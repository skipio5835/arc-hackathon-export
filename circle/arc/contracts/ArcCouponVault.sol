// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcCouponVault {
    struct Coupon {
        address creator;
        address recipient;
        uint256 amount;
        uint256 claimedAmount;
        uint64 createdAt;
        uint64 expiresAt;
        bool closed;
        string couponRef;
        string metadataURI;
        string claimURI;
    }

    mapping(bytes32 couponId => Coupon card) private _cards;

    event CouponCreated(
        bytes32 indexed couponId,
        address indexed creator,
        address indexed recipient,
        uint256 amount,
        uint64 expiresAt,
        string couponRef,
        string metadataURI
    );
    event CouponClaimed(
        bytes32 indexed couponId,
        address indexed recipient,
        address indexed to,
        uint256 amount,
        string claimURI
    );
    event CouponClosed(bytes32 indexed couponId, address indexed creator, address indexed refundTo, uint256 refundAmount);

    error CouponAlreadyExists(bytes32 couponId);
    error CouponClosedAlready(bytes32 couponId);
    error CouponExpired(uint64 expiresAt);
    error CouponMissing(bytes32 couponId);
    error CouponClaimedAlready(bytes32 couponId);
    error InvalidAddress();
    error InvalidAmount();
    error InvalidText();
    error TransferFailed();
    error Unauthorized();

    function createCoupon(
        bytes32 couponId,
        address recipient,
        uint64 expiresAt,
        string calldata couponRef,
        string calldata metadataURI
    ) external payable {
        if (_cards[couponId].creator != address(0)) revert CouponAlreadyExists(couponId);
        if (recipient == address(0)) revert InvalidAddress();
        if (msg.value == 0) revert InvalidAmount();
        if (bytes(couponRef).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _cards[couponId] = Coupon({
            creator: msg.sender,
            recipient: recipient,
            amount: msg.value,
            claimedAmount: 0,
            createdAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            closed: false,
            couponRef: couponRef,
            metadataURI: metadataURI,
            claimURI: ""
        });

        emit CouponCreated(couponId, msg.sender, recipient, msg.value, expiresAt, couponRef, metadataURI);
    }

    function claimCoupon(bytes32 couponId, address payable to, string calldata claimURI) external {
        Coupon storage card = _requireOpenCard(couponId);
        if (msg.sender != card.recipient) revert Unauthorized();
        if (to == address(0)) revert InvalidAddress();
        if (bytes(claimURI).length == 0) revert InvalidText();
        if (card.claimedAmount != 0) revert CouponClaimedAlready(couponId);
        if (card.expiresAt != 0 && block.timestamp > card.expiresAt) revert CouponExpired(card.expiresAt);

        card.claimedAmount = card.amount;
        card.claimURI = claimURI;
        _sendValue(to, card.amount);

        emit CouponClaimed(couponId, msg.sender, to, card.amount, claimURI);
    }

    function closeCoupon(bytes32 couponId, address payable refundTo) external {
        Coupon storage card = _requireOpenCard(couponId);
        if (msg.sender != card.creator) revert Unauthorized();
        if (refundTo == address(0)) revert InvalidAddress();

        uint256 refundAmount = card.amount - card.claimedAmount;
        card.closed = true;
        if (refundAmount > 0) {
            _sendValue(refundTo, refundAmount);
        }

        emit CouponClosed(couponId, msg.sender, refundTo, refundAmount);
    }

    function getCoupon(bytes32 couponId) external view returns (Coupon memory) {
        return _cards[couponId];
    }

    function _requireOpenCard(bytes32 couponId) private view returns (Coupon storage card) {
        card = _cards[couponId];
        if (card.creator == address(0)) revert CouponMissing(couponId);
        if (card.closed) revert CouponClosedAlready(couponId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}




