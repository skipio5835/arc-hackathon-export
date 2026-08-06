// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcStreamingPayroll {
    enum StreamStatus { Unknown, Active, Completed, Cancelled }
    struct Stream {
        address sender;
        address recipient;
        uint256 totalAmount;
        uint256 withdrawn;
        uint64 startTime;
        uint64 endTime;
        string metadataURI;
        StreamStatus status;
    }

    mapping(bytes32 => Stream) private streams;
    event StreamCreated(bytes32 indexed streamId, address indexed sender, address indexed recipient, uint256 totalAmount, uint64 startTime, uint64 endTime, string metadataURI);
    event StreamWithdrawn(bytes32 indexed streamId, address indexed recipient, uint256 amount, uint256 withdrawnTotal);
    event StreamCancelled(bytes32 indexed streamId, address indexed sender, uint256 recipientAmount, uint256 senderRefund);

    function createStream(bytes32 streamId, address recipient, uint64 startTime, uint64 endTime, string calldata metadataURI) external payable {
        require(streamId != bytes32(0), "stream id required");
        require(recipient != address(0), "recipient required");
        require(startTime >= block.timestamp && endTime > startTime, "invalid schedule");
        require(msg.value > 0, "amount required");
        require(streams[streamId].status == StreamStatus.Unknown, "stream exists");
        streams[streamId] = Stream({ sender: msg.sender, recipient: recipient, totalAmount: msg.value, withdrawn: 0, startTime: startTime, endTime: endTime, metadataURI: metadataURI, status: StreamStatus.Active });
        emit StreamCreated(streamId, msg.sender, recipient, msg.value, startTime, endTime, metadataURI);
    }

    function vestedAmount(bytes32 streamId) public view returns (uint256) {
        Stream memory stream = streams[streamId];
        if (stream.status == StreamStatus.Unknown) return 0;
        if (block.timestamp <= stream.startTime) return 0;
        if (block.timestamp >= stream.endTime) return stream.totalAmount;
        return (stream.totalAmount * (block.timestamp - stream.startTime)) / (stream.endTime - stream.startTime);
    }

    function withdraw(bytes32 streamId) external {
        Stream storage stream = streams[streamId];
        require(stream.status == StreamStatus.Active, "stream not active");
        require(msg.sender == stream.recipient, "recipient only");
        uint256 vested = vestedAmount(streamId);
        uint256 amount = vested - stream.withdrawn;
        require(amount > 0, "nothing available");
        stream.withdrawn += amount;
        if (stream.withdrawn == stream.totalAmount) stream.status = StreamStatus.Completed;
        (bool sent, ) = payable(stream.recipient).call{value: amount}("");
        require(sent, "withdraw failed");
        emit StreamWithdrawn(streamId, stream.recipient, amount, stream.withdrawn);
    }

    function cancel(bytes32 streamId) external {
        Stream storage stream = streams[streamId];
        require(stream.status == StreamStatus.Active, "stream not active");
        require(msg.sender == stream.sender, "sender only");
        uint256 vested = vestedAmount(streamId);
        uint256 recipientAmount = vested - stream.withdrawn;
        uint256 senderRefund = stream.totalAmount - vested;
        stream.status = StreamStatus.Cancelled;
        stream.withdrawn = stream.totalAmount;
        if (recipientAmount > 0) { (bool paid, ) = payable(stream.recipient).call{value: recipientAmount}(""); require(paid, "recipient payment failed"); }
        if (senderRefund > 0) { (bool refunded, ) = payable(stream.sender).call{value: senderRefund}(""); require(refunded, "sender refund failed"); }
        emit StreamCancelled(streamId, stream.sender, recipientAmount, senderRefund);
    }

    function getStream(bytes32 streamId) external view returns (Stream memory) { return streams[streamId]; }
}
