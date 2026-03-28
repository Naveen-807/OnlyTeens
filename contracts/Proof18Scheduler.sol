// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Proof18Access.sol";
import "./Proof18Vault.sol";

contract Proof18Scheduler {
    Proof18Access public access;
    Proof18Vault public vault;

    enum ScheduleType {
        SAVINGS,
        SUBSCRIPTION
    }

    struct Schedule {
        bytes32 familyId;
        address teen;
        uint256 amount;
        uint256 intervalSeconds;
        uint256 nextExecution;
        string label;
        ScheduleType scheduleType;
        bool active;
        address payable recipient;
    }

    mapping(uint256 => Schedule) public schedules;
    uint256 public scheduleCount;

    bool private locked;

    event ScheduleCreated(
        uint256 indexed scheduleId,
        bytes32 indexed familyId,
        address teen,
        string label,
        ScheduleType scheduleType,
        uint256 amount,
        uint256 intervalSeconds
    );
    event ScheduleExecuted(uint256 indexed scheduleId, bytes32 indexed familyId, address teen, uint256 amount, uint256 timestamp);
    event SchedulePaused(uint256 indexed scheduleId, bytes32 indexed familyId);
    event ScheduleResumed(uint256 indexed scheduleId, bytes32 indexed familyId);

    constructor(address _access, address _vault) {
        require(_access != address(0) && _vault != address(0), "Invalid addresses");
        access = Proof18Access(_access);
        vault = Proof18Vault(_vault);
    }

    modifier nonReentrant() {
        require(!locked, "Reentrancy guard");
        locked = true;
        _;
        locked = false;
    }

    function createSchedule(
        bytes32 familyId,
        address teen,
        uint256 amount,
        uint256 intervalSeconds,
        string calldata label,
        ScheduleType scheduleType,
        address payable recipient
    ) external returns (uint256 scheduleId) {
        require(access.familyActive(familyId), "Family not active");
        require(
            access.isExecutor(familyId, msg.sender) || access.isGuardian(familyId, msg.sender),
            "Not authorized"
        );
        require(access.isTeen(familyId, teen), "Invalid teen");
        require(amount > 0 && intervalSeconds >= 3600, "Invalid params");

        scheduleId = scheduleCount++;
        schedules[scheduleId] = Schedule({
            familyId: familyId,
            teen: teen,
            amount: amount,
            intervalSeconds: intervalSeconds,
            nextExecution: block.timestamp + intervalSeconds,
            label: label,
            scheduleType: scheduleType,
            active: true,
            recipient: recipient
        });

        emit ScheduleCreated(scheduleId, familyId, teen, label, scheduleType, amount, intervalSeconds);
    }

    function executeSchedule(uint256 scheduleId) external payable nonReentrant {
        Schedule storage s = schedules[scheduleId];
        require(s.active, "Not active");
        require(block.timestamp >= s.nextExecution, "Too early");
        require(
            access.isExecutor(s.familyId, msg.sender) || access.isGuardian(s.familyId, msg.sender),
            "Not authorized"
        );

        s.nextExecution = block.timestamp + s.intervalSeconds;

        if (s.scheduleType == ScheduleType.SAVINGS) {
            require(msg.value == s.amount, "Missing savings value");
            vault.depositSavings{value: s.amount}(s.familyId, s.teen);
        } else {
            require(s.recipient != address(0), "Invalid recipient");
            vault.executeSubscriptionPayment(s.familyId, s.teen, s.label, s.amount, s.recipient);
        }

        emit ScheduleExecuted(scheduleId, s.familyId, s.teen, s.amount, block.timestamp);
    }

    function pauseSchedule(uint256 scheduleId) external {
        Schedule storage s = schedules[scheduleId];
        require(access.isGuardian(s.familyId, msg.sender), "Guardian only");
        s.active = false;
        emit SchedulePaused(scheduleId, s.familyId);
    }

    function resumeSchedule(uint256 scheduleId) external {
        Schedule storage s = schedules[scheduleId];
        require(access.isGuardian(s.familyId, msg.sender), "Guardian only");
        s.active = true;
        s.nextExecution = block.timestamp + s.intervalSeconds;
        emit ScheduleResumed(scheduleId, s.familyId);
    }

    function getSchedule(uint256 scheduleId)
        external
        view
        returns (
            bytes32 familyId,
            address teen,
            uint256 amount,
            uint256 interval,
            uint256 nextExec,
            string memory label,
            bool active
        )
    {
        Schedule storage s = schedules[scheduleId];
        return (s.familyId, s.teen, s.amount, s.intervalSeconds, s.nextExecution, s.label, s.active);
    }
}
