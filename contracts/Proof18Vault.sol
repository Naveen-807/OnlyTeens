// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Proof18Access.sol";

contract Proof18Vault {
    Proof18Access public access;

    mapping(bytes32 => mapping(address => uint256)) public savingsBalance;
    mapping(bytes32 => mapping(address => uint256)) public subscriptionReserve;

    bool private locked;

    event SavingsDeposit(
        bytes32 indexed familyId,
        address indexed teen,
        uint256 amount,
        uint256 newBalance,
        uint256 timestamp
    );
    event SavingsWithdraw(
        bytes32 indexed familyId,
        address indexed teen,
        uint256 amount,
        uint256 timestamp
    );
    event SubscriptionFunded(
        bytes32 indexed familyId,
        address indexed teen,
        string serviceName,
        uint256 amount,
        uint256 timestamp
    );
    event SubscriptionPaid(
        bytes32 indexed familyId,
        address indexed teen,
        string serviceName,
        uint256 amount,
        address recipient,
        uint256 timestamp
    );

    constructor(address _access) {
        require(_access != address(0), "Invalid access");
        access = Proof18Access(_access);
    }

    modifier onlyActive(bytes32 familyId) {
        require(access.familyActive(familyId), "Family not active");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Reentrancy guard");
        locked = true;
        _;
        locked = false;
    }

    function depositSavings(bytes32 familyId, address teen) external payable onlyActive(familyId) {
        require(
            access.isExecutor(familyId, msg.sender) ||
                access.isGuardian(familyId, msg.sender) ||
                access.isTeen(familyId, msg.sender),
            "Not authorized"
        );
        require(access.isTeen(familyId, teen), "Invalid teen");
        require(msg.value > 0, "Must send value");

        savingsBalance[familyId][teen] += msg.value;
        emit SavingsDeposit(familyId, teen, msg.value, savingsBalance[familyId][teen], block.timestamp);
    }

    function withdrawSavings(bytes32 familyId, address teen, uint256 amount)
        external
        onlyActive(familyId)
        nonReentrant
    {
        require(access.isGuardian(familyId, msg.sender), "Guardian only");
        require(savingsBalance[familyId][teen] >= amount, "Insufficient");

        savingsBalance[familyId][teen] -= amount;
        payable(msg.sender).transfer(amount);
        emit SavingsWithdraw(familyId, teen, amount, block.timestamp);
    }

    function fundSubscription(bytes32 familyId, address teen, string calldata serviceName)
        external
        payable
        onlyActive(familyId)
    {
        require(
            access.isExecutor(familyId, msg.sender) || access.isGuardian(familyId, msg.sender),
            "Not authorized"
        );
        require(msg.value > 0, "Must send value");
        require(access.isTeen(familyId, teen), "Invalid teen");

        subscriptionReserve[familyId][teen] += msg.value;
        emit SubscriptionFunded(familyId, teen, serviceName, msg.value, block.timestamp);
    }

    function executeSubscriptionPayment(
        bytes32 familyId,
        address teen,
        string calldata serviceName,
        uint256 amount,
        address payable recipient
    ) external onlyActive(familyId) nonReentrant {
        require(access.isExecutor(familyId, msg.sender), "Executor only");
        require(recipient != address(0), "Invalid recipient");
        require(subscriptionReserve[familyId][teen] >= amount, "Insufficient reserve");

        subscriptionReserve[familyId][teen] -= amount;
        recipient.transfer(amount);
        emit SubscriptionPaid(familyId, teen, serviceName, amount, recipient, block.timestamp);
    }

    function getBalances(bytes32 familyId, address teen) external view returns (uint256 savings, uint256 reserve) {
        return (savingsBalance[familyId][teen], subscriptionReserve[familyId][teen]);
    }
}
