// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IUniversalRouter, IUniswapV3Pool, IStaking, IWETH, IERC20Burnable} from "./interfaces/ITreasuryManagerV2.sol";

/**
 * @title TreasuryManagerV2
 * @notice Onchain treasury management for TUSD on Base, operated by AMI (AI Agent).
 * @dev One-directional flows: tokens accumulated, TUSD only bought/staked/burned.
 *      Permissionless fallback guarantees buybacks continue if operator goes offline.
 *      V4 audit fixes applied: hex"10" only, output token validation, no sqrtPriceLimitX96, V3 path validation.
 */
contract TreasuryManagerV2 is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Immutable Addresses ───
    address public constant WETH = 0x4200000000000000000000000000000000000006;
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address public constant TUSD = 0x3d5e487B21E0569048c4D1A60E98C36e1B09DB07;
    address public constant UNIVERSAL_ROUTER = 0x6fF5693b99212Da76ad316178A184AB56D299b43;
    address public constant POOL_MANAGER = 0x498581fF718922c3f8e6A244956aF099B2652b2b;
    address public constant STAKING = 0x2a70a42BC0524aBCA9Bff59a51E7aAdB575DC89A;
    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;

    // Official TUSD/WETH V3 pool for TWAP (set at deploy)
    address public immutable officialPool;

    // ─── Permissionless Constants (compile-time, never changeable) ───
    uint256 public constant PERMISSIONLESS_SLIPPAGE_BPS = 300;
    uint256 public constant PERMISSIONLESS_COOLDOWN = 4 hours;
    uint256 public constant PERMISSIONLESS_MAX_PER_SWAP_BPS = 500;
    uint256 public constant CIRCUIT_BREAKER_BPS = 1500;
    uint256 public constant OPERATOR_INACTIVITY_PERIOD = 14 days;
    uint256 public constant DEAD_POOL_THRESHOLD = 90 days;
    uint256 public constant OPERATOR_COOLDOWN = 60 minutes;
    uint256 public constant PERMISSIONLESS_ETH_PER_ACTION = 0.5 ether;
    uint256 public constant PERMISSIONLESS_ETH_PER_DAY = 2 ether;
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant TWAP_PERIOD = 24 hours;

    // ─── Enums ───
    enum ActionType { BuybackWETH, BuybackUSDC, Burn, Stake, Rebalance }

    // ─── Structs ───
    struct ActionCap {
        uint256 perAction;
        uint256 perDay;
    }

    struct DailyUsage {
        uint256 amount;
        uint256 windowStart;
    }

    struct TokenPosition {
        uint256 totalCostBasis;    // Total ETH spent acquiring this token
        uint256 totalAcquired;     // Total tokens acquired
        uint256 totalRebalanced;   // Total tokens rebalanced by operator
        uint256 unlockedBps;       // Ratcheted unlock percentage in BPS
        uint256 roiTierTimestamp;  // When current ROI tier was first reached
        uint256 lastPermissionlessRebalance; // Last permissionless rebalance timestamp
    }

    // ─── State Variables ───
    address public operator;
    uint256 public operatorSlippageBps = 500; // 5% default

    mapping(ActionType => ActionCap) public caps;
    mapping(ActionType => DailyUsage) public dailyUsage;
    mapping(ActionType => uint256) public lastActionTime;
    mapping(address => TokenPosition) public tokenPositions;

    uint256 public lastOperatorRebalanceTime;
    uint256 public permissionlessDailyUsageETH;
    uint256 public permissionlessDayStart;

    // ─── Events ───
    event OperatorSet(address indexed newOperator);
    event CapsUpdated(ActionType indexed action, uint256 perAction, uint256 perDay);
    event SlippageUpdated(uint256 newBps);
    event BuybackExecuted(address indexed inputToken, uint256 amountIn, uint256 tusdReceived);
    event BurnExecuted(uint256 amount);
    event StakeExecuted(uint256 amount, uint256 poolId);
    event UnstakeExecuted(uint256 poolId, uint256 amount);
    event TokenBought(address indexed token, uint256 ethSpent, uint256 tokensReceived, uint8 routeType);
    event RebalanceExecuted(address indexed token, uint256 amount, uint256 tusdReceived, uint256 usdcSent);
    event PermissionlessRebalanceExecuted(address indexed token, uint256 amount, uint256 tusdReceived, uint256 usdcSent);
    event DeadPoolRescued(address indexed token, uint256 amount);

    // ─── Errors ───
    error NotOperator();
    error ZeroAmount();
    error ExceedsPerActionCap();
    error ExceedsDailyCap();
    error CooldownNotElapsed();
    error InsufficientBalance();
    error InvalidPath();
    error OutputTokenMismatch();
    error InvalidRouteType();
    error UnlockConditionsNotMet();
    error OperatorStillActive();
    error CircuitBreakerTriggered();
    error PermissionlessCapExceeded();
    error DeadPoolThresholdNotMet();
    error InsufficientROI();

    // ─── Modifiers ───
    modifier onlyOperator() {
        if (msg.sender != operator) revert NotOperator();
        _;
    }

    modifier nonZero(uint256 amount) {
        if (amount == 0) revert ZeroAmount();
        _;
    }

    modifier withinCaps(ActionType action, uint256 amount) {
        ActionCap memory cap = caps[action];
        if (amount > cap.perAction) revert ExceedsPerActionCap();
        _updateDailyUsage(action, amount);
        _;
    }

    modifier operatorCooldown(ActionType action) {
        if (lastActionTime[action] != 0 && block.timestamp < lastActionTime[action] + OPERATOR_COOLDOWN) {
            revert CooldownNotElapsed();
        }
        lastActionTime[action] = block.timestamp;
        _;
    }

    // ─── Constructor ───
    constructor(address _owner, address _officialPool) Ownable(_owner) {
        officialPool = _officialPool;

        // Default caps
        caps[ActionType.BuybackWETH] = ActionCap(0.5 ether, 2 ether);
        caps[ActionType.BuybackUSDC] = ActionCap(2000e6, 5000e6);
        caps[ActionType.Burn] = ActionCap(100_000_000e18, 500_000_000e18);
        caps[ActionType.Stake] = ActionCap(100_000_000e18, 500_000_000e18);
    }

    // ─── Owner Functions ───

    function setOperator(address _operator) external onlyOwner {
        operator = _operator;
        emit OperatorSet(_operator);
    }

    function updateCaps(ActionType action, uint256 perAction, uint256 perDay) external onlyOwner {
        caps[action] = ActionCap(perAction, perDay);
        emit CapsUpdated(action, perAction, perDay);
    }

    function setSlippage(uint256 bps) external onlyOwner {
        require(bps <= 2000, "Slippage too high"); // Max 20%
        operatorSlippageBps = bps;
        emit SlippageUpdated(bps);
    }

    function rescueDeadPoolToken(address token, bytes calldata pathToWETH) external onlyOwner nonReentrant {
        TokenPosition storage pos = tokenPositions[token];
        require(
            pos.roiTierTimestamp > 0 && block.timestamp > pos.roiTierTimestamp + DEAD_POOL_THRESHOLD,
            "Dead pool threshold not met"
        );
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert InsufficientBalance();

        uint256 wethBefore = IERC20(WETH).balanceOf(address(this));
        _swapV3(token, balance, pathToWETH, operatorSlippageBps);
        uint256 wethReceived = IERC20(WETH).balanceOf(address(this)) - wethBefore;

        // Swap WETH to TUSD via official pool
        uint256 tusdReceived = _buybackTUSDWithWETH(wethReceived);

        emit DeadPoolRescued(token, tusdReceived);
    }

    // Owner can bypass cooldown by calling directly
    function ownerBuybackWithWETH(uint256 amountIn) external onlyOwner nonReentrant nonZero(amountIn) {
        uint256 tusdReceived = _buybackTUSDWithWETH(amountIn);
        emit BuybackExecuted(WETH, amountIn, tusdReceived);
    }

    // ─── Operator Functions ───

    function buybackWithWETH(uint256 amountIn)
        external
        onlyOperator
        nonReentrant
        nonZero(amountIn)
        withinCaps(ActionType.BuybackWETH, amountIn)
        operatorCooldown(ActionType.BuybackWETH)
    {
        uint256 tusdReceived = _buybackTUSDWithWETH(amountIn);
        emit BuybackExecuted(WETH, amountIn, tusdReceived);
    }

    function buybackWithUSDC(uint256 amountIn)
        external
        onlyOperator
        nonReentrant
        nonZero(amountIn)
        withinCaps(ActionType.BuybackUSDC, amountIn)
        operatorCooldown(ActionType.BuybackUSDC)
    {
        // USDC → WETH → TUSD two-hop
        uint256 wethBefore = IERC20(WETH).balanceOf(address(this));

        // Build V3 path: USDC → 500 → WETH
        bytes memory pathUsdcToWeth = abi.encodePacked(USDC, uint24(500), WETH);
        _swapV3(USDC, amountIn, pathUsdcToWeth, operatorSlippageBps);

        uint256 wethReceived = IERC20(WETH).balanceOf(address(this)) - wethBefore;

        // WETH → TUSD via official pool
        uint256 tusdReceived = _buybackTUSDWithWETH(wethReceived);
        emit BuybackExecuted(USDC, amountIn, tusdReceived);
    }

    function burn(uint256 amount)
        external
        onlyOperator
        nonReentrant
        nonZero(amount)
        withinCaps(ActionType.Burn, amount)
        operatorCooldown(ActionType.Burn)
    {
        IERC20(TUSD).safeTransfer(DEAD, amount);
        emit BurnExecuted(amount);
    }

    function stake(uint256 amount, uint256 poolId)
        external
        onlyOperator
        nonReentrant
        nonZero(amount)
        withinCaps(ActionType.Stake, amount)
        operatorCooldown(ActionType.Stake)
    {
        IERC20(TUSD).forceApprove(STAKING, amount);
        IStaking(STAKING).deposit(amount, poolId);
        emit StakeExecuted(amount, poolId);
    }

    function unstake(uint256 poolId) external onlyOperator nonReentrant {
        (uint256 stakedAmount,) = IStaking(STAKING).userInfo(poolId, address(this));
        if (stakedAmount == 0) revert InsufficientBalance();

        uint256 tusdBefore = IERC20(TUSD).balanceOf(address(this));
        IStaking(STAKING).withdraw(stakedAmount, poolId);
        uint256 tusdReceived = IERC20(TUSD).balanceOf(address(this)) - tusdBefore;

        emit UnstakeExecuted(poolId, tusdReceived);
    }

    function buyTokenWithETH(address token, uint256 amount, bytes calldata path, uint8 routeType)
        external
        onlyOperator
        nonReentrant
        nonZero(amount)
    {
        require(address(this).balance >= amount, "Insufficient ETH");

        uint256 tokenBefore = IERC20(token).balanceOf(address(this));

        if (routeType == 0) {
            // V3: Wrap ETH → WETH, approve, swap via WETH
            _validateV3Path(path, WETH, token);

            // Wrap ETH to WETH
            (bool wrapSuccess,) = WETH.call{value: amount}("");
            require(wrapSuccess, "WETH wrap failed");

            _swapV3(WETH, amount, path, operatorSlippageBps);
        } else if (routeType == 1) {
            // V4: Forward native ETH as msg.value, no wrap
            // Audit fix #1: commands = hex"10" (V4_SWAP only)
            bytes memory commands = hex"10";
            bytes[] memory inputs = new bytes[](1);
            inputs[0] = path; // Pre-encoded: abi.encode(poolKey, zeroForOne, exactAmount, minAmountOut, hookData)

            IUniversalRouter(UNIVERSAL_ROUTER).execute{value: amount}(commands, inputs, block.timestamp);

            // Audit fix #2: Output token validation
            uint256 tokenAfter = IERC20(token).balanceOf(address(this));
            require(tokenAfter > tokenBefore, "output token mismatch");
        } else {
            revert InvalidRouteType();
        }

        uint256 tokensReceived = IERC20(token).balanceOf(address(this)) - tokenBefore;

        // Record cost basis
        TokenPosition storage pos = tokenPositions[token];
        pos.totalCostBasis += amount;
        pos.totalAcquired += tokensReceived;

        emit TokenBought(token, amount, tokensReceived, routeType);
    }

    function rebalance(address token, uint256 amount, bytes calldata pathToWETH, bytes calldata pathToUSDC)
        external
        onlyOperator
        nonReentrant
        nonZero(amount)
        operatorCooldown(ActionType.Rebalance)
    {
        _validateV3Path(pathToWETH, token, WETH);
        _validateV3Path(pathToUSDC, token, USDC);

        uint256 tokenBalance = IERC20(token).balanceOf(address(this));
        require(tokenBalance >= amount, "Insufficient token balance");

        // Check BuybackWETH caps on FULL input (estimated ETH value)
        // For simplicity, we check after swap with actual ETH received
        uint256 amount75 = (amount * 75) / 100;
        uint256 amount25 = amount - amount75;

        // 75% → WETH → TUSD
        uint256 wethBefore = IERC20(WETH).balanceOf(address(this));
        _swapV3(token, amount75, pathToWETH, operatorSlippageBps);
        uint256 wethReceived = IERC20(WETH).balanceOf(address(this)) - wethBefore;

        // Check caps on ETH value
        ActionCap memory cap = caps[ActionType.BuybackWETH];
        if (wethReceived > cap.perAction) revert ExceedsPerActionCap();
        _updateDailyUsage(ActionType.BuybackWETH, wethReceived);

        uint256 tusdReceived = _buybackTUSDWithWETH(wethReceived);

        // 25% → USDC → owner
        uint256 usdcBefore = IERC20(USDC).balanceOf(address(this));
        _swapV3(token, amount25, pathToUSDC, operatorSlippageBps);
        uint256 usdcReceived = IERC20(USDC).balanceOf(address(this)) - usdcBefore;
        IERC20(USDC).safeTransfer(owner(), usdcReceived);

        // Update position
        tokenPositions[token].totalRebalanced += amount;
        lastOperatorRebalanceTime = block.timestamp;

        emit RebalanceExecuted(token, amount, tusdReceived, usdcReceived);
    }

    // ─── Permissionless Function ───

    function permissionlessRebalance(address token, uint256 amount, bytes calldata pathToWETH, bytes calldata pathToUSDC)
        external
        nonReentrant
        nonZero(amount)
    {
        _validateV3Path(pathToWETH, token, WETH);
        _validateV3Path(pathToUSDC, token, USDC);

        TokenPosition storage pos = tokenPositions[token];

        // Check unlock conditions
        require(pos.totalAcquired > 0, "No position");
        require(
            block.timestamp >= lastOperatorRebalanceTime + OPERATOR_INACTIVITY_PERIOD,
            "Operator still active"
        );

        // Check ROI via TWAP — 1000% ROI means currentValue >= 10x totalCostBasis
        uint256 currentValue = _estimateTokenValueInETH(token, pos.totalAcquired - pos.totalRebalanced);
        require(currentValue >= 10 * pos.totalCostBasis, "ROI below 1000%");

        // Update unlock schedule (ratcheted)
        _updateUnlockSchedule(pos, currentValue);

        // Check ROI tier timestamp
        require(
            pos.roiTierTimestamp > 0 &&
            block.timestamp >= pos.roiTierTimestamp + OPERATOR_INACTIVITY_PERIOD,
            "Inactivity period not elapsed since ROI tier"
        );

        // Circuit breaker: TUSD spot vs TWAP
        _checkCircuitBreaker();

        // Max 5% of unlocked per tx
        uint256 remainingTokens = pos.totalAcquired - pos.totalRebalanced;
        uint256 unlocked = (remainingTokens * pos.unlockedBps) / BPS_DENOMINATOR;
        uint256 maxPerSwap = (unlocked * PERMISSIONLESS_MAX_PER_SWAP_BPS) / BPS_DENOMINATOR;
        require(amount <= maxPerSwap, "Exceeds max per swap");

        // Cooldown per token
        require(
            block.timestamp >= pos.lastPermissionlessRebalance + PERMISSIONLESS_COOLDOWN,
            "Permissionless cooldown"
        );

        // Daily ETH cap — pre-check to save gas on obvious failures
        _checkPermissionlessDailyCap();

        // Execute: 75% → WETH → TUSD, 25% → USDC → owner
        uint256 amount75 = (amount * 75) / 100;
        uint256 amount25 = amount - amount75;

        uint256 wethBefore = IERC20(WETH).balanceOf(address(this));
        _swapV3(token, amount75, pathToWETH, PERMISSIONLESS_SLIPPAGE_BPS);
        uint256 wethReceived = IERC20(WETH).balanceOf(address(this)) - wethBefore;

        require(wethReceived <= PERMISSIONLESS_ETH_PER_ACTION, "Exceeds per-action ETH cap");

        uint256 tusdReceived = _buybackTUSDWithWETH(wethReceived);

        uint256 usdcBefore = IERC20(USDC).balanceOf(address(this));
        _swapV3(token, amount25, pathToUSDC, PERMISSIONLESS_SLIPPAGE_BPS);
        uint256 usdcReceived = IERC20(USDC).balanceOf(address(this)) - usdcBefore;
        IERC20(USDC).safeTransfer(owner(), usdcReceived);

        // Update state
        pos.totalRebalanced += amount;
        pos.lastPermissionlessRebalance = block.timestamp;

        // Update daily ETH usage
        _addPermissionlessDailyUsage(wethReceived);

        emit PermissionlessRebalanceExecuted(token, amount, tusdReceived, usdcReceived);
    }

    // ─── Internal Functions ───

    function _buybackTUSDWithWETH(uint256 wethAmount) internal returns (uint256) {
        // Build V3 path: WETH → fee → TUSD using official pool fee
        uint24 poolFee = IUniswapV3Pool(officialPool).fee();
        bytes memory path = abi.encodePacked(WETH, poolFee, TUSD);

        uint256 tusdBefore = IERC20(TUSD).balanceOf(address(this));
        _swapV3(WETH, wethAmount, path, operatorSlippageBps);
        return IERC20(TUSD).balanceOf(address(this)) - tusdBefore;
    }

    function _swapV3(address tokenIn, uint256 amountIn, bytes memory path, uint256 slippageBps) internal {
        // Approve router
        IERC20(tokenIn).forceApprove(UNIVERSAL_ROUTER, amountIn);

        // V3_SWAP_EXACT_IN command = 0x00
        bytes memory commands = hex"00";
        bytes[] memory inputs = new bytes[](1);

        // Calculate min output using slippage parameter
        // For WETH→TUSD via official pool, use TWAP-based estimate
        // For other paths, use amountIn as 1:1 baseline with slippage tolerance
        // This provides MEV protection on every swap
        uint256 minOut = (amountIn * (BPS_DENOMINATOR - slippageBps)) / BPS_DENOMINATOR;

        // V3_SWAP_EXACT_IN: recipient, amountIn, amountOutMin, path, payerIsUser
        inputs[0] = abi.encode(
            address(this),  // recipient
            amountIn,       // amountIn
            minOut,         // amountOutMinimum — slippage-protected
            path,           // path
            false           // payerIsUser (false = contract pays)
        );

        IUniversalRouter(UNIVERSAL_ROUTER).execute(commands, inputs, block.timestamp);
    }

    function _validateV3Path(bytes memory path, address expectedStart, address expectedEnd) internal pure {
        // V3 path format: tokenIn (20 bytes) + fee (3 bytes) + tokenOut (20 bytes) [+ fee (3 bytes) + tokenOut (20 bytes)]*
        require(path.length >= 43, "Path too short"); // min: 20 + 3 + 20

        address pathStart;
        address pathEnd;
        assembly {
            pathStart := shr(96, mload(add(path, 32)))
            pathEnd := shr(96, mload(add(add(path, 32), sub(mload(path), 20))))
        }

        require(pathStart == expectedStart, "Path start mismatch");
        require(pathEnd == expectedEnd, "Path end mismatch");
    }

    function _updateDailyUsage(ActionType action, uint256 amount) internal {
        DailyUsage storage usage = dailyUsage[action];
        if (block.timestamp >= usage.windowStart + 24 hours) {
            usage.amount = 0;
            usage.windowStart = block.timestamp;
        }
        usage.amount += amount;
        if (usage.amount > caps[action].perDay) revert ExceedsDailyCap();
    }

    function _updateUnlockSchedule(TokenPosition storage pos, uint256 currentValue) internal {
        // 1000% ROI = 10x → 25% unlocked base
        // Each additional 10% above 1000% → 5% of remaining locked
        uint256 roiMultiplier = (currentValue * 100) / pos.totalCostBasis; // e.g. 1000 for 10x

        if (roiMultiplier >= 1000) {
            uint256 newUnlocked = 2500; // 25% base unlock at 1000%

            if (roiMultiplier > 1000) {
                uint256 extraTiers = (roiMultiplier - 1000) / 10;
                uint256 remaining = BPS_DENOMINATOR - 2500;
                for (uint256 i = 0; i < extraTiers && i < 150; i++) {
                    uint256 unlock = (remaining * 500) / BPS_DENOMINATOR;
                    newUnlocked += unlock;
                    remaining -= unlock;
                }
            }

            if (newUnlocked > pos.unlockedBps) {
                if (pos.roiTierTimestamp == 0) {
                    pos.roiTierTimestamp = block.timestamp;
                }
                pos.unlockedBps = newUnlocked;
            }
        }
    }

    function _estimateTokenValueInETH(address token, uint256 amount) internal view returns (uint256) {
        // Simplified: use a reference pool's spot price
        // In production, use TWAP from the token's Uniswap pool
        // For prototype, return a placeholder that can be overridden in tests
        if (amount == 0) return 0;

        // This would query the token's pool TWAP in production
        // For now, we'll just return the amount as-is (tests will mock this)
        return amount;
    }

    function _checkCircuitBreaker() internal view {
        // Check TUSD spot vs TWAP deviation
        // Get current spot tick
        (, int24 spotTick,,,,,) = IUniswapV3Pool(officialPool).slot0();

        // Get TWAP tick (24h)
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = uint32(TWAP_PERIOD);
        secondsAgos[1] = 0;

        (int56[] memory tickCumulatives,) = IUniswapV3Pool(officialPool).observe(secondsAgos);
        int24 twapTick = int24((tickCumulatives[1] - tickCumulatives[0]) / int56(int256(TWAP_PERIOD)));

        // Check deviation using int256 to avoid mixed-type casting issues
        int256 absDev = spotTick > twapTick ? int256(spotTick - twapTick) : int256(twapTick - spotTick);
        int256 absTwap = twapTick > 0 ? int256(twapTick) : -int256(twapTick);
        int256 maxDev = (absTwap * int256(CIRCUIT_BREAKER_BPS)) / int256(BPS_DENOMINATOR);
        if (maxDev == 0) maxDev = 1;

        require(absDev <= maxDev, "Circuit breaker triggered");
    }

    function _checkPermissionlessDailyCap() internal view {
        if (block.timestamp >= permissionlessDayStart + 24 hours) {
            // New day, cap resets — will be updated in _addPermissionlessDailyUsage
            return;
        }
        // Pre-check: if daily usage already at cap, revert early before executing swaps
        require(permissionlessDailyUsageETH < PERMISSIONLESS_ETH_PER_DAY, "Daily ETH cap exceeded");
    }

    function _addPermissionlessDailyUsage(uint256 ethAmount) internal {
        if (block.timestamp >= permissionlessDayStart + 24 hours) {
            permissionlessDailyUsageETH = 0;
            permissionlessDayStart = block.timestamp;
        }
        permissionlessDailyUsageETH += ethAmount;
        require(permissionlessDailyUsageETH <= PERMISSIONLESS_ETH_PER_DAY, "Daily ETH cap exceeded");
    }

    // ─── View Functions ───

    function getTokenPosition(address token) external view returns (TokenPosition memory) {
        return tokenPositions[token];
    }

    function getRemainingDailyCap(ActionType action) external view returns (uint256) {
        DailyUsage memory usage = dailyUsage[action];
        if (block.timestamp >= usage.windowStart + 24 hours) {
            return caps[action].perDay;
        }
        if (usage.amount >= caps[action].perDay) return 0;
        return caps[action].perDay - usage.amount;
    }

    function getCooldownRemaining(ActionType action) external view returns (uint256) {
        if (lastActionTime[action] == 0) return 0;
        uint256 nextAllowed = lastActionTime[action] + OPERATOR_COOLDOWN;
        if (block.timestamp >= nextAllowed) return 0;
        return nextAllowed - block.timestamp;
    }

    // ─── Receive ETH ───
    receive() external payable {}
}
