// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcWarrantyRegistry {
    struct Warranty {
        address owner;
        address serviceProvider;
        uint64 createdAt;
        uint64 expiresAt;
        uint64 claimedAt;
        uint64 resolvedAt;
        bool claimOpen;
        bool resolved;
        string productRef;
        string metadataURI;
        string claimURI;
        string resolutionURI;
    }

    mapping(bytes32 warrantyId => Warranty warranty) private _warranties;

    event WarrantyRegistered(
        bytes32 indexed warrantyId,
        address indexed owner,
        address indexed serviceProvider,
        uint64 expiresAt,
        string productRef,
        string metadataURI
    );
    event WarrantyClaimOpened(bytes32 indexed warrantyId, address indexed reporter, string claimURI);
    event WarrantyResolved(bytes32 indexed warrantyId, address indexed resolver, string resolutionURI);

    error InvalidAddress();
    error InvalidText();
    error Unauthorized();
    error WarrantyAlreadyClaimed(bytes32 warrantyId);
    error WarrantyAlreadyExists(bytes32 warrantyId);
    error WarrantyAlreadyResolved(bytes32 warrantyId);
    error WarrantyMissing(bytes32 warrantyId);
    error WarrantyNotClaimed(bytes32 warrantyId);

    function registerWarranty(
        bytes32 warrantyId,
        address serviceProvider,
        uint64 expiresAt,
        string calldata productRef,
        string calldata metadataURI
    ) external {
        if (_warranties[warrantyId].owner != address(0)) revert WarrantyAlreadyExists(warrantyId);
        if (serviceProvider == address(0)) revert InvalidAddress();
        if (bytes(productRef).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _warranties[warrantyId] = Warranty({
            owner: msg.sender,
            serviceProvider: serviceProvider,
            createdAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            claimedAt: 0,
            resolvedAt: 0,
            claimOpen: false,
            resolved: false,
            productRef: productRef,
            metadataURI: metadataURI,
            claimURI: "",
            resolutionURI: ""
        });

        emit WarrantyRegistered(warrantyId, msg.sender, serviceProvider, expiresAt, productRef, metadataURI);
    }

    function openClaim(bytes32 warrantyId, string calldata claimURI) external {
        Warranty storage warranty = _requireWarranty(warrantyId);
        if (msg.sender != warranty.owner && msg.sender != warranty.serviceProvider) revert Unauthorized();
        if (warranty.claimOpen || warranty.claimedAt != 0) revert WarrantyAlreadyClaimed(warrantyId);
        if (warranty.resolved) revert WarrantyAlreadyResolved(warrantyId);
        if (bytes(claimURI).length == 0) revert InvalidText();

        warranty.claimOpen = true;
        warranty.claimedAt = uint64(block.timestamp);
        warranty.claimURI = claimURI;

        emit WarrantyClaimOpened(warrantyId, msg.sender, claimURI);
    }

    function resolveClaim(bytes32 warrantyId, string calldata resolutionURI) external {
        Warranty storage warranty = _requireWarranty(warrantyId);
        if (msg.sender != warranty.owner && msg.sender != warranty.serviceProvider) revert Unauthorized();
        if (!warranty.claimOpen) revert WarrantyNotClaimed(warrantyId);
        if (warranty.resolved) revert WarrantyAlreadyResolved(warrantyId);
        if (bytes(resolutionURI).length == 0) revert InvalidText();

        warranty.claimOpen = false;
        warranty.resolved = true;
        warranty.resolvedAt = uint64(block.timestamp);
        warranty.resolutionURI = resolutionURI;

        emit WarrantyResolved(warrantyId, msg.sender, resolutionURI);
    }

    function getWarranty(bytes32 warrantyId) external view returns (Warranty memory) {
        return _warranties[warrantyId];
    }

    function _requireWarranty(bytes32 warrantyId) private view returns (Warranty storage warranty) {
        warranty = _warranties[warrantyId];
        if (warranty.owner == address(0)) revert WarrantyMissing(warrantyId);
    }
}
