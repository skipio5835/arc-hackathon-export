// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcCashbackVault {
    struct Cashback {
        address creator;
        address recipient;
        uint256 amount;
        uint256 claimedAmount;
        uint64 createdAt;
        uint64 expiresAt;
        bool closed;
        string CashbackRef;
        string metadataURI;
        string claimURI;
    }

    mapping(bytes32 CashbackId => Cashback card) private _cards;

    event CashbackCreated(
        bytes32 indexed CashbackId,
        address indexed creator,
        address indexed recipient,
        uint256 amount,
        uint64 expiresAt,
        string CashbackRef,
        string metadataURI
    );
    event CashbackClaimed(
        bytes32 indexed CashbackId,
        address indexed recipient,
        address indexed to,
        uint256 amount,
        string claimURI
    );
    event CashbackClosed(bytes32 indexed CashbackId, address indexed creator, address indexed refundTo, uint256 refundAmount);

    error CashbackAlreadyExists(bytes32 CashbackId);
    error CashbackClosedAlready(bytes32 CashbackId);
    error CashbackExpired(uint64 expiresAt);
    error CashbackMissing(bytes32 CashbackId);
    error CashbackClaimedAlready(bytes32 CashbackId);
    error InvalidAddress();
    error InvalidAmount();
    error InvalidText();
    error TransferFailed();
    error Unauthorized();

    function createCashback(
        bytes32 CashbackId,
        address recipient,
        uint64 expiresAt,
        string calldata CashbackRef,
        string calldata metadataURI
    ) external payable {
        if (_cards[CashbackId].creator != address(0)) revert CashbackAlreadyExists(CashbackId);
        if (recipient == address(0)) revert InvalidAddress();
        if (msg.value == 0) revert InvalidAmount();
        if (bytes(CashbackRef).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _cards[CashbackId] = Cashback({
            creator: msg.sender,
            recipient: recipient,
            amount: msg.value,
            claimedAmount: 0,
            createdAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            closed: false,
            CashbackRef: CashbackRef,
            metadataURI: metadataURI,
            claimURI: ""
        });

        emit CashbackCreated(CashbackId, msg.sender, recipient, msg.value, expiresAt, CashbackRef, metadataURI);
    }

    function claimCashback(bytes32 CashbackId, address payable to, string calldata claimURI) external {
        Cashback storage card = _requireOpenCard(CashbackId);
        if (msg.sender != card.recipient) revert Unauthorized();
        if (to == address(0)) revert InvalidAddress();
        if (bytes(claimURI).length == 0) revert InvalidText();
        if (card.claimedAmount != 0) revert CashbackClaimedAlready(CashbackId);
        if (card.expiresAt != 0 && block.timestamp > card.expiresAt) revert CashbackExpired(card.expiresAt);

        card.claimedAmount = card.amount;
        card.claimURI = claimURI;
        _sendValue(to, card.amount);

        emit CashbackClaimed(CashbackId, msg.sender, to, card.amount, claimURI);
    }

    function closeCashback(bytes32 CashbackId, address payable refundTo) external {
        Cashback storage card = _requireOpenCard(CashbackId);
        if (msg.sender != card.creator) revert Unauthorized();
        if (refundTo == address(0)) revert InvalidAddress();

        uint256 refundAmount = card.amount - card.claimedAmount;
        card.closed = true;
        if (refundAmount > 0) {
            _sendValue(refundTo, refundAmount);
        }

        emit CashbackClosed(CashbackId, msg.sender, refundTo, refundAmount);
    }

    function getCashback(bytes32 CashbackId) external view returns (Cashback memory) {
        return _cards[CashbackId];
    }

    function _requireOpenCard(bytes32 CashbackId) private view returns (Cashback storage card) {
        card = _cards[CashbackId];
        if (card.creator == address(0)) revert CashbackMissing(CashbackId);
        if (card.closed) revert CashbackClosedAlready(CashbackId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}





