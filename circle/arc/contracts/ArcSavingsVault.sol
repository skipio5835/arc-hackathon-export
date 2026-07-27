// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcSavingsVault {
    struct Vault {
        address owner;
        uint256 balance;
        uint256 goalAmount;
        uint64 createdAt;
        uint64 updatedAt;
        bool closed;
        string label;
    }

    mapping(bytes32 vaultId => Vault vault) private _vaults;

    event VaultCreated(
        bytes32 indexed vaultId,
        address indexed owner,
        uint256 initialDeposit,
        uint256 goalAmount,
        string label
    );
    event VaultDeposited(bytes32 indexed vaultId, address indexed owner, uint256 amount, uint256 balance);
    event VaultGoalUpdated(bytes32 indexed vaultId, uint256 goalAmount, string label);
    event VaultWithdrawn(bytes32 indexed vaultId, address indexed owner, address indexed to, uint256 amount, uint256 balance);
    event VaultClosed(bytes32 indexed vaultId, address indexed owner, address indexed to, uint256 amount);

    error InvalidAddress();
    error InvalidAmount();
    error InvalidLabel();
    error TransferFailed();
    error Unauthorized();
    error VaultAlreadyExists(bytes32 vaultId);
    error VaultClosedAlready(bytes32 vaultId);
    error VaultMissing(bytes32 vaultId);

    function createVault(bytes32 vaultId, uint256 goalAmount, string calldata label) external payable {
        if (_vaults[vaultId].owner != address(0)) revert VaultAlreadyExists(vaultId);
        if (bytes(label).length == 0) revert InvalidLabel();

        uint64 nowTs = uint64(block.timestamp);
        _vaults[vaultId] = Vault({
            owner: msg.sender,
            balance: msg.value,
            goalAmount: goalAmount,
            createdAt: nowTs,
            updatedAt: nowTs,
            closed: false,
            label: label
        });

        emit VaultCreated(vaultId, msg.sender, msg.value, goalAmount, label);
    }

    function deposit(bytes32 vaultId) external payable {
        if (msg.value == 0) revert InvalidAmount();

        Vault storage vault = _requireOpenVault(vaultId);
        _requireOwner(vault);

        vault.balance += msg.value;
        vault.updatedAt = uint64(block.timestamp);

        emit VaultDeposited(vaultId, msg.sender, msg.value, vault.balance);
    }

    function setGoal(bytes32 vaultId, uint256 goalAmount, string calldata label) external {
        Vault storage vault = _requireOpenVault(vaultId);
        _requireOwner(vault);
        if (bytes(label).length == 0) revert InvalidLabel();

        vault.goalAmount = goalAmount;
        vault.label = label;
        vault.updatedAt = uint64(block.timestamp);

        emit VaultGoalUpdated(vaultId, goalAmount, label);
    }

    function withdraw(bytes32 vaultId, uint256 amount, address payable to) external {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        Vault storage vault = _requireOpenVault(vaultId);
        _requireOwner(vault);
        if (amount > vault.balance) revert InvalidAmount();

        vault.balance -= amount;
        vault.updatedAt = uint64(block.timestamp);

        _sendValue(to, amount);

        emit VaultWithdrawn(vaultId, msg.sender, to, amount, vault.balance);
    }

    function closeVault(bytes32 vaultId, address payable to) external {
        if (to == address(0)) revert InvalidAddress();

        Vault storage vault = _requireOpenVault(vaultId);
        _requireOwner(vault);

        uint256 amount = vault.balance;
        vault.balance = 0;
        vault.closed = true;
        vault.updatedAt = uint64(block.timestamp);

        if (amount > 0) {
            _sendValue(to, amount);
        }

        emit VaultClosed(vaultId, msg.sender, to, amount);
    }

    function getVault(bytes32 vaultId) external view returns (Vault memory) {
        return _vaults[vaultId];
    }

    function isGoalReached(bytes32 vaultId) external view returns (bool) {
        Vault memory vault = _vaults[vaultId];
        return vault.owner != address(0) && vault.goalAmount > 0 && vault.balance >= vault.goalAmount;
    }

    function _requireOpenVault(bytes32 vaultId) private view returns (Vault storage vault) {
        vault = _vaults[vaultId];
        if (vault.owner == address(0)) revert VaultMissing(vaultId);
        if (vault.closed) revert VaultClosedAlready(vaultId);
    }

    function _requireOwner(Vault storage vault) private view {
        if (vault.owner != msg.sender) revert Unauthorized();
    }

    function _sendValue(address payable to, uint256 amount) private {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
