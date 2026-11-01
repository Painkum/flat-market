// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CollectibleCollection} from "./CollectibleCollection.sol";

/// @title RedemptionManager
/// @notice Tracks one-time redemption and access eligibility for FLAT MARKET collectibles.
/// @dev On-chain state proves ownership and redemption. It cannot independently verify off-chain fulfillment.
contract RedemptionManager is Ownable {
    struct AccessResult {
        bool eligible;
        bool ownsToken;
        bool expired;
        uint256 balance;
        uint256 redeemedAmount;
        uint256 unredeemedAmount;
        CollectibleCollection.UtilityType utilityType;
        uint64 expiry;
    }

    CollectibleCollection public immutable collection;

    /// @dev redeemed[owner][tokenId] = number of units this owner has redeemed.
    mapping(address owner => mapping(uint256 tokenId => uint256 amount)) public redeemed;
    mapping(uint256 tokenId => address operator) public redemptionOperator;

    error NotEditionCreator();
    error NotAuthorized();
    error NotRedeemable();
    error Expired();
    error InsufficientUnredeemed();
    error ZeroAmount();
    error ZeroAddress();

    event UtilityOperatorSet(uint256 indexed tokenId, address indexed operator);
    event Redeemed(address indexed owner, uint256 indexed tokenId, uint256 amount, address indexed actor);

    constructor(address collection_) Ownable(msg.sender) {
        if (collection_ == address(0)) revert ZeroAddress();
        collection = CollectibleCollection(collection_);
    }

    /// @notice Edition creator assigns an operator who may mark real-world fulfillment.
    function setRedemptionOperator(uint256 tokenId, address operator) external {
        CollectibleCollection.Edition memory edition = collection.getEdition(tokenId);
        if (edition.creator != msg.sender) revert NotEditionCreator();
        redemptionOperator[tokenId] = operator;
        emit UtilityOperatorSet(tokenId, operator);
    }

    /// @notice Owner redeems `amount` units of a REDEEMABLE collectible.
    function redeem(uint256 tokenId, uint256 amount) external {
        _redeem(msg.sender, tokenId, amount, msg.sender);
    }

    /// @notice Authorized operator records fulfillment for a current owner.
    function operatorRedeem(address owner, uint256 tokenId, uint256 amount) external {
        if (owner == address(0)) revert ZeroAddress();
        if (msg.sender != redemptionOperator[tokenId]) revert NotAuthorized();
        _redeem(owner, tokenId, amount, msg.sender);
    }

    /// @notice Off-chain apps can query whether a wallet currently holds an unexpired, unredeemed benefit.
    function verifyCollectibleAccess(address wallet, uint256 tokenId) external view returns (AccessResult memory result) {
        CollectibleCollection.Edition memory edition = collection.getEdition(tokenId);
        uint256 balance = collection.balanceOf(wallet, tokenId);
        uint256 already = redeemed[wallet][tokenId];
        uint256 unredeemed = balance > already ? balance - already : 0;
        bool expired = edition.expiry != 0 && block.timestamp > edition.expiry;

        result.ownsToken = balance > 0;
        result.expired = expired;
        result.balance = balance;
        result.redeemedAmount = already;
        result.unredeemedAmount = unredeemed;
        result.utilityType = edition.utilityType;
        result.expiry = edition.expiry;

        if (expired || balance == 0) {
            result.eligible = false;
            return result;
        }

        if (edition.utilityType == CollectibleCollection.UtilityType.ACCESS) {
            result.eligible = true;
        } else if (edition.utilityType == CollectibleCollection.UtilityType.TIME_LIMITED) {
            result.eligible = true;
        } else if (edition.utilityType == CollectibleCollection.UtilityType.REDEEMABLE) {
            result.eligible = unredeemed > 0;
        } else {
            result.eligible = true;
        }
    }

    function _redeem(address owner, uint256 tokenId, uint256 amount, address actor) private {
        if (amount == 0) revert ZeroAmount();

        CollectibleCollection.Edition memory edition = collection.getEdition(tokenId);
        if (edition.utilityType != CollectibleCollection.UtilityType.REDEEMABLE) revert NotRedeemable();
        if (edition.expiry != 0 && block.timestamp > edition.expiry) revert Expired();

        uint256 balance = collection.balanceOf(owner, tokenId);
        uint256 already = redeemed[owner][tokenId];
        if (already + amount > balance) revert InsufficientUnredeemed();

        redeemed[owner][tokenId] = already + amount;
        emit Redeemed(owner, tokenId, amount, actor);
    }
}
