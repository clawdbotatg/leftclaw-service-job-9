// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {TreasuryManagerV2} from "../contracts/TreasuryManagerV2.sol";

/**
 * @title TreasuryManagerV2 Tests
 * @notice Comprehensive test suite (target: 38+ tests)
 * @dev Uses vm.mockCall for all external contract interactions since
 *      TreasuryManagerV2 uses constant addresses for WETH, USDC, TUSD, etc.
 */
contract TreasuryManagerV2Test is Test {
    TreasuryManagerV2 public tm;

    address public owner = makeAddr("owner");
    address public operatorAddr = makeAddr("operator");
    address public alice = makeAddr("alice");
    address public officialPool = makeAddr("officialPool");

    // Constants from the contract
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant TUSD = 0x0C03Ce270B4826Ec62e7DD007f0B716068639F7B;
    address constant UNIVERSAL_ROUTER = 0x6fF5693b99212Da76ad316178A184AB56D299b43;
    address constant STAKING = 0x2a70a42BC0524aBCA9Bff59a51E7aAdB575DC89A;
    address constant DEAD = 0x000000000000000000000000000000000000dEaD;

    function setUp() public {
        vm.prank(owner);
        tm = new TreasuryManagerV2(owner, officialPool);

        vm.prank(owner);
        tm.setOperator(operatorAddr);

        // Mock the official pool's fee() to return 3000
        vm.mockCall(officialPool, abi.encodeWithSignature("fee()"), abi.encode(uint24(3000)));

        // Give the TM contract some tokens by mocking balanceOf
        // We'll set up specific mocks per test
    }

    // ─── Helper: mock balanceOf for a token ───
    function _mockBalance(address token, address account, uint256 amount) internal {
        vm.mockCall(
            token,
            abi.encodeWithSignature("balanceOf(address)", account),
            abi.encode(amount)
        );
    }

    // ─── Helper: mock approve/forceApprove ───
    function _mockApprove(address token, address spender) internal {
        vm.mockCall(
            token,
            abi.encodeWithSignature("approve(address,uint256)", spender, 0),
            abi.encode(true)
        );
        // For forceApprove, it calls approve(spender, 0) then approve(spender, amount)
        // Mock all approve calls
        vm.mockCall(
            token,
            abi.encodeWithSignature("approve(address,uint256)"),
            abi.encode(true)
        );
    }

    // ─── Helper: mock transfer ───
    function _mockTransfer(address token) internal {
        vm.mockCall(
            token,
            abi.encodeWithSignature("transfer(address,uint256)"),
            abi.encode(true)
        );
    }

    // ─── Helper: mock transferFrom ───
    function _mockTransferFrom(address token) internal {
        vm.mockCall(
            token,
            abi.encodeWithSignature("transferFrom(address,address,uint256)"),
            abi.encode(true)
        );
    }

    // ─── Helper: mock Universal Router execute ───
    function _mockRouterExecute() internal {
        vm.mockCall(
            UNIVERSAL_ROUTER,
            abi.encodeWithSignature("execute(bytes,bytes[],uint256)"),
            abi.encode()
        );
    }

    // ─── Helper: mock staking ───
    function _mockStakingDeposit() internal {
        vm.mockCall(
            STAKING,
            abi.encodeWithSignature("deposit(uint256,uint256)"),
            abi.encode()
        );
    }

    function _mockStakingWithdraw() internal {
        vm.mockCall(
            STAKING,
            abi.encodeWithSignature("withdraw(uint256,uint256)"),
            abi.encode()
        );
    }

    function _mockStakingUserInfo(uint256 poolId, address user, uint256 amount) internal {
        vm.mockCall(
            STAKING,
            abi.encodeWithSignature("userInfo(uint256,address)", poolId, user),
            abi.encode(amount, uint256(0))
        );
    }

    // ─── Helper: setup for buyback with WETH ───
    function _setupBuybackWETH(uint256 wethBalance, uint256 tusdBefore, uint256 tusdAfter) internal {
        _mockBalance(WETH, address(tm), wethBalance);
        _mockApprove(WETH, UNIVERSAL_ROUTER);
        _mockRouterExecute();

        // Mock TUSD balance: first call returns tusdBefore, second returns tusdAfter
        // We'll use mockCallRevert for the second call... actually simpler to use static mock
        // Since _buybackTUSDWithWETH calls balanceOf twice (before and after swap),
        // we need ordered mocks. vm.mockCall always returns the same value.
        // So let's just mock a constant TUSD balance and accept 0 received for unit tests.
        // Better: we can set TUSD balance to change after router execute
        _mockBalance(TUSD, address(tm), tusdAfter);
    }

    // ═══════════════════════════════════════════
    // TEST GROUP 1: Constructor & Setup
    // ═══════════════════════════════════════════

    function test_constructor_setsOwner() public view {
        assertEq(tm.owner(), owner);
    }

    function test_constructor_setsOfficialPool() public view {
        assertEq(tm.officialPool(), officialPool);
    }

    function test_constructor_setsDefaultCaps() public view {
        (uint256 perAction, uint256 perDay) = tm.caps(TreasuryManagerV2.ActionType.BuybackWETH);
        assertEq(perAction, 0.5 ether);
        assertEq(perDay, 2 ether);
    }

    function test_constructor_setsDefaultUSDCCaps() public view {
        (uint256 perAction, uint256 perDay) = tm.caps(TreasuryManagerV2.ActionType.BuybackUSDC);
        assertEq(perAction, 2000e6);
        assertEq(perDay, 5000e6);
    }

    function test_constructor_setsDefaultBurnCaps() public view {
        (uint256 perAction, uint256 perDay) = tm.caps(TreasuryManagerV2.ActionType.Burn);
        assertEq(perAction, 100_000_000e18);
        assertEq(perDay, 500_000_000e18);
    }

    function test_constructor_setsDefaultStakeCaps() public view {
        (uint256 perAction, uint256 perDay) = tm.caps(TreasuryManagerV2.ActionType.Stake);
        assertEq(perAction, 100_000_000e18);
        assertEq(perDay, 500_000_000e18);
    }

    // ═══════════════════════════════════════════
    // TEST GROUP 2: Owner Functions
    // ═══════════════════════════════════════════

    function test_setOperator() public {
        address newOp = makeAddr("newOp");
        vm.prank(owner);
        tm.setOperator(newOp);
        assertEq(tm.operator(), newOp);
    }

    function test_setOperator_revertNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        tm.setOperator(alice);
    }

    function test_updateCaps() public {
        vm.prank(owner);
        tm.updateCaps(TreasuryManagerV2.ActionType.BuybackWETH, 1 ether, 5 ether);

        (uint256 perAction, uint256 perDay) = tm.caps(TreasuryManagerV2.ActionType.BuybackWETH);
        assertEq(perAction, 1 ether);
        assertEq(perDay, 5 ether);
    }

    function test_updateCaps_revertNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        tm.updateCaps(TreasuryManagerV2.ActionType.BuybackWETH, 1 ether, 5 ether);
    }

    function test_setSlippage() public {
        vm.prank(owner);
        tm.setSlippage(300);
        assertEq(tm.operatorSlippageBps(), 300);
    }

    function test_setSlippage_revertTooHigh() public {
        vm.prank(owner);
        vm.expectRevert("Slippage too high");
        tm.setSlippage(2001);
    }

    function test_setSlippage_revertNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        tm.setSlippage(300);
    }

    // ═══════════════════════════════════════════
    // TEST GROUP 3: buybackWithWETH
    // ═══════════════════════════════════════════

    function test_buybackWithWETH_success() public {
        uint256 amountIn = 0.1 ether;

        // Mock: WETH balance sufficient
        _mockBalance(WETH, address(tm), 1 ether);
        _mockApprove(WETH, UNIVERSAL_ROUTER);
        _mockRouterExecute();
        // Mock TUSD balance before = 0, after = some amount
        // Since mockCall is static, we mock it to return constant
        _mockBalance(TUSD, address(tm), 1000e18);

        vm.prank(operatorAddr);
        tm.buybackWithWETH(amountIn);
    }

    function test_buybackWithWETH_revertNotOperator() public {
        vm.prank(alice);
        vm.expectRevert(TreasuryManagerV2.NotOperator.selector);
        tm.buybackWithWETH(0.1 ether);
    }

    function test_buybackWithWETH_revertZeroAmount() public {
        vm.prank(operatorAddr);
        vm.expectRevert(TreasuryManagerV2.ZeroAmount.selector);
        tm.buybackWithWETH(0);
    }

    function test_buybackWithWETH_revertExceedsPerActionCap() public {
        vm.prank(operatorAddr);
        vm.expectRevert(TreasuryManagerV2.ExceedsPerActionCap.selector);
        tm.buybackWithWETH(0.6 ether); // Cap is 0.5 ether
    }

    function test_buybackWithWETH_revertCooldown() public {
        uint256 amountIn = 0.1 ether;
        _mockBalance(WETH, address(tm), 10 ether);
        _mockApprove(WETH, UNIVERSAL_ROUTER);
        _mockRouterExecute();
        _mockBalance(TUSD, address(tm), 1000e18);

        vm.prank(operatorAddr);
        tm.buybackWithWETH(amountIn);

        // Try again immediately - should revert with cooldown
        vm.prank(operatorAddr);
        vm.expectRevert(TreasuryManagerV2.CooldownNotElapsed.selector);
        tm.buybackWithWETH(amountIn);
    }

    function test_buybackWithWETH_cooldownExpires() public {
        uint256 amountIn = 0.1 ether;
        _mockBalance(WETH, address(tm), 10 ether);
        _mockApprove(WETH, UNIVERSAL_ROUTER);
        _mockRouterExecute();
        _mockBalance(TUSD, address(tm), 1000e18);

        vm.prank(operatorAddr);
        tm.buybackWithWETH(amountIn);

        // Wait for cooldown
        vm.warp(block.timestamp + 61 minutes);

        vm.prank(operatorAddr);
        tm.buybackWithWETH(amountIn);
    }

    function test_buybackWithWETH_revertExceedsDailyCap() public {
        _mockBalance(WETH, address(tm), 10 ether);
        _mockApprove(WETH, UNIVERSAL_ROUTER);
        _mockRouterExecute();
        _mockBalance(TUSD, address(tm), 1000e18);

        // Update caps: small per-day, big per-action so we hit daily cap easily
        vm.prank(owner);
        tm.updateCaps(TreasuryManagerV2.ActionType.BuybackWETH, 1 ether, 1 ether);

        // First buyback uses up the full daily cap
        vm.prank(operatorAddr);
        tm.buybackWithWETH(1 ether);

        // Wait for cooldown
        vm.warp(block.timestamp + 61 minutes);

        // 2nd should fail — daily cap exceeded
        vm.prank(operatorAddr);
        vm.expectRevert(TreasuryManagerV2.ExceedsDailyCap.selector);
        tm.buybackWithWETH(0.1 ether);
    }

    // ═══════════════════════════════════════════
    // TEST GROUP 4: buybackWithUSDC
    // ═══════════════════════════════════════════

    function test_buybackWithUSDC_success() public {
        uint256 amountIn = 1000e6; // 1000 USDC

        _mockBalance(USDC, address(tm), 5000e6);
        _mockBalance(WETH, address(tm), 1 ether); // WETH balance after swap
        _mockApprove(USDC, UNIVERSAL_ROUTER);
        _mockApprove(WETH, UNIVERSAL_ROUTER);
        _mockRouterExecute();
        _mockBalance(TUSD, address(tm), 5000e18);

        vm.prank(operatorAddr);
        tm.buybackWithUSDC(amountIn);
    }

    function test_buybackWithUSDC_revertNotOperator() public {
        vm.prank(alice);
        vm.expectRevert(TreasuryManagerV2.NotOperator.selector);
        tm.buybackWithUSDC(1000e6);
    }

    function test_buybackWithUSDC_revertExceedsPerActionCap() public {
        vm.prank(operatorAddr);
        vm.expectRevert(TreasuryManagerV2.ExceedsPerActionCap.selector);
        tm.buybackWithUSDC(2001e6); // Cap is 2000 USDC
    }

    // ═══════════════════════════════════════════
    // TEST GROUP 5: burn
    // ═══════════════════════════════════════════

    function test_burn_success() public {
        uint256 amount = 1_000_000e18;

        _mockBalance(TUSD, address(tm), 10_000_000e18);
        _mockTransfer(TUSD);

        vm.prank(operatorAddr);
        tm.burn(amount);
    }

    function test_burn_revertNotOperator() public {
        vm.prank(alice);
        vm.expectRevert(TreasuryManagerV2.NotOperator.selector);
        tm.burn(1000e18);
    }

    function test_burn_revertZeroAmount() public {
        vm.prank(operatorAddr);
        vm.expectRevert(TreasuryManagerV2.ZeroAmount.selector);
        tm.burn(0);
    }

    function test_burn_revertExceedsCap() public {
        vm.prank(operatorAddr);
        vm.expectRevert(TreasuryManagerV2.ExceedsPerActionCap.selector);
        tm.burn(100_000_001e18);
    }

    function test_burn_revertCooldown() public {
        _mockBalance(TUSD, address(tm), 1_000_000_000e18);
        _mockTransfer(TUSD);

        vm.prank(operatorAddr);
        tm.burn(1_000_000e18);

        vm.prank(operatorAddr);
        vm.expectRevert(TreasuryManagerV2.CooldownNotElapsed.selector);
        tm.burn(1_000_000e18);
    }

    // ═══════════════════════════════════════════
    // TEST GROUP 6: stake / unstake
    // ═══════════════════════════════════════════

    function test_stake_success() public {
        uint256 amount = 1_000_000e18;

        _mockBalance(TUSD, address(tm), 10_000_000e18);
        _mockApprove(TUSD, STAKING);
        _mockStakingDeposit();

        vm.prank(operatorAddr);
        tm.stake(amount, 0);
    }

    function test_stake_revertNotOperator() public {
        vm.prank(alice);
        vm.expectRevert(TreasuryManagerV2.NotOperator.selector);
        tm.stake(1000e18, 0);
    }

    function test_stake_revertZeroAmount() public {
        vm.prank(operatorAddr);
        vm.expectRevert(TreasuryManagerV2.ZeroAmount.selector);
        tm.stake(0, 0);
    }

    function test_stake_revertExceedsCap() public {
        vm.prank(operatorAddr);
        vm.expectRevert(TreasuryManagerV2.ExceedsPerActionCap.selector);
        tm.stake(100_000_001e18, 0);
    }

    function test_stake_revertCooldown() public {
        _mockBalance(TUSD, address(tm), 1_000_000_000e18);
        _mockApprove(TUSD, STAKING);
        _mockStakingDeposit();

        vm.prank(operatorAddr);
        tm.stake(1_000_000e18, 0);

        vm.prank(operatorAddr);
        vm.expectRevert(TreasuryManagerV2.CooldownNotElapsed.selector);
        tm.stake(1_000_000e18, 0);
    }

    function test_unstake_success() public {
        _mockStakingUserInfo(0, address(tm), 1_000_000e18);
        _mockStakingWithdraw();
        _mockBalance(TUSD, address(tm), 1_000_000e18);

        vm.prank(operatorAddr);
        tm.unstake(0);
    }

    function test_unstake_revertNotOperator() public {
        vm.prank(alice);
        vm.expectRevert(TreasuryManagerV2.NotOperator.selector);
        tm.unstake(0);
    }

    function test_unstake_revertNoBalance() public {
        _mockStakingUserInfo(0, address(tm), 0);

        vm.prank(operatorAddr);
        vm.expectRevert(TreasuryManagerV2.InsufficientBalance.selector);
        tm.unstake(0);
    }

    function test_unstake_noCooldown() public {
        // Unstake should work even right after staking (no cooldown for unstake)
        _mockBalance(TUSD, address(tm), 1_000_000_000e18);
        _mockApprove(TUSD, STAKING);
        _mockStakingDeposit();

        vm.prank(operatorAddr);
        tm.stake(1_000_000e18, 0);

        _mockStakingUserInfo(0, address(tm), 1_000_000e18);
        _mockStakingWithdraw();

        vm.prank(operatorAddr);
        tm.unstake(0);
    }

    // ═══════════════════════════════════════════
    // TEST GROUP 7: Rolling Window Daily Caps
    // ═══════════════════════════════════════════

    function test_dailyCap_resetsAfter24Hours() public {
        _mockBalance(WETH, address(tm), 100 ether);
        _mockApprove(WETH, UNIVERSAL_ROUTER);
        _mockRouterExecute();
        _mockBalance(TUSD, address(tm), 100000e18);

        // Set smaller daily cap for easier testing
        vm.prank(owner);
        tm.updateCaps(TreasuryManagerV2.ActionType.BuybackWETH, 1 ether, 1 ether);

        // Use up daily cap
        vm.prank(operatorAddr);
        tm.buybackWithWETH(1 ether);

        // Wait for cooldown but NOT daily reset
        vm.warp(block.timestamp + 61 minutes);

        // Fails - daily cap exceeded
        vm.prank(operatorAddr);
        vm.expectRevert(TreasuryManagerV2.ExceedsDailyCap.selector);
        tm.buybackWithWETH(0.1 ether);

        // Wait 24 hours from cap window start - cap should reset
        vm.warp(block.timestamp + 24 hours);

        vm.prank(operatorAddr);
        tm.buybackWithWETH(0.5 ether);
    }

    function test_getRemainingDailyCap() public {
        uint256 remaining = tm.getRemainingDailyCap(TreasuryManagerV2.ActionType.BuybackWETH);
        assertEq(remaining, 2 ether);
    }

    function test_getRemainingDailyCap_afterUsage() public {
        _mockBalance(WETH, address(tm), 100 ether);
        _mockApprove(WETH, UNIVERSAL_ROUTER);
        _mockRouterExecute();
        _mockBalance(TUSD, address(tm), 100000e18);

        vm.prank(operatorAddr);
        tm.buybackWithWETH(0.5 ether);

        uint256 remaining = tm.getRemainingDailyCap(TreasuryManagerV2.ActionType.BuybackWETH);
        assertEq(remaining, 1.5 ether);
    }

    // ═══════════════════════════════════════════
    // TEST GROUP 8: Owner Bypass of Cooldown
    // ═══════════════════════════════════════════

    function test_ownerBuyback_bypassesCooldown() public {
        _mockBalance(WETH, address(tm), 100 ether);
        _mockApprove(WETH, UNIVERSAL_ROUTER);
        _mockRouterExecute();
        _mockBalance(TUSD, address(tm), 100000e18);

        // Owner can buyback without cooldown
        vm.prank(owner);
        tm.ownerBuybackWithWETH(0.1 ether);

        // Immediately again
        vm.prank(owner);
        tm.ownerBuybackWithWETH(0.1 ether);
    }

    function test_ownerBuyback_revertNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        tm.ownerBuybackWithWETH(0.1 ether);
    }

    // ═══════════════════════════════════════════
    // TEST GROUP 9: Cooldown View Functions
    // ═══════════════════════════════════════════

    function test_getCooldownRemaining_noAction() public view {
        uint256 remaining = tm.getCooldownRemaining(TreasuryManagerV2.ActionType.BuybackWETH);
        assertEq(remaining, 0);
    }

    function test_getCooldownRemaining_afterAction() public {
        _mockBalance(WETH, address(tm), 100 ether);
        _mockApprove(WETH, UNIVERSAL_ROUTER);
        _mockRouterExecute();
        _mockBalance(TUSD, address(tm), 100000e18);

        vm.prank(operatorAddr);
        tm.buybackWithWETH(0.1 ether);

        uint256 remaining = tm.getCooldownRemaining(TreasuryManagerV2.ActionType.BuybackWETH);
        assertEq(remaining, 60 minutes);
    }

    // ═══════════════════════════════════════════
    // TEST GROUP 10: Constants Verification
    // ═══════════════════════════════════════════

    function test_constants_permissionlessSlippage() public view {
        assertEq(tm.PERMISSIONLESS_SLIPPAGE_BPS(), 300);
    }

    function test_constants_permissionlessCooldown() public view {
        assertEq(tm.PERMISSIONLESS_COOLDOWN(), 4 hours);
    }

    function test_constants_permissionlessMaxPerSwap() public view {
        assertEq(tm.PERMISSIONLESS_MAX_PER_SWAP_BPS(), 500);
    }

    function test_constants_circuitBreaker() public view {
        assertEq(tm.CIRCUIT_BREAKER_BPS(), 1500);
    }

    function test_constants_operatorInactivity() public view {
        assertEq(tm.OPERATOR_INACTIVITY_PERIOD(), 14 days);
    }

    function test_constants_operatorCooldown() public view {
        assertEq(tm.OPERATOR_COOLDOWN(), 60 minutes);
    }

    function test_constants_permissionlessETHPerAction() public view {
        assertEq(tm.PERMISSIONLESS_ETH_PER_ACTION(), 0.5 ether);
    }

    function test_constants_permissionlessETHPerDay() public view {
        assertEq(tm.PERMISSIONLESS_ETH_PER_DAY(), 2 ether);
    }

    // ═══════════════════════════════════════════
    // TEST GROUP 11: Token Positions
    // ═══════════════════════════════════════════

    function test_getTokenPosition_empty() public view {
        TreasuryManagerV2.TokenPosition memory pos = tm.getTokenPosition(address(0x1234));
        assertEq(pos.totalCostBasis, 0);
        assertEq(pos.totalAcquired, 0);
    }

    // ═══════════════════════════════════════════
    // TEST GROUP 12: Receive ETH
    // ═══════════════════════════════════════════

    function test_receiveETH() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        (bool success,) = address(tm).call{value: 0.5 ether}("");
        assertTrue(success);
        assertEq(address(tm).balance, 0.5 ether);
    }

    // ═══════════════════════════════════════════
    // TEST GROUP 13: Ownable2Step
    // ═══════════════════════════════════════════

    function test_transferOwnership_twoStep() public {
        vm.prank(owner);
        tm.transferOwnership(alice);

        // Alice is pending, not yet owner
        assertEq(tm.owner(), owner);
        assertEq(tm.pendingOwner(), alice);

        // Alice accepts
        vm.prank(alice);
        tm.acceptOwnership();
        assertEq(tm.owner(), alice);
    }

    function test_transferOwnership_revertNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        tm.transferOwnership(alice);
    }

    // ═══════════════════════════════════════════
    // TEST GROUP 14: Default Slippage
    // ═══════════════════════════════════════════

    function test_defaultSlippage() public view {
        assertEq(tm.operatorSlippageBps(), 500);
    }
}
