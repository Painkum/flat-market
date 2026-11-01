// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {CollectibleCollection} from "../contracts/CollectibleCollection.sol";
import {Marketplace} from "../contracts/Marketplace.sol";
import {RedemptionManager} from "../contracts/RedemptionManager.sol";

/// @notice Deploys FLAT MARKET contracts to the configured RPC (Robinhood Chain testnet by default).
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address treasury = vm.envOr("TREASURY", deployer);
        uint16 feeBps = uint16(vm.envOr("FEE_BPS", uint256(250)));

        vm.startBroadcast(deployerKey);
        CollectibleCollection collection = new CollectibleCollection();
        Marketplace marketplace = new Marketplace(address(collection), treasury, feeBps);
        RedemptionManager redemption = new RedemptionManager(address(collection));
        vm.stopBroadcast();

        console2.log("CollectibleCollection", address(collection));
        console2.log("Marketplace", address(marketplace));
        console2.log("RedemptionManager", address(redemption));
        console2.log("Treasury", treasury);
        console2.log("Fee bps", feeBps);
    }
}
