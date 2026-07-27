// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcAirdropCampaign {
    struct Campaign {
        address owner;
        uint256 totalFunded;
        uint256 totalClaimed;
        uint64 createdAt;
        uint64 closesAt;
        bool closed;
        string label;
    }

    mapping(bytes32 campaignId => Campaign campaign) private _campaigns;
    mapping(bytes32 campaignId => mapping(address recipient => uint256 amount)) private _allocations;
    mapping(bytes32 campaignId => mapping(address recipient => bool claimed)) private _claimed;

    event CampaignCreated(
        bytes32 indexed campaignId,
        address indexed owner,
        uint256 totalFunded,
        uint64 closesAt,
        string label
    );
    event AllocationSet(bytes32 indexed campaignId, address indexed recipient, uint256 amount);
    event AirdropClaimed(bytes32 indexed campaignId, address indexed recipient, uint256 amount);
    event CampaignClosed(bytes32 indexed campaignId, address indexed owner, address indexed refundTo, uint256 refundAmount);

    error AlreadyClaimed(bytes32 campaignId, address recipient);
    error CampaignAlreadyExists(bytes32 campaignId);
    error CampaignClosedAlready(bytes32 campaignId);
    error CampaignExpired(bytes32 campaignId);
    error CampaignMissing(bytes32 campaignId);
    error InvalidAddress();
    error InvalidAmount();
    error InvalidDuration();
    error InvalidLabel();
    error InvalidRecipients();
    error InvalidFunding(uint256 expected, uint256 actual);
    error NoAllocation(bytes32 campaignId, address recipient);
    error TransferFailed();
    error Unauthorized();

    function createCampaign(
        bytes32 campaignId,
        address[] calldata recipients,
        uint256[] calldata amounts,
        uint64 durationSeconds,
        string calldata label
    ) external payable {
        if (_campaigns[campaignId].owner != address(0)) revert CampaignAlreadyExists(campaignId);
        if (recipients.length == 0 || recipients.length != amounts.length) revert InvalidRecipients();
        if (durationSeconds == 0) revert InvalidDuration();
        if (bytes(label).length == 0) revert InvalidLabel();

        uint256 total;
        for (uint256 i = 0; i < recipients.length; i += 1) {
            address recipient = recipients[i];
            uint256 amount = amounts[i];
            if (recipient == address(0)) revert InvalidAddress();
            if (amount == 0) revert InvalidAmount();

            uint256 allocation = _allocations[campaignId][recipient] + amount;
            _allocations[campaignId][recipient] = allocation;
            total += amount;

            emit AllocationSet(campaignId, recipient, allocation);
        }

        if (msg.value != total) revert InvalidFunding(total, msg.value);

        uint64 nowTs = uint64(block.timestamp);
        uint64 closesAt = nowTs + durationSeconds;

        _campaigns[campaignId] = Campaign({
            owner: msg.sender,
            totalFunded: total,
            totalClaimed: 0,
            createdAt: nowTs,
            closesAt: closesAt,
            closed: false,
            label: label
        });

        emit CampaignCreated(campaignId, msg.sender, total, closesAt, label);
    }

    function claim(bytes32 campaignId) external {
        Campaign storage campaign = _requireOpenCampaign(campaignId);
        if (block.timestamp > campaign.closesAt) revert CampaignExpired(campaignId);
        if (_claimed[campaignId][msg.sender]) revert AlreadyClaimed(campaignId, msg.sender);

        uint256 amount = _allocations[campaignId][msg.sender];
        if (amount == 0) revert NoAllocation(campaignId, msg.sender);

        _claimed[campaignId][msg.sender] = true;
        campaign.totalClaimed += amount;

        _sendValue(payable(msg.sender), amount);

        emit AirdropClaimed(campaignId, msg.sender, amount);
    }

    function closeCampaign(bytes32 campaignId, address payable refundTo) external {
        if (refundTo == address(0)) revert InvalidAddress();

        Campaign storage campaign = _requireOpenCampaign(campaignId);
        if (campaign.owner != msg.sender) revert Unauthorized();

        uint256 refundAmount = campaign.totalFunded - campaign.totalClaimed;
        campaign.closed = true;

        if (refundAmount > 0) {
            _sendValue(refundTo, refundAmount);
        }

        emit CampaignClosed(campaignId, msg.sender, refundTo, refundAmount);
    }

    function getCampaign(bytes32 campaignId) external view returns (Campaign memory) {
        return _campaigns[campaignId];
    }

    function getAllocation(bytes32 campaignId, address recipient)
        external
        view
        returns (uint256 allocation, bool claimed, uint256 claimable)
    {
        allocation = _allocations[campaignId][recipient];
        claimed = _claimed[campaignId][recipient];
        claimable = claimed ? 0 : allocation;
    }

    function _requireOpenCampaign(bytes32 campaignId) private view returns (Campaign storage campaign) {
        campaign = _campaigns[campaignId];
        if (campaign.owner == address(0)) revert CampaignMissing(campaignId);
        if (campaign.closed) revert CampaignClosedAlready(campaignId);
    }

    function _sendValue(address payable to, uint256 amount) private {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
