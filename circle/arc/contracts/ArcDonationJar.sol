// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcDonationJar {
    struct Campaign {
        address creator;
        address treasury;
        uint256 goalAmount;
        uint256 totalDonated;
        uint256 withdrawnAmount;
        uint64 createdAt;
        bool active;
        string title;
        string metadataURI;
    }

    struct Donation {
        address donor;
        uint256 amount;
        uint64 donatedAt;
        string message;
    }

    mapping(bytes32 campaignId => Campaign campaign) private _campaigns;
    mapping(bytes32 campaignId => mapping(uint256 donationId => Donation donation)) private _donations;
    mapping(bytes32 campaignId => uint256 donationCount) private _donationCounts;

    event CampaignCreated(
        bytes32 indexed campaignId,
        address indexed creator,
        address indexed treasury,
        uint256 goalAmount,
        string title,
        string metadataURI
    );
    event DonationReceived(
        bytes32 indexed campaignId,
        uint256 indexed donationId,
        address indexed donor,
        uint256 amount,
        string message
    );
    event CampaignWithdrawn(bytes32 indexed campaignId, address indexed to, uint256 amount);
    event CampaignClosed(bytes32 indexed campaignId);

    error CampaignAlreadyExists(bytes32 campaignId);
    error CampaignInactive(bytes32 campaignId);
    error CampaignMissing(bytes32 campaignId);
    error InvalidAddress();
    error InvalidAmount();
    error InvalidText();
    error TransferFailed();
    error Unauthorized();

    function createCampaign(
        bytes32 campaignId,
        address treasury,
        uint256 goalAmount,
        string calldata title,
        string calldata metadataURI
    ) external {
        if (_campaigns[campaignId].creator != address(0)) revert CampaignAlreadyExists(campaignId);
        if (treasury == address(0)) revert InvalidAddress();
        if (goalAmount == 0) revert InvalidAmount();
        if (bytes(title).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _campaigns[campaignId] = Campaign({
            creator: msg.sender,
            treasury: treasury,
            goalAmount: goalAmount,
            totalDonated: 0,
            withdrawnAmount: 0,
            createdAt: uint64(block.timestamp),
            active: true,
            title: title,
            metadataURI: metadataURI
        });

        emit CampaignCreated(campaignId, msg.sender, treasury, goalAmount, title, metadataURI);
    }

    function donate(bytes32 campaignId, string calldata message) external payable returns (uint256 donationId) {
        Campaign storage campaign = _requireActiveCampaign(campaignId);
        if (msg.value == 0) revert InvalidAmount();
        if (bytes(message).length == 0) revert InvalidText();

        donationId = _donationCounts[campaignId] + 1;
        _donationCounts[campaignId] = donationId;
        campaign.totalDonated += msg.value;
        _donations[campaignId][donationId] = Donation({
            donor: msg.sender,
            amount: msg.value,
            donatedAt: uint64(block.timestamp),
            message: message
        });

        emit DonationReceived(campaignId, donationId, msg.sender, msg.value, message);
    }

    function withdrawCampaign(bytes32 campaignId, address payable to, uint256 amount) external {
        Campaign storage campaign = _requireCampaign(campaignId);
        if (msg.sender != campaign.creator && msg.sender != campaign.treasury) revert Unauthorized();
        if (to == address(0)) revert InvalidAddress();

        uint256 available = campaign.totalDonated - campaign.withdrawnAmount;
        if (amount == 0 || amount > available) revert InvalidAmount();

        campaign.withdrawnAmount += amount;
        _sendValue(to, amount);

        emit CampaignWithdrawn(campaignId, to, amount);
    }

    function closeCampaign(bytes32 campaignId) external {
        Campaign storage campaign = _requireActiveCampaign(campaignId);
        if (msg.sender != campaign.creator && msg.sender != campaign.treasury) revert Unauthorized();
        campaign.active = false;

        emit CampaignClosed(campaignId);
    }

    function getCampaign(bytes32 campaignId) external view returns (Campaign memory) {
        return _campaigns[campaignId];
    }

    function getDonation(bytes32 campaignId, uint256 donationId) external view returns (Donation memory) {
        return _donations[campaignId][donationId];
    }

    function getDonationCount(bytes32 campaignId) external view returns (uint256) {
        return _donationCounts[campaignId];
    }

    function _requireCampaign(bytes32 campaignId) private view returns (Campaign storage campaign) {
        campaign = _campaigns[campaignId];
        if (campaign.creator == address(0)) revert CampaignMissing(campaignId);
    }

    function _requireActiveCampaign(bytes32 campaignId) private view returns (Campaign storage campaign) {
        campaign = _requireCampaign(campaignId);
        if (!campaign.active) revert CampaignInactive(campaignId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
