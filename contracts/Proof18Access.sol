// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Proof18Access {
    address public owner;
    mapping(bytes32 => address) public guardians;
    mapping(bytes32 => address) public teens;
    mapping(bytes32 => address) public executors;
    mapping(bytes32 => bool) public familyActive;
    mapping(bytes32 => mapping(address => bool)) private teenMembers;
    mapping(bytes32 => address[]) private teenRegistry;
    mapping(bytes32 => mapping(address => bool)) private approvedExecutors;

    event FamilyRegistered(bytes32 indexed familyId, address guardian, address teen, address executor);
    event ExecutorUpdated(bytes32 indexed familyId, address oldExecutor, address newExecutor);
    event FamilyDeactivated(bytes32 indexed familyId);
    event TeenAdded(bytes32 indexed familyId, address teen);
    event TeenRemoved(bytes32 indexed familyId, address teen);
    event ExecutorApproved(bytes32 indexed familyId, address executor);
    event ExecutorRevoked(bytes32 indexed familyId, address executor);

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
        teenMembers[familyId][teen] = true;
        teenRegistry[familyId].push(teen);
        if (executor != address(0)) {
            approvedExecutors[familyId][executor] = true;
        }

        emit FamilyRegistered(familyId, guardian, teen, executor);
        if (executor != address(0)) {
            emit ExecutorApproved(familyId, executor);
        }
    }

    function updateExecutor(bytes32 familyId, address newExecutor) external onlyGuardian(familyId) {
        address oldExecutor = executors[familyId];
        executors[familyId] = newExecutor;
        if (oldExecutor != address(0)) {
            approvedExecutors[familyId][oldExecutor] = false;
            emit ExecutorRevoked(familyId, oldExecutor);
        }
        if (newExecutor != address(0)) {
            approvedExecutors[familyId][newExecutor] = true;
            emit ExecutorApproved(familyId, newExecutor);
        }
        emit ExecutorUpdated(familyId, oldExecutor, newExecutor);
    }

    function approveExecutor(bytes32 familyId, address executor) external onlyGuardian(familyId) {
        require(executor != address(0), "Invalid executor");
        approvedExecutors[familyId][executor] = true;
        emit ExecutorApproved(familyId, executor);
    }

    function revokeExecutor(bytes32 familyId, address executor) external onlyGuardian(familyId) {
        approvedExecutors[familyId][executor] = false;
        if (executors[familyId] == executor) {
            executors[familyId] = address(0);
        }
        emit ExecutorRevoked(familyId, executor);
    }

    function addTeen(bytes32 familyId, address teen) external onlyGuardian(familyId) {
        require(familyActive[familyId], "Family not active");
        require(teen != address(0), "Invalid teen");
        require(!teenMembers[familyId][teen], "Teen exists");

        teenMembers[familyId][teen] = true;
        teenRegistry[familyId].push(teen);
        emit TeenAdded(familyId, teen);
    }

    function removeTeen(bytes32 familyId, address teen) external onlyGuardian(familyId) {
        require(teenMembers[familyId][teen], "Teen missing");
        require(teenRegistry[familyId].length > 1, "Cannot remove last teen");

        teenMembers[familyId][teen] = false;
        _removeTeenFromRegistry(familyId, teen);
        if (teens[familyId] == teen) {
            teens[familyId] = _nextActiveTeen(familyId);
        }
        emit TeenRemoved(familyId, teen);
    }

    function deactivateFamily(bytes32 familyId) external onlyGuardian(familyId) {
        familyActive[familyId] = false;
        emit FamilyDeactivated(familyId);
    }

    function isGuardian(bytes32 familyId, address addr) external view returns (bool) {
        return guardians[familyId] == addr;
    }

    function isTeen(bytes32 familyId, address addr) external view returns (bool) {
        return teenMembers[familyId][addr];
    }

    function isExecutor(bytes32 familyId, address addr) external view returns (bool) {
        return approvedExecutors[familyId][addr];
    }

    function getTeenCount(bytes32 familyId) external view returns (uint256) {
        return teenRegistry[familyId].length;
    }

    function getTeenAt(bytes32 familyId, uint256 index) external view returns (address) {
        return teenRegistry[familyId][index];
    }

    function getFamily(bytes32 familyId)
        external
        view
        returns (address guardian, address teen, address executor, bool active)
    {
        return (guardians[familyId], teens[familyId], executors[familyId], familyActive[familyId]);
    }

    function _nextActiveTeen(bytes32 familyId) private view returns (address) {
        address[] storage registry = teenRegistry[familyId];
        for (uint256 i = 0; i < registry.length; i++) {
            address candidate = registry[i];
            if (teenMembers[familyId][candidate]) {
                return candidate;
            }
        }
        return address(0);
    }

    function _removeTeenFromRegistry(bytes32 familyId, address teen) private {
        address[] storage registry = teenRegistry[familyId];
        uint256 length = registry.length;

        for (uint256 i = 0; i < length; i++) {
            if (registry[i] == teen) {
                registry[i] = registry[length - 1];
                registry.pop();
                return;
            }
        }
    }
}
