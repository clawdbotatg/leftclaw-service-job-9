//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import { DeployYourContract } from "./DeployYourContract.s.sol";
import { DeployTreasuryManagerV2 } from "./DeployTreasuryManagerV2.s.sol";

/**
 * @notice Main deployment script for all contracts
 * @dev Run this when you want to deploy multiple contracts at once
 *
 * Example: yarn deploy # runs this script(without`--file` flag)
 */
contract DeployScript is ScaffoldETHDeploy {
  function run() external {
    // Deploy TreasuryManagerV2
    DeployTreasuryManagerV2 deployTM = new DeployTreasuryManagerV2();
    deployTM.run();

    // Deploy YourContract (SE2 default)
    DeployYourContract deployYourContract = new DeployYourContract();
    deployYourContract.run();
  }
}