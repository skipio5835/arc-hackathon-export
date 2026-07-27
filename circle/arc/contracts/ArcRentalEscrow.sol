// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcRentalEscrow {
    struct Rental {
        address owner;
        address renter;
        address payoutTo;
        uint256 rentalFee;
        uint256 deposit;
        uint256 damageFee;
        uint256 paidTotal;
        uint64 createdAt;
        uint64 returnedAt;
        bool closed;
        bool canceled;
        string rentalRef;
        string metadataURI;
        string returnURI;
        string cancelURI;
    }

    mapping(bytes32 rentalId => Rental rental) private _rentals;

    event RentalCreated(
        bytes32 indexed rentalId,
        address indexed owner,
        address indexed payoutTo,
        uint256 rentalFee,
        uint256 deposit,
        string rentalRef,
        string metadataURI
    );
    event RentalBooked(bytes32 indexed rentalId, address indexed renter, uint256 rentalFee, uint256 deposit);
    event RentalReturned(
        bytes32 indexed rentalId,
        address indexed resolver,
        address indexed renter,
        uint256 payoutAmount,
        uint256 refundAmount,
        uint256 damageFee,
        string returnURI
    );
    event RentalCanceled(bytes32 indexed rentalId, address indexed resolver, address indexed refundTo, uint256 refundAmount, string cancelURI);

    error InvalidAddress();
    error InvalidAmount();
    error InvalidText();
    error RentalAlreadyBooked(bytes32 rentalId);
    error RentalAlreadyClosed(bytes32 rentalId);
    error RentalAlreadyExists(bytes32 rentalId);
    error RentalMissing(bytes32 rentalId);
    error RentalNotBooked(bytes32 rentalId);
    error TransferFailed();
    error Unauthorized();

    function createRental(
        bytes32 rentalId,
        address payoutTo,
        uint256 rentalFee,
        uint256 deposit,
        string calldata rentalRef,
        string calldata metadataURI
    ) external {
        if (_rentals[rentalId].owner != address(0)) revert RentalAlreadyExists(rentalId);
        if (payoutTo == address(0)) revert InvalidAddress();
        if (rentalFee == 0 || deposit == 0) revert InvalidAmount();
        if (bytes(rentalRef).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _rentals[rentalId] = Rental({
            owner: msg.sender,
            renter: address(0),
            payoutTo: payoutTo,
            rentalFee: rentalFee,
            deposit: deposit,
            damageFee: 0,
            paidTotal: 0,
            createdAt: uint64(block.timestamp),
            returnedAt: 0,
            closed: false,
            canceled: false,
            rentalRef: rentalRef,
            metadataURI: metadataURI,
            returnURI: "",
            cancelURI: ""
        });

        emit RentalCreated(rentalId, msg.sender, payoutTo, rentalFee, deposit, rentalRef, metadataURI);
    }

    function bookRental(bytes32 rentalId) external payable {
        Rental storage rental = _requireOpenRental(rentalId);
        if (rental.renter != address(0)) revert RentalAlreadyBooked(rentalId);

        uint256 expected = rental.rentalFee + rental.deposit;
        if (msg.value != expected) revert InvalidAmount();

        rental.renter = msg.sender;
        rental.paidTotal = msg.value;

        emit RentalBooked(rentalId, msg.sender, rental.rentalFee, rental.deposit);
    }

    function returnRental(bytes32 rentalId, uint256 damageFee, address payable refundTo, string calldata returnURI)
        external
    {
        Rental storage rental = _requireBookedRental(rentalId);
        if (msg.sender != rental.owner && msg.sender != rental.renter) revert Unauthorized();
        if (refundTo == address(0)) revert InvalidAddress();
        if (damageFee > rental.deposit) revert InvalidAmount();
        if (bytes(returnURI).length == 0) revert InvalidText();

        uint256 refundAmount = rental.deposit - damageFee;
        uint256 payoutAmount = rental.rentalFee + damageFee;

        rental.closed = true;
        rental.damageFee = damageFee;
        rental.returnedAt = uint64(block.timestamp);
        rental.returnURI = returnURI;

        if (payoutAmount > 0) {
            _sendValue(rental.payoutTo, payoutAmount);
        }
        if (refundAmount > 0) {
            _sendValue(refundTo, refundAmount);
        }

        emit RentalReturned(rentalId, msg.sender, rental.renter, payoutAmount, refundAmount, damageFee, returnURI);
    }

    function cancelRental(bytes32 rentalId, address payable refundTo, string calldata cancelURI) external {
        Rental storage rental = _requireOpenRental(rentalId);
        if (msg.sender != rental.owner && msg.sender != rental.renter) revert Unauthorized();
        if (refundTo == address(0)) revert InvalidAddress();
        if (bytes(cancelURI).length == 0) revert InvalidText();

        uint256 refundAmount = rental.paidTotal;
        rental.closed = true;
        rental.canceled = true;
        rental.cancelURI = cancelURI;

        if (refundAmount > 0) {
            _sendValue(refundTo, refundAmount);
        }

        emit RentalCanceled(rentalId, msg.sender, refundTo, refundAmount, cancelURI);
    }

    function getRental(bytes32 rentalId) external view returns (Rental memory) {
        return _rentals[rentalId];
    }

    function _requireOpenRental(bytes32 rentalId) private view returns (Rental storage rental) {
        rental = _rentals[rentalId];
        if (rental.owner == address(0)) revert RentalMissing(rentalId);
        if (rental.closed) revert RentalAlreadyClosed(rentalId);
    }

    function _requireBookedRental(bytes32 rentalId) private view returns (Rental storage rental) {
        rental = _requireOpenRental(rentalId);
        if (rental.renter == address(0)) revert RentalNotBooked(rentalId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
