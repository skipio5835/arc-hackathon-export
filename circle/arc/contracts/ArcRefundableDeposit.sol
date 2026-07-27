// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcRefundableDeposit {
    struct Deposit {
        address payer;
        address beneficiary;
        uint256 amount;
        uint64 createdAt;
        uint64 deadline;
        bool closed;
        bool refunded;
        string depositRef;
        string metadataURI;
        string resolutionURI;
    }

    mapping(bytes32 depositId => Deposit deposit) private _deposits;

    event DepositCreated(
        bytes32 indexed depositId,
        address indexed payer,
        address indexed beneficiary,
        uint256 amount,
        uint64 deadline,
        string depositRef,
        string metadataURI
    );
    event DepositRefunded(
        bytes32 indexed depositId,
        address indexed resolver,
        address indexed refundTo,
        uint256 amount,
        string resolutionURI
    );
    event DepositForfeited(
        bytes32 indexed depositId,
        address indexed resolver,
        address indexed payoutTo,
        uint256 amount,
        string resolutionURI
    );

    error DepositAlreadyExists(bytes32 depositId);
    error DepositClosedAlready(bytes32 depositId);
    error DepositMissing(bytes32 depositId);
    error InvalidAddress();
    error InvalidAmount();
    error InvalidText();
    error TransferFailed();
    error Unauthorized();

    function createDeposit(
        bytes32 depositId,
        address beneficiary,
        uint64 deadline,
        string calldata depositRef,
        string calldata metadataURI
    ) external payable {
        if (_deposits[depositId].payer != address(0)) revert DepositAlreadyExists(depositId);
        if (beneficiary == address(0)) revert InvalidAddress();
        if (msg.value == 0) revert InvalidAmount();
        if (bytes(depositRef).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _deposits[depositId] = Deposit({
            payer: msg.sender,
            beneficiary: beneficiary,
            amount: msg.value,
            createdAt: uint64(block.timestamp),
            deadline: deadline,
            closed: false,
            refunded: false,
            depositRef: depositRef,
            metadataURI: metadataURI,
            resolutionURI: ""
        });

        emit DepositCreated(depositId, msg.sender, beneficiary, msg.value, deadline, depositRef, metadataURI);
    }

    function refundDeposit(bytes32 depositId, address payable refundTo, string calldata resolutionURI) external {
        Deposit storage deposit = _requireOpenDeposit(depositId);
        _requireResolver(deposit);
        if (refundTo == address(0)) revert InvalidAddress();
        if (bytes(resolutionURI).length == 0) revert InvalidText();

        deposit.closed = true;
        deposit.refunded = true;
        deposit.resolutionURI = resolutionURI;
        _sendValue(refundTo, deposit.amount);

        emit DepositRefunded(depositId, msg.sender, refundTo, deposit.amount, resolutionURI);
    }

    function forfeitDeposit(bytes32 depositId, address payable payoutTo, string calldata resolutionURI) external {
        Deposit storage deposit = _requireOpenDeposit(depositId);
        _requireResolver(deposit);
        if (payoutTo == address(0)) revert InvalidAddress();
        if (bytes(resolutionURI).length == 0) revert InvalidText();

        deposit.closed = true;
        deposit.refunded = false;
        deposit.resolutionURI = resolutionURI;
        _sendValue(payoutTo, deposit.amount);

        emit DepositForfeited(depositId, msg.sender, payoutTo, deposit.amount, resolutionURI);
    }

    function getDeposit(bytes32 depositId) external view returns (Deposit memory) {
        return _deposits[depositId];
    }

    function _requireOpenDeposit(bytes32 depositId) private view returns (Deposit storage deposit) {
        deposit = _deposits[depositId];
        if (deposit.payer == address(0)) revert DepositMissing(depositId);
        if (deposit.closed) revert DepositClosedAlready(depositId);
    }

    function _requireResolver(Deposit storage deposit) private view {
        if (msg.sender != deposit.payer && msg.sender != deposit.beneficiary) revert Unauthorized();
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
