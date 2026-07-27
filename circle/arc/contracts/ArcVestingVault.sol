// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcVestingVault {
    struct VestingGrant {
        address funder;
        address beneficiary;
        uint256 amount;
        uint256 claimedAmount;
        uint64 createdAt;
        uint64 unlockTime;
        bool closed;
        string grantRef;
        string metadataURI;
        string claimURI;
    }

    mapping(bytes32 grantId => VestingGrant grant) private _grants;

    event VestingCreated(
        bytes32 indexed grantId,
        address indexed funder,
        address indexed beneficiary,
        uint256 amount,
        uint64 unlockTime,
        string grantRef,
        string metadataURI
    );
    event VestingClaimed(
        bytes32 indexed grantId,
        address indexed beneficiary,
        address indexed to,
        uint256 amount,
        string claimURI
    );
    event VestingClosed(bytes32 indexed grantId, address indexed funder, address indexed refundTo, uint256 refundAmount);

    error InvalidAddress();
    error InvalidAmount();
    error InvalidText();
    error TransferFailed();
    error Unauthorized();
    error VestingAlreadyExists(bytes32 grantId);
    error VestingClaimedAlready(bytes32 grantId);
    error VestingClosedAlready(bytes32 grantId);
    error VestingMissing(bytes32 grantId);
    error VestingNotUnlocked(uint64 unlockTime);

    function createVesting(
        bytes32 grantId,
        address beneficiary,
        uint64 unlockTime,
        string calldata grantRef,
        string calldata metadataURI
    ) external payable {
        if (_grants[grantId].funder != address(0)) revert VestingAlreadyExists(grantId);
        if (beneficiary == address(0)) revert InvalidAddress();
        if (msg.value == 0) revert InvalidAmount();
        if (bytes(grantRef).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _grants[grantId] = VestingGrant({
            funder: msg.sender,
            beneficiary: beneficiary,
            amount: msg.value,
            claimedAmount: 0,
            createdAt: uint64(block.timestamp),
            unlockTime: unlockTime,
            closed: false,
            grantRef: grantRef,
            metadataURI: metadataURI,
            claimURI: ""
        });

        emit VestingCreated(grantId, msg.sender, beneficiary, msg.value, unlockTime, grantRef, metadataURI);
    }

    function claimVesting(bytes32 grantId, address payable to, string calldata claimURI) external {
        VestingGrant storage grant = _requireOpenGrant(grantId);
        if (msg.sender != grant.beneficiary) revert Unauthorized();
        if (to == address(0)) revert InvalidAddress();
        if (bytes(claimURI).length == 0) revert InvalidText();
        if (grant.claimedAmount != 0) revert VestingClaimedAlready(grantId);
        if (block.timestamp < grant.unlockTime) revert VestingNotUnlocked(grant.unlockTime);

        grant.claimedAmount = grant.amount;
        grant.claimURI = claimURI;
        _sendValue(to, grant.amount);

        emit VestingClaimed(grantId, msg.sender, to, grant.amount, claimURI);
    }

    function closeVesting(bytes32 grantId, address payable refundTo) external {
        VestingGrant storage grant = _requireOpenGrant(grantId);
        if (msg.sender != grant.funder) revert Unauthorized();
        if (refundTo == address(0)) revert InvalidAddress();

        uint256 refundAmount = grant.amount - grant.claimedAmount;
        grant.closed = true;
        if (refundAmount > 0) {
            _sendValue(refundTo, refundAmount);
        }

        emit VestingClosed(grantId, msg.sender, refundTo, refundAmount);
    }

    function getVesting(bytes32 grantId) external view returns (VestingGrant memory) {
        return _grants[grantId];
    }

    function _requireOpenGrant(bytes32 grantId) private view returns (VestingGrant storage grant) {
        grant = _grants[grantId];
        if (grant.funder == address(0)) revert VestingMissing(grantId);
        if (grant.closed) revert VestingClosedAlready(grantId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
