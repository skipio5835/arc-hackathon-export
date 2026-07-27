// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArcPoll {
    struct Poll {
        address creator;
        uint64 createdAt;
        uint64 closesAt;
        bool closed;
        uint32 yesVotes;
        uint32 noVotes;
        uint32 abstainVotes;
        string title;
        string metadataURI;
    }

    struct Vote {
        uint8 choice;
        uint64 votedAt;
        string reason;
    }

    mapping(bytes32 pollId => Poll poll) private _polls;
    mapping(bytes32 pollId => mapping(address voter => Vote vote)) private _votes;

    event PollCreated(
        bytes32 indexed pollId,
        address indexed creator,
        uint64 closesAt,
        string title,
        string metadataURI
    );
    event VoteCast(bytes32 indexed pollId, address indexed voter, uint8 choice, string reason);
    event PollClosed(bytes32 indexed pollId, address indexed creator, uint32 yesVotes, uint32 noVotes, uint32 abstainVotes);

    error InvalidChoice();
    error InvalidDuration();
    error InvalidTitle();
    error PollAlreadyExists(bytes32 pollId);
    error PollClosedAlready(bytes32 pollId);
    error PollExpired(bytes32 pollId);
    error PollMissing(bytes32 pollId);
    error Unauthorized();

    function createPoll(
        bytes32 pollId,
        string calldata title,
        string calldata metadataURI,
        uint64 durationSeconds
    ) external {
        if (_polls[pollId].creator != address(0)) revert PollAlreadyExists(pollId);
        if (bytes(title).length == 0) revert InvalidTitle();
        if (durationSeconds == 0) revert InvalidDuration();

        uint64 nowTs = uint64(block.timestamp);
        uint64 closesAt = nowTs + durationSeconds;

        _polls[pollId] = Poll({
            creator: msg.sender,
            createdAt: nowTs,
            closesAt: closesAt,
            closed: false,
            yesVotes: 0,
            noVotes: 0,
            abstainVotes: 0,
            title: title,
            metadataURI: metadataURI
        });

        emit PollCreated(pollId, msg.sender, closesAt, title, metadataURI);
    }

    function castVote(bytes32 pollId, uint8 choice, string calldata reason) external {
        if (choice < 1 || choice > 3) revert InvalidChoice();

        Poll storage poll = _requireOpenPoll(pollId);
        if (block.timestamp > poll.closesAt) revert PollExpired(pollId);

        Vote storage vote = _votes[pollId][msg.sender];
        if (vote.choice != 0) {
            _decrementTally(poll, vote.choice);
        }

        vote.choice = choice;
        vote.votedAt = uint64(block.timestamp);
        vote.reason = reason;

        _incrementTally(poll, choice);

        emit VoteCast(pollId, msg.sender, choice, reason);
    }

    function closePoll(bytes32 pollId) external {
        Poll storage poll = _requireOpenPoll(pollId);
        if (poll.creator != msg.sender) revert Unauthorized();

        poll.closed = true;

        emit PollClosed(pollId, msg.sender, poll.yesVotes, poll.noVotes, poll.abstainVotes);
    }

    function getPoll(bytes32 pollId) external view returns (Poll memory) {
        return _polls[pollId];
    }

    function getVote(bytes32 pollId, address voter) external view returns (Vote memory) {
        return _votes[pollId][voter];
    }

    function _requireOpenPoll(bytes32 pollId) private view returns (Poll storage poll) {
        poll = _polls[pollId];
        if (poll.creator == address(0)) revert PollMissing(pollId);
        if (poll.closed) revert PollClosedAlready(pollId);
    }

    function _incrementTally(Poll storage poll, uint8 choice) private {
        if (choice == 1) {
            poll.yesVotes += 1;
        } else if (choice == 2) {
            poll.noVotes += 1;
        } else {
            poll.abstainVotes += 1;
        }
    }

    function _decrementTally(Poll storage poll, uint8 choice) private {
        if (choice == 1) {
            poll.yesVotes -= 1;
        } else if (choice == 2) {
            poll.noVotes -= 1;
        } else if (choice == 3) {
            poll.abstainVotes -= 1;
        }
    }
}
