// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcReferralVault {
    struct Referral {
        address creator;
        address recipient;
        uint256 amount;
        uint256 claimedAmount;
        uint64 createdAt;
        uint64 expiresAt;
        bool closed;
        string ReferralRef;
        string metadataURI;
        string claimURI;
    }

    mapping(bytes32 ReferralId => Referral card) private _cards;

    event ReferralCreated(
        bytes32 indexed ReferralId,
        address indexed creator,
        address indexed recipient,
        uint256 amount,
        uint64 expiresAt,
        string ReferralRef,
        string metadataURI
    );
    event ReferralClaimed(
        bytes32 indexed ReferralId,
        address indexed recipient,
        address indexed to,
        uint256 amount,
        string claimURI
    );
    event ReferralClosed(bytes32 indexed ReferralId, address indexed creator, address indexed refundTo, uint256 refundAmount);

    error ReferralAlreadyExists(bytes32 ReferralId);
    error ReferralClosedAlready(bytes32 ReferralId);
    error ReferralExpired(uint64 expiresAt);
    error ReferralMissing(bytes32 ReferralId);
    error ReferralClaimedAlready(bytes32 ReferralId);
    error InvalidAddress();
    error InvalidAmount();
    error InvalidText();
    error TransferFailed();
    error Unauthorized();

    function createReferral(
        bytes32 ReferralId,
        address recipient,
        uint64 expiresAt,
        string calldata ReferralRef,
        string calldata metadataURI
    ) external payable {
        if (_cards[ReferralId].creator != address(0)) revert ReferralAlreadyExists(ReferralId);
        if (recipient == address(0)) revert InvalidAddress();
        if (msg.value == 0) revert InvalidAmount();
        if (bytes(ReferralRef).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _cards[ReferralId] = Referral({
            creator: msg.sender,
            recipient: recipient,
            amount: msg.value,
            claimedAmount: 0,
            createdAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            closed: false,
            ReferralRef: ReferralRef,
            metadataURI: metadataURI,
            claimURI: ""
        });

        emit ReferralCreated(ReferralId, msg.sender, recipient, msg.value, expiresAt, ReferralRef, metadataURI);
    }

    function claimReferral(bytes32 ReferralId, address payable to, string calldata claimURI) external {
        Referral storage card = _requireOpenCard(ReferralId);
        if (msg.sender != card.recipient) revert Unauthorized();
        if (to == address(0)) revert InvalidAddress();
        if (bytes(claimURI).length == 0) revert InvalidText();
        if (card.claimedAmount != 0) revert ReferralClaimedAlready(ReferralId);
        if (card.expiresAt != 0 && block.timestamp > card.expiresAt) revert ReferralExpired(card.expiresAt);

        card.claimedAmount = card.amount;
        card.claimURI = claimURI;
        _sendValue(to, card.amount);

        emit ReferralClaimed(ReferralId, msg.sender, to, card.amount, claimURI);
    }

    function closeReferral(bytes32 ReferralId, address payable refundTo) external {
        Referral storage card = _requireOpenCard(ReferralId);
        if (msg.sender != card.creator) revert Unauthorized();
        if (refundTo == address(0)) revert InvalidAddress();

        uint256 refundAmount = card.amount - card.claimedAmount;
        card.closed = true;
        if (refundAmount > 0) {
            _sendValue(refundTo, refundAmount);
        }

        emit ReferralClosed(ReferralId, msg.sender, refundTo, refundAmount);
    }

    function getReferral(bytes32 ReferralId) external view returns (Referral memory) {
        return _cards[ReferralId];
    }

    function _requireOpenCard(bytes32 ReferralId) private view returns (Referral storage card) {
        card = _cards[ReferralId];
        if (card.creator == address(0)) revert ReferralMissing(ReferralId);
        if (card.closed) revert ReferralClosedAlready(ReferralId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}





