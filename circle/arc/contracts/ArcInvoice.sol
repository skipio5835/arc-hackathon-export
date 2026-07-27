// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcInvoice {
    enum InvoiceStatus {
        Unknown,
        Created,
        Paid,
        Cancelled
    }

    enum QuoteStatus {
        Unknown,
        Created,
        Accepted,
        Settled,
        Cancelled
    }

    struct Invoice {
        address merchant;
        address payer;
        uint256 amount;
        uint64 createdAt;
        uint64 paidAt;
        string metadataURI;
        InvoiceStatus status;
    }

    struct Quote {
        address seller;
        address buyer;
        uint256 amount;
        uint64 createdAt;
        uint64 acceptedAt;
        uint64 settledAt;
        string metadataURI;
        string acceptanceURI;
        QuoteStatus status;
    }

    mapping(bytes32 => Invoice) private invoices;
    mapping(bytes32 => Quote) private quotes;

    event InvoiceCreated(bytes32 indexed invoiceId, address indexed merchant, uint256 amount, string metadataURI);
    event InvoicePaid(
        bytes32 indexed invoiceId,
        address indexed merchant,
        address indexed payer,
        uint256 amount,
        uint256 paidAt
    );
    event InvoiceCancelled(bytes32 indexed invoiceId, address indexed merchant, uint256 cancelledAt);
    event QuoteCreated(
        bytes32 indexed quoteId,
        address indexed seller,
        address indexed buyer,
        uint256 amount,
        string metadataURI
    );
    event QuoteAccepted(
        bytes32 indexed quoteId,
        address indexed buyer,
        uint256 amount,
        string acceptanceURI
    );
    event QuoteSettled(bytes32 indexed quoteId, address indexed seller, address indexed to, uint256 amount);
    event QuoteCancelled(bytes32 indexed quoteId, address indexed seller, uint256 cancelledAt);

    function createInvoice(bytes32 invoiceId, uint256 amount, string calldata metadataURI) external {
        require(invoiceId != bytes32(0), "invoice id required");
        require(amount > 0, "amount required");
        require(invoices[invoiceId].status == InvoiceStatus.Unknown, "invoice exists");

        invoices[invoiceId] = Invoice({
            merchant: msg.sender,
            payer: address(0),
            amount: amount,
            createdAt: uint64(block.timestamp),
            paidAt: 0,
            metadataURI: metadataURI,
            status: InvoiceStatus.Created
        });

        emit InvoiceCreated(invoiceId, msg.sender, amount, metadataURI);
    }

    function payInvoice(bytes32 invoiceId) external payable {
        Invoice storage invoice = invoices[invoiceId];

        require(invoice.status == InvoiceStatus.Created, "invoice not payable");
        require(msg.value == invoice.amount, "incorrect amount");

        invoice.status = InvoiceStatus.Paid;
        invoice.payer = msg.sender;
        invoice.paidAt = uint64(block.timestamp);

        (bool sent, ) = payable(invoice.merchant).call{value: msg.value}("");
        require(sent, "settlement failed");

        emit InvoicePaid(invoiceId, invoice.merchant, msg.sender, msg.value, block.timestamp);
    }

    function cancelInvoice(bytes32 invoiceId) external {
        Invoice storage invoice = invoices[invoiceId];

        require(invoice.status == InvoiceStatus.Created, "invoice not cancellable");
        require(invoice.merchant == msg.sender, "merchant only");

        invoice.status = InvoiceStatus.Cancelled;

        emit InvoiceCancelled(invoiceId, msg.sender, block.timestamp);
    }

    function getInvoice(bytes32 invoiceId) external view returns (Invoice memory) {
        return invoices[invoiceId];
    }

    function createQuote(
        bytes32 quoteId,
        address buyer,
        uint256 amount,
        string calldata metadataURI
    ) external {
        require(quoteId != bytes32(0), "quote id required");
        require(buyer != address(0), "buyer required");
        require(amount > 0, "amount required");
        require(bytes(metadataURI).length > 0, "metadata required");
        require(quotes[quoteId].status == QuoteStatus.Unknown, "quote exists");

        quotes[quoteId] = Quote({
            seller: msg.sender,
            buyer: buyer,
            amount: amount,
            createdAt: uint64(block.timestamp),
            acceptedAt: 0,
            settledAt: 0,
            metadataURI: metadataURI,
            acceptanceURI: "",
            status: QuoteStatus.Created
        });

        emit QuoteCreated(quoteId, msg.sender, buyer, amount, metadataURI);
    }

    function acceptQuote(bytes32 quoteId, string calldata acceptanceURI) external payable {
        Quote storage quote = quotes[quoteId];

        require(quote.status == QuoteStatus.Created, "quote not acceptable");
        require(quote.buyer == msg.sender, "buyer only");
        require(msg.value == quote.amount, "incorrect amount");
        require(bytes(acceptanceURI).length > 0, "acceptance required");

        quote.status = QuoteStatus.Accepted;
        quote.acceptedAt = uint64(block.timestamp);
        quote.acceptanceURI = acceptanceURI;

        emit QuoteAccepted(quoteId, msg.sender, msg.value, acceptanceURI);
    }

    function settleQuote(bytes32 quoteId, address payable to) external {
        Quote storage quote = quotes[quoteId];

        require(quote.status == QuoteStatus.Accepted, "quote not settleable");
        require(quote.seller == msg.sender, "seller only");
        require(to != address(0), "recipient required");

        quote.status = QuoteStatus.Settled;
        quote.settledAt = uint64(block.timestamp);

        (bool sent, ) = to.call{value: quote.amount}("");
        require(sent, "settlement failed");

        emit QuoteSettled(quoteId, msg.sender, to, quote.amount);
    }

    function cancelQuote(bytes32 quoteId) external {
        Quote storage quote = quotes[quoteId];

        require(quote.status == QuoteStatus.Created, "quote not cancellable");
        require(quote.seller == msg.sender, "seller only");

        quote.status = QuoteStatus.Cancelled;

        emit QuoteCancelled(quoteId, msg.sender, block.timestamp);
    }

    function getQuote(bytes32 quoteId) external view returns (Quote memory) {
        return quotes[quoteId];
    }
}
