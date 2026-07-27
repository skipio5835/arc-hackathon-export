// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcAuctionHouse {
    struct Auction {
        address seller;
        address settlementTo;
        address highestBidder;
        uint256 minBid;
        uint256 highestBid;
        uint256 settledAmount;
        uint256 bidCount;
        uint64 createdAt;
        uint64 endsAt;
        bool closed;
        bool canceled;
        string title;
        string metadataURI;
        string settlementURI;
        string cancelURI;
    }

    mapping(bytes32 auctionId => Auction auction) private _auctions;

    event AuctionCreated(
        bytes32 indexed auctionId,
        address indexed seller,
        address indexed settlementTo,
        uint256 minBid,
        uint64 endsAt,
        string title,
        string metadataURI
    );
    event BidPlaced(
        bytes32 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        address indexed previousBidder,
        uint256 previousAmount
    );
    event AuctionSettled(bytes32 indexed auctionId, address indexed seller, address indexed winner, uint256 amount, string settlementURI);
    event AuctionCanceled(bytes32 indexed auctionId, address indexed seller, address indexed refundedBidder, uint256 refundAmount, string cancelURI);

    error AuctionAlreadyExists(bytes32 auctionId);
    error AuctionClosed(bytes32 auctionId);
    error AuctionEnded(uint64 endsAt);
    error AuctionMissing(bytes32 auctionId);
    error AuctionStillActive(uint64 endsAt);
    error BidTooLow(uint256 minimumRequired);
    error InvalidAddress();
    error InvalidAmount();
    error InvalidText();
    error TransferFailed();
    error Unauthorized();

    function createAuction(
        bytes32 auctionId,
        address settlementTo,
        uint256 minBid,
        uint64 endsAt,
        string calldata title,
        string calldata metadataURI
    ) external {
        if (_auctions[auctionId].seller != address(0)) revert AuctionAlreadyExists(auctionId);
        if (settlementTo == address(0)) revert InvalidAddress();
        if (minBid == 0) revert InvalidAmount();
        if (bytes(title).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _auctions[auctionId] = Auction({
            seller: msg.sender,
            settlementTo: settlementTo,
            highestBidder: address(0),
            minBid: minBid,
            highestBid: 0,
            settledAmount: 0,
            bidCount: 0,
            createdAt: uint64(block.timestamp),
            endsAt: endsAt,
            closed: false,
            canceled: false,
            title: title,
            metadataURI: metadataURI,
            settlementURI: "",
            cancelURI: ""
        });

        emit AuctionCreated(auctionId, msg.sender, settlementTo, minBid, endsAt, title, metadataURI);
    }

    function bid(bytes32 auctionId) external payable {
        Auction storage auction = _requireOpenAuction(auctionId);
        if (auction.endsAt != 0 && block.timestamp > auction.endsAt) revert AuctionEnded(auction.endsAt);

        uint256 minimumRequired = auction.highestBid == 0 ? auction.minBid : auction.highestBid + 1;
        if (msg.value < auction.minBid || msg.value <= auction.highestBid) revert BidTooLow(minimumRequired);

        address previousBidder = auction.highestBidder;
        uint256 previousAmount = auction.highestBid;

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        auction.bidCount += 1;

        if (previousAmount > 0) {
            _sendValue(previousBidder, previousAmount);
        }

        emit BidPlaced(auctionId, msg.sender, msg.value, previousBidder, previousAmount);
    }

    function settleAuction(bytes32 auctionId, string calldata settlementURI) external {
        Auction storage auction = _requireOpenAuction(auctionId);
        if (msg.sender != auction.seller) revert Unauthorized();
        if (auction.highestBidder == address(0)) revert InvalidAmount();
        if (auction.endsAt != 0 && block.timestamp < auction.endsAt) revert AuctionStillActive(auction.endsAt);
        if (bytes(settlementURI).length == 0) revert InvalidText();

        uint256 amount = auction.highestBid;
        auction.closed = true;
        auction.settledAmount = amount;
        auction.settlementURI = settlementURI;

        _sendValue(auction.settlementTo, amount);

        emit AuctionSettled(auctionId, msg.sender, auction.highestBidder, amount, settlementURI);
    }

    function cancelAuction(bytes32 auctionId, string calldata cancelURI) external {
        Auction storage auction = _requireOpenAuction(auctionId);
        if (msg.sender != auction.seller) revert Unauthorized();
        if (bytes(cancelURI).length == 0) revert InvalidText();

        address refundedBidder = auction.highestBidder;
        uint256 refundAmount = auction.highestBid;
        auction.closed = true;
        auction.canceled = true;
        auction.cancelURI = cancelURI;

        if (refundAmount > 0) {
            _sendValue(refundedBidder, refundAmount);
        }

        emit AuctionCanceled(auctionId, msg.sender, refundedBidder, refundAmount, cancelURI);
    }

    function getAuction(bytes32 auctionId) external view returns (Auction memory) {
        return _auctions[auctionId];
    }

    function _requireOpenAuction(bytes32 auctionId) private view returns (Auction storage auction) {
        auction = _auctions[auctionId];
        if (auction.seller == address(0)) revert AuctionMissing(auctionId);
        if (auction.closed) revert AuctionClosed(auctionId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
