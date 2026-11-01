// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CollectibleCollection} from "../contracts/CollectibleCollection.sol";

contract CollectibleCollectionTest is Test {
    CollectibleCollection internal collection;
    address internal creator = makeAddr("creator");
    address internal stranger = makeAddr("stranger");
    address internal buyer = makeAddr("buyer");

    function setUp() public {
        collection = new CollectibleCollection();
        vm.prank(creator);
        collection.createCollection("Studio North", "Utility passes", "ipfs://cover", 0, "");
    }

    function _createEdition(bool transferable, CollectibleCollection.UtilityType utility, uint64 expiry)
        internal
        returns (uint256 tokenId)
    {
        vm.prank(creator);
        tokenId = collection.createEdition(
            1, "Member Pass", "ipfs://token", 10, transferable, utility, "Unlocks the studio.", expiry
        );
    }

    function test_createCollection_success() public view {
        CollectibleCollection.Collection memory created = collection.getCollection(1);
        assertEq(created.creator, creator);
        assertEq(created.name, "Studio North");
        assertTrue(created.exists);
    }

    function test_createEdition_and_mint_success() public {
        uint256 tokenId = _createEdition(true, CollectibleCollection.UtilityType.ACCESS, 0);
        vm.prank(creator);
        collection.mint(buyer, tokenId, 3);
        assertEq(collection.balanceOf(buyer, tokenId), 3);
        assertEq(collection.totalSupply(tokenId), 3);
    }

    function test_mint_revertsWhenExceedingMaxSupply() public {
        uint256 tokenId = _createEdition(true, CollectibleCollection.UtilityType.COLLECTIBLE, 0);
        vm.startPrank(creator);
        collection.mint(buyer, tokenId, 10);
        vm.expectRevert(CollectibleCollection.MaxSupplyExceeded.selector);
        collection.mint(buyer, tokenId, 1);
        vm.stopPrank();
    }

    function test_mint_revertsForUnauthorized() public {
        uint256 tokenId = _createEdition(true, CollectibleCollection.UtilityType.COLLECTIBLE, 0);
        vm.prank(stranger);
        vm.expectRevert(CollectibleCollection.NotEditionCreator.selector);
        collection.mint(stranger, tokenId, 1);
    }

    function test_createEdition_revertsForNonCreator() public {
        vm.prank(stranger);
        vm.expectRevert(CollectibleCollection.NotCollectionCreator.selector);
        collection.createEdition(1, "X", "ipfs://x", 1, true, CollectibleCollection.UtilityType.COLLECTIBLE, "", 0);
    }

    function test_transfer_restrictedWhenSoulbound() public {
        uint256 tokenId = _createEdition(false, CollectibleCollection.UtilityType.ACCESS, 0);
        vm.prank(creator);
        collection.mint(buyer, tokenId, 1);

        vm.prank(buyer);
        vm.expectRevert(CollectibleCollection.NotTransferable.selector);
        collection.safeTransferFrom(buyer, stranger, tokenId, 1, "");
    }

    function test_transfer_allowedWhenTransferable() public {
        uint256 tokenId = _createEdition(true, CollectibleCollection.UtilityType.COLLECTIBLE, 0);
        vm.prank(creator);
        collection.mint(buyer, tokenId, 2);

        vm.prank(buyer);
        collection.safeTransferFrom(buyer, stranger, tokenId, 1, "");
        assertEq(collection.balanceOf(stranger, tokenId), 1);
        assertEq(collection.balanceOf(buyer, tokenId), 1);
    }
}
