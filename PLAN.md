# PLAN.md — TreasuryManager v2 Architecture

## Overview

TreasuryManager v2 is an onchain treasury management contract for ₸USD (TurboUSD) on Base, operated by AMI (Artificial Monetary Intelligence). The contract enforces strict one-directional token flows: tokens are accumulated into the treasury, ₸USD can only be bought, staked, or burned — never sold.

A permissionless fallback mechanism guarantees ₸USD buybacks will continue even if the operator goes offline.

## Contract Architecture

### TreasuryManagerV2.sol

**Inheritance:** Ownable2Step, ReentrancyGuard

**Immutable State:**
| Variable | Address | Notes |
|----------|---------|-------|
| WETH | `0x4200000000000000000000000000000000000006` | Base native WETH |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Base USDC |
| TUSD | `0x0c03Ce270B4826Ec62e7DD007f0B716068639F7B` | ₸USD token |
| UNIVERSAL_ROUTER | `0x6fF5693b99212Da76ad316178A184AB56D299b43` | Uniswap Universal Router (Base) |
| POOL_MANAGER | `0x498581ff718922c3f8e6a244956af099b2652b2b` | Uniswap V4 PoolManager |
| OFFICIAL_POOL | TBD at deploy | ₸USD/WETH V3 pool for TWAP |
| STAKING | `0x2a70a42BC0524aBCA9Bff59a51E7aAdB575DC89A` | ₸USD staking contract |

**Permissionless Constants (compile-time, never changeable):**
| Constant | Value | Purpose |
|----------|-------|---------|
| PERMISSIONLESS_SLIPPAGE_BPS | 300 (3%) | Max slippage for permissionless swaps |
| PERMISSIONLESS_COOLDOWN | 4 hours | Cooldown between permissionless rebalances per token |
| PERMISSIONLESS_MAX_PER_SWAP_BPS | 500 (5%) | Max % of unlocked amount per swap |
| CIRCUIT_BREAKER_BPS | 1500 (15%) | Max spot vs TWAP deviation |
| OPERATOR_INACTIVITY_PERIOD | 14 days | Days without operator rebalance before permissionless unlocks |
| DEAD_POOL_THRESHOLD | 90 days | Days before dead pool rescue |
| OPERATOR_COOLDOWN | 60 minutes | Cooldown between operator actions |
| PERMISSIONLESS_ETH_PER_ACTION | 0.5 ether | Max ETH per permissionless action |
| PERMISSIONLESS_ETH_PER_DAY | 2 ether | Max ETH per day for permissionless |

**Operator Caps (owner-configurable):**
| Action | Default Per Action | Default Per Day |
|--------|-------------------|----------------|
| BuybackWETH | 0.5 ETH | 2 ETH |
| BuybackUSDC | 2000 USDC | 5000 USDC |
| Burn | 100M ₸USD | 500M ₸USD |
| Stake | 100M ₸USD | 500M ₸USD |
| Rebalance | Uses BuybackWETH caps on 100% of input | |

### Function Specifications

#### Owner-Only Functions
1. **`setOperator(address)`** — Set AMI operator address
2. **`updateCaps(ActionType, uint256 perAction, uint256 perDay)`** — Change operator caps
3. **`setSlippage(uint256 bps)`** — Set operator slippage (default 500 = 5%)
4. **`rescueDeadPoolToken(address token, bytes path)`** — Rescue from dead pool after 90+ days

#### Operator-Only Functions
1. **`buybackWithWETH(uint256 amountIn)`** — WETH → ₸USD via official V3 pool. BuybackWETH caps. 60-min cooldown.
2. **`buybackWithUSDC(uint256 amountIn)`** — USDC → WETH → ₸USD multihop via official pool. BuybackUSDC caps. 60-min cooldown.
3. **`burn(uint256 amount)`** — Burn ₸USD. Burn caps. 60-min cooldown.
4. **`stake(uint256 amount, uint256 poolId)`** — Stake ₸USD. Stake caps. 60-min cooldown.
5. **`unstake(uint256 poolId)`** — Unstake full balance + rewards. No caps, no cooldown.
6. **`buyTokenWithETH(address token, uint256 amount, bytes path, uint8 routeType)`** — ETH → ERC20 via Universal Router. Route-dependent ETH handling:
   - routeType 0 (V3): Wrap ETH → WETH, approve, swap via WETH. Path validated starts with WETH.
   - routeType 1 (V4): Forward native ETH as msg.value, no wrap. Currency0 = address(0) for ETH pairs.
   Records cost basis.
7. **`rebalance(address token, uint256 amount, bytes pathToWETH, bytes pathToUSDC)`** — 75% → WETH → ₸USD via official pool. 25% → USDC to designated address. BuybackWETH caps on full input. 60-min cooldown.

#### Permissionless Function
**`permissionlessRebalance(address token, uint256 amount, bytes pathToWETH, bytes pathToUSDC)`**

Unlock Conditions (both required):
1. ROI ≥ 1000% vs weighted average cost (measured via 24h TWAP from token's Uniswap pool)
2. No operator rebalance for 14 days since current ROI tier was first reached

Unlock Schedule (ratcheted, never decreases):
- 1000% ROI: 25% unlocked
- Each additional 10% above: 5% of remaining locked unlocks

Execution Rules:
- Max 5% of unlocked per tx
- 4h cooldown per token
- Circuit breaker: ₸USD spot vs 24h TWAP, blocks if spot >15% above TWAP
- Hardcoded caps: 0.5 ETH/action, 2 ETH/day
- Hardcoded 3% slippage

### Universal Router Integration — V3 + V4

#### V3 Routing (routeType 0)
- Command: `0x00` (V3_SWAP_EXACT_IN)
- Path: encoded as `tokenIn . fee . tokenOut [. fee . tokenOut]*`
- ETH handling: Contract wraps ETH → WETH before swap, approves router

#### V4 Routing (routeType 1) — CRITICAL CHANGES
- Command: `0x10` (V4_SWAP)
- Single-hop only in v1
- Encoding: `abi.encode(poolKey, zeroForOne, exactAmount, minAmountOut, hookData)`
- Where poolKey = `abi.encode(currency0, currency1, fee, tickSpacing, hooks)`
- **ETH pairs: currency0 = address(0), NOT WETH**
- **ETH handling: Forward native ETH as msg.value, no WETH wrapping**
- Output token validation: `require(outputToken == token, "output token mismatch")`
- No sqrtPriceLimitX96 — not part of V4_SWAP command

### Design Decisions

#### ETH Handling (Route-Dependent)
| Route Type | ETH Handling |
|------------|-------------|
| V3 (routeType 0) | Wrap ETH → WETH, approve, swap via WETH |
| V4 (routeType 1) | Forward native ETH as msg.value, no wrap |

#### V4 Pool Discovery (Agent-Side)
- Local SQLite index of PoolManager Initialize events
- V4 ETH pools use currency0 = address(0), NOT WETH
- Incremental refresh every 30 seconds
- No ad-hoc chain scans at request time

#### Forced Pool ID Behavior
- If operator provides a V4 poolId, use only that pool
- Fail fast if unresolved
- No silent fallback

#### V3 Path Validation
- `_validateV3Path` helper ensures path starts with WETH and ends with target token
- Reverts with descriptive error if validation fails

### Contract Prohibitions
- No withdrawals
- No selling ₸USD
- WETH only swaps to ₸USD
- USDC only swaps to ₸USD via WETH
- No LP management
- No changing permissionless parameters
- ETH only for buying ERC20s

## Security Architecture

1. **ReentrancyGuard** on all external calls
2. **CEI pattern** (Checks-Effects-Interactions)
3. **balanceOf deltas** for all accounting (no trust in return values)
4. **24h TWAP** for ROI checks and circuit breaker
5. **Permissionless params** are compile-time constants (cannot be changed)
6. **Ownable2Step** — two-step ownership transfer prevents accidental transfers

## Project Structure

```
packages/
├── foundry/
│   ├── contracts/
│   │   ├── TreasuryManagerV2.sol        # Main contract
│   │   └── interfaces/
│   │       └── ITreasuryManagerV2.sol    # Interfaces
│   ├── script/
│   │   └── DeployTreasuryManagerV2.s.sol # Deploy script
│   └── test/
│       └── TreasuryManagerV2.t.sol       # Comprehensive tests
└── nextjs/
    ├── app/
    │   └── treasury/                     # Treasury dashboard
    ├── components/
    │   └── treasury/                     # Treasury components
    └── contracts/
        └── externalContracts.ts          # External contract ABIs
```

## Deployment

- **Network:** Base (Chain ID 8453)
- **Owner:** `0x9ba58Eea1Ea9ABDEA25BA83603D54F6D9A01E506` (client)
- **Operator:** Set by owner post-deployment
- **Constructor Args:** Owner address, official ₸USD/WETH V3 pool address

## Dependencies

- OpenZeppelin Contracts (Ownable2Step, ReentrancyGuard)
- Uniswap V3 Pool interface (TWAP)
- Uniswap Universal Router interface (swaps)
- IERC20 (token interactions)
