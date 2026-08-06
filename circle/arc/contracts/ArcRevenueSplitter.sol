// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcRevenueSplitter {
    event PaymentSplit(
        address indexed payer,
        uint256 totalAmount,
        address[] recipients,
        uint256[] amounts,
        string metadataURI
    );

    function splitPayment(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string calldata metadataURI
    ) external payable {
        require(recipients.length > 0, "recipients required");
        require(recipients.length == amounts.length, "length mismatch");

        uint256 total;
        for (uint256 i; i < recipients.length; i++) {
            require(recipients[i] != address(0), "recipient required");
            require(amounts[i] > 0, "amount required");
            total += amounts[i];
        }
        require(msg.value == total, "incorrect total");

        for (uint256 i; i < recipients.length; i++) {
            (bool sent, ) = payable(recipients[i]).call{value: amounts[i]}("");
            require(sent, "split transfer failed");
        }

        emit PaymentSplit(msg.sender, total, recipients, amounts, metadataURI);
    }
}
