// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcBountyBoard {
    enum Status {
        None,
        Open,
        Accepted,
        Submitted,
        Released,
        Canceled
    }

    struct Bounty {
        address sponsor;
        address worker;
        uint256 reward;
        uint64 createdAt;
        uint64 acceptedAt;
        uint64 submittedAt;
        uint64 releasedAt;
        Status status;
        string title;
        string metadataURI;
        string submissionURI;
    }

    mapping(bytes32 bountyId => Bounty bounty) private _bounties;

    event BountyCreated(bytes32 indexed bountyId, address indexed sponsor, uint256 reward, string title, string metadataURI);
    event BountyAccepted(bytes32 indexed bountyId, address indexed worker);
    event WorkSubmitted(bytes32 indexed bountyId, address indexed worker, string submissionURI);
    event BountyReleased(bytes32 indexed bountyId, address indexed worker, uint256 reward);
    event BountyCanceled(bytes32 indexed bountyId, address indexed sponsor, uint256 refundAmount);

    error BountyAlreadyExists(bytes32 bountyId);
    error BountyMissing(bytes32 bountyId);
    error InvalidAmount();
    error InvalidText();
    error InvalidStatus(Status expected, Status actual);
    error TransferFailed();
    error Unauthorized();

    function createBounty(bytes32 bountyId, string calldata title, string calldata metadataURI) external payable {
        if (_bounties[bountyId].status != Status.None) revert BountyAlreadyExists(bountyId);
        if (msg.value == 0) revert InvalidAmount();
        if (bytes(title).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _bounties[bountyId] = Bounty({
            sponsor: msg.sender,
            worker: address(0),
            reward: msg.value,
            createdAt: uint64(block.timestamp),
            acceptedAt: 0,
            submittedAt: 0,
            releasedAt: 0,
            status: Status.Open,
            title: title,
            metadataURI: metadataURI,
            submissionURI: ""
        });

        emit BountyCreated(bountyId, msg.sender, msg.value, title, metadataURI);
    }

    function acceptBounty(bytes32 bountyId) external {
        Bounty storage bounty = _requireBounty(bountyId);
        if (bounty.status != Status.Open) revert InvalidStatus(Status.Open, bounty.status);

        bounty.worker = msg.sender;
        bounty.acceptedAt = uint64(block.timestamp);
        bounty.status = Status.Accepted;

        emit BountyAccepted(bountyId, msg.sender);
    }

    function submitWork(bytes32 bountyId, string calldata submissionURI) external {
        Bounty storage bounty = _requireBounty(bountyId);
        if (bounty.status != Status.Accepted) revert InvalidStatus(Status.Accepted, bounty.status);
        if (msg.sender != bounty.worker) revert Unauthorized();
        if (bytes(submissionURI).length == 0) revert InvalidText();

        bounty.submissionURI = submissionURI;
        bounty.submittedAt = uint64(block.timestamp);
        bounty.status = Status.Submitted;

        emit WorkSubmitted(bountyId, msg.sender, submissionURI);
    }

    function releaseBounty(bytes32 bountyId) external {
        Bounty storage bounty = _requireBounty(bountyId);
        if (bounty.status != Status.Submitted) revert InvalidStatus(Status.Submitted, bounty.status);
        if (msg.sender != bounty.sponsor) revert Unauthorized();

        uint256 reward = bounty.reward;
        address worker = bounty.worker;
        bounty.releasedAt = uint64(block.timestamp);
        bounty.status = Status.Released;

        _sendValue(worker, reward);

        emit BountyReleased(bountyId, worker, reward);
    }

    function cancelBounty(bytes32 bountyId) external {
        Bounty storage bounty = _requireBounty(bountyId);
        if (bounty.status != Status.Open) revert InvalidStatus(Status.Open, bounty.status);
        if (msg.sender != bounty.sponsor) revert Unauthorized();

        uint256 refundAmount = bounty.reward;
        bounty.status = Status.Canceled;

        _sendValue(bounty.sponsor, refundAmount);

        emit BountyCanceled(bountyId, bounty.sponsor, refundAmount);
    }

    function getBounty(bytes32 bountyId) external view returns (Bounty memory) {
        return _bounties[bountyId];
    }

    function _requireBounty(bytes32 bountyId) private view returns (Bounty storage bounty) {
        bounty = _bounties[bountyId];
        if (bounty.status == Status.None) revert BountyMissing(bountyId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
