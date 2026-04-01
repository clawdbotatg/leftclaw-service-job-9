# 🏦 ₸USD - Treasury Manager v2

## Operated by AMI (Artificial Monetary Intelligence)

TreasuryManager v2 is an onchain treasury management contract for ₸USD (TurboUSD) on Base. The contract enforces strict one-directional token flows: tokens are accumulated into the treasury, ₸USD can only be bought, staked, or burned — never sold.

A permissionless fallback mechanism guarantees ₸USD buybacks will continue even if the operator goes offline, ensuring treasury funds are never stuck and the protocol's monetary policy remains active under all circumstances.

## Features

- **Operator-controlled buybacks** — WETH → ₸USD and USDC → WETH → ₸USD via Uniswap
- **Token accumulation** — Buy any ERC20 with ETH via Universal Router (V3 + V4)
- **Permissionless rebalance** — Anyone can trigger rebalances when ROI thresholds are met and operator is inactive
- **Staking integration** — Stake/unstake ₸USD to staking contract
- **Burn mechanism** — Partial ₸USD burns with operator caps
- **Circuit breaker** — Blocks swaps when spot price deviates >15% from 24h TWAP
- **Dead pool rescue** — Owner can rescue tokens from dead pools after 90 days

## Architecture

- **Network:** Base (Chain ID 8453)
- **Contracts:** Foundry (Solidity 0.8.26+)
- **Frontend:** Next.js via Scaffold-ETH 2
- **Dependencies:** OpenZeppelin (Ownable2Step, ReentrancyGuard), Uniswap Universal Router + V3 Pool

## Contract Addresses (Base)

| Contract | Address |
|----------|---------|
| WETH | `0x4200000000000000000000000000000000000006` |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| ₸USD | `0x0c03Ce270B4826Ec62e7DD007f0B716068639F7B` |
| Universal Router | `0x6fF5693b99212Da76ad316178A184AB56D299b43` |
| PoolManager (V4) | `0x498581ff718922c3f8e6a244956af099b2652b2b` |
| ₸USD Staking | `0x2a70a42BC0524aBCA9Bff59a51E7aAdB575DC89A` |

## Development

```bash
# Install dependencies
yarn install

# Start local fork
yarn fork --network base

# Deploy contracts
yarn deploy

# Start frontend
yarn start
```

## License

MIT
