// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcSupportDesk {
    struct Ticket {
        address requester;
        address agent;
        uint64 createdAt;
        uint64 respondedAt;
        uint64 closedAt;
        bool responded;
        bool closed;
        string ticketRef;
        string category;
        string metadataURI;
        string responseURI;
        string closeURI;
    }

    mapping(bytes32 ticketId => Ticket ticket) private _tickets;

    event TicketCreated(
        bytes32 indexed ticketId,
        address indexed requester,
        address indexed agent,
        string ticketRef,
        string category,
        string metadataURI
    );
    event TicketResponded(bytes32 indexed ticketId, address indexed responder, string responseURI);
    event TicketClosed(bytes32 indexed ticketId, address indexed closer, string closeURI);

    error InvalidAddress();
    error InvalidText();
    error TicketAlreadyClosed(bytes32 ticketId);
    error TicketAlreadyExists(bytes32 ticketId);
    error TicketAlreadyResponded(bytes32 ticketId);
    error TicketMissing(bytes32 ticketId);
    error TicketNotResponded(bytes32 ticketId);
    error Unauthorized();

    function createTicket(
        bytes32 ticketId,
        address agent,
        string calldata ticketRef,
        string calldata category,
        string calldata metadataURI
    ) external {
        if (_tickets[ticketId].requester != address(0)) revert TicketAlreadyExists(ticketId);
        if (agent == address(0)) revert InvalidAddress();
        if (bytes(ticketRef).length == 0 || bytes(category).length == 0 || bytes(metadataURI).length == 0) {
            revert InvalidText();
        }

        _tickets[ticketId] = Ticket({
            requester: msg.sender,
            agent: agent,
            createdAt: uint64(block.timestamp),
            respondedAt: 0,
            closedAt: 0,
            responded: false,
            closed: false,
            ticketRef: ticketRef,
            category: category,
            metadataURI: metadataURI,
            responseURI: "",
            closeURI: ""
        });

        emit TicketCreated(ticketId, msg.sender, agent, ticketRef, category, metadataURI);
    }

    function respondTicket(bytes32 ticketId, string calldata responseURI) external {
        Ticket storage ticket = _requireTicket(ticketId);
        if (msg.sender != ticket.requester && msg.sender != ticket.agent) revert Unauthorized();
        if (ticket.closed) revert TicketAlreadyClosed(ticketId);
        if (ticket.responded) revert TicketAlreadyResponded(ticketId);
        if (bytes(responseURI).length == 0) revert InvalidText();

        ticket.responded = true;
        ticket.respondedAt = uint64(block.timestamp);
        ticket.responseURI = responseURI;

        emit TicketResponded(ticketId, msg.sender, responseURI);
    }

    function closeTicket(bytes32 ticketId, string calldata closeURI) external {
        Ticket storage ticket = _requireTicket(ticketId);
        if (msg.sender != ticket.requester && msg.sender != ticket.agent) revert Unauthorized();
        if (ticket.closed) revert TicketAlreadyClosed(ticketId);
        if (!ticket.responded) revert TicketNotResponded(ticketId);
        if (bytes(closeURI).length == 0) revert InvalidText();

        ticket.closed = true;
        ticket.closedAt = uint64(block.timestamp);
        ticket.closeURI = closeURI;

        emit TicketClosed(ticketId, msg.sender, closeURI);
    }

    function getTicket(bytes32 ticketId) external view returns (Ticket memory) {
        return _tickets[ticketId];
    }

    function _requireTicket(bytes32 ticketId) private view returns (Ticket storage ticket) {
        ticket = _tickets[ticketId];
        if (ticket.requester == address(0)) revert TicketMissing(ticketId);
    }
}
