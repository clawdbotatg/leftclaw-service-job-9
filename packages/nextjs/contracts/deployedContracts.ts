import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

const deployedContracts = {
  8453: {
    TreasuryManagerV2: {
      address: "0x21774D0621C27b22a10D6857cE370222A0b56188",
      abi: [
      {
            "type": "constructor",
            "inputs": [
                  {
                        "name": "_owner",
                        "type": "address",
                        "internalType": "address"
                  },
                  {
                        "name": "_officialPool",
                        "type": "address",
                        "internalType": "address"
                  }
            ],
            "stateMutability": "nonpayable"
      },
      {
            "type": "receive",
            "stateMutability": "payable"
      },
      {
            "type": "function",
            "name": "BPS_DENOMINATOR",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "CIRCUIT_BREAKER_BPS",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "DEAD",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "address",
                        "internalType": "address"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "DEAD_POOL_THRESHOLD",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "OPERATOR_COOLDOWN",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "OPERATOR_INACTIVITY_PERIOD",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "PERMISSIONLESS_COOLDOWN",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "PERMISSIONLESS_ETH_PER_ACTION",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "PERMISSIONLESS_ETH_PER_DAY",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "PERMISSIONLESS_MAX_PER_SWAP_BPS",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "PERMISSIONLESS_SLIPPAGE_BPS",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "POOL_MANAGER",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "address",
                        "internalType": "address"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "STAKING",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "address",
                        "internalType": "address"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "TUSD",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "address",
                        "internalType": "address"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "TWAP_PERIOD",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "UNIVERSAL_ROUTER",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "address",
                        "internalType": "address"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "USDC",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "address",
                        "internalType": "address"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "WETH",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "address",
                        "internalType": "address"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "acceptOwnership",
            "inputs": [],
            "outputs": [],
            "stateMutability": "nonpayable"
      },
      {
            "type": "function",
            "name": "burn",
            "inputs": [
                  {
                        "name": "amount",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
      },
      {
            "type": "function",
            "name": "buyTokenWithETH",
            "inputs": [
                  {
                        "name": "token",
                        "type": "address",
                        "internalType": "address"
                  },
                  {
                        "name": "amount",
                        "type": "uint256",
                        "internalType": "uint256"
                  },
                  {
                        "name": "path",
                        "type": "bytes",
                        "internalType": "bytes"
                  },
                  {
                        "name": "routeType",
                        "type": "uint8",
                        "internalType": "uint8"
                  }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
      },
      {
            "type": "function",
            "name": "buybackWithUSDC",
            "inputs": [
                  {
                        "name": "amountIn",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
      },
      {
            "type": "function",
            "name": "buybackWithWETH",
            "inputs": [
                  {
                        "name": "amountIn",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
      },
      {
            "type": "function",
            "name": "caps",
            "inputs": [
                  {
                        "name": "",
                        "type": "uint8",
                        "internalType": "enum TreasuryManagerV2.ActionType"
                  }
            ],
            "outputs": [
                  {
                        "name": "perAction",
                        "type": "uint256",
                        "internalType": "uint256"
                  },
                  {
                        "name": "perDay",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "dailyUsage",
            "inputs": [
                  {
                        "name": "",
                        "type": "uint8",
                        "internalType": "enum TreasuryManagerV2.ActionType"
                  }
            ],
            "outputs": [
                  {
                        "name": "amount",
                        "type": "uint256",
                        "internalType": "uint256"
                  },
                  {
                        "name": "windowStart",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "getCooldownRemaining",
            "inputs": [
                  {
                        "name": "action",
                        "type": "uint8",
                        "internalType": "enum TreasuryManagerV2.ActionType"
                  }
            ],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "getRemainingDailyCap",
            "inputs": [
                  {
                        "name": "action",
                        "type": "uint8",
                        "internalType": "enum TreasuryManagerV2.ActionType"
                  }
            ],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "getTokenPosition",
            "inputs": [
                  {
                        "name": "token",
                        "type": "address",
                        "internalType": "address"
                  }
            ],
            "outputs": [
                  {
                        "name": "",
                        "type": "tuple",
                        "internalType": "struct TreasuryManagerV2.TokenPosition",
                        "components": [
                              {
                                    "name": "totalCostBasis",
                                    "type": "uint256",
                                    "internalType": "uint256"
                              },
                              {
                                    "name": "totalAcquired",
                                    "type": "uint256",
                                    "internalType": "uint256"
                              },
                              {
                                    "name": "totalRebalanced",
                                    "type": "uint256",
                                    "internalType": "uint256"
                              },
                              {
                                    "name": "unlockedBps",
                                    "type": "uint256",
                                    "internalType": "uint256"
                              },
                              {
                                    "name": "roiTierTimestamp",
                                    "type": "uint256",
                                    "internalType": "uint256"
                              },
                              {
                                    "name": "lastPermissionlessRebalance",
                                    "type": "uint256",
                                    "internalType": "uint256"
                              }
                        ]
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "lastActionTime",
            "inputs": [
                  {
                        "name": "",
                        "type": "uint8",
                        "internalType": "enum TreasuryManagerV2.ActionType"
                  }
            ],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "lastOperatorRebalanceTime",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "officialPool",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "address",
                        "internalType": "address"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "operator",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "address",
                        "internalType": "address"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "operatorSlippageBps",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "owner",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "address",
                        "internalType": "address"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "ownerBuybackWithWETH",
            "inputs": [
                  {
                        "name": "amountIn",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
      },
      {
            "type": "function",
            "name": "pendingOwner",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "address",
                        "internalType": "address"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "permissionlessDailyUsageETH",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "permissionlessDayStart",
            "inputs": [],
            "outputs": [
                  {
                        "name": "",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "permissionlessRebalance",
            "inputs": [
                  {
                        "name": "token",
                        "type": "address",
                        "internalType": "address"
                  },
                  {
                        "name": "amount",
                        "type": "uint256",
                        "internalType": "uint256"
                  },
                  {
                        "name": "pathToWETH",
                        "type": "bytes",
                        "internalType": "bytes"
                  },
                  {
                        "name": "pathToUSDC",
                        "type": "bytes",
                        "internalType": "bytes"
                  }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
      },
      {
            "type": "function",
            "name": "rebalance",
            "inputs": [
                  {
                        "name": "token",
                        "type": "address",
                        "internalType": "address"
                  },
                  {
                        "name": "amount",
                        "type": "uint256",
                        "internalType": "uint256"
                  },
                  {
                        "name": "pathToWETH",
                        "type": "bytes",
                        "internalType": "bytes"
                  },
                  {
                        "name": "pathToUSDC",
                        "type": "bytes",
                        "internalType": "bytes"
                  }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
      },
      {
            "type": "function",
            "name": "renounceOwnership",
            "inputs": [],
            "outputs": [],
            "stateMutability": "nonpayable"
      },
      {
            "type": "function",
            "name": "rescueDeadPoolToken",
            "inputs": [
                  {
                        "name": "token",
                        "type": "address",
                        "internalType": "address"
                  },
                  {
                        "name": "pathToWETH",
                        "type": "bytes",
                        "internalType": "bytes"
                  }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
      },
      {
            "type": "function",
            "name": "setOperator",
            "inputs": [
                  {
                        "name": "_operator",
                        "type": "address",
                        "internalType": "address"
                  }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
      },
      {
            "type": "function",
            "name": "setSlippage",
            "inputs": [
                  {
                        "name": "bps",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
      },
      {
            "type": "function",
            "name": "stake",
            "inputs": [
                  {
                        "name": "amount",
                        "type": "uint256",
                        "internalType": "uint256"
                  },
                  {
                        "name": "poolId",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
      },
      {
            "type": "function",
            "name": "tokenPositions",
            "inputs": [
                  {
                        "name": "",
                        "type": "address",
                        "internalType": "address"
                  }
            ],
            "outputs": [
                  {
                        "name": "totalCostBasis",
                        "type": "uint256",
                        "internalType": "uint256"
                  },
                  {
                        "name": "totalAcquired",
                        "type": "uint256",
                        "internalType": "uint256"
                  },
                  {
                        "name": "totalRebalanced",
                        "type": "uint256",
                        "internalType": "uint256"
                  },
                  {
                        "name": "unlockedBps",
                        "type": "uint256",
                        "internalType": "uint256"
                  },
                  {
                        "name": "roiTierTimestamp",
                        "type": "uint256",
                        "internalType": "uint256"
                  },
                  {
                        "name": "lastPermissionlessRebalance",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "stateMutability": "view"
      },
      {
            "type": "function",
            "name": "transferOwnership",
            "inputs": [
                  {
                        "name": "newOwner",
                        "type": "address",
                        "internalType": "address"
                  }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
      },
      {
            "type": "function",
            "name": "unstake",
            "inputs": [
                  {
                        "name": "poolId",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
      },
      {
            "type": "function",
            "name": "updateCaps",
            "inputs": [
                  {
                        "name": "action",
                        "type": "uint8",
                        "internalType": "enum TreasuryManagerV2.ActionType"
                  },
                  {
                        "name": "perAction",
                        "type": "uint256",
                        "internalType": "uint256"
                  },
                  {
                        "name": "perDay",
                        "type": "uint256",
                        "internalType": "uint256"
                  }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
      },
      {
            "type": "event",
            "name": "BurnExecuted",
            "inputs": [
                  {
                        "name": "amount",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  }
            ],
            "anonymous": false
      },
      {
            "type": "event",
            "name": "BuybackExecuted",
            "inputs": [
                  {
                        "name": "inputToken",
                        "type": "address",
                        "indexed": true,
                        "internalType": "address"
                  },
                  {
                        "name": "amountIn",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  },
                  {
                        "name": "tusdReceived",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  }
            ],
            "anonymous": false
      },
      {
            "type": "event",
            "name": "CapsUpdated",
            "inputs": [
                  {
                        "name": "action",
                        "type": "uint8",
                        "indexed": true,
                        "internalType": "enum TreasuryManagerV2.ActionType"
                  },
                  {
                        "name": "perAction",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  },
                  {
                        "name": "perDay",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  }
            ],
            "anonymous": false
      },
      {
            "type": "event",
            "name": "DeadPoolRescued",
            "inputs": [
                  {
                        "name": "token",
                        "type": "address",
                        "indexed": true,
                        "internalType": "address"
                  },
                  {
                        "name": "amount",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  }
            ],
            "anonymous": false
      },
      {
            "type": "event",
            "name": "OperatorSet",
            "inputs": [
                  {
                        "name": "newOperator",
                        "type": "address",
                        "indexed": true,
                        "internalType": "address"
                  }
            ],
            "anonymous": false
      },
      {
            "type": "event",
            "name": "OwnershipTransferStarted",
            "inputs": [
                  {
                        "name": "previousOwner",
                        "type": "address",
                        "indexed": true,
                        "internalType": "address"
                  },
                  {
                        "name": "newOwner",
                        "type": "address",
                        "indexed": true,
                        "internalType": "address"
                  }
            ],
            "anonymous": false
      },
      {
            "type": "event",
            "name": "OwnershipTransferred",
            "inputs": [
                  {
                        "name": "previousOwner",
                        "type": "address",
                        "indexed": true,
                        "internalType": "address"
                  },
                  {
                        "name": "newOwner",
                        "type": "address",
                        "indexed": true,
                        "internalType": "address"
                  }
            ],
            "anonymous": false
      },
      {
            "type": "event",
            "name": "PermissionlessRebalanceExecuted",
            "inputs": [
                  {
                        "name": "token",
                        "type": "address",
                        "indexed": true,
                        "internalType": "address"
                  },
                  {
                        "name": "amount",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  },
                  {
                        "name": "tusdReceived",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  },
                  {
                        "name": "usdcSent",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  }
            ],
            "anonymous": false
      },
      {
            "type": "event",
            "name": "RebalanceExecuted",
            "inputs": [
                  {
                        "name": "token",
                        "type": "address",
                        "indexed": true,
                        "internalType": "address"
                  },
                  {
                        "name": "amount",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  },
                  {
                        "name": "tusdReceived",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  },
                  {
                        "name": "usdcSent",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  }
            ],
            "anonymous": false
      },
      {
            "type": "event",
            "name": "SlippageUpdated",
            "inputs": [
                  {
                        "name": "newBps",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  }
            ],
            "anonymous": false
      },
      {
            "type": "event",
            "name": "StakeExecuted",
            "inputs": [
                  {
                        "name": "amount",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  },
                  {
                        "name": "poolId",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  }
            ],
            "anonymous": false
      },
      {
            "type": "event",
            "name": "TokenBought",
            "inputs": [
                  {
                        "name": "token",
                        "type": "address",
                        "indexed": true,
                        "internalType": "address"
                  },
                  {
                        "name": "ethSpent",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  },
                  {
                        "name": "tokensReceived",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  },
                  {
                        "name": "routeType",
                        "type": "uint8",
                        "indexed": false,
                        "internalType": "uint8"
                  }
            ],
            "anonymous": false
      },
      {
            "type": "event",
            "name": "UnstakeExecuted",
            "inputs": [
                  {
                        "name": "poolId",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  },
                  {
                        "name": "amount",
                        "type": "uint256",
                        "indexed": false,
                        "internalType": "uint256"
                  }
            ],
            "anonymous": false
      },
      {
            "type": "error",
            "name": "CircuitBreakerTriggered",
            "inputs": []
      },
      {
            "type": "error",
            "name": "CooldownNotElapsed",
            "inputs": []
      },
      {
            "type": "error",
            "name": "DeadPoolThresholdNotMet",
            "inputs": []
      },
      {
            "type": "error",
            "name": "ExceedsDailyCap",
            "inputs": []
      },
      {
            "type": "error",
            "name": "ExceedsPerActionCap",
            "inputs": []
      },
      {
            "type": "error",
            "name": "InsufficientBalance",
            "inputs": []
      },
      {
            "type": "error",
            "name": "InsufficientROI",
            "inputs": []
      },
      {
            "type": "error",
            "name": "InvalidPath",
            "inputs": []
      },
      {
            "type": "error",
            "name": "InvalidRouteType",
            "inputs": []
      },
      {
            "type": "error",
            "name": "NotOperator",
            "inputs": []
      },
      {
            "type": "error",
            "name": "OperatorStillActive",
            "inputs": []
      },
      {
            "type": "error",
            "name": "OutputTokenMismatch",
            "inputs": []
      },
      {
            "type": "error",
            "name": "OwnableInvalidOwner",
            "inputs": [
                  {
                        "name": "owner",
                        "type": "address",
                        "internalType": "address"
                  }
            ]
      },
      {
            "type": "error",
            "name": "OwnableUnauthorizedAccount",
            "inputs": [
                  {
                        "name": "account",
                        "type": "address",
                        "internalType": "address"
                  }
            ]
      },
      {
            "type": "error",
            "name": "PermissionlessCapExceeded",
            "inputs": []
      },
      {
            "type": "error",
            "name": "ReentrancyGuardReentrantCall",
            "inputs": []
      },
      {
            "type": "error",
            "name": "SafeERC20FailedOperation",
            "inputs": [
                  {
                        "name": "token",
                        "type": "address",
                        "internalType": "address"
                  }
            ]
      },
      {
            "type": "error",
            "name": "UnlockConditionsNotMet",
            "inputs": []
      },
      {
            "type": "error",
            "name": "ZeroAmount",
            "inputs": []
      }
],
      inheritedFunctions: {},
    },
  },
} as const;

export default deployedContracts satisfies GenericContractsDeclaration;
