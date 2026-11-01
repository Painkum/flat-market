// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title CollectibleCollection
/// @notice Creator-controlled ERC-1155 editions with supply caps, transfer locks, and on-chain utility config.
contract CollectibleCollection is ERC1155, ERC1155Supply, Ownable {
    enum UtilityType {
        ACCESS,
        REDEEMABLE,
        TIME_LIMITED,
        COLLECTIBLE
    }

    struct Collection {
        address creator;
        string name;
        string description;
        string coverURI;
        uint8 category;
        string socialsURI;
        bool exists;
    }

    struct Edition {
        uint256 collectionId;
        address creator;
        string name;
        uint256 maxSupply;
        bool transferable;
        UtilityType utilityType;
        string utilityDescription;
        uint64 expiry;
        string tokenURI;
        bool exists;
    }

    uint256 public nextCollectionId = 1;
    uint256 public nextTokenId = 1;

    mapping(uint256 collectionId => Collection) private _collections;
    mapping(uint256 tokenId => Edition) private _editions;

    error CollectionNotFound();
    error EditionNotFound();
    error NotCollectionCreator();
    error NotEditionCreator();
    error InvalidSupply();
    error InvalidName();
    error MaxSupplyExceeded();
    error NotTransferable();
    error ZeroAddress();

    event CollectionCreated(
        uint256 indexed collectionId,
        address indexed creator,
        string name,
        uint8 category,
        string coverURI
    );
    event EditionCreated(
        uint256 indexed tokenId,
        uint256 indexed collectionId,
        address indexed creator,
        string name,
        uint256 maxSupply,
        bool transferable,
        UtilityType utilityType,
        uint64 expiry,
        string tokenURI
    );
    event CollectibleMinted(uint256 indexed tokenId, address indexed to, uint256 amount, uint256 newSupply);

    constructor() ERC1155("") Ownable(msg.sender) {}

    /// @notice Create a new collection. The caller becomes its creator.
    function createCollection(
        string calldata name,
        string calldata description,
        string calldata coverURI,
        uint8 category,
        string calldata socialsURI
    ) external returns (uint256 collectionId) {
        if (bytes(name).length == 0) revert InvalidName();

        collectionId = nextCollectionId++;
        _collections[collectionId] = Collection({
            creator: msg.sender,
            name: name,
            description: description,
            coverURI: coverURI,
            category: category,
            socialsURI: socialsURI,
            exists: true
        });

        emit CollectionCreated(collectionId, msg.sender, name, category, coverURI);
    }

    /// @notice Create a limited edition under an existing collection. Does not mint.
    function createEdition(
        uint256 collectionId,
        string calldata name,
        string calldata tokenURI_,
        uint256 maxSupply,
        bool transferable,
        UtilityType utilityType,
        string calldata utilityDescription,
        uint64 expiry
    ) external returns (uint256 tokenId) {
        Collection storage collection = _collections[collectionId];
        if (!collection.exists) revert CollectionNotFound();
        if (collection.creator != msg.sender) revert NotCollectionCreator();
        if (bytes(name).length == 0) revert InvalidName();
        if (maxSupply == 0) revert InvalidSupply();

        tokenId = nextTokenId++;
        _editions[tokenId] = Edition({
            collectionId: collectionId,
            creator: msg.sender,
            name: name,
            maxSupply: maxSupply,
            transferable: transferable,
            utilityType: utilityType,
            utilityDescription: utilityDescription,
            expiry: expiry,
            tokenURI: tokenURI_,
            exists: true
        });

        emit EditionCreated(
            tokenId, collectionId, msg.sender, name, maxSupply, transferable, utilityType, expiry, tokenURI_
        );
    }

    /// @notice Mint editions up to the declared maximum supply. Only the edition creator.
    function mint(address to, uint256 tokenId, uint256 amount) external {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidSupply();

        Edition storage edition = _editions[tokenId];
        if (!edition.exists) revert EditionNotFound();
        if (edition.creator != msg.sender) revert NotEditionCreator();
        if (totalSupply(tokenId) + amount > edition.maxSupply) revert MaxSupplyExceeded();

        _mint(to, tokenId, amount, "");
        emit CollectibleMinted(tokenId, to, amount, totalSupply(tokenId));
    }

    function getCollection(uint256 collectionId) external view returns (Collection memory) {
        Collection memory collection = _collections[collectionId];
        if (!collection.exists) revert CollectionNotFound();
        return collection;
    }

    function getEdition(uint256 tokenId) external view returns (Edition memory) {
        Edition memory edition = _editions[tokenId];
        if (!edition.exists) revert EditionNotFound();
        return edition;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        Edition memory edition = _editions[tokenId];
        if (!edition.exists) revert EditionNotFound();
        return edition.tokenURI;
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        if (from != address(0) && to != address(0)) {
            uint256 length = ids.length;
            for (uint256 i; i < length; ++i) {
                if (!_editions[ids[i]].transferable) revert NotTransferable();
            }
        }
        super._update(from, to, ids, values);
    }
}
