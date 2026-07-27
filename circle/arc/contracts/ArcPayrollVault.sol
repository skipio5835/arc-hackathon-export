// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcPayrollVault {
    struct Payroll {
        address payer;
        address worker;
        uint256 amount;
        uint256 claimedAmount;
        uint64 createdAt;
        uint64 claimAfter;
        bool closed;
        string payrollRef;
        string metadataURI;
        string claimURI;
    }

    mapping(bytes32 payrollId => Payroll payroll) private _payrolls;

    event PayrollCreated(
        bytes32 indexed payrollId,
        address indexed payer,
        address indexed worker,
        uint256 amount,
        uint64 claimAfter,
        string payrollRef,
        string metadataURI
    );
    event PayrollClaimed(bytes32 indexed payrollId, address indexed worker, address indexed to, uint256 amount, string claimURI);
    event PayrollClosed(bytes32 indexed payrollId, address indexed payer, address indexed refundTo, uint256 refundAmount);

    error InvalidAddress();
    error InvalidAmount();
    error InvalidText();
    error PayrollAlreadyExists(bytes32 payrollId);
    error PayrollClosedAlready(bytes32 payrollId);
    error PayrollMissing(bytes32 payrollId);
    error PayrollNotClaimable(uint64 claimAfter);
    error PayrollClaimedAlready(bytes32 payrollId);
    error TransferFailed();
    error Unauthorized();

    function createPayroll(
        bytes32 payrollId,
        address worker,
        uint64 claimAfter,
        string calldata payrollRef,
        string calldata metadataURI
    ) external payable {
        if (_payrolls[payrollId].payer != address(0)) revert PayrollAlreadyExists(payrollId);
        if (worker == address(0)) revert InvalidAddress();
        if (msg.value == 0) revert InvalidAmount();
        if (bytes(payrollRef).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _payrolls[payrollId] = Payroll({
            payer: msg.sender,
            worker: worker,
            amount: msg.value,
            claimedAmount: 0,
            createdAt: uint64(block.timestamp),
            claimAfter: claimAfter,
            closed: false,
            payrollRef: payrollRef,
            metadataURI: metadataURI,
            claimURI: ""
        });

        emit PayrollCreated(payrollId, msg.sender, worker, msg.value, claimAfter, payrollRef, metadataURI);
    }

    function claimPayroll(bytes32 payrollId, address payable to, string calldata claimURI) external {
        Payroll storage payroll = _requireOpenPayroll(payrollId);
        if (msg.sender != payroll.worker) revert Unauthorized();
        if (to == address(0)) revert InvalidAddress();
        if (bytes(claimURI).length == 0) revert InvalidText();
        if (payroll.claimedAmount != 0) revert PayrollClaimedAlready(payrollId);
        if (block.timestamp < payroll.claimAfter) revert PayrollNotClaimable(payroll.claimAfter);

        payroll.claimedAmount = payroll.amount;
        payroll.claimURI = claimURI;
        _sendValue(to, payroll.amount);

        emit PayrollClaimed(payrollId, msg.sender, to, payroll.amount, claimURI);
    }

    function closePayroll(bytes32 payrollId, address payable refundTo) external {
        Payroll storage payroll = _requireOpenPayroll(payrollId);
        if (msg.sender != payroll.payer) revert Unauthorized();
        if (refundTo == address(0)) revert InvalidAddress();

        uint256 refundAmount = payroll.amount - payroll.claimedAmount;
        payroll.closed = true;
        if (refundAmount > 0) {
            _sendValue(refundTo, refundAmount);
        }

        emit PayrollClosed(payrollId, msg.sender, refundTo, refundAmount);
    }

    function getPayroll(bytes32 payrollId) external view returns (Payroll memory) {
        return _payrolls[payrollId];
    }

    function _requireOpenPayroll(bytes32 payrollId) private view returns (Payroll storage payroll) {
        payroll = _payrolls[payrollId];
        if (payroll.payer == address(0)) revert PayrollMissing(payrollId);
        if (payroll.closed) revert PayrollClosedAlready(payrollId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
