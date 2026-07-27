// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcInstallmentPayments {
    struct Agreement {
        address payer;
        address merchant;
        uint256 installmentAmount;
        uint256 paidAmount;
        uint8 installmentCount;
        uint8 paidInstallments;
        uint64 createdAt;
        bool closed;
        string agreementRef;
        string metadataURI;
        string completionURI;
    }

    mapping(bytes32 agreementId => Agreement agreement) private _agreements;

    event AgreementCreated(
        bytes32 indexed agreementId,
        address indexed payer,
        address indexed merchant,
        uint256 installmentAmount,
        uint8 installmentCount,
        string agreementRef,
        string metadataURI
    );
    event InstallmentPaid(
        bytes32 indexed agreementId,
        address indexed payer,
        address indexed merchant,
        uint8 installmentNumber,
        uint256 amount,
        string paymentURI
    );
    event AgreementCompleted(bytes32 indexed agreementId, address indexed resolver, string completionURI);

    error AgreementAlreadyExists(bytes32 agreementId);
    error AgreementClosedAlready(bytes32 agreementId);
    error AgreementIncomplete(bytes32 agreementId);
    error AgreementMissing(bytes32 agreementId);
    error InvalidAddress();
    error InvalidAmount();
    error InvalidInstallmentCount();
    error InvalidText();
    error TransferFailed();
    error Unauthorized();

    function createAgreement(
        bytes32 agreementId,
        address merchant,
        uint8 installmentCount,
        uint256 installmentAmount,
        string calldata agreementRef,
        string calldata metadataURI
    ) external {
        if (_agreements[agreementId].payer != address(0)) revert AgreementAlreadyExists(agreementId);
        if (merchant == address(0)) revert InvalidAddress();
        if (installmentCount == 0) revert InvalidInstallmentCount();
        if (installmentAmount == 0) revert InvalidAmount();
        if (bytes(agreementRef).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _agreements[agreementId] = Agreement({
            payer: msg.sender,
            merchant: merchant,
            installmentAmount: installmentAmount,
            paidAmount: 0,
            installmentCount: installmentCount,
            paidInstallments: 0,
            createdAt: uint64(block.timestamp),
            closed: false,
            agreementRef: agreementRef,
            metadataURI: metadataURI,
            completionURI: ""
        });

        emit AgreementCreated(
            agreementId,
            msg.sender,
            merchant,
            installmentAmount,
            installmentCount,
            agreementRef,
            metadataURI
        );
    }

    function payInstallment(bytes32 agreementId, string calldata paymentURI) external payable {
        Agreement storage agreement = _requireOpenAgreement(agreementId);
        if (msg.sender != agreement.payer) revert Unauthorized();
        if (bytes(paymentURI).length == 0) revert InvalidText();
        if (msg.value != agreement.installmentAmount) revert InvalidAmount();
        if (agreement.paidInstallments >= agreement.installmentCount) revert AgreementClosedAlready(agreementId);

        agreement.paidInstallments += 1;
        agreement.paidAmount += msg.value;
        _sendValue(agreement.merchant, msg.value);

        emit InstallmentPaid(
            agreementId,
            msg.sender,
            agreement.merchant,
            agreement.paidInstallments,
            msg.value,
            paymentURI
        );
    }

    function completeAgreement(bytes32 agreementId, string calldata completionURI) external {
        Agreement storage agreement = _requireOpenAgreement(agreementId);
        if (msg.sender != agreement.payer && msg.sender != agreement.merchant) revert Unauthorized();
        if (bytes(completionURI).length == 0) revert InvalidText();
        if (agreement.paidInstallments != agreement.installmentCount) revert AgreementIncomplete(agreementId);

        agreement.closed = true;
        agreement.completionURI = completionURI;

        emit AgreementCompleted(agreementId, msg.sender, completionURI);
    }

    function getAgreement(bytes32 agreementId) external view returns (Agreement memory) {
        return _agreements[agreementId];
    }

    function _requireOpenAgreement(bytes32 agreementId) private view returns (Agreement storage agreement) {
        agreement = _agreements[agreementId];
        if (agreement.payer == address(0)) revert AgreementMissing(agreementId);
        if (agreement.closed) revert AgreementClosedAlready(agreementId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
