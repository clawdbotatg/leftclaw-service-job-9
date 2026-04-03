"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const StakingPanel = () => {
  const [stakeAmount, setStakeAmount] = useState("");
  const [poolId, setPoolId] = useState("0");

  const { writeContractAsync: writeStake, isMining: isStaking } = useScaffoldWriteContract("TreasuryManagerV2");

  const { writeContractAsync: writeUnstake, isMining: isUnstaking } = useScaffoldWriteContract("TreasuryManagerV2");

  const handleStake = async () => {
    if (!stakeAmount) return;
    try {
      await writeStake({
        functionName: "stake",
        args: [parseEther(stakeAmount), BigInt(poolId)],
      });
      setStakeAmount("");
    } catch (e) {
      console.error("Stake failed:", e);
    }
  };

  const handleUnstake = async () => {
    try {
      await writeUnstake({
        functionName: "unstake",
        args: [BigInt(poolId)],
      });
    } catch (e) {
      console.error("Unstake failed:", e);
    }
  };

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
                onChange={e => setStakeAmount(e.target.value)}
                disabled={isStaking}
              />
              <button
                className={`btn btn-success ${isStaking ? "loading" : ""}`}
                onClick={handleStake}
                disabled={isStaking || !stakeAmount}
              >
                {isStaking ? "⏳" : "Stake"}
              </button>
            </div>
          </div>

          <div className="divider my-0"></div>

          <button
            className={`btn btn-warning w-full ${isUnstaking ? "loading" : ""}`}
            onClick={handleUnstake}
            disabled={isUnstaking}
          >
            {isUnstaking ? "⏳ Unstaking..." : "Unstake All from Pool"}
          </button>
          <p className="text-xs text-base-content/50">Unstake has no cooldown or cap limit.</p>
        </div>
      </div>
    </div>
  );
};
