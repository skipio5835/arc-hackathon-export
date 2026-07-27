// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcAccessRegistry {
    struct AccessRecord {
        address requester;
        address approver;
        uint64 createdAt;
        uint64 approvedAt;
        uint64 revokedAt;
        bool approved;
        bool revoked;
        string accessRef;
        string role;
        string metadataURI;
        string approvalURI;
        string revokeURI;
    }

    mapping(bytes32 accessId => AccessRecord record) private _records;

    event AccessRequested(
        bytes32 indexed accessId,
        address indexed requester,
        address indexed approver,
        string accessRef,
        string role,
        string metadataURI
    );
    event AccessApproved(bytes32 indexed accessId, address indexed approver, string approvalURI);
    event AccessRevoked(bytes32 indexed accessId, address indexed revoker, string revokeURI);

    error AccessAlreadyApproved(bytes32 accessId);
    error AccessAlreadyExists(bytes32 accessId);
    error AccessAlreadyRevoked(bytes32 accessId);
    error AccessMissing(bytes32 accessId);
    error AccessNotApproved(bytes32 accessId);
    error InvalidAddress();
    error InvalidText();
    error Unauthorized();

    function requestAccess(
        bytes32 accessId,
        address approver,
        string calldata accessRef,
        string calldata role,
        string calldata metadataURI
    ) external {
        if (_records[accessId].requester != address(0)) revert AccessAlreadyExists(accessId);
        if (approver == address(0)) revert InvalidAddress();
        if (bytes(accessRef).length == 0 || bytes(role).length == 0 || bytes(metadataURI).length == 0) {
            revert InvalidText();
        }

        _records[accessId] = AccessRecord({
            requester: msg.sender,
            approver: approver,
            createdAt: uint64(block.timestamp),
            approvedAt: 0,
            revokedAt: 0,
            approved: false,
            revoked: false,
            accessRef: accessRef,
            role: role,
            metadataURI: metadataURI,
            approvalURI: "",
            revokeURI: ""
        });

        emit AccessRequested(accessId, msg.sender, approver, accessRef, role, metadataURI);
    }

    function approveAccess(bytes32 accessId, string calldata approvalURI) external {
        AccessRecord storage record = _requireRecord(accessId);
        if (msg.sender != record.approver) revert Unauthorized();
        if (record.approved) revert AccessAlreadyApproved(accessId);
        if (record.revoked) revert AccessAlreadyRevoked(accessId);
        if (bytes(approvalURI).length == 0) revert InvalidText();

        record.approved = true;
        record.approvedAt = uint64(block.timestamp);
        record.approvalURI = approvalURI;

        emit AccessApproved(accessId, msg.sender, approvalURI);
    }

    function revokeAccess(bytes32 accessId, string calldata revokeURI) external {
        AccessRecord storage record = _requireRecord(accessId);
        if (msg.sender != record.requester && msg.sender != record.approver) revert Unauthorized();
        if (!record.approved) revert AccessNotApproved(accessId);
        if (record.revoked) revert AccessAlreadyRevoked(accessId);
        if (bytes(revokeURI).length == 0) revert InvalidText();

        record.revoked = true;
        record.revokedAt = uint64(block.timestamp);
        record.revokeURI = revokeURI;

        emit AccessRevoked(accessId, msg.sender, revokeURI);
    }

    function getAccess(bytes32 accessId) external view returns (AccessRecord memory) {
        return _records[accessId];
    }

    function _requireRecord(bytes32 accessId) private view returns (AccessRecord storage record) {
        record = _records[accessId];
        if (record.requester == address(0)) revert AccessMissing(accessId);
    }
}
