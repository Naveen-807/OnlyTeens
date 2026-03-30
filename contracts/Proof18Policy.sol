// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint64, euint8, ebool, externalEuint64, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import "./Proof18Access.sol";

contract Proof18Policy is ZamaEthereumConfig {
    address public owner;
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
    mapping(bytes32 => euint8) private latestDecisionHandles;
    mapping(bytes32 => uint256) private latestDecisionAmounts;
    mapping(bytes32 => bool) private latestDecisionRecurring;
    mapping(bytes32 => address) private latestDecisionActors;
    mapping(bytes32 => bool) private latestDecisionInitialized;

    event PolicySet(bytes32 indexed familyId, address guardian, uint256 timestamp);
    event PolicyEvaluated(
        bytes32 indexed familyId,
        address indexed actor,
        address indexed teen,
        string actionType,
        uint256 amount,
        bool isRecurring,
        uint256 timestamp
    );

    constructor(address _access) {
        require(_access != address(0), "Invalid access");
        owner = msg.sender;
        access = Proof18Access(_access);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Owner only");
        _;
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
        FHE.allow(riskFlags, msg.sender);

        if (owner != msg.sender) {
            FHE.allow(singleCap, owner);
            FHE.allow(recurringCap, owner);
            FHE.allow(trustThreshold, owner);
            FHE.allow(riskFlags, owner);
        }

        emit PolicySet(familyId, msg.sender, block.timestamp);
    }

    function evaluateAction(
        bytes32 familyId,
        uint256 amount,
        uint8 currentPassportLevel,
        bool isRecurring
    ) external {
        FamilyPolicy storage p = policies[familyId];
        require(p.initialized, "No policy");
        require(
            access.isTeen(familyId, msg.sender) || access.isExecutor(familyId, msg.sender) || access.isGuardian(familyId, msg.sender),
            "Not authorized"
        );

        require(amount <= type(uint64).max, "Amount too large");

        euint8 decisionEnc;
        {
            euint64 encAmount = FHE.asEuint64(uint64(amount));
            euint8 encPassport = FHE.asEuint8(currentPassportLevel);
            ebool zeroAmount = FHE.eq(encAmount, FHE.asEuint64(uint64(0)));
            ebool hasRiskFlags = FHE.ne(p.riskFlags, FHE.asEuint8(uint8(0)));
            ebool withinCap = FHE.select(
                FHE.asEbool(isRecurring),
                FHE.le(encAmount, p.recurringMonthlyCap),
                FHE.le(encAmount, p.singleActionCap)
            );

            decisionEnc = FHE.select(
                zeroAmount,
                FHE.asEuint8(uint8(Decision.BLOCKED)),
                FHE.select(
                    hasRiskFlags,
                    FHE.asEuint8(uint8(Decision.BLOCKED)),
                    FHE.select(
                        withinCap,
                        FHE.select(
                            FHE.ge(encPassport, p.trustUnlockThreshold),
                            FHE.asEuint8(uint8(Decision.GREEN)),
                            FHE.asEuint8(uint8(Decision.YELLOW))
                        ),
                        FHE.asEuint8(uint8(Decision.RED))
                    )
                )
            );
        }

        latestDecisionHandles[familyId] = decisionEnc;
        latestDecisionAmounts[familyId] = amount;
        latestDecisionRecurring[familyId] = isRecurring;
        latestDecisionActors[familyId] = msg.sender;
        latestDecisionInitialized[familyId] = true;

        FHE.allowThis(decisionEnc);
        FHE.allow(decisionEnc, msg.sender);

        address guardian = access.guardians(familyId);
        if (guardian != address(0) && guardian != msg.sender) {
            FHE.allow(decisionEnc, guardian);
        }

        address executor = access.executors(familyId);
        if (executor != address(0) && executor != msg.sender) {
            FHE.allow(decisionEnc, executor);
        }

        if (owner != msg.sender) {
            FHE.allow(decisionEnc, owner);
        }

        address teen = access.teens(familyId);
        string memory actionType = isRecurring ? "subscription" : "savings";

        emit PolicyEvaluated(familyId, msg.sender, teen, actionType, amount, isRecurring, block.timestamp);
    }

    function getGuardianPolicyView(bytes32 familyId)
        external
        view
        returns (euint64 singleCap, euint64 recurringCap, euint8 trustThreshold, euint8 riskFlags)
    {
        FamilyPolicy storage p = policies[familyId];
        require(access.isGuardian(familyId, msg.sender), "Guardian only");
        return (p.singleActionCap, p.recurringMonthlyCap, p.trustUnlockThreshold, p.riskFlags);
    }

    function getServerPolicyView(bytes32 familyId)
        external
        view
        onlyOwner
        returns (euint64 singleCap, euint64 recurringCap, euint8 trustThreshold, euint8 riskFlags)
    {
        FamilyPolicy storage p = policies[familyId];
        require(p.initialized, "No policy");
        return (p.singleActionCap, p.recurringMonthlyCap, p.trustUnlockThreshold, p.riskFlags);
    }

    function getGuardianLatestDecisionView(bytes32 familyId)
        external
        view
        returns (euint8 decisionHandle, uint256 amount, bool isRecurring, address actor)
    {
        require(access.isGuardian(familyId, msg.sender), "Guardian only");
        require(latestDecisionInitialized[familyId], "No decision");
        return (
            latestDecisionHandles[familyId],
            latestDecisionAmounts[familyId],
            latestDecisionRecurring[familyId],
            latestDecisionActors[familyId]
        );
    }

    function getServerLatestDecisionView(bytes32 familyId)
        external
        view
        onlyOwner
        returns (euint8 decisionHandle, uint256 amount, bool isRecurring, address actor)
    {
        require(latestDecisionInitialized[familyId], "No decision");
        return (
            latestDecisionHandles[familyId],
            latestDecisionAmounts[familyId],
            latestDecisionRecurring[familyId],
            latestDecisionActors[familyId]
        );
    }

    function isPolicySet(bytes32 familyId) external view returns (bool) {
        return policies[familyId].initialized;
    }
}
