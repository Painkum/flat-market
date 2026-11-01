// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CollectibleCollection} from "../contracts/CollectibleCollection.sol";
import {Marketplace} from "../contracts/Marketplace.sol";

contract MarketplaceTest is Test {
    CollectibleCollection internal collection;
    Marketplace internal market;
    address internal creator = makeAddr("creator");
    address internal seller = makeAddr("seller");
    address internal buyer = makeAddr("buyer");
    address internal treasury = makeAddr("treasury");
    uint256 internal tokenId;

    function setUp() public {
        collection = new CollectibleCollection();
        market = new Marketplace(address(collection), treasury, 250);

        vm.startPrank(creator);
        collection.createCollection("North", "desc", "ipfs://c", 0, "");
        tokenId = collection.createEdition(
            1, "Pass", "ipfs://t", 20, true, CollectibleCollection.UtilityType.ACCESS, "Access", 0
        );
        collection.mint(seller, tokenId, 5);
        vm.stopPrank();

        vm.prank(seller);
        collection.setApprovalForAll(address(market), true);

        vm.deal(buyer, 100 ether);
    }

    function test_list_and_purchase_success() public {
        vm.prank(seller);
        uint256 listingId = market.list(tokenId, 2, 1 ether);

        uint256 sellerBefore = seller.balance;
        uint256 treasuryBefore = treasury.balance;

        vm.prank(buyer);
        market.buy{value: 2 ether}(listingId, 2);

        assertEq(collection.balanceOf(buyer, tokenId), 2);
        assertEq(collection.balanceOf(seller, tokenId), 3);
        assertEq(seller.balance - sellerBefore, 1.95 ether);
        assertEq(treasury.balance - treasuryBefore, 0.05 ether);

        Marketplace.Listing memory listing = market.getListing(listingId);
        assertFalse(listing.active);
    }

    function test_buy_revertsOnInsufficientPayment() public {
        vm.prank(seller);
        uint256 listingId = market.list(tokenId, 1, 1 ether);

        vm.prank(buyer);
        vm.expectRevert(Marketplace.InsufficientPayment.selector);
        market.buy{value: 0.5 ether}(listingId, 1);
    }

    function test_list_revertsWhenNotOwner() public {
        vm.prank(buyer);
        collection.setApprovalForAll(address(market), true);
        vm.prank(buyer);
        vm.expectRevert(Marketplace.NotTokenOwner.selector);
        market.list(tokenId, 1, 1 ether);
    }

    function test_list_revertsWithoutApproval() public {
        address other = makeAddr("other");
        vm.prank(creator);
        collection.mint(other, tokenId, 1);
        vm.prank(other);
        vm.expectRevert(Marketplace.NotApproved.selector);
        market.list(tokenId, 1, 1 ether);
    }

    function test_cancel_listing() public {
        vm.prank(seller);
        uint256 listingId = market.list(tokenId, 1, 1 ether);
        vm.prank(seller);
        market.cancel(listingId);

        vm.prank(buyer);
        vm.expectRevert(Marketplace.ListingInactive.selector);
        market.buy{value: 1 ether}(listingId, 1);
    }

    function test_duplicatePurchase_revertsAfterSoldOut() public {
        vm.prank(seller);
        uint256 listingId = market.list(tokenId, 1, 1 ether);
        vm.prank(buyer);
        market.buy{value: 1 ether}(listingId, 1);
        vm.prank(buyer);
        vm.expectRevert(Marketplace.ListingInactive.selector);
        market.buy{value: 1 ether}(listingId, 1);
    }

    function test_list_revertsOnZeroPrice() public {
        vm.prank(seller);
        vm.expectRevert(Marketplace.InvalidPrice.selector);
        market.list(tokenId, 1, 0);
    }

    function test_fee_calculation() public {
        vm.prank(seller);
        uint256 listingId = market.list(tokenId, 1, 10 ether);
        vm.prank(buyer);
        market.buy{value: 10 ether}(listingId, 1);
        assertEq(treasury.balance, 0.25 ether);
        assertEq(seller.balance, 9.75 ether);
    }

    function test_partialFill() public {
        vm.prank(seller);
        uint256 listingId = market.list(tokenId, 4, 1 ether);
        vm.prank(buyer);
        market.buy{value: 1 ether}(listingId, 1);
        Marketplace.Listing memory listing = market.getListing(listingId);
        assertTrue(listing.active);
        assertEq(listing.amount, 3);
    }
}
