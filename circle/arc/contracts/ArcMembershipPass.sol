// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ArcMembershipPass is ERC721, Ownable {
    struct Pass {
        uint64 mintedAt;
        uint64 expiresAt;
        uint64 renewedAt;
        string handle;
    }

    uint256 public nextTokenId = 1;
    uint256 public mintPrice;
    uint256 public renewalPrice;
    uint64 public defaultDurationSeconds;

    mapping(uint256 tokenId => Pass passData) private _passes;

    event PassMinted(
        address indexed member,
        uint256 indexed tokenId,
        uint256 price,
        uint64 expiresAt,
        string handle
    );
    event PassRenewed(
        address indexed member,
        uint256 indexed tokenId,
        uint256 price,
        uint64 extraDays,
        uint64 expiresAt
    );
    event PassRevoked(uint256 indexed tokenId);
    event PricesUpdated(uint256 mintPrice, uint256 renewalPrice);
    event DurationUpdated(uint64 defaultDurationSeconds);
    event TreasuryWithdrawn(address indexed to, uint256 amount);

    error InvalidAddress();
    error InvalidDuration();
    error InvalidHandle();
    error InvalidPayment(uint256 expected, uint256 actual);
    error Unauthorized();
    error TransferFailed();

    constructor(
        address initialOwner,
        uint256 mintPrice_,
        uint256 renewalPrice_,
        uint64 defaultDurationSeconds_
    ) ERC721("Arc Membership Pass", "ARCM") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert InvalidAddress();
        if (defaultDurationSeconds_ == 0) revert InvalidDuration();

        mintPrice = mintPrice_;
        renewalPrice = renewalPrice_;
        defaultDurationSeconds = defaultDurationSeconds_;
    }

    function mintPass(string calldata handle) external payable returns (uint256 tokenId) {
        if (bytes(handle).length == 0) revert InvalidHandle();
        if (msg.value != mintPrice) revert InvalidPayment(mintPrice, msg.value);

        tokenId = nextTokenId;
        nextTokenId += 1;

        uint64 mintedAt = uint64(block.timestamp);
        uint64 expiresAt = mintedAt + defaultDurationSeconds;

        _passes[tokenId] = Pass({
            mintedAt: mintedAt,
            expiresAt: expiresAt,
            renewedAt: 0,
            handle: handle
        });

        _safeMint(msg.sender, tokenId);

        emit PassMinted(msg.sender, tokenId, msg.value, expiresAt, handle);
    }

    function renewPass(uint256 tokenId, uint64 extraDays) external payable {
        if (extraDays == 0) revert InvalidDuration();
        if (msg.value != renewalPrice) revert InvalidPayment(renewalPrice, msg.value);

        address owner = ownerOf(tokenId);
        if (owner != msg.sender) revert Unauthorized();

        Pass storage passData = _passes[tokenId];
        uint64 nowTs = uint64(block.timestamp);
        uint64 base = passData.expiresAt > nowTs ? passData.expiresAt : nowTs;
        uint64 extension = extraDays * uint64(1 days);

        passData.renewedAt = nowTs;
        passData.expiresAt = base + extension;

        emit PassRenewed(msg.sender, tokenId, msg.value, extraDays, passData.expiresAt);
    }

    function revokePass(uint256 tokenId) external onlyOwner {
        ownerOf(tokenId);
        _burn(tokenId);
        delete _passes[tokenId];

        emit PassRevoked(tokenId);
    }

    function setPrices(uint256 mintPrice_, uint256 renewalPrice_) external onlyOwner {
        mintPrice = mintPrice_;
        renewalPrice = renewalPrice_;

        emit PricesUpdated(mintPrice_, renewalPrice_);
    }

    function setDefaultDuration(uint64 defaultDurationSeconds_) external onlyOwner {
        if (defaultDurationSeconds_ == 0) revert InvalidDuration();

        defaultDurationSeconds = defaultDurationSeconds_;

        emit DurationUpdated(defaultDurationSeconds_);
    }

    function withdraw(address payable to) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();

        uint256 amount = address(this).balance;
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit TreasuryWithdrawn(to, amount);
    }

    function getPass(uint256 tokenId) external view returns (Pass memory) {
        ownerOf(tokenId);
        return _passes[tokenId];
    }

    function passOf(address member)
        external
        view
        returns (uint256 tokenId, bool active, uint64 expiresAt, string memory handle)
    {
        uint256 maxTokenId = nextTokenId;
        uint64 nowTs = uint64(block.timestamp);

        for (uint256 i = 1; i < maxTokenId; i += 1) {
            if (_ownerOf(i) == member) {
                Pass memory passData = _passes[i];
                return (i, passData.expiresAt >= nowTs, passData.expiresAt, passData.handle);
            }
        }

        return (0, false, 0, "");
    }

    function isActive(uint256 tokenId) external view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) return false;
        return _passes[tokenId].expiresAt >= uint64(block.timestamp);
    }
}
