// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcPreorderStore {
    struct Product {
        address seller;
        address treasury;
        uint256 price;
        uint256 maxSupply;
        uint256 ordered;
        uint256 fulfilled;
        uint256 refunded;
        uint256 settledAmount;
        uint64 createdAt;
        bool active;
        string title;
        string metadataURI;
    }

    struct Preorder {
        address buyer;
        uint256 amount;
        uint64 orderedAt;
        bool fulfilled;
        bool refunded;
        string fulfillmentURI;
    }

    mapping(bytes32 productId => Product product) private _products;
    mapping(bytes32 productId => mapping(uint256 preorderId => Preorder preorder)) private _preorders;
    mapping(bytes32 productId => mapping(address buyer => uint256 preorderId)) private _preorderOf;

    event ProductCreated(
        bytes32 indexed productId,
        address indexed seller,
        address indexed treasury,
        uint256 price,
        uint256 maxSupply,
        string title,
        string metadataURI
    );
    event PreorderPlaced(bytes32 indexed productId, uint256 indexed preorderId, address indexed buyer, uint256 amount);
    event PreorderFulfilled(
        bytes32 indexed productId,
        uint256 indexed preorderId,
        address indexed buyer,
        string fulfillmentURI
    );
    event PreorderRefunded(bytes32 indexed productId, uint256 indexed preorderId, address indexed buyer, uint256 amount);
    event ProductSettled(bytes32 indexed productId, address indexed seller, address indexed to, uint256 amount);

    error FullyOrdered();
    error InvalidAddress();
    error InvalidAmount();
    error InvalidText();
    error PreorderAlreadyExists(address buyer);
    error PreorderFulfilledAlready(uint256 preorderId);
    error PreorderMissing(uint256 preorderId);
    error PreorderRefundedAlready(uint256 preorderId);
    error ProductAlreadyExists(bytes32 productId);
    error ProductInactive(bytes32 productId);
    error ProductMissing(bytes32 productId);
    error TransferFailed();
    error Unauthorized();

    function createProduct(
        bytes32 productId,
        address treasury,
        uint256 price,
        uint256 maxSupply,
        string calldata title,
        string calldata metadataURI
    ) external {
        if (_products[productId].seller != address(0)) revert ProductAlreadyExists(productId);
        if (treasury == address(0)) revert InvalidAddress();
        if (price == 0 || maxSupply == 0) revert InvalidAmount();
        if (bytes(title).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _products[productId] = Product({
            seller: msg.sender,
            treasury: treasury,
            price: price,
            maxSupply: maxSupply,
            ordered: 0,
            fulfilled: 0,
            refunded: 0,
            settledAmount: 0,
            createdAt: uint64(block.timestamp),
            active: true,
            title: title,
            metadataURI: metadataURI
        });

        emit ProductCreated(productId, msg.sender, treasury, price, maxSupply, title, metadataURI);
    }

    function preorder(bytes32 productId) external payable returns (uint256 preorderId) {
        Product storage product = _requireActiveProduct(productId);
        if (msg.value != product.price) revert InvalidAmount();
        if (product.ordered >= product.maxSupply) revert FullyOrdered();
        if (_preorderOf[productId][msg.sender] != 0) revert PreorderAlreadyExists(msg.sender);

        preorderId = product.ordered + 1;
        product.ordered = preorderId;
        _preorders[productId][preorderId] = Preorder({
            buyer: msg.sender,
            amount: msg.value,
            orderedAt: uint64(block.timestamp),
            fulfilled: false,
            refunded: false,
            fulfillmentURI: ""
        });
        _preorderOf[productId][msg.sender] = preorderId;

        emit PreorderPlaced(productId, preorderId, msg.sender, msg.value);
    }

    function fulfillPreorder(bytes32 productId, uint256 preorderId, string calldata fulfillmentURI) external {
        Product storage product = _requireProduct(productId);
        if (msg.sender != product.seller) revert Unauthorized();
        if (bytes(fulfillmentURI).length == 0) revert InvalidText();

        Preorder storage order = _requirePreorder(productId, preorderId);
        if (order.refunded) revert PreorderRefundedAlready(preorderId);
        if (order.fulfilled) revert PreorderFulfilledAlready(preorderId);

        order.fulfilled = true;
        order.fulfillmentURI = fulfillmentURI;
        product.fulfilled += 1;

        emit PreorderFulfilled(productId, preorderId, order.buyer, fulfillmentURI);
    }

    function refundPreorder(bytes32 productId, uint256 preorderId, address payable refundTo) external {
        Product storage product = _requireProduct(productId);
        Preorder storage order = _requirePreorder(productId, preorderId);
        if (msg.sender != product.seller && msg.sender != order.buyer) revert Unauthorized();
        if (refundTo == address(0)) revert InvalidAddress();
        if (order.refunded) revert PreorderRefundedAlready(preorderId);
        if (order.fulfilled) revert PreorderFulfilledAlready(preorderId);

        order.refunded = true;
        product.refunded += order.amount;
        _sendValue(refundTo, order.amount);

        emit PreorderRefunded(productId, preorderId, order.buyer, order.amount);
    }

    function settleProduct(bytes32 productId, address payable to) external {
        Product storage product = _requireProduct(productId);
        if (msg.sender != product.seller && msg.sender != product.treasury) revert Unauthorized();
        if (to == address(0)) revert InvalidAddress();

        uint256 gross = product.price * product.ordered;
        uint256 available = gross - product.refunded - product.settledAmount;
        if (available == 0) revert InvalidAmount();

        product.settledAmount += available;
        _sendValue(to, available);

        emit ProductSettled(productId, msg.sender, to, available);
    }

    function closeProduct(bytes32 productId) external {
        Product storage product = _requireActiveProduct(productId);
        if (msg.sender != product.seller && msg.sender != product.treasury) revert Unauthorized();
        product.active = false;
    }

    function getProduct(bytes32 productId) external view returns (Product memory) {
        return _products[productId];
    }

    function getPreorder(bytes32 productId, uint256 preorderId) external view returns (Preorder memory) {
        return _preorders[productId][preorderId];
    }

    function getPreorderOf(bytes32 productId, address buyer) external view returns (uint256) {
        return _preorderOf[productId][buyer];
    }

    function _requireProduct(bytes32 productId) private view returns (Product storage product) {
        product = _products[productId];
        if (product.seller == address(0)) revert ProductMissing(productId);
    }

    function _requireActiveProduct(bytes32 productId) private view returns (Product storage product) {
        product = _requireProduct(productId);
        if (!product.active) revert ProductInactive(productId);
    }

    function _requirePreorder(bytes32 productId, uint256 preorderId) private view returns (Preorder storage order) {
        order = _preorders[productId][preorderId];
        if (order.buyer == address(0)) revert PreorderMissing(preorderId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
