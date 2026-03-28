// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Proof18Access.sol";

contract Proof18Passport {
    Proof18Access public access;

    struct Passport {
        uint8 level;
        uint16 weeklyStreak;
        uint32 totalActions;
        uint32 savingsCount;
        uint32 approvedSubs;
        uint32 rejectedActions;
        uint256 lastActionTime;
        uint256 createdAt;
    }

    string[6] public levelNames;
    uint32[6] public levelThresholds;

    mapping(bytes32 => mapping(address => Passport)) public passports;

    event PassportCreated(bytes32 indexed familyId, address indexed teen, uint256 timestamp);
    event PassportLevelUp(bytes32 indexed familyId, address indexed teen, uint8 oldLevel, uint8 newLevel, string newLevelName, uint32 totalActions, uint256 timestamp);
    event PassportStreakUpdate(bytes32 indexed familyId, address indexed teen, uint16 newStreak, uint256 timestamp);
    event PassportActionRecorded(bytes32 indexed familyId, address indexed teen, string actionType, bool wasApproved, uint32 newTotalActions, uint256 timestamp);

    constructor(address _access) {
        require(_access != address(0), "Invalid access");
        access = Proof18Access(_access);

        levelNames[0] = "Starter";
        levelNames[1] = "Explorer";
        levelNames[2] = "Saver";
        levelNames[3] = "Manager";
        levelNames[4] = "Planner";
        levelNames[5] = "Independent";

        levelThresholds[0] = 0;
        levelThresholds[1] = 5;
        levelThresholds[2] = 15;
        levelThresholds[3] = 35;
        levelThresholds[4] = 70;
        levelThresholds[5] = 150;
    }

    function createPassport(bytes32 familyId, address teen) external {
        require(access.familyActive(familyId), "Family not active");
        require(
            access.isGuardian(familyId, msg.sender) || access.isExecutor(familyId, msg.sender),
            "Not authorized"
        );
        require(access.isTeen(familyId, teen), "Invalid teen");
        require(passports[familyId][teen].createdAt == 0, "Already exists");

        passports[familyId][teen] = Passport({
            level: 0,
            weeklyStreak: 0,
            totalActions: 0,
            savingsCount: 0,
            approvedSubs: 0,
            rejectedActions: 0,
            lastActionTime: block.timestamp,
            createdAt: block.timestamp
        });
        emit PassportCreated(familyId, teen, block.timestamp);
    }

    function recordAction(
        bytes32 familyId,
        address teen,
        string calldata actionType,
        bool wasApproved
    ) external returns (bool leveledUp, uint8 newLevel) {
        require(
            access.isExecutor(familyId, msg.sender) || access.isGuardian(familyId, msg.sender),
            "Not authorized"
        );

        Passport storage p = passports[familyId][teen];
        require(p.createdAt > 0, "No passport");

        p.totalActions++;
        p.lastActionTime = block.timestamp;

        if (wasApproved) {
            if (keccak256(bytes(actionType)) == keccak256(bytes("savings"))) {
                p.savingsCount++;
            } else if (keccak256(bytes(actionType)) == keccak256(bytes("subscription"))) {
                p.approvedSubs++;
            }
        } else {
            p.rejectedActions++;
        }

        emit PassportActionRecorded(familyId, teen, actionType, wasApproved, p.totalActions, block.timestamp);

        uint8 oldLevel = p.level;
        for (uint8 i = 5; i > oldLevel; i--) {
            if (p.totalActions >= levelThresholds[i]) {
                p.level = i;
                break;
            }
        }

        if (p.level > oldLevel) {
            emit PassportLevelUp(familyId, teen, oldLevel, p.level, levelNames[p.level], p.totalActions, block.timestamp);
            return (true, p.level);
        }

        return (false, p.level);
    }

    function updateStreak(bytes32 familyId, address teen, uint16 newStreak) external {
        require(
            access.isExecutor(familyId, msg.sender) || access.isGuardian(familyId, msg.sender),
            "Not authorized"
        );
        passports[familyId][teen].weeklyStreak = newStreak;
        emit PassportStreakUpdate(familyId, teen, newStreak, block.timestamp);
    }

    function getPassport(bytes32 familyId, address teen)
        external
        view
        returns (
            uint8 level,
            string memory levelName,
            uint16 streak,
            uint32 totalActions,
            uint32 savingsCount,
            uint32 approvedSubs,
            uint32 rejectedActions
        )
    {
        Passport storage p = passports[familyId][teen];
        return (
            p.level,
            levelNames[p.level],
            p.weeklyStreak,
            p.totalActions,
            p.savingsCount,
            p.approvedSubs,
            p.rejectedActions
        );
    }

    function getProgressToNextLevel(bytes32 familyId, address teen)
        external
        view
        returns (
            uint32 currentActions,
            uint32 nextLevelThreshold,
            uint32 remaining,
            string memory currentLevelName,
            string memory nextLevelName
        )
    {
        Passport storage p = passports[familyId][teen];
        uint8 nextLevel = p.level < 5 ? p.level + 1 : 5;
        uint32 threshold = levelThresholds[nextLevel];
        uint32 rem = p.totalActions >= threshold ? 0 : threshold - p.totalActions;
        return (p.totalActions, threshold, rem, levelNames[p.level], levelNames[nextLevel]);
    }
}
