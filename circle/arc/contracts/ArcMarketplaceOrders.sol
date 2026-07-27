// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcMarketplaceOrders {
    struct Listing {
        address seller;
        address treasury;
        uint256 price;
        uint256 maxOrders;
        uint256 sold;
        uint256 fulfilled;
        uint256 refunded;
        uint256 settledAmount;
        uint64 createdAt;
        bool active;
        string title;
        string metadataURI;
    }

    struct Order {
        address buyer;
        uint256 amount;
        uint64 purchasedAt;
        bool fulfilled;
        bool refunded;
        string fulfillmentURI;
    }

    struct ReturnCase {
        address requester;
        uint64 requestedAt;
        uint64 reviewedAt;
        uint64 closedAt;
        bool accepted;
        string reasonURI;
        string reviewURI;
        string closeURI;
        ReturnStatus status;
    }

    enum ReturnStatus {
        Unknown,
        Requested,
        Reviewed,
        Closed
    }

    mapping(bytes32 listingId => Listing listing) private _listings;
    mapping(bytes32 listingId => mapping(uint256 orderId => Order order)) private _orders;
    mapping(bytes32 listingId => mapping(uint256 orderId => ReturnCase returnCase)) private _returns;
    mapping(bytes32 listingId => mapping(address buyer => uint256 orderId)) private _orderOf;

    event ListingCreated(
        bytes32 indexed listingId,
        address indexed seller,
        address indexed treasury,
        uint256 price,
        uint256 maxOrders,
        string title,
        string metadataURI
    );
    event OrderPurchased(bytes32 indexed listingId, uint256 indexed orderId, address indexed buyer, uint256 amount);
    event OrderFulfilled(bytes32 indexed listingId, uint256 indexed orderId, address indexed buyer, string fulfillmentURI);
    event OrderRefunded(bytes32 indexed listingId, uint256 indexed orderId, address indexed buyer, uint256 amount);
    event ReturnRequested(bytes32 indexed listingId, uint256 indexed orderId, address indexed requester, string reasonURI);
    event ReturnReviewed(bytes32 indexed listingId, uint256 indexed orderId, bool accepted, string reviewURI);
    event ReturnClosed(bytes32 indexed listingId, uint256 indexed orderId, string closeURI);
    event ListingSettled(bytes32 indexed listingId, address indexed seller, address indexed to, uint256 amount);

    error InvalidAddress();
    error InvalidAmount();
    error InvalidText();
    error ListingAlreadyExists(bytes32 listingId);
    error ListingInactive(bytes32 listingId);
    error ListingMissing(bytes32 listingId);
    error OrderAlreadyExists(address buyer);
    error OrderFulfilledAlready(uint256 orderId);
    error OrderNotFulfilled(uint256 orderId);
    error OrderMissing(uint256 orderId);
    error OrderRefundedAlready(uint256 orderId);
    error ReturnAlreadyExists(uint256 orderId);
    error ReturnMissing(uint256 orderId);
    error ReturnNotClosable(uint256 orderId);
    error ReturnNotReviewable(uint256 orderId);
    error SoldOut();
    error TransferFailed();
    error Unauthorized();

    function createListing(
        bytes32 listingId,
        address treasury,
        uint256 price,
        uint256 maxOrders,
        string calldata title,
        string calldata metadataURI
    ) external {
        if (_listings[listingId].seller != address(0)) revert ListingAlreadyExists(listingId);
        if (treasury == address(0)) revert InvalidAddress();
        if (price == 0 || maxOrders == 0) revert InvalidAmount();
        if (bytes(title).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _listings[listingId] = Listing({
            seller: msg.sender,
            treasury: treasury,
            price: price,
            maxOrders: maxOrders,
            sold: 0,
            fulfilled: 0,
            refunded: 0,
            settledAmount: 0,
            createdAt: uint64(block.timestamp),
            active: true,
            title: title,
            metadataURI: metadataURI
        });

        emit ListingCreated(listingId, msg.sender, treasury, price, maxOrders, title, metadataURI);
    }

    function purchase(bytes32 listingId) external payable returns (uint256 orderId) {
        Listing storage listing = _requireActiveListing(listingId);
        if (msg.value != listing.price) revert InvalidAmount();
        if (listing.sold >= listing.maxOrders) revert SoldOut();
        if (_orderOf[listingId][msg.sender] != 0) revert OrderAlreadyExists(msg.sender);

        orderId = listing.sold + 1;
        listing.sold = orderId;
        _orders[listingId][orderId] = Order({
            buyer: msg.sender,
            amount: msg.value,
            purchasedAt: uint64(block.timestamp),
            fulfilled: false,
            refunded: false,
            fulfillmentURI: ""
        });
        _orderOf[listingId][msg.sender] = orderId;

        emit OrderPurchased(listingId, orderId, msg.sender, msg.value);
    }

    function fulfillOrder(bytes32 listingId, uint256 orderId, string calldata fulfillmentURI) external {
        Listing storage listing = _requireListing(listingId);
        if (msg.sender != listing.seller) revert Unauthorized();
        if (bytes(fulfillmentURI).length == 0) revert InvalidText();

        Order storage order = _requireOrder(listingId, orderId);
        if (order.refunded) revert OrderRefundedAlready(orderId);
        if (order.fulfilled) revert OrderFulfilledAlready(orderId);

        order.fulfilled = true;
        order.fulfillmentURI = fulfillmentURI;
        listing.fulfilled += 1;

        emit OrderFulfilled(listingId, orderId, order.buyer, fulfillmentURI);
    }

    function refundOrder(bytes32 listingId, uint256 orderId, address payable refundTo) external {
        Listing storage listing = _requireListing(listingId);
        Order storage order = _requireOrder(listingId, orderId);
        if (msg.sender != listing.seller && msg.sender != order.buyer) revert Unauthorized();
        if (refundTo == address(0)) revert InvalidAddress();
        if (order.refunded) revert OrderRefundedAlready(orderId);
        if (order.fulfilled) revert OrderFulfilledAlready(orderId);

        order.refunded = true;
        listing.refunded += order.amount;
        _sendValue(refundTo, order.amount);

        emit OrderRefunded(listingId, orderId, order.buyer, order.amount);
    }

    function requestReturn(bytes32 listingId, uint256 orderId, string calldata reasonURI) external {
        Order storage order = _requireOrder(listingId, orderId);
        if (msg.sender != order.buyer) revert Unauthorized();
        if (!order.fulfilled) revert OrderNotFulfilled(orderId);
        if (order.refunded) revert OrderRefundedAlready(orderId);
        if (_returns[listingId][orderId].status != ReturnStatus.Unknown) revert ReturnAlreadyExists(orderId);
        if (bytes(reasonURI).length == 0) revert InvalidText();

        _returns[listingId][orderId] = ReturnCase({
            requester: msg.sender,
            requestedAt: uint64(block.timestamp),
            reviewedAt: 0,
            closedAt: 0,
            accepted: false,
            reasonURI: reasonURI,
            reviewURI: "",
            closeURI: "",
            status: ReturnStatus.Requested
        });

        emit ReturnRequested(listingId, orderId, msg.sender, reasonURI);
    }

    function reviewReturn(
        bytes32 listingId,
        uint256 orderId,
        bool accepted,
        string calldata reviewURI
    ) external {
        Listing storage listing = _requireListing(listingId);
        if (msg.sender != listing.seller) revert Unauthorized();
        if (bytes(reviewURI).length == 0) revert InvalidText();

        ReturnCase storage returnCase = _requireReturn(listingId, orderId);
        if (returnCase.status != ReturnStatus.Requested) revert ReturnNotReviewable(orderId);

        returnCase.accepted = accepted;
        returnCase.reviewedAt = uint64(block.timestamp);
        returnCase.reviewURI = reviewURI;
        returnCase.status = ReturnStatus.Reviewed;

        emit ReturnReviewed(listingId, orderId, accepted, reviewURI);
    }

    function closeReturn(bytes32 listingId, uint256 orderId, string calldata closeURI) external {
        Listing storage listing = _requireListing(listingId);
        ReturnCase storage returnCase = _requireReturn(listingId, orderId);
        if (msg.sender != listing.seller && msg.sender != returnCase.requester) revert Unauthorized();
        if (returnCase.status != ReturnStatus.Reviewed) revert ReturnNotClosable(orderId);
        if (bytes(closeURI).length == 0) revert InvalidText();

        returnCase.closedAt = uint64(block.timestamp);
        returnCase.closeURI = closeURI;
        returnCase.status = ReturnStatus.Closed;

        emit ReturnClosed(listingId, orderId, closeURI);
    }

    function settleListing(bytes32 listingId, address payable to) external {
        Listing storage listing = _requireListing(listingId);
        if (msg.sender != listing.seller) revert Unauthorized();
        if (to == address(0)) revert InvalidAddress();

        uint256 gross = listing.price * listing.sold;
        uint256 available = gross - listing.refunded - listing.settledAmount;
        if (available == 0) revert InvalidAmount();

        listing.settledAmount += available;
        _sendValue(to, available);

        emit ListingSettled(listingId, msg.sender, to, available);
    }

    function deactivateListing(bytes32 listingId) external {
        Listing storage listing = _requireActiveListing(listingId);
        if (msg.sender != listing.seller) revert Unauthorized();
        listing.active = false;
    }

    function getListing(bytes32 listingId) external view returns (Listing memory) {
        return _listings[listingId];
    }

    function getOrder(bytes32 listingId, uint256 orderId) external view returns (Order memory) {
        return _orders[listingId][orderId];
    }

    function getReturnCase(bytes32 listingId, uint256 orderId) external view returns (ReturnCase memory) {
        return _returns[listingId][orderId];
    }

    function getOrderOf(bytes32 listingId, address buyer) external view returns (uint256) {
        return _orderOf[listingId][buyer];
    }

    function _requireListing(bytes32 listingId) private view returns (Listing storage listing) {
        listing = _listings[listingId];
        if (listing.seller == address(0)) revert ListingMissing(listingId);
    }

    function _requireActiveListing(bytes32 listingId) private view returns (Listing storage listing) {
        listing = _requireListing(listingId);
        if (!listing.active) revert ListingInactive(listingId);
    }

    function _requireOrder(bytes32 listingId, uint256 orderId) private view returns (Order storage order) {
        order = _orders[listingId][orderId];
        if (order.buyer == address(0)) revert OrderMissing(orderId);
    }

    function _requireReturn(bytes32 listingId, uint256 orderId) private view returns (ReturnCase storage returnCase) {
        returnCase = _returns[listingId][orderId];
        if (returnCase.status == ReturnStatus.Unknown) revert ReturnMissing(orderId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
