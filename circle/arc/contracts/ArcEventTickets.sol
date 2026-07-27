// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcEventTickets {
    struct EventInfo {
        address organizer;
        address treasury;
        uint256 ticketPrice;
        uint256 maxSupply;
        uint256 sold;
        uint256 checkedIn;
        uint256 refunded;
        uint256 settledAmount;
        uint64 createdAt;
        bool canceled;
        string title;
        string metadataURI;
    }

    struct Ticket {
        address holder;
        uint64 purchasedAt;
        bool checkedIn;
        bool refunded;
    }

    mapping(bytes32 eventId => EventInfo eventInfo) private _events;
    mapping(bytes32 eventId => mapping(uint256 ticketId => Ticket ticket)) private _tickets;
    mapping(bytes32 eventId => mapping(address holder => uint256 ticketId)) private _ticketOf;

    event EventCreated(
        bytes32 indexed eventId,
        address indexed organizer,
        address indexed treasury,
        uint256 ticketPrice,
        uint256 maxSupply,
        string title,
        string metadataURI
    );
    event TicketPurchased(bytes32 indexed eventId, uint256 indexed ticketId, address indexed buyer, uint256 amount);
    event TicketCheckedIn(bytes32 indexed eventId, uint256 indexed ticketId, address indexed holder);
    event TicketRefunded(bytes32 indexed eventId, uint256 indexed ticketId, address indexed holder, uint256 amount);
    event EventSettled(bytes32 indexed eventId, address indexed organizer, address indexed to, uint256 amount);

    error EventAlreadyExists(bytes32 eventId);
    error EventCanceled(bytes32 eventId);
    error EventMissing(bytes32 eventId);
    error InvalidAddress();
    error InvalidAmount();
    error InvalidText();
    error SoldOut();
    error TicketAlreadyExists(address holder);
    error TicketCheckedInAlready(uint256 ticketId);
    error TicketMissing(uint256 ticketId);
    error TicketRefundedAlready(uint256 ticketId);
    error TransferFailed();
    error Unauthorized();

    function createEvent(
        bytes32 eventId,
        address treasury,
        uint256 ticketPrice,
        uint256 maxSupply,
        string calldata title,
        string calldata metadataURI
    ) external {
        if (_events[eventId].organizer != address(0)) revert EventAlreadyExists(eventId);
        if (treasury == address(0)) revert InvalidAddress();
        if (ticketPrice == 0 || maxSupply == 0) revert InvalidAmount();
        if (bytes(title).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _events[eventId] = EventInfo({
            organizer: msg.sender,
            treasury: treasury,
            ticketPrice: ticketPrice,
            maxSupply: maxSupply,
            sold: 0,
            checkedIn: 0,
            refunded: 0,
            settledAmount: 0,
            createdAt: uint64(block.timestamp),
            canceled: false,
            title: title,
            metadataURI: metadataURI
        });

        emit EventCreated(eventId, msg.sender, treasury, ticketPrice, maxSupply, title, metadataURI);
    }

    function buyTicket(bytes32 eventId) external payable returns (uint256 ticketId) {
        EventInfo storage eventInfo = _requireOpenEvent(eventId);
        if (msg.value != eventInfo.ticketPrice) revert InvalidAmount();
        if (eventInfo.sold >= eventInfo.maxSupply) revert SoldOut();
        if (_ticketOf[eventId][msg.sender] != 0) revert TicketAlreadyExists(msg.sender);

        ticketId = eventInfo.sold + 1;
        eventInfo.sold = ticketId;
        _tickets[eventId][ticketId] = Ticket({
            holder: msg.sender,
            purchasedAt: uint64(block.timestamp),
            checkedIn: false,
            refunded: false
        });
        _ticketOf[eventId][msg.sender] = ticketId;

        emit TicketPurchased(eventId, ticketId, msg.sender, msg.value);
    }

    function checkIn(bytes32 eventId, uint256 ticketId) external {
        EventInfo storage eventInfo = _requireOpenEvent(eventId);
        if (msg.sender != eventInfo.organizer) revert Unauthorized();

        Ticket storage ticket = _requireTicket(eventId, ticketId);
        if (ticket.refunded) revert TicketRefundedAlready(ticketId);
        if (ticket.checkedIn) revert TicketCheckedInAlready(ticketId);

        ticket.checkedIn = true;
        eventInfo.checkedIn += 1;

        emit TicketCheckedIn(eventId, ticketId, ticket.holder);
    }

    function refundTicket(bytes32 eventId, uint256 ticketId, address payable refundTo) external {
        EventInfo storage eventInfo = _requireEvent(eventId);
        Ticket storage ticket = _requireTicket(eventId, ticketId);
        if (msg.sender != eventInfo.organizer && msg.sender != ticket.holder) revert Unauthorized();
        if (refundTo == address(0)) revert InvalidAddress();
        if (ticket.refunded) revert TicketRefundedAlready(ticketId);
        if (ticket.checkedIn) revert TicketCheckedInAlready(ticketId);

        ticket.refunded = true;
        eventInfo.refunded += eventInfo.ticketPrice;
        _sendValue(refundTo, eventInfo.ticketPrice);

        emit TicketRefunded(eventId, ticketId, ticket.holder, eventInfo.ticketPrice);
    }

    function settleEvent(bytes32 eventId, address payable to) external {
        EventInfo storage eventInfo = _requireEvent(eventId);
        if (msg.sender != eventInfo.organizer) revert Unauthorized();
        if (to == address(0)) revert InvalidAddress();

        uint256 gross = eventInfo.ticketPrice * eventInfo.sold;
        uint256 available = gross - eventInfo.refunded - eventInfo.settledAmount;
        if (available == 0) revert InvalidAmount();

        eventInfo.settledAmount += available;
        _sendValue(to, available);

        emit EventSettled(eventId, msg.sender, to, available);
    }

    function cancelEvent(bytes32 eventId) external {
        EventInfo storage eventInfo = _requireOpenEvent(eventId);
        if (msg.sender != eventInfo.organizer) revert Unauthorized();
        eventInfo.canceled = true;
    }

    function getEvent(bytes32 eventId) external view returns (EventInfo memory) {
        return _events[eventId];
    }

    function getTicket(bytes32 eventId, uint256 ticketId) external view returns (Ticket memory) {
        return _tickets[eventId][ticketId];
    }

    function getTicketOf(bytes32 eventId, address holder) external view returns (uint256) {
        return _ticketOf[eventId][holder];
    }

    function _requireEvent(bytes32 eventId) private view returns (EventInfo storage eventInfo) {
        eventInfo = _events[eventId];
        if (eventInfo.organizer == address(0)) revert EventMissing(eventId);
    }

    function _requireOpenEvent(bytes32 eventId) private view returns (EventInfo storage eventInfo) {
        eventInfo = _requireEvent(eventId);
        if (eventInfo.canceled) revert EventCanceled(eventId);
    }

    function _requireTicket(bytes32 eventId, uint256 ticketId) private view returns (Ticket storage ticket) {
        ticket = _tickets[eventId][ticketId];
        if (ticket.holder == address(0)) revert TicketMissing(ticketId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
