"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const StrategicTokenPanel = () => {
  const [tokenAddress, setTokenAddress] = useState("");

  const { data: position } = useScaffoldReadContract({
    contractName: "TreasuryManagerV2",
    functionName: "getTokenPosition",
    args: [tokenAddress as `0x${string}`],
  });

  const { data: lastRebalance } = useScaffoldReadContract({
    contractName: "TreasuryManagerV2",
    functionName: "lastOperatorRebalanceTime",
  });

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-xl">🎯 Strategic Tokens</h2>

        <div className="space-y-3">
          <div>
            <label className="label">
              <span className="label-text font-semibold">Token Address</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              className="input input-bordered w-full font-mono text-sm"
              value={tokenAddress}
              onChange={e => setTokenAddress(e.target.value)}
            />
          </div>

          {position && (
            <div className="bg-base-300 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Cost Basis:</span>
                <span>{formatEther(position.totalCostBasis)} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Tokens Acquired:</span>
                <span>{formatEther(position.totalAcquired)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tokens Rebalanced:</span>
                <span>{formatEther(position.totalRebalanced)}</span>
              </div>
              <div className="flex justify-between">
                <span>Unlocked:</span>
                <span>{Number(position.unlockedBps) / 100}%</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining:</span>
                <span>{formatEther(BigInt(position.totalAcquired) - BigInt(position.totalRebalanced))}</span>
              </div>
            </div>
          )}

          <div className="divider my-1"></div>

          <div className="text-xs text-base-content/50 space-y-1">
            <p>• Permissionless rebalance unlocks at 1000%+ ROI</p>
            <p>• 14-day operator inactivity required</p>
            <p>• Max 0.5 ETH per action, 2 ETH per day</p>
            <p>
              Last operator rebalance:{" "}
              {lastRebalance && lastRebalance > 0n
                ? new Date(Number(lastRebalance) * 1000).toLocaleDateString()
                : "Never"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
