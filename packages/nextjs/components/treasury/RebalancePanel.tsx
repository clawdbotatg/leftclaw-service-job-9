"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const RebalancePanel = () => {
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");
  const [feeTier, setFeeTier] = useState("3000");
  const [error, setError] = useState<string | null>(null);

  const { address: connectedAddress } = useAccount();

  const { data: operator } = useScaffoldReadContract({
    contractName: "TreasuryManagerV2",
    functionName: "operator",
  });

  const isOperator = connectedAddress && operator && connectedAddress.toLowerCase() === String(operator).toLowerCase();

  const { writeContractAsync, isMining } = useScaffoldWriteContract("TreasuryManagerV2");

  const handleRebalance = async () => {
    if (!token || !amount) return;
    setError(null);
    const WETH = "0x4200000000000000000000000000000000000006";
    const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

    // Encode fee tier as 3-byte hex (e.g., 500 = 0x0001f4, 3000 = 0x000bb8, 10000 = 0x002710)
    const feeHex = Number(feeTier).toString(16).padStart(6, "0");
    // V3 path: token → fee → WETH
    const pathToWETH = token.toLowerCase() + feeHex + WETH.slice(2).toLowerCase();
    // V3 path: token → fee → USDC
    const pathToUSDC = token.toLowerCase() + feeHex + USDC.slice(2).toLowerCase();

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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      if (msg.includes("NotOperator")) setError("Not authorized.");
      else if (msg.includes("ExceedsPerActionCap")) setError("Exceeds per-action cap.");
      else if (msg.includes("CooldownNotElapsed")) setError("Cooldown active. Wait 60 minutes.");
      else if (msg.includes("User rejected")) setError("Transaction cancelled.");
      else setError("Rebalance failed. Check console for details.");
      console.error("Rebalance failed:", e);
    }
  };

  if (!connectedAddress) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl">⚖️ Rebalance</h2>
          <p className="text-sm text-base-content/60">Connect wallet to rebalance.</p>
        </div>
      </div>
    );
  }

  if (!isOperator) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl">⚖️ Rebalance</h2>
          <p className="text-sm text-warning">⚠️ Connected wallet is not the operator.</p>
        </div>
      </div>
    );
  }

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
              onChange={e => {
                setToken(e.target.value);
                setError(null);
              }}
              disabled={isMining}
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text font-semibold">Fee Tier</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={feeTier}
              onChange={e => setFeeTier(e.target.value)}
              disabled={isMining}
            >
              <option value="100">0.01% (Stablecoins)</option>
              <option value="500">0.05% (Common pairs)</option>
              <option value="3000">0.3% (Standard)</option>
              <option value="10000">1% (Exotic pairs)</option>
            </select>
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
                onChange={e => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                disabled={isMining}
              />
              <button
                className={`btn btn-accent ${isMining ? "loading" : ""}`}
                onClick={handleRebalance}
                disabled={isMining || !token || !amount}
              >
                {isMining ? "⏳ Rebalancing..." : "Rebalance"}
              </button>
            </div>
          </div>
          {error && <p className="text-error text-sm mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
};
