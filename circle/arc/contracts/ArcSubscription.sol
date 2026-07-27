// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcSubscription {
    struct Plan {
        address owner;
        address merchant;
        uint256 price;
        uint64 periodSeconds;
        bool active;
        string metadataURI;
    }

    struct Subscription {
        address subscriber;
        bytes32 planId;
        uint64 paidThrough;
        bool active;
    }

    mapping(bytes32 planId => Plan plan) private _plans;
    mapping(bytes32 subscriptionId => Subscription subscription) private _subscriptions;

    event PlanCreated(
        bytes32 indexed planId,
        address indexed owner,
        address indexed merchant,
        uint256 price,
        uint64 periodSeconds,
        string metadataURI
    );
    event SubscriptionPaid(
        bytes32 indexed planId,
        address indexed subscriber,
        address indexed merchant,
        uint256 amount,
        uint64 cycles,
        uint64 paidThrough
    );
    event SubscriptionCancelled(bytes32 indexed planId, address indexed subscriber);

    error InvalidMerchant();
    error InvalidPayment();
    error InvalidPeriod();
    error InvalidPrice();
    error InvalidCycles();
    error PlanAlreadyExists(bytes32 planId);
    error PlanInactive(bytes32 planId);
    error PlanMissing(bytes32 planId);
    error SubscriptionMissing(bytes32 planId, address subscriber);
    error Unauthorized();
    error TransferFailed();

    function createPlan(
        bytes32 planId,
        address merchant,
        uint256 price,
        uint64 periodSeconds,
        string calldata metadataURI
    ) external {
        if (_plans[planId].merchant != address(0)) revert PlanAlreadyExists(planId);
        if (merchant == address(0)) revert InvalidMerchant();
        if (price == 0) revert InvalidPrice();
        if (periodSeconds == 0) revert InvalidPeriod();

        _plans[planId] = Plan({
            owner: msg.sender,
            merchant: merchant,
            price: price,
            periodSeconds: periodSeconds,
            active: true,
            metadataURI: metadataURI
        });

        emit PlanCreated(planId, msg.sender, merchant, price, periodSeconds, metadataURI);
    }

    function subscribe(bytes32 planId, uint64 cycles) external payable {
        Plan memory plan = _plans[planId];
        if (plan.merchant == address(0)) revert PlanMissing(planId);
        if (!plan.active) revert PlanInactive(planId);
        if (cycles == 0) revert InvalidCycles();

        uint256 requiredAmount = plan.price * cycles;
        if (msg.value != requiredAmount) revert InvalidPayment();

        bytes32 subscriptionId = getSubscriptionId(planId, msg.sender);
        Subscription storage subscription = _subscriptions[subscriptionId];

        uint64 baseTime = subscription.paidThrough > block.timestamp
            ? subscription.paidThrough
            : uint64(block.timestamp);
        uint64 paidThrough = baseTime + (plan.periodSeconds * cycles);

        subscription.subscriber = msg.sender;
        subscription.planId = planId;
        subscription.paidThrough = paidThrough;
        subscription.active = true;

        _sendValue(plan.merchant, msg.value);

        emit SubscriptionPaid(planId, msg.sender, plan.merchant, msg.value, cycles, paidThrough);
    }

    function cancelSubscription(bytes32 planId) external {
        bytes32 subscriptionId = getSubscriptionId(planId, msg.sender);
        Subscription storage subscription = _subscriptions[subscriptionId];
        if (subscription.subscriber == address(0)) revert SubscriptionMissing(planId, msg.sender);
        if (subscription.subscriber != msg.sender) revert Unauthorized();

        subscription.active = false;

        emit SubscriptionCancelled(planId, msg.sender);
    }

    function getPlan(bytes32 planId) external view returns (Plan memory) {
        return _plans[planId];
    }

    function getSubscription(bytes32 planId, address subscriber) external view returns (Subscription memory) {
        return _subscriptions[getSubscriptionId(planId, subscriber)];
    }

    function getSubscriptionId(bytes32 planId, address subscriber) public pure returns (bytes32) {
        return keccak256(abi.encode(planId, subscriber));
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
