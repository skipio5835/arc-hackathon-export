// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcPayLink {
    enum LinkStatus {
        Unknown,
        Open,
        Paid,
        Cancelled
    }

    struct Link {
        address merchant;
        address payer;
        uint256 amount;
        uint64 createdAt;
        uint64 expiresAt;
        uint64 paidAt;
        string metadataURI;
        LinkStatus status;
    }

    mapping(bytes32 => Link) private links;

    event LinkCreated(bytes32 indexed linkId, address indexed merchant, uint256 amount, uint64 expiresAt, string metadataURI);
    event LinkPaid(bytes32 indexed linkId, address indexed merchant, address indexed payer, uint256 amount, uint256 paidAt);
    event LinkCancelled(bytes32 indexed linkId, address indexed merchant, uint256 cancelledAt);

    function createLink(bytes32 linkId, uint256 amount, uint64 expiresAt, string calldata metadataURI) external {
        require(linkId != bytes32(0), "link id required");
        require(amount > 0, "amount required");
        require(expiresAt > block.timestamp, "expiry required");
        require(links[linkId].status == LinkStatus.Unknown, "link exists");

        links[linkId] = Link({
            merchant: msg.sender,
            payer: address(0),
            amount: amount,
            createdAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            paidAt: 0,
            metadataURI: metadataURI,
            status: LinkStatus.Open
        });

        emit LinkCreated(linkId, msg.sender, amount, expiresAt, metadataURI);
    }

    function payLink(bytes32 linkId) external payable {
        Link storage link = links[linkId];
        require(link.status == LinkStatus.Open, "link not payable");
        require(block.timestamp < link.expiresAt, "link expired");
        require(msg.value == link.amount, "incorrect amount");

        link.status = LinkStatus.Paid;
        link.payer = msg.sender;
        link.paidAt = uint64(block.timestamp);

        (bool sent, ) = payable(link.merchant).call{value: msg.value}("");
        require(sent, "settlement failed");

        emit LinkPaid(linkId, link.merchant, msg.sender, msg.value, block.timestamp);
    }

    function cancelLink(bytes32 linkId) external {
        Link storage link = links[linkId];
        require(link.status == LinkStatus.Open, "link not cancellable");
        require(link.merchant == msg.sender, "merchant only");

        link.status = LinkStatus.Cancelled;
        emit LinkCancelled(linkId, msg.sender, block.timestamp);
    }

    function getLink(bytes32 linkId) external view returns (Link memory) {
        return links[linkId];
    }
}
