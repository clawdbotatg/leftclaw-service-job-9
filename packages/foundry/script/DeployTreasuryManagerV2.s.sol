// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./DeployHelpers.s.sol";
import {TreasuryManagerV2} from "../contracts/TreasuryManagerV2.sol";

contract DeployTreasuryManagerV2 is ScaffoldETHDeploy {
    // Client address = owner
    address constant CLIENT = 0x9ba58Eea1Ea9ABDEA25BA83603D54F6D9A01E506;

    // Official TUSD/WETH V3 pool on Base (placeholder - update with real pool address)
    address constant OFFICIAL_POOL = 0x0000000000000000000000000000000000000001;

    function run() external ScaffoldEthDeployerRunner {
        TreasuryManagerV2 tm = new TreasuryManagerV2(CLIENT, OFFICIAL_POOL);

        console.logString(
            string.concat("TreasuryManagerV2 deployed at: ", vm.toString(address(tm)))
        );
    }
}
