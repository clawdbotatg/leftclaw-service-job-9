"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const BurnPanel = () => {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { address: connectedAddress } = useAccount();

  const { data: operator } = useScaffoldReadContract({
    contractName: "TreasuryManagerV2",
    functionName: "operator",
  });

  const isOperator = connectedAddress && operator && connectedAddress.toLowerCase() === String(operator).toLowerCase();

  const { writeContractAsync, isMining } = useScaffoldWriteContract("TreasuryManagerV2");

  const handleBurn = async () => {
    if (!amount) return;
    setError(null);
    try {
      await writeContractAsync({
        functionName: "burn",
        args: [parseEther(amount)],
      });
      setAmount("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      if (msg.includes("NotOperator")) setError("Not authorized — only the operator can burn.");
      else if (msg.includes("ExceedsPerActionCap")) setError("Exceeds per-action cap (max 100M ₸USD).");
      else if (msg.includes("ExceedsDailyCap")) setError("Daily cap exceeded.");
      else if (msg.includes("CooldownNotElapsed")) setError("Cooldown active. Wait 60 minutes.");
      else if (msg.includes("User rejected")) setError("Transaction cancelled.");
      else setError("Burn failed. Check console for details.");
      console.error("Burn failed:", e);
    }
  };

  if (!connectedAddress) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl">🔥 Burn ₸USD</h2>
          <p className="text-sm text-base-content/60">Connect wallet to burn ₸USD.</p>
        </div>
      </div>
    );
  }

  if (!isOperator) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl">🔥 Burn ₸USD</h2>
          <p className="text-sm text-warning">⚠️ Connected wallet is not the operator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-xl">🔥 Burn ₸USD</h2>
        <p className="text-sm text-base-content/60">
          Send ₸USD to dead address (0x...dEaD). Permanently removes from supply.
        </p>

        <div className="mt-2">
          <div className="flex gap-2">
            <input
              type="number"
              step="1000"
              placeholder="Amount of ₸USD to burn"
              className="input input-bordered flex-1"
              value={amount}
              onChange={e => {
                setAmount(e.target.value);
                setError(null);
              }}
              disabled={isMining}
            />
            <button
              className={`btn btn-error ${isMining ? "loading" : ""}`}
              onClick={handleBurn}
              disabled={isMining || !amount}
            >
              {isMining ? "⏳ Burning..." : "🔥 Burn"}
            </button>
          </div>
          <label className="label">
            <span className="label-text-alt text-base-content/50">Max: 100M ₸USD per action</span>
          </label>
          {error && <p className="text-error text-sm mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
};
