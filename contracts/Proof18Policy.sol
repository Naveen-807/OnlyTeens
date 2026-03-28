// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint64, euint8, ebool, externalEuint64, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import "./Proof18Access.sol";

contract Proof18Policy is ZamaEthereumConfig {
    Proof18Access public access;

    struct FamilyPolicy {
        euint64 singleActionCap;
        euint64 recurringMonthlyCap;
        euint8 trustUnlockThreshold;
        euint8 riskFlags;
        bool initialized;
    }

    enum Decision {
        GREEN,
        YELLOW,
        RED,
        BLOCKED
    }

    mapping(bytes32 => FamilyPolicy) private policies;

    event PolicySet(bytes32 indexed familyId, address guardian, uint256 timestamp);
    event PolicyEvaluated(bytes32 indexed familyId, address indexed teen, string actionType, uint256 amount, Decision decision, uint256 timestamp);

    constructor(address _access) {
        require(_access != address(0), "Invalid access");
        access = Proof18Access(_access);
    }

    function setPolicy(
        bytes32 familyId,
        externalEuint64 encSingleCap,
        externalEuint64 encRecurringCap,
        externalEuint8 encTrustThreshold,
        externalEuint8 encRiskFlags,
        bytes calldata inputProof
    ) external {
        require(access.isGuardian(familyId, msg.sender), "Guardian only");

        euint64 singleCap = FHE.fromExternal(encSingleCap, inputProof);
        euint64 recurringCap = FHE.fromExternal(encRecurringCap, inputProof);
        euint8 trustThreshold = FHE.fromExternal(encTrustThreshold, inputProof);
        euint8 riskFlags = FHE.fromExternal(encRiskFlags, inputProof);

        policies[familyId] = FamilyPolicy({
            singleActionCap: singleCap,
            recurringMonthlyCap: recurringCap,
            trustUnlockThreshold: trustThreshold,
            riskFlags: riskFlags,
            initialized: true
        });

        FHE.allowThis(singleCap);
        FHE.allowThis(recurringCap);
        FHE.allowThis(trustThreshold);
        FHE.allowThis(riskFlags);

        FHE.allow(singleCap, msg.sender);
        FHE.allow(recurringCap, msg.sender);
        FHE.allow(trustThreshold, msg.sender);

        emit PolicySet(familyId, msg.sender, block.timestamp);
    }

    function evaluateAction(
        bytes32 familyId,
        uint256 amount,
        uint8 currentPassportLevel,
        bool isRecurring
    ) external returns (Decision) {
        FamilyPolicy storage p = policies[familyId];
        require(p.initialized, "No policy");
        require(
            access.isTeen(familyId, msg.sender) || access.isExecutor(familyId, msg.sender) || access.isGuardian(familyId, msg.sender),
            "Not authorized"
        );

        // Keep the confidential policy evaluation in-scope only for the encrypted output.
        // This avoids "stack too deep" while still producing a publicly-decryptable encrypted decision.
        {
            require(amount <= type(uint64).max, "Amount too large");

            euint64 encAmount = FHE.asEuint64(uint64(amount));
            euint8 encPassport = FHE.asEuint8(currentPassportLevel);

            ebool hasRiskFlags = FHE.ne(p.riskFlags, FHE.asEuint8(uint8(0)));
            ebool withinSingleCap = FHE.le(encAmount, p.singleActionCap);
            ebool withinRecurringCap = FHE.le(encAmount, p.recurringMonthlyCap);
            ebool meetsPassport = FHE.ge(encPassport, p.trustUnlockThreshold);

            ebool useRecurringCap = FHE.asEbool(isRecurring);
            ebool withinCap = FHE.select(useRecurringCap, withinRecurringCap, withinSingleCap);

            // decisionEnc:
            // - BLOCKED if risk flags are set
            // - GREEN if within cap + meets passport threshold
            // - YELLOW if within cap but doesn't meet passport threshold
            // - RED if over cap
            euint8 decisionEnc = FHE.select(
                hasRiskFlags,
                FHE.asEuint8(uint8(Decision.BLOCKED)),
                FHE.select(
                    withinCap,
                    FHE.select(
                        meetsPassport,
                        FHE.asEuint8(uint8(Decision.GREEN)),
                        FHE.asEuint8(uint8(Decision.YELLOW))
                    ),
                    FHE.asEuint8(uint8(Decision.RED))
                )
            );

            FHE.allowThis(decisionEnc);
            FHE.makePubliclyDecryptable(decisionEnc);
        }

        Decision decision;
        if (amount == 0) {
            decision = Decision.BLOCKED;
        } else if (isRecurring) {
            // MVP: recurring actions always require guardian review (YELLOW/RED is decided offchain).
            // The confidential cap checks above are still computed and made decryptable.
            decision = Decision.RED;
        } else if (currentPassportLevel >= 2 && amount <= 15) {
            decision = Decision.GREEN;
        } else {
            decision = Decision.YELLOW;
        }

        address teen = access.teens(familyId);
        string memory actionType = isRecurring ? "subscription" : "savings";

        emit PolicyEvaluated(familyId, teen, actionType, amount, decision, block.timestamp);
        return decision;
    }

    function getGuardianPolicyView(bytes32 familyId)
        external
        view
        returns (euint64 singleCap, euint64 recurringCap, euint8 trustThreshold)
    {
        FamilyPolicy storage p = policies[familyId];
        require(access.isGuardian(familyId, msg.sender), "Guardian only");
        return (p.singleActionCap, p.recurringMonthlyCap, p.trustUnlockThreshold);
    }

    function isPolicySet(bytes32 familyId) external view returns (bool) {
        return policies[familyId].initialized;
    }
}
