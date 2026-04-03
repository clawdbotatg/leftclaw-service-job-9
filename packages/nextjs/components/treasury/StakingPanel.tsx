"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const StakingPanel = () => {
  const [stakeAmount, setStakeAmount] = useState("");
  const [poolId, setPoolId] = useState("0");
  const [stakeError, setStakeError] = useState<string | null>(null);
  const [unstakeError, setUnstakeError] = useState<string | null>(null);

  const { address: connectedAddress } = useAccount();

  const { data: operator } = useScaffoldReadContract({
    contractName: "TreasuryManagerV2",
    functionName: "operator",
  });

  const isOperator = connectedAddress && operator && connectedAddress.toLowerCase() === String(operator).toLowerCase();

  const { writeContractAsync: writeStake, isMining: isStaking } = useScaffoldWriteContract("TreasuryManagerV2");
  const { writeContractAsync: writeUnstake, isMining: isUnstaking } = useScaffoldWriteContract("TreasuryManagerV2");

  const handleStake = async () => {
    if (!stakeAmount) return;
    setStakeError(null);
    try {
      await writeStake({
        functionName: "stake",
        args: [parseEther(stakeAmount), BigInt(poolId)],
      });
      setStakeAmount("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      if (msg.includes("NotOperator")) setStakeError("Not authorized.");
      else if (msg.includes("ExceedsPerActionCap")) setStakeError("Exceeds per-action cap.");
      else if (msg.includes("CooldownNotElapsed")) setStakeError("Cooldown active. Wait 60 minutes.");
      else if (msg.includes("User rejected")) setStakeError("Transaction cancelled.");
      else setStakeError("Stake failed.");
      console.error("Stake failed:", e);
    }
  };

  const handleUnstake = async () => {
    setUnstakeError(null);
    try {
      await writeUnstake({
        functionName: "unstake",
        args: [BigInt(poolId)],
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      if (msg.includes("InsufficientBalance")) setUnstakeError("No staked balance in this pool.");
      else if (msg.includes("User rejected")) setUnstakeError("Transaction cancelled.");
      else setUnstakeError("Unstake failed.");
      console.error("Unstake failed:", e);
    }
  };

  if (!connectedAddress) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl">🥩 Staking</h2>
          <p className="text-sm text-base-content/60">Connect wallet to manage staking.</p>
        </div>
      </div>
    );
  }

  if (!isOperator) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl">🥩 Staking</h2>
          <p className="text-sm text-warning">⚠️ Connected wallet is not the operator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-xl">🥩 Staking</h2>

        <div className="space-y-3">
          <div>
            <label className="label">
              <span className="label-text font-semibold">Pool ID</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="Pool ID"
              className="input input-bordered w-full"
              value={poolId}
              onChange={e => setPoolId(e.target.value)}
              disabled={isStaking || isUnstaking}
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text font-semibold">Stake ₸USD</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="1000"
                placeholder="Amount to stake"
                className="input input-bordered flex-1"
                value={stakeAmount}
                onChange={e => {
                  setStakeAmount(e.target.value);
                  setStakeError(null);
                }}
                disabled={isStaking}
              />
              <button
                className={`btn btn-success ${isStaking ? "loading" : ""}`}
                onClick={handleStake}
                disabled={isStaking || !stakeAmount}
              >
                {isStaking ? "⏳ Staking..." : "Stake"}
              </button>
            </div>
            {stakeError && <p className="text-error text-sm mt-1">{stakeError}</p>}
          </div>

          <div className="divider my-0"></div>

          <button
            className={`btn btn-warning w-full ${isUnstaking ? "loading" : ""}`}
            onClick={handleUnstake}
            disabled={isUnstaking}
          >
            {isUnstaking ? "⏳ Unstaking..." : "Unstake All from Pool"}
          </button>
          {unstakeError && <p className="text-error text-sm mt-1">{unstakeError}</p>}
          <p className="text-xs text-base-content/50">Unstake has no cooldown or cap limit.</p>
        </div>
      </div>
    </div>
  );
};
