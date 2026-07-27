// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcEscrow {
    enum Status {
        None,
        Funded,
        Released,
        Refunded,
        Disputed
    }

    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;
        Status status;
        string metadataURI;
    }

    struct Dispute {
        address openedBy;
        string disputeURI;
        string evidenceURI;
        string resolutionURI;
    }

    mapping(bytes32 escrowId => Escrow escrow) private _escrows;
    mapping(bytes32 escrowId => Dispute dispute) private _disputes;

    event EscrowFunded(
        bytes32 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        string metadataURI
    );
    event EscrowReleased(bytes32 indexed escrowId, address indexed seller, uint256 amount);
    event EscrowRefunded(bytes32 indexed escrowId, address indexed buyer, uint256 amount);
    event EscrowDisputed(bytes32 indexed escrowId, address indexed openedBy, string disputeURI);
    event EscrowEvidenceSubmitted(bytes32 indexed escrowId, address indexed submittedBy, string evidenceURI);
    event EscrowDisputeResolved(
        bytes32 indexed escrowId,
        address indexed resolvedBy,
        bool releasedToSeller,
        uint256 amount,
        string resolutionURI
    );

    error EscrowAlreadyExists(bytes32 escrowId);
    error EscrowNotFunded(bytes32 escrowId);
    error EscrowNotDisputed(bytes32 escrowId);
    error InvalidAmount();
    error InvalidSeller();
    error Unauthorized();
    error TransferFailed();

    function createEscrow(bytes32 escrowId, address seller, string calldata metadataURI) external payable {
        if (msg.value == 0) revert InvalidAmount();
        if (seller == address(0)) revert InvalidSeller();
        if (_escrows[escrowId].status != Status.None) revert EscrowAlreadyExists(escrowId);

        _escrows[escrowId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            status: Status.Funded,
            metadataURI: metadataURI
        });

        emit EscrowFunded(escrowId, msg.sender, seller, msg.value, metadataURI);
    }

    function releaseEscrow(bytes32 escrowId) external {
        Escrow storage escrow = _escrows[escrowId];
        if (escrow.status != Status.Funded) revert EscrowNotFunded(escrowId);
        if (msg.sender != escrow.buyer) revert Unauthorized();

        escrow.status = Status.Released;
        _sendValue(escrow.seller, escrow.amount);

        emit EscrowReleased(escrowId, escrow.seller, escrow.amount);
    }

    function refundEscrow(bytes32 escrowId) external {
        Escrow storage escrow = _escrows[escrowId];
        if (escrow.status != Status.Funded) revert EscrowNotFunded(escrowId);
        if (msg.sender != escrow.buyer && msg.sender != escrow.seller) revert Unauthorized();

        escrow.status = Status.Refunded;
        _sendValue(escrow.buyer, escrow.amount);

        emit EscrowRefunded(escrowId, escrow.buyer, escrow.amount);
    }

    function openDispute(bytes32 escrowId, string calldata disputeURI) external {
        Escrow storage escrow = _escrows[escrowId];
        if (escrow.status != Status.Funded) revert EscrowNotFunded(escrowId);
        if (msg.sender != escrow.buyer && msg.sender != escrow.seller) revert Unauthorized();

        escrow.status = Status.Disputed;
        _disputes[escrowId] = Dispute({
            openedBy: msg.sender,
            disputeURI: disputeURI,
            evidenceURI: disputeURI,
            resolutionURI: ""
        });

        emit EscrowDisputed(escrowId, msg.sender, disputeURI);
    }

    function submitEvidence(bytes32 escrowId, string calldata evidenceURI) external {
        Escrow storage escrow = _escrows[escrowId];
        if (escrow.status != Status.Disputed) revert EscrowNotDisputed(escrowId);
        if (msg.sender != escrow.buyer && msg.sender != escrow.seller) revert Unauthorized();

        _disputes[escrowId].evidenceURI = evidenceURI;

        emit EscrowEvidenceSubmitted(escrowId, msg.sender, evidenceURI);
    }

    function resolveDispute(bytes32 escrowId, bool releaseToSeller, string calldata resolutionURI) external {
        Escrow storage escrow = _escrows[escrowId];
        if (escrow.status != Status.Disputed) revert EscrowNotDisputed(escrowId);
        if (msg.sender != escrow.buyer) revert Unauthorized();

        _disputes[escrowId].resolutionURI = resolutionURI;

        if (releaseToSeller) {
            escrow.status = Status.Released;
            _sendValue(escrow.seller, escrow.amount);
            emit EscrowReleased(escrowId, escrow.seller, escrow.amount);
        } else {
            escrow.status = Status.Refunded;
            _sendValue(escrow.buyer, escrow.amount);
            emit EscrowRefunded(escrowId, escrow.buyer, escrow.amount);
        }

        emit EscrowDisputeResolved(escrowId, msg.sender, releaseToSeller, escrow.amount, resolutionURI);
    }

    function getEscrow(bytes32 escrowId) external view returns (Escrow memory) {
        return _escrows[escrowId];
    }

    function getDispute(bytes32 escrowId) external view returns (Dispute memory) {
        return _disputes[escrowId];
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
