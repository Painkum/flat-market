// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CollectibleCollection} from "../contracts/CollectibleCollection.sol";
import {RedemptionManager} from "../contracts/RedemptionManager.sol";

contract RedemptionManagerTest is Test {
    CollectibleCollection internal collection;
    RedemptionManager internal redemption;
    address internal creator = makeAddr("creator");
    address internal owner_ = makeAddr("owner");
    address internal stranger = makeAddr("stranger");
    address internal operator = makeAddr("operator");
    uint256 internal tokenId;

    function setUp() public {
        collection = new CollectibleCollection();
        redemption = new RedemptionManager(address(collection));

        vm.startPrank(creator);
        collection.createCollection("Vouchers", "desc", "ipfs://c", 5, "");
        tokenId = collection.createEdition(
            1,
            "Coffee Voucher",
            "ipfs://t",
            5,
            true,
            CollectibleCollection.UtilityType.REDEEMABLE,
            "One drink",
            0
        );
        collection.mint(owner_, tokenId, 2);
        vm.stopPrank();
    }

    function test_redeem_success() public {
        vm.prank(owner_);
        redemption.redeem(tokenId, 1);
        assertEq(redemption.redeemed(owner_, tokenId), 1);

        RedemptionManager.AccessResult memory access = redemption.verifyCollectibleAccess(owner_, tokenId);
        assertTrue(access.ownsToken);
        assertEq(access.unredeemedAmount, 1);
        assertTrue(access.eligible);
    }

    function test_redeem_duplicateRejected() public {
        vm.startPrank(owner_);
        redemption.redeem(tokenId, 2);
        vm.expectRevert(RedemptionManager.InsufficientUnredeemed.selector);
        redemption.redeem(tokenId, 1);
        vm.stopPrank();
    }

    function test_redeem_revertsForNonOwner() public {
        vm.prank(stranger);
        vm.expectRevert(RedemptionManager.InsufficientUnredeemed.selector);
        redemption.redeem(tokenId, 1);
    }

    function test_redeem_revertsWhenExpired() public {
        vm.startPrank(creator);
        uint256 expiredId = collection.createEdition(
            1,
            "Expired",
            "ipfs://e",
            1,
            true,
            CollectibleCollection.UtilityType.REDEEMABLE,
            "gone",
            uint64(block.timestamp + 1)
        );
        collection.mint(owner_, expiredId, 1);
        vm.stopPrank();

        vm.warp(block.timestamp + 2);
        vm.prank(owner_);
        vm.expectRevert(RedemptionManager.Expired.selector);
        redemption.redeem(expiredId, 1);
    }

    function test_redeem_revertsForAccessUtility() public {
        vm.startPrank(creator);
        uint256 accessId = collection.createEdition(
            1, "Access", "ipfs://a", 1, false, CollectibleCollection.UtilityType.ACCESS, "gate", 0
        );
        collection.mint(owner_, accessId, 1);
        vm.stopPrank();

        vm.prank(owner_);
        vm.expectRevert(RedemptionManager.NotRedeemable.selector);
        redemption.redeem(accessId, 1);
    }

    function test_operatorRedeem_success() public {
        vm.prank(creator);
        redemption.setRedemptionOperator(tokenId, operator);
        vm.prank(operator);
        redemption.operatorRedeem(owner_, tokenId, 1);
        assertEq(redemption.redeemed(owner_, tokenId), 1);
    }

    function test_operatorRedeem_revertsWhenUnauthorized() public {
        vm.prank(stranger);
        vm.expectRevert(RedemptionManager.NotAuthorized.selector);
        redemption.operatorRedeem(owner_, tokenId, 1);
    }

    function test_nonTransferable_stillRedeemableByOwner() public {
        vm.startPrank(creator);
        uint256 soulbound = collection.createEdition(
            1, "Bound", "ipfs://b", 1, false, CollectibleCollection.UtilityType.REDEEMABLE, "once", 0
        );
        collection.mint(owner_, soulbound, 1);
        vm.stopPrank();

        vm.prank(owner_);
        vm.expectRevert(CollectibleCollection.NotTransferable.selector);
        collection.safeTransferFrom(owner_, stranger, soulbound, 1, "");

        vm.prank(owner_);
        redemption.redeem(soulbound, 1);
        assertEq(redemption.redeemed(owner_, soulbound), 1);
    }

    function test_verifyAccess_expiredTimeLimited() public {
        vm.startPrank(creator);
        uint256 timed = collection.createEdition(
            1,
            "Month",
            "ipfs://m",
            1,
            false,
            CollectibleCollection.UtilityType.TIME_LIMITED,
            "30 days",
            uint64(block.timestamp + 10)
        );
        collection.mint(owner_, timed, 1);
        vm.stopPrank();

        RedemptionManager.AccessResult memory beforeExpiry = redemption.verifyCollectibleAccess(owner_, timed);
        assertTrue(beforeExpiry.eligible);

        vm.warp(block.timestamp + 11);
        RedemptionManager.AccessResult memory afterExpiry = redemption.verifyCollectibleAccess(owner_, timed);
        assertTrue(afterExpiry.expired);
        assertFalse(afterExpiry.eligible);
    }
}
