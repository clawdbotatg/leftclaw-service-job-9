# ₸USD Treasury Manager v2

Onchain treasury management for [₸USD (TurboUSD)](https://www.turbousd.com/) on Base, operated by AMI (Artificial Monetary Intelligence).

## Deployed

| Component | Address / URL |
|-----------|---------------|
| **Contract** | [`0x21774D0621C27b22a10D6857cE370222A0b56188`](https://basescan.org/address/0x21774D0621C27b22a10D6857cE370222A0b56188) |
| **Chain** | Base (8453) |
| **Owner** | `0x9ba58Eea1Ea9ABDEA25BA83603D54F6D9A01E506` |
| **TUSD/WETH Pool** | [`0xd013725b904e76394A3aB0334Da306C505D778F8`](https://basescan.org/address/0xd013725b904e76394A3aB0334Da306C505D778F8) (V3, 1% fee) |
| **Frontend (IPFS)** | [Live App](https://bafybeialogsusgypuigh7bxmnnf2kfhbovl6bzedu6ujg2bmjp7qaltmn4.ipfs.community.bgipfs.com/) |

## Architecture

**One-directional flows:** tokens are accumulated, ₸USD can only be bought, staked, or burned — never sold.

### Roles

- **Owner** (client) — sets operator, adjusts caps/slippage, rescues dead pool tokens, transfers ownership via 2-step
- **Operator** (AMI agent) — executes buybacks, burns, stakes, buys strategic tokens, rebalances positions
- **Permissionless** (anyone) — triggers rebalance fallback if operator is inactive 14+ days and position has 1000%+ ROI

### Core Operations

| Operation | Description | Rate Limit |
|-----------|-------------|------------|
| **Buyback (WETH)** | WETH → TUSD via V3 swap | 0.5 ETH/action, 2 ETH/day, 60m cooldown |
| **Buyback (USDC)** | USDC → WETH → TUSD two-hop | 2,000 USDC/action, 5,000/day, 60m cooldown |
| **Burn** | Send TUSD to 0x...dEaD | 100M/action, 500M/day, 60m cooldown |
| **Stake** | Deposit TUSD into staking contract | 100M/action, 500M/day, 60m cooldown |
| **Buy Token** | Use ETH to acquire strategic tokens (V3 or V4 routes) | Operator-only, no daily cap |
| **Rebalance** | Sell token: 75% → WETH → TUSD, 25% → USDC to owner | Operator cooldown, checked against buyback caps |

### Permissionless Fallback

If the operator is inactive for 14 days, anyone can trigger rebalance on positions with 1000%+ ROI:
- **Circuit breaker:** halts if TUSD spot price deviates >15% from 24h TWAP
- **Per-action cap:** 0.5 ETH equivalent
- **Daily cap:** 2 ETH equivalent
- **Cooldown:** 4 hours per token
- **Max per swap:** 5% of unlocked position
- **Unlock schedule:** ratcheted, starting at 25% at 1000% ROI

### Security Notes

- `Ownable2Step` — ownership transfer requires acceptance by new owner
- `ReentrancyGuard` on all state-changing functions
- `SafeERC20` / `forceApprove` (OZ 5.6.1) — no safeApprove
- V3 path validation enforces correct start/end tokens on all swap paths
- Slippage protection via `minOut` calculation from `slippageBps` parameter
- All constants are immutable or compile-time — no admin can change permissionless parameters
- No token approvals persist beyond each swap (forceApprove → execute pattern)

## Run Locally

```bash
# Clone
git clone https://github.com/clawdbotatg/leftclaw-service-job-9.git
cd leftclaw-service-job-9

# Install
yarn install

# Run tests (foundry)
cd packages/foundry
forge test

# Start frontend (dev mode, targets local anvil)
# First update scaffold.config.ts to target chains.foundry
cd packages/nextjs
yarn dev
```

## Deploy

### Contract

```bash
cd packages/foundry

# Deploy to Base
forge script script/DeployTreasuryManagerV2.s.sol \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  --private-key $PRIVATE_KEY

# Verify
forge verify-contract <address> \
  contracts/TreasuryManagerV2.sol:TreasuryManagerV2 \
  --chain-id 8453 \
  --constructor-args $(cast abi-encode "constructor(address,address)" <owner> <officialPool>)
```

### Frontend (IPFS)

```bash
cd packages/nextjs
rm -rf out .next
NEXT_PUBLIC_IPFS_BUILD=true NODE_OPTIONS="--require ./polyfill-localstorage.cjs" npm run build
bgipfs upload out --config ~/.bgipfs/credentials.json
```

## Key Dependencies

- Solidity 0.8.26, OpenZeppelin 5.6.1
- Uniswap V3 (Universal Router) for swaps
- Scaffold-ETH 2 frontend
- Next.js 15 with static export for IPFS
