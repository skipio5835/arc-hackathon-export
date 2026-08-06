// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcUsageBilling {
    enum ChargeStatus { Unknown, Open, Paid, Cancelled }

    struct Charge {
        address merchant;
        address payer;
        uint256 units;
        uint256 unitPrice;
        uint256 totalAmount;
        uint64 createdAt;
        uint64 expiresAt;
        uint64 paidAt;
        string metadataURI;
        ChargeStatus status;
    }

    mapping(bytes32 => Charge) private charges;

    event UsageChargeCreated(bytes32 indexed chargeId, address indexed merchant, address indexed payer, uint256 units, uint256 unitPrice, uint256 totalAmount, uint64 expiresAt, string metadataURI);
    event UsageChargePaid(bytes32 indexed chargeId, address indexed merchant, address indexed payer, uint256 units, uint256 totalAmount, uint256 paidAt);
    event UsageChargeCancelled(bytes32 indexed chargeId, address indexed merchant, uint256 cancelledAt);

    function createCharge(bytes32 chargeId, address payer, uint256 units, uint256 unitPrice, uint64 expiresAt, string calldata metadataURI) external {
        require(chargeId != bytes32(0), "charge id required");
        require(payer != address(0), "payer required");
        require(units > 0 && unitPrice > 0, "usage price required");
        require(expiresAt > block.timestamp, "expiry required");
        require(charges[chargeId].status == ChargeStatus.Unknown, "charge exists");

        uint256 totalAmount = units * unitPrice;
        require(totalAmount / units == unitPrice, "amount overflow");
        charges[chargeId] = Charge({
            merchant: msg.sender, payer: payer, units: units, unitPrice: unitPrice, totalAmount: totalAmount,
            createdAt: uint64(block.timestamp), expiresAt: expiresAt, paidAt: 0, metadataURI: metadataURI, status: ChargeStatus.Open
        });
        emit UsageChargeCreated(chargeId, msg.sender, payer, units, unitPrice, totalAmount, expiresAt, metadataURI);
    }

    function payCharge(bytes32 chargeId) external payable {
        Charge storage charge = charges[chargeId];
        require(charge.status == ChargeStatus.Open, "charge not payable");
        require(msg.sender == charge.payer, "payer only");
        require(block.timestamp < charge.expiresAt, "charge expired");
        require(msg.value == charge.totalAmount, "incorrect amount");
        charge.status = ChargeStatus.Paid;
        charge.paidAt = uint64(block.timestamp);
        (bool sent, ) = payable(charge.merchant).call{value: msg.value}("");
        require(sent, "settlement failed");
        emit UsageChargePaid(chargeId, charge.merchant, msg.sender, charge.units, msg.value, block.timestamp);
    }

    function cancelCharge(bytes32 chargeId) external {
        Charge storage charge = charges[chargeId];
        require(charge.status == ChargeStatus.Open, "charge not cancellable");
        require(charge.merchant == msg.sender, "merchant only");
        charge.status = ChargeStatus.Cancelled;
        emit UsageChargeCancelled(chargeId, msg.sender, block.timestamp);
    }

    function getCharge(bytes32 chargeId) external view returns (Charge memory) { return charges[chargeId]; }
}
