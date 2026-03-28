// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Proof18Access {
    address public owner;
    mapping(bytes32 => address) public guardians;
    mapping(bytes32 => address) public teens;
    mapping(bytes32 => address) public executors;
    mapping(bytes32 => bool) public familyActive;

    event FamilyRegistered(bytes32 indexed familyId, address guardian, address teen, address executor);
    event ExecutorUpdated(bytes32 indexed familyId, address oldExecutor, address newExecutor);
    event FamilyDeactivated(bytes32 indexed familyId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyGuardian(bytes32 familyId) {
        require(msg.sender == guardians[familyId], "Not guardian");
        _;
    }

    modifier onlyFamilyMember(bytes32 familyId) {
        require(
            msg.sender == guardians[familyId] ||
                msg.sender == teens[familyId] ||
                msg.sender == executors[familyId],
            "Not family member"
        );
        _;
    }

    modifier onlyExecutorOrGuardian(bytes32 familyId) {
        require(
            msg.sender == executors[familyId] || msg.sender == guardians[familyId],
            "Not executor or guardian"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerFamily(
        bytes32 familyId,
        address guardian,
        address teen,
        address executor
    ) external onlyOwner {
        require(!familyActive[familyId], "Family exists");
        require(guardian != address(0) && teen != address(0), "Invalid addresses");

        guardians[familyId] = guardian;
        teens[familyId] = teen;
        executors[familyId] = executor;
        familyActive[familyId] = true;

        emit FamilyRegistered(familyId, guardian, teen, executor);
    }

    function updateExecutor(bytes32 familyId, address newExecutor) external onlyGuardian(familyId) {
        address oldExecutor = executors[familyId];
        executors[familyId] = newExecutor;
        emit ExecutorUpdated(familyId, oldExecutor, newExecutor);
    }

    function deactivateFamily(bytes32 familyId) external onlyGuardian(familyId) {
        familyActive[familyId] = false;
        emit FamilyDeactivated(familyId);
    }

    function isGuardian(bytes32 familyId, address addr) external view returns (bool) {
        return guardians[familyId] == addr;
    }

    function isTeen(bytes32 familyId, address addr) external view returns (bool) {
        return teens[familyId] == addr;
    }

    function isExecutor(bytes32 familyId, address addr) external view returns (bool) {
        return executors[familyId] == addr;
    }

    function getFamily(bytes32 familyId)
        external
        view
        returns (address guardian, address teen, address executor, bool active)
    {
        return (guardians[familyId], teens[familyId], executors[familyId], familyActive[familyId]);
    }
}