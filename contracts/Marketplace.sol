// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CollectibleCollection} from "./CollectibleCollection.sol";

/// @title Marketplace
/// @notice Fixed-price ETH listings for FLAT MARKET ERC-1155 collectibles.
contract Marketplace is ReentrancyGuard, Ownable {
    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 amount;
        uint256 pricePerUnit;
        bool active;
    }

    CollectibleCollection public immutable collection;
    address public treasury;
    uint16 public feeBps;
    uint16 public constant MAX_FEE_BPS = 1000;
    uint256 public nextListingId = 1;

    mapping(uint256 listingId => Listing) private _listings;

    error NotCollectionToken();
    error NotTokenOwner();
    error NotApproved();
    error NotSeller();
    error ListingInactive();
    error InvalidAmount();
    error InvalidPrice();
    error InvalidFee();
    error InsufficientPayment();
    error NotTransferable();
    error ZeroAddress();
    error PaymentFailed();
    error ListingNotFound();

    event Listed(
        uint256 indexed listingId, address indexed seller, uint256 indexed tokenId, uint256 amount, uint256 pricePerUnit
    );
    event ListingCancelled(uint256 indexed listingId);
    event PriceUpdated(uint256 indexed listingId, uint256 newPricePerUnit);
    event Purchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 tokenId,
        uint256 amount,
        uint256 totalPaid,
        uint256 fee
    );
    event FeeUpdated(uint16 feeBps);
    event TreasuryUpdated(address treasury);

    constructor(address collection_, address treasury_, uint16 feeBps_) Ownable(msg.sender) {
        if (collection_ == address(0) || treasury_ == address(0)) revert ZeroAddress();
        if (feeBps_ > MAX_FEE_BPS) revert InvalidFee();
        collection = CollectibleCollection(collection_);
        treasury = treasury_;
        feeBps = feeBps_;
    }

    /// @notice List owned editions at a fixed ETH price per unit. Tokens remain in the seller wallet until purchase.
    function list(uint256 tokenId, uint256 amount, uint256 pricePerUnit) external returns (uint256 listingId) {
        if (amount == 0) revert InvalidAmount();
        if (pricePerUnit == 0) revert InvalidPrice();

        CollectibleCollection.Edition memory edition = collection.getEdition(tokenId);
        if (!edition.transferable) revert NotTransferable();
        if (collection.balanceOf(msg.sender, tokenId) < amount) revert NotTokenOwner();
        if (!collection.isApprovedForAll(msg.sender, address(this))) revert NotApproved();

        listingId = nextListingId++;
        _listings[listingId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            amount: amount,
            pricePerUnit: pricePerUnit,
            active: true
        });

        emit Listed(listingId, msg.sender, tokenId, amount, pricePerUnit);
    }

    function cancel(uint256 listingId) external {
        Listing storage listing = _requireListing(listingId);
        if (listing.seller != msg.sender) revert NotSeller();
        listing.active = false;
        emit ListingCancelled(listingId);
    }

    function updatePrice(uint256 listingId, uint256 newPricePerUnit) external {
        if (newPricePerUnit == 0) revert InvalidPrice();
        Listing storage listing = _requireListing(listingId);
        if (listing.seller != msg.sender) revert NotSeller();
        listing.pricePerUnit = newPricePerUnit;
        emit PriceUpdated(listingId, newPricePerUnit);
    }

    /// @notice Buy `amount` units from an active listing. Pays in native ETH.
    function buy(uint256 listingId, uint256 amount) external payable nonReentrant {
        if (amount == 0) revert InvalidAmount();
        Listing storage listing = _requireListing(listingId);
        if (amount > listing.amount) revert InvalidAmount();

        uint256 total = listing.pricePerUnit * amount;
        if (msg.value < total) revert InsufficientPayment();

        address seller = listing.seller;
        uint256 tokenId = listing.tokenId;

        if (collection.balanceOf(seller, tokenId) < amount) revert NotTokenOwner();
        if (!collection.isApprovedForAll(seller, address(this))) revert NotApproved();

        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }

        uint256 fee = (total * feeBps) / 10_000;
        uint256 sellerProceeds = total - fee;

        collection.safeTransferFrom(seller, msg.sender, tokenId, amount, "");

        _pay(seller, sellerProceeds);
        if (fee > 0) {
            _pay(treasury, fee);
        }

        uint256 refund = msg.value - total;
        if (refund > 0) {
            _pay(msg.sender, refund);
        }

        emit Purchased(listingId, msg.sender, seller, tokenId, amount, total, fee);
    }

    function getListing(uint256 listingId) external view returns (Listing memory) {
        Listing memory listing = _listings[listingId];
        if (listing.seller == address(0)) revert ListingNotFound();
        return listing;
    }

    function setFeeBps(uint16 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert InvalidFee();
        feeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    function _requireListing(uint256 listingId) private view returns (Listing storage listing) {
        listing = _listings[listingId];
        if (listing.seller == address(0)) revert ListingNotFound();
        if (!listing.active) revert ListingInactive();
    }

    function _pay(address to, uint256 amount) private {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert PaymentFailed();
    }
}
