"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const BurnPanel = () => {
  const [amount, setAmount] = useState("");

  const { writeContractAsync, isMining } = useScaffoldWriteContract("TreasuryManagerV2");

  const handleBurn = async () => {
    if (!amount) return;
    try {
      await writeContractAsync({
        functionName: "burn",
        args: [parseEther(amount)],
      });
      setAmount("");
    } catch (e) {
      console.error("Burn failed:", e);
    }
  };

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
              onChange={e => setAmount(e.target.value)}
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
        </div>
      </div>
    </div>
  );
};
