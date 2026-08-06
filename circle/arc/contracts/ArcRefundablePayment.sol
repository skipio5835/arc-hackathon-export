// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcRefundablePayment {
    enum PaymentStatus { Unknown, Open, Paid, RefundRequested, Refunded, Settled, Cancelled }
    struct Payment { address merchant; address payer; uint256 amount; uint64 createdAt; uint64 expiresAt; string metadataURI; PaymentStatus status; }
    mapping(bytes32 => Payment) private payments;

    event PaymentCreated(bytes32 indexed paymentId, address indexed merchant, address indexed payer, uint256 amount, uint64 expiresAt, string metadataURI);
    event PaymentPaid(bytes32 indexed paymentId, address indexed payer, uint256 amount);
    event RefundRequested(bytes32 indexed paymentId, address indexed payer, string reasonURI);
    event PaymentRefunded(bytes32 indexed paymentId, address indexed payer, uint256 amount);
    event PaymentSettled(bytes32 indexed paymentId, address indexed merchant, uint256 amount);
    event PaymentCancelled(bytes32 indexed paymentId, address indexed merchant);

    function createPayment(bytes32 paymentId, address payer, uint256 amount, uint64 expiresAt, string calldata metadataURI) external {
        require(paymentId != bytes32(0) && payments[paymentId].status == PaymentStatus.Unknown, "payment exists");
        require(payer != address(0) && amount > 0 && expiresAt > block.timestamp, "invalid payment");
        payments[paymentId] = Payment({ merchant: msg.sender, payer: payer, amount: amount, createdAt: uint64(block.timestamp), expiresAt: expiresAt, metadataURI: metadataURI, status: PaymentStatus.Open });
        emit PaymentCreated(paymentId, msg.sender, payer, amount, expiresAt, metadataURI);
    }

    function pay(bytes32 paymentId) external payable {
        Payment storage payment = payments[paymentId];
        require(payment.status == PaymentStatus.Open && msg.sender == payment.payer, "payment not payable");
        require(block.timestamp < payment.expiresAt && msg.value == payment.amount, "invalid payment");
        payment.status = PaymentStatus.Paid;
        emit PaymentPaid(paymentId, msg.sender, msg.value);
    }

    function requestRefund(bytes32 paymentId, string calldata reasonURI) external {
        Payment storage payment = payments[paymentId];
        require(payment.status == PaymentStatus.Paid && msg.sender == payment.payer, "refund not available");
        require(bytes(reasonURI).length > 0, "reason required");
        payment.status = PaymentStatus.RefundRequested;
        emit RefundRequested(paymentId, msg.sender, reasonURI);
    }

    function refund(bytes32 paymentId) external {
        Payment storage payment = payments[paymentId];
        require(payment.status == PaymentStatus.RefundRequested && msg.sender == payment.merchant, "refund not approved");
        payment.status = PaymentStatus.Refunded;
        (bool sent, ) = payable(payment.payer).call{value: payment.amount}("");
        require(sent, "refund failed");
        emit PaymentRefunded(paymentId, payment.payer, payment.amount);
    }

    function settle(bytes32 paymentId) external {
        Payment storage payment = payments[paymentId];
        require(payment.status == PaymentStatus.Paid && msg.sender == payment.merchant, "payment not settleable");
        payment.status = PaymentStatus.Settled;
        (bool sent, ) = payable(payment.merchant).call{value: payment.amount}("");
        require(sent, "settlement failed");
        emit PaymentSettled(paymentId, payment.merchant, payment.amount);
    }

    function cancel(bytes32 paymentId) external {
        Payment storage payment = payments[paymentId];
        require(payment.status == PaymentStatus.Open && msg.sender == payment.merchant, "payment not cancellable");
        payment.status = PaymentStatus.Cancelled;
        emit PaymentCancelled(paymentId, msg.sender);
    }

    function getPayment(bytes32 paymentId) external view returns (Payment memory) { return payments[paymentId]; }
}
