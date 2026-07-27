// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcServiceBookings {
    enum WorkOrderStatus {
        None,
        Created,
        Accepted,
        Submitted,
        Approved,
        Refunded
    }

    struct Service {
        address provider;
        address treasury;
        uint256 price;
        uint256 maxBookings;
        uint256 booked;
        uint256 completed;
        uint256 refunded;
        uint256 settledAmount;
        uint64 createdAt;
        bool active;
        string title;
        string metadataURI;
    }

    struct Booking {
        address client;
        uint256 amount;
        uint64 bookedAt;
        bool completed;
        bool refunded;
        string completionURI;
    }

    struct WorkOrder {
        address client;
        address worker;
        uint256 amount;
        WorkOrderStatus status;
        string title;
        string briefURI;
        string submissionURI;
        string approvalURI;
    }

    mapping(bytes32 serviceId => Service service) private _services;
    mapping(bytes32 serviceId => mapping(uint256 bookingId => Booking booking)) private _bookings;
    mapping(bytes32 serviceId => mapping(address client => uint256 bookingId)) private _bookingOf;
    mapping(bytes32 workOrderId => WorkOrder workOrder) private _workOrders;

    event ServiceCreated(
        bytes32 indexed serviceId,
        address indexed provider,
        address indexed treasury,
        uint256 price,
        uint256 maxBookings,
        string title,
        string metadataURI
    );
    event BookingCreated(bytes32 indexed serviceId, uint256 indexed bookingId, address indexed client, uint256 amount);
    event BookingCompleted(bytes32 indexed serviceId, uint256 indexed bookingId, address indexed client, string completionURI);
    event BookingRefunded(bytes32 indexed serviceId, uint256 indexed bookingId, address indexed client, uint256 amount);
    event ServiceSettled(bytes32 indexed serviceId, address indexed provider, address indexed to, uint256 amount);
    event WorkOrderCreated(
        bytes32 indexed workOrderId,
        address indexed client,
        address indexed worker,
        uint256 amount,
        string title,
        string briefURI
    );
    event WorkOrderAccepted(bytes32 indexed workOrderId, address indexed worker);
    event WorkOrderSubmitted(bytes32 indexed workOrderId, address indexed worker, string submissionURI);
    event WorkOrderApproved(
        bytes32 indexed workOrderId,
        address indexed client,
        address indexed payoutTo,
        uint256 amount,
        string approvalURI
    );
    event WorkOrderRefunded(bytes32 indexed workOrderId, address indexed refundTo, uint256 amount);

    error BookingAlreadyExists(address client);
    error BookingCompletedAlready(uint256 bookingId);
    error BookingMissing(uint256 bookingId);
    error BookingRefundedAlready(uint256 bookingId);
    error FullyBooked();
    error InvalidAddress();
    error InvalidAmount();
    error InvalidText();
    error ServiceAlreadyExists(bytes32 serviceId);
    error ServiceInactive(bytes32 serviceId);
    error ServiceMissing(bytes32 serviceId);
    error TransferFailed();
    error Unauthorized();
    error WorkOrderAlreadyExists(bytes32 workOrderId);
    error WorkOrderMissing(bytes32 workOrderId);
    error WorkOrderWrongStatus(bytes32 workOrderId);

    function createService(
        bytes32 serviceId,
        address treasury,
        uint256 price,
        uint256 maxBookings,
        string calldata title,
        string calldata metadataURI
    ) external {
        if (_services[serviceId].provider != address(0)) revert ServiceAlreadyExists(serviceId);
        if (treasury == address(0)) revert InvalidAddress();
        if (price == 0 || maxBookings == 0) revert InvalidAmount();
        if (bytes(title).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _services[serviceId] = Service({
            provider: msg.sender,
            treasury: treasury,
            price: price,
            maxBookings: maxBookings,
            booked: 0,
            completed: 0,
            refunded: 0,
            settledAmount: 0,
            createdAt: uint64(block.timestamp),
            active: true,
            title: title,
            metadataURI: metadataURI
        });

        emit ServiceCreated(serviceId, msg.sender, treasury, price, maxBookings, title, metadataURI);
    }

    function bookService(bytes32 serviceId) external payable returns (uint256 bookingId) {
        Service storage service = _requireActiveService(serviceId);
        if (msg.value != service.price) revert InvalidAmount();
        if (service.booked >= service.maxBookings) revert FullyBooked();
        if (_bookingOf[serviceId][msg.sender] != 0) revert BookingAlreadyExists(msg.sender);

        bookingId = service.booked + 1;
        service.booked = bookingId;
        _bookings[serviceId][bookingId] = Booking({
            client: msg.sender,
            amount: msg.value,
            bookedAt: uint64(block.timestamp),
            completed: false,
            refunded: false,
            completionURI: ""
        });
        _bookingOf[serviceId][msg.sender] = bookingId;

        emit BookingCreated(serviceId, bookingId, msg.sender, msg.value);
    }

    function completeBooking(bytes32 serviceId, uint256 bookingId, string calldata completionURI) external {
        Service storage service = _requireService(serviceId);
        if (msg.sender != service.provider) revert Unauthorized();
        if (bytes(completionURI).length == 0) revert InvalidText();

        Booking storage booking = _requireBooking(serviceId, bookingId);
        if (booking.refunded) revert BookingRefundedAlready(bookingId);
        if (booking.completed) revert BookingCompletedAlready(bookingId);

        booking.completed = true;
        booking.completionURI = completionURI;
        service.completed += 1;

        emit BookingCompleted(serviceId, bookingId, booking.client, completionURI);
    }

    function refundBooking(bytes32 serviceId, uint256 bookingId, address payable refundTo) external {
        Service storage service = _requireService(serviceId);
        Booking storage booking = _requireBooking(serviceId, bookingId);
        if (msg.sender != service.provider && msg.sender != booking.client) revert Unauthorized();
        if (refundTo == address(0)) revert InvalidAddress();
        if (booking.refunded) revert BookingRefundedAlready(bookingId);
        if (booking.completed) revert BookingCompletedAlready(bookingId);

        booking.refunded = true;
        service.refunded += booking.amount;
        _sendValue(refundTo, booking.amount);

        emit BookingRefunded(serviceId, bookingId, booking.client, booking.amount);
    }

    function settleService(bytes32 serviceId, address payable to) external {
        Service storage service = _requireService(serviceId);
        if (msg.sender != service.provider) revert Unauthorized();
        if (to == address(0)) revert InvalidAddress();

        uint256 gross = service.price * service.booked;
        uint256 available = gross - service.refunded - service.settledAmount;
        if (available == 0) revert InvalidAmount();

        service.settledAmount += available;
        _sendValue(to, available);

        emit ServiceSettled(serviceId, msg.sender, to, available);
    }

    function deactivateService(bytes32 serviceId) external {
        Service storage service = _requireActiveService(serviceId);
        if (msg.sender != service.provider) revert Unauthorized();
        service.active = false;
    }

    function createWorkOrder(
        bytes32 workOrderId,
        address worker,
        string calldata title,
        string calldata briefURI
    ) external payable {
        if (_workOrders[workOrderId].client != address(0)) revert WorkOrderAlreadyExists(workOrderId);
        if (worker == address(0)) revert InvalidAddress();
        if (msg.value == 0) revert InvalidAmount();
        if (bytes(title).length == 0 || bytes(briefURI).length == 0) revert InvalidText();

        _workOrders[workOrderId] = WorkOrder({
            client: msg.sender,
            worker: worker,
            amount: msg.value,
            status: WorkOrderStatus.Created,
            title: title,
            briefURI: briefURI,
            submissionURI: "",
            approvalURI: ""
        });

        emit WorkOrderCreated(workOrderId, msg.sender, worker, msg.value, title, briefURI);
    }

    function acceptWorkOrder(bytes32 workOrderId) external {
        WorkOrder storage order = _requireWorkOrder(workOrderId);
        if (msg.sender != order.worker) revert Unauthorized();
        if (order.status != WorkOrderStatus.Created) revert WorkOrderWrongStatus(workOrderId);

        order.status = WorkOrderStatus.Accepted;

        emit WorkOrderAccepted(workOrderId, msg.sender);
    }

    function submitWorkOrder(bytes32 workOrderId, string calldata submissionURI) external {
        WorkOrder storage order = _requireWorkOrder(workOrderId);
        if (msg.sender != order.worker) revert Unauthorized();
        if (order.status != WorkOrderStatus.Accepted) revert WorkOrderWrongStatus(workOrderId);
        if (bytes(submissionURI).length == 0) revert InvalidText();

        order.status = WorkOrderStatus.Submitted;
        order.submissionURI = submissionURI;

        emit WorkOrderSubmitted(workOrderId, msg.sender, submissionURI);
    }

    function approveWorkOrder(
        bytes32 workOrderId,
        address payable payoutTo,
        string calldata approvalURI
    ) external {
        WorkOrder storage order = _requireWorkOrder(workOrderId);
        if (msg.sender != order.client) revert Unauthorized();
        if (order.status != WorkOrderStatus.Submitted) revert WorkOrderWrongStatus(workOrderId);
        if (payoutTo == address(0)) revert InvalidAddress();
        if (bytes(approvalURI).length == 0) revert InvalidText();

        order.status = WorkOrderStatus.Approved;
        order.approvalURI = approvalURI;
        _sendValue(payoutTo, order.amount);

        emit WorkOrderApproved(workOrderId, msg.sender, payoutTo, order.amount, approvalURI);
    }

    function refundWorkOrder(bytes32 workOrderId, address payable refundTo) external {
        WorkOrder storage order = _requireWorkOrder(workOrderId);
        if (msg.sender != order.client && msg.sender != order.worker) revert Unauthorized();
        if (
            order.status != WorkOrderStatus.Created
                && order.status != WorkOrderStatus.Accepted
                && order.status != WorkOrderStatus.Submitted
        ) {
            revert WorkOrderWrongStatus(workOrderId);
        }
        if (refundTo == address(0)) revert InvalidAddress();

        order.status = WorkOrderStatus.Refunded;
        _sendValue(refundTo, order.amount);

        emit WorkOrderRefunded(workOrderId, refundTo, order.amount);
    }

    function getService(bytes32 serviceId) external view returns (Service memory) {
        return _services[serviceId];
    }

    function getBooking(bytes32 serviceId, uint256 bookingId) external view returns (Booking memory) {
        return _bookings[serviceId][bookingId];
    }

    function getBookingOf(bytes32 serviceId, address client) external view returns (uint256) {
        return _bookingOf[serviceId][client];
    }

    function getWorkOrder(bytes32 workOrderId) external view returns (WorkOrder memory) {
        return _workOrders[workOrderId];
    }

    function _requireService(bytes32 serviceId) private view returns (Service storage service) {
        service = _services[serviceId];
        if (service.provider == address(0)) revert ServiceMissing(serviceId);
    }

    function _requireActiveService(bytes32 serviceId) private view returns (Service storage service) {
        service = _requireService(serviceId);
        if (!service.active) revert ServiceInactive(serviceId);
    }

    function _requireBooking(bytes32 serviceId, uint256 bookingId) private view returns (Booking storage booking) {
        booking = _bookings[serviceId][bookingId];
        if (booking.client == address(0)) revert BookingMissing(bookingId);
    }

    function _requireWorkOrder(bytes32 workOrderId) private view returns (WorkOrder storage order) {
        order = _workOrders[workOrderId];
        if (order.client == address(0)) revert WorkOrderMissing(workOrderId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
