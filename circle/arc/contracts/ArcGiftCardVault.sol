// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcGiftCardVault {
    struct GiftCard {
        address creator;
        address recipient;
        uint256 amount;
        uint256 redeemedAmount;
        uint64 createdAt;
        uint64 expiresAt;
        bool closed;
        string cardRef;
        string metadataURI;
        string redeemURI;
    }

    mapping(bytes32 cardId => GiftCard card) private _cards;

    event GiftCardCreated(
        bytes32 indexed cardId,
        address indexed creator,
        address indexed recipient,
        uint256 amount,
        uint64 expiresAt,
        string cardRef,
        string metadataURI
    );
    event GiftCardRedeemed(
        bytes32 indexed cardId,
        address indexed recipient,
        address indexed to,
        uint256 amount,
        string redeemURI
    );
    event GiftCardClosed(bytes32 indexed cardId, address indexed creator, address indexed refundTo, uint256 refundAmount);

    error GiftCardAlreadyExists(bytes32 cardId);
    error GiftCardClosedAlready(bytes32 cardId);
    error GiftCardExpired(uint64 expiresAt);
    error GiftCardMissing(bytes32 cardId);
    error GiftCardRedeemedAlready(bytes32 cardId);
    error InvalidAddress();
    error InvalidAmount();
    error InvalidText();
    error TransferFailed();
    error Unauthorized();

    function createGiftCard(
        bytes32 cardId,
        address recipient,
        uint64 expiresAt,
        string calldata cardRef,
        string calldata metadataURI
    ) external payable {
        if (_cards[cardId].creator != address(0)) revert GiftCardAlreadyExists(cardId);
        if (recipient == address(0)) revert InvalidAddress();
        if (msg.value == 0) revert InvalidAmount();
        if (bytes(cardRef).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _cards[cardId] = GiftCard({
            creator: msg.sender,
            recipient: recipient,
            amount: msg.value,
            redeemedAmount: 0,
            createdAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            closed: false,
            cardRef: cardRef,
            metadataURI: metadataURI,
            redeemURI: ""
        });

        emit GiftCardCreated(cardId, msg.sender, recipient, msg.value, expiresAt, cardRef, metadataURI);
    }

    function redeemGiftCard(bytes32 cardId, address payable to, string calldata redeemURI) external {
        GiftCard storage card = _requireOpenCard(cardId);
        if (msg.sender != card.recipient) revert Unauthorized();
        if (to == address(0)) revert InvalidAddress();
        if (bytes(redeemURI).length == 0) revert InvalidText();
        if (card.redeemedAmount != 0) revert GiftCardRedeemedAlready(cardId);
        if (card.expiresAt != 0 && block.timestamp > card.expiresAt) revert GiftCardExpired(card.expiresAt);

        card.redeemedAmount = card.amount;
        card.redeemURI = redeemURI;
        _sendValue(to, card.amount);

        emit GiftCardRedeemed(cardId, msg.sender, to, card.amount, redeemURI);
    }

    function closeGiftCard(bytes32 cardId, address payable refundTo) external {
        GiftCard storage card = _requireOpenCard(cardId);
        if (msg.sender != card.creator) revert Unauthorized();
        if (refundTo == address(0)) revert InvalidAddress();

        uint256 refundAmount = card.amount - card.redeemedAmount;
        card.closed = true;
        if (refundAmount > 0) {
            _sendValue(refundTo, refundAmount);
        }

        emit GiftCardClosed(cardId, msg.sender, refundTo, refundAmount);
    }

    function getGiftCard(bytes32 cardId) external view returns (GiftCard memory) {
        return _cards[cardId];
    }

    function _requireOpenCard(bytes32 cardId) private view returns (GiftCard storage card) {
        card = _cards[cardId];
        if (card.creator == address(0)) revert GiftCardMissing(cardId);
        if (card.closed) revert GiftCardClosedAlready(cardId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
