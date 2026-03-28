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

        euint64 encAmount = FHE.asEuint64(amount);
        euint8 encPassport = FHE.asEuint8(currentPassportLevel);

        ebool withinSingleCap = FHE.le(encAmount, p.singleActionCap);
        ebool meetsPassport = FHE.ge(encPassport, p.trustUnlockThreshold);
        ebool withinRecurring = FHE.le(encAmount, p.recurringMonthlyCap);
        ebool hasRiskFlags = FHE.ne(p.riskFlags, FHE.asEuint8(0));

        euint8 greenCheck = FHE.select(
            FHE.and(FHE.and(withinSingleCap, meetsPassport), FHE.not(hasRiskFlags)),
            FHE.asEuint8(0),
            FHE.asEuint8(1)
        );

        euint8 yellowCheck = FHE.select(
            FHE.and(FHE.and(withinSingleCap, FHE.not(meetsPassport)), FHE.not(hasRiskFlags)),
            FHE.asEuint8(1),
            FHE.asEuint8(2)
        );

        euint8 finalDecision = FHE.select(
            hasRiskFlags,
            FHE.asEuint8(3),
            FHE.select(FHE.eq(greenCheck, FHE.asEuint8(0)), FHE.asEuint8(0), yellowCheck)
        );

        FHE.allowThis(finalDecision);
        FHE.makePubliclyDecryptable(FHE.toBytes32(finalDecision));

        Decision decision;
        if (amount == 0) {
            decision = Decision.BLOCKED;
        } else if (isRecurring) {
            decision = withinRecurring ? Decision.YELLOW : Decision.RED;
        } else if (currentPassportLevel >= 2 && amount <= 15) {
            decision = Decision.GREEN;
        } else {
            decision = Decision.YELLOW;
        }

        emit PolicyEvaluated(familyId, access.teens(familyId), isRecurring ? "subscription" : "savings", amount, decision, block.timestamp);
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
