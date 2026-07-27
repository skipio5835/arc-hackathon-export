// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcExpenseSplitter {
    struct Expense {
        address owner;
        address payee;
        uint256 targetAmount;
        uint256 totalContributed;
        uint256 totalWithdrawn;
        uint64 createdAt;
        bool closed;
        string title;
        string metadataURI;
    }

    mapping(bytes32 expenseId => Expense expense) private _expenses;
    mapping(bytes32 expenseId => mapping(address contributor => uint256 amount)) private _contributions;

    event ExpenseCreated(
        bytes32 indexed expenseId,
        address indexed owner,
        address indexed payee,
        uint256 targetAmount,
        string title,
        string metadataURI
    );
    event ContributionReceived(bytes32 indexed expenseId, address indexed contributor, uint256 amount);
    event ExpenseWithdrawn(bytes32 indexed expenseId, address indexed payee, uint256 amount);
    event ExpenseClosed(bytes32 indexed expenseId, address indexed owner, address indexed refundTo, uint256 refundAmount);

    error ExpenseAlreadyExists(bytes32 expenseId);
    error ExpenseClosedAlready(bytes32 expenseId);
    error ExpenseMissing(bytes32 expenseId);
    error InvalidAddress();
    error InvalidAmount();
    error InvalidText();
    error TargetExceeded(uint256 targetAmount, uint256 attemptedTotal);
    error TransferFailed();
    error Unauthorized();

    function createExpense(
        bytes32 expenseId,
        address payee,
        uint256 targetAmount,
        string calldata title,
        string calldata metadataURI
    ) external {
        if (_expenses[expenseId].owner != address(0)) revert ExpenseAlreadyExists(expenseId);
        if (payee == address(0)) revert InvalidAddress();
        if (targetAmount == 0) revert InvalidAmount();
        if (bytes(title).length == 0 || bytes(metadataURI).length == 0) revert InvalidText();

        _expenses[expenseId] = Expense({
            owner: msg.sender,
            payee: payee,
            targetAmount: targetAmount,
            totalContributed: 0,
            totalWithdrawn: 0,
            createdAt: uint64(block.timestamp),
            closed: false,
            title: title,
            metadataURI: metadataURI
        });

        emit ExpenseCreated(expenseId, msg.sender, payee, targetAmount, title, metadataURI);
    }

    function contribute(bytes32 expenseId) external payable {
        Expense storage expense = _requireOpenExpense(expenseId);
        if (msg.value == 0) revert InvalidAmount();

        uint256 attemptedTotal = expense.totalContributed + msg.value;
        if (attemptedTotal > expense.targetAmount) revert TargetExceeded(expense.targetAmount, attemptedTotal);

        expense.totalContributed = attemptedTotal;
        _contributions[expenseId][msg.sender] += msg.value;

        emit ContributionReceived(expenseId, msg.sender, msg.value);
    }

    function withdraw(bytes32 expenseId, uint256 amount, address payable to) external {
        Expense storage expense = _requireOpenExpense(expenseId);
        if (msg.sender != expense.owner) revert Unauthorized();
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        uint256 available = expense.totalContributed - expense.totalWithdrawn;
        if (amount > available) revert InvalidAmount();

        expense.totalWithdrawn += amount;
        _sendValue(to, amount);

        emit ExpenseWithdrawn(expenseId, to, amount);
    }

    function closeExpense(bytes32 expenseId, address payable refundTo) external {
        Expense storage expense = _requireOpenExpense(expenseId);
        if (msg.sender != expense.owner) revert Unauthorized();
        if (refundTo == address(0)) revert InvalidAddress();

        uint256 refundAmount = expense.totalContributed - expense.totalWithdrawn;
        expense.closed = true;

        if (refundAmount > 0) {
            _sendValue(refundTo, refundAmount);
        }

        emit ExpenseClosed(expenseId, msg.sender, refundTo, refundAmount);
    }

    function getExpense(bytes32 expenseId) external view returns (Expense memory) {
        return _expenses[expenseId];
    }

    function getContribution(bytes32 expenseId, address contributor) external view returns (uint256) {
        return _contributions[expenseId][contributor];
    }

    function _requireOpenExpense(bytes32 expenseId) private view returns (Expense storage expense) {
        expense = _expenses[expenseId];
        if (expense.owner == address(0)) revert ExpenseMissing(expenseId);
        if (expense.closed) revert ExpenseClosedAlready(expenseId);
    }

    function _sendValue(address to, uint256 amount) private {
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
