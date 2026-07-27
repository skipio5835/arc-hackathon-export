// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcMilestoneAgreement {
    struct Agreement {
        address sponsor;
        address worker;
        uint256 totalFunded;
        uint256 totalReleased;
        uint64 createdAt;
        bool closed;
        string title;
        string metadataURI;
    }

    struct Milestone {
        uint256 amount;
        bool submitted;
        bool released;
        string submissionURI;
    }

    mapping(bytes32 agreementId => Agreement agreement) private _agreements;
    mapping(bytes32 agreementId => Milestone[] milestones) private _milestones;

    event AgreementCreated(
        bytes32 indexed agreementId,
        address indexed sponsor,
        address indexed worker,
        uint256 totalFunded,
        string title,
        string metadataURI
    );
    event MilestoneSubmitted(bytes32 indexed agreementId, uint256 indexed milestoneIndex, address indexed worker, string submissionURI);
    event MilestoneReleased(bytes32 indexed agreementId, uint256 indexed milestoneIndex, address indexed worker, uint256 amount);
    event AgreementClosed(bytes32 indexed agreementId, address indexed sponsor, address indexed refundTo, uint256 refundAmount);

    error AgreementAlreadyExists(bytes32 agreementId);
    error AgreementClosedAlready(bytes32 agreementId);
    error AgreementMissing(bytes32 agreementId);
    error InvalidAddress();
    error InvalidAmount();
    error InvalidMilestone();
    error InvalidText();
    error TransferFailed();
    error Unauthorized();

    function createAgreement(
        bytes32 agreementId,
        address worker,
        uint256[] calldata amounts,
        string calldata title,
        string calldata metadataURI
    ) external payable {
        if (_agreements[agreementId].sponsor != address(0)) revert AgreementAlreadyExists(agreementId);
        if (worker == address(0)) revert InvalidAddress();
        if (amounts.length == 0 || amounts.length > 8) revert InvalidMilestone();
        if (bytes(title).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        uint256 total;
        for (uint256 i = 0; i < amounts.length; i += 1) {
            uint256 amount = amounts[i];
            if (amount == 0) revert InvalidAmount();
            total += amount;
            _milestones[agreementId].push(Milestone({amount: amount, submitted: false, released: false, submissionURI: ""}));
        }
        if (msg.value != total) revert InvalidAmount();

        _agreements[agreementId] = Agreement({
            sponsor: msg.sender,
            worker: worker,
            totalFunded: total,
            totalReleased: 0,
            createdAt: uint64(block.timestamp),
            closed: false,
            title: title,
            metadataURI: metadataURI
        });

        emit AgreementCreated(agreementId, msg.sender, worker, total, title, metadataURI);
    }

    function submitMilestone(bytes32 agreementId, uint256 milestoneIndex, string calldata submissionURI) external {
        Agreement storage agreement = _requireOpenAgreement(agreementId);
        if (msg.sender != agreement.worker) revert Unauthorized();
        if (bytes(submissionURI).length == 0) revert InvalidText();

        Milestone storage milestone = _requireMilestone(agreementId, milestoneIndex);
        if (milestone.released) revert InvalidMilestone();

        milestone.submitted = true;
        milestone.submissionURI = submissionURI;

        emit MilestoneSubmitted(agreementId, milestoneIndex, msg.sender, submissionURI);
    }

    function releaseMilestone(bytes32 agreementId, uint256 milestoneIndex) external {
        Agreement storage agreement = _requireOpenAgreement(agreementId);
        if (msg.sender != agreement.sponsor) revert Unauthorized();

        Milestone storage milestone = _requireMilestone(agreementId, milestoneIndex);
        if (!milestone.submitted || milestone.released) revert InvalidMilestone();

        milestone.released = true;
        agreement.totalReleased += milestone.amount;
        _sendValue(agreement.worker, milestone.amount);

        emit MilestoneReleased(agreementId, milestoneIndex, agreement.worker, milestone.amount);
    }

    function closeAgreement(bytes32 agreementId, address payable refundTo) external {
        if (refundTo == address(0)) revert InvalidAddress();

        Agreement storage agreement = _requireOpenAgreement(agreementId);
        if (msg.sender != agreement.sponsor) revert Unauthorized();

        uint256 refundAmount = agreement.totalFunded - agreement.totalReleased;
        agreement.closed = true;

        if (refundAmount > 0) {
            _sendValue(refundTo, refundAmount);
        }

        emit AgreementClosed(agreementId, msg.sender, refundTo, refundAmount);
    }

    function getAgreement(bytes32 agreementId) external view returns (Agreement memory agreement, uint256 milestoneCount) {
        agreement = _agreements[agreementId];
        milestoneCount = _milestones[agreementId].length;
    }

    function getMilestone(bytes32 agreementId, uint256 milestoneIndex) external view returns (Milestone memory) {
        return _requireMilestone(agreementId, milestoneIndex);
    }

    function _requireOpenAgreement(bytes32 agreementId) private view returns (Agreement storage agreement) {
        agreement = _agreements[agreementId];
        if (agreement.sponsor == address(0)) revert AgreementMissing(agreementId);
        if (agreement.closed) revert AgreementClosedAlready(agreementId);
    }

    function _requireMilestone(bytes32 agreementId, uint256 milestoneIndex) private view returns (Milestone storage milestone) {
        if (milestoneIndex >= _milestones[agreementId].length) revert InvalidMilestone();
        milestone = _milestones[agreementId][milestoneIndex];
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
