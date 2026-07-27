// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcRewardVault {
    struct Reward {
        address creator;
        address recipient;
        uint256 amount;
        uint256 claimedAmount;
        uint64 createdAt;
        uint64 expiresAt;
        bool closed;
        string rewardRef;
        string metadataURI;
        string claimURI;
    }

    mapping(bytes32 rewardId => Reward card) private _cards;

    event RewardCreated(
        bytes32 indexed rewardId,
        address indexed creator,
        address indexed recipient,
        uint256 amount,
        uint64 expiresAt,
        string rewardRef,
        string metadataURI
    );
    event RewardClaimed(
        bytes32 indexed rewardId,
        address indexed recipient,
        address indexed to,
        uint256 amount,
        string claimURI
    );
    event RewardClosed(bytes32 indexed rewardId, address indexed creator, address indexed refundTo, uint256 refundAmount);

    error RewardAlreadyExists(bytes32 rewardId);
    error RewardClosedAlready(bytes32 rewardId);
    error RewardExpired(uint64 expiresAt);
    error RewardMissing(bytes32 rewardId);
    error RewardClaimedAlready(bytes32 rewardId);
    error InvalidAddress();
    error InvalidAmount();
    error InvalidText();
    error TransferFailed();
    error Unauthorized();

    function createReward(
        bytes32 rewardId,
        address recipient,
        uint64 expiresAt,
        string calldata rewardRef,
        string calldata metadataURI
    ) external payable {
        if (_cards[rewardId].creator != address(0)) revert RewardAlreadyExists(rewardId);
        if (recipient == address(0)) revert InvalidAddress();
        if (msg.value == 0) revert InvalidAmount();
        if (bytes(rewardRef).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _cards[rewardId] = Reward({
            creator: msg.sender,
            recipient: recipient,
            amount: msg.value,
            claimedAmount: 0,
            createdAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            closed: false,
            rewardRef: rewardRef,
            metadataURI: metadataURI,
            claimURI: ""
        });

        emit RewardCreated(rewardId, msg.sender, recipient, msg.value, expiresAt, rewardRef, metadataURI);
    }

    function claimReward(bytes32 rewardId, address payable to, string calldata claimURI) external {
        Reward storage card = _requireOpenCard(rewardId);
        if (msg.sender != card.recipient) revert Unauthorized();
        if (to == address(0)) revert InvalidAddress();
        if (bytes(claimURI).length == 0) revert InvalidText();
        if (card.claimedAmount != 0) revert RewardClaimedAlready(rewardId);
        if (card.expiresAt != 0 && block.timestamp > card.expiresAt) revert RewardExpired(card.expiresAt);

        card.claimedAmount = card.amount;
        card.claimURI = claimURI;
        _sendValue(to, card.amount);

        emit RewardClaimed(rewardId, msg.sender, to, card.amount, claimURI);
    }

    function closeReward(bytes32 rewardId, address payable refundTo) external {
        Reward storage card = _requireOpenCard(rewardId);
        if (msg.sender != card.creator) revert Unauthorized();
        if (refundTo == address(0)) revert InvalidAddress();

        uint256 refundAmount = card.amount - card.claimedAmount;
        card.closed = true;
        if (refundAmount > 0) {
            _sendValue(refundTo, refundAmount);
        }

        emit RewardClosed(rewardId, msg.sender, refundTo, refundAmount);
    }

    function getReward(bytes32 rewardId) external view returns (Reward memory) {
        return _cards[rewardId];
    }

    function _requireOpenCard(bytes32 rewardId) private view returns (Reward storage card) {
        card = _cards[rewardId];
        if (card.creator == address(0)) revert RewardMissing(rewardId);
        if (card.closed) revert RewardClosedAlready(rewardId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}


