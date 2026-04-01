# User Journey — TreasuryManager v2

## Actors

1. **Owner** — `0x9ba58Eea1Ea9ABDEA25BA83603D54F6D9A01E506` — Protocol governance. Sets operator, configures caps, rescues dead pools.
2. **Operator (AMI)** — AI agent. Executes buybacks, burns, stakes, buys tokens, rebalances.
3. **Public** — Anyone. Can trigger permissionless rebalance when conditions are met.

---

## Journey 1: Owner Setup

### Step 1 — Deploy Contract
- Owner deploys TreasuryManagerV2 with their address as initial owner
- Constructor sets immutable addresses (WETH, USDC, ₸USD, pools, router)

### Step 2 — Set Operator
- Owner calls `setOperator(AMI_address)` to authorize the AI operator
- Event emitted: `OperatorSet(address)`

### Step 3 — Configure Caps (Optional)
- Owner calls `updateCaps(ActionType.BuybackWETH, 0.5 ether, 2 ether)` etc.
- Default caps are reasonable; owner adjusts only if needed

### Step 4 — Fund Contract
- Owner sends WETH, USDC, or ETH to the contract address
- Contract receives tokens via standard ERC20 transfers
- Contract has `receive()` to accept ETH

---

## Journey 2: Operator Buyback (WETH → ₸USD)

### Step 1 — Check Balances
- Operator reads WETH balance of contract
- Checks if amount is within BuybackWETH caps

### Step 2 — Execute Buyback
- Operator calls `buybackWithWETH(amountIn)`
- Contract validates: operator role, caps, cooldown (60 min)
- Contract swaps WETH → ₸USD via official V3 pool through Universal Router
- Uses operator slippage (default 5%)

### Step 3 — Verify
- ₸USD balance of contract increased
- Event emitted: `BuybackExecuted(token, amountIn, amountOut)`

---

## Journey 3: Operator Token Acquisition (ETH → ERC20)

### Step 1 — Identify Token
- Operator identifies a token to buy for the treasury

### Step 2 — Choose Route
- **V3 route (routeType 0):** Standard multi-hop path. Contract wraps ETH → WETH first.
- **V4 route (routeType 1):** Single-hop via V4 pool. Contract forwards ETH as msg.value. Currency0 = address(0) for ETH pairs.

### Step 3 — Execute Buy
- Operator calls `buyTokenWithETH(token, amount, path, routeType)`
- Contract records cost basis via balanceOf deltas
- Token now tracked for future rebalancing

---

## Journey 4: Operator Rebalance

### Step 1 — Check Token Performance
- Token has appreciated significantly
- Operator decides to rebalance

### Step 2 — Execute Rebalance
- Operator calls `rebalance(token, amount, pathToWETH, pathToUSDC)`
- 75% of tokens → WETH → ₸USD via official pool
- 25% of tokens → USDC to designated address
- BuybackWETH caps apply on full input amount

---

## Journey 5: Permissionless Rebalance

### Prerequisites
- Token ROI ≥ 1000% vs weighted average cost (measured via 24h TWAP)
- No operator rebalance for 14 days since ROI tier first reached

### Step 1 — Check Unlock
- Public user checks if token is unlocked for permissionless rebalance
- Reads unlock percentage from contract

### Step 2 — Execute
- Public calls `permissionlessRebalance(token, amount, pathToWETH, pathToUSDC)`
- Amount capped at 5% of unlocked
- Circuit breaker checked: ₸USD spot vs 24h TWAP (blocks if >15% above)
- Hardcoded 3% slippage
- Max 0.5 ETH/action, 2 ETH/day

### Step 3 — Cooldown
- 4-hour cooldown per token before next permissionless rebalance

---

## Journey 6: Staking

### Stake
- Operator calls `stake(amount, poolId)`
- ₸USD transferred to staking contract
- Stake caps apply, 60-min cooldown

### Unstake
- Operator calls `unstake(poolId)`
- Full balance + rewards withdrawn
- No caps, no cooldown

---

## Journey 7: Burn

- Operator calls `burn(amount)`
- ₸USD partially burned
- Burn caps apply, 60-min cooldown

---

## Journey 8: Dead Pool Rescue (Emergency)

- A tracked token's pool has been inactive for 90+ days
- Owner calls `rescueDeadPoolToken(token, path)`
- Token swapped out via provided path
- Only available to owner, only after 90-day threshold

---

## Frontend Dashboard

### Dashboard View
- Contract ETH/WETH/USDC/₸USD balances
- List of tracked tokens with cost basis and current value
- Operator status and last action time
- Permissionless unlock percentages per token

### Owner Panel
- Set operator
- Update caps
- Set slippage
- Rescue dead pool tokens

### Operator Panel
- Execute buybacks (WETH/USDC)
- Buy tokens with ETH
- Rebalance tokens
- Stake/unstake ₸USD
- Burn ₸USD

### Public Panel
- View unlock status per token
- Execute permissionless rebalance
- View circuit breaker status
