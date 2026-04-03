"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const RebalancePanel = () => {
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");

  const { writeContractAsync, isMining } = useScaffoldWriteContract("TreasuryManagerV2");

  const handleRebalance = async () => {
    if (!token || !amount) return;
    // For prototype, use placeholder paths
    // In production, the AI agent would compute optimal paths
    const WETH = "0x4200000000000000000000000000000000000006";
    const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

    // V3 path: token → 3000 fee → WETH
    const pathToWETH = token.toLowerCase() + "000bb8" + WETH.slice(2).toLowerCase();
    // V3 path: token → 3000 fee → USDC
    const pathToUSDC = token.toLowerCase() + "000bb8" + USDC.slice(2).toLowerCase();

    try {
      await writeContractAsync({
        functionName: "rebalance",
        args: [
          token as `0x${string}`,
          parseEther(amount),
          `0x${pathToWETH.replace("0x", "")}` as `0x${string}`,
          `0x${pathToUSDC.replace("0x", "")}` as `0x${string}`,
        ],
      });
      setAmount("");
    } catch (e) {
      console.error("Rebalance failed:", e);
    }
  };

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-xl">⚖️ Rebalance</h2>
        <p className="text-sm text-base-content/60">75% → WETH → ₸USD buyback. 25% → USDC to owner.</p>

        <div className="space-y-3 mt-2">
          <div>
            <label className="label">
              <span className="label-text font-semibold">Token Address</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              className="input input-bordered w-full font-mono text-sm"
              value={token}
              onChange={e => setToken(e.target.value)}
              disabled={isMining}
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text font-semibold">Amount</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="100"
                placeholder="Token amount"
                className="input input-bordered flex-1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={isMining}
              />
              <button
                className={`btn btn-accent ${isMining ? "loading" : ""}`}
                onClick={handleRebalance}
                disabled={isMining || !token || !amount}
              >
                {isMining ? "⏳" : "Rebalance"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
