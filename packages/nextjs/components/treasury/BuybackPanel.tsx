"use client";

import { useState } from "react";
import { parseEther, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const BuybackPanel = () => {
  const [wethAmount, setWethAmount] = useState("");
  const [usdcAmount, setUsdcAmount] = useState("");
  const [wethError, setWethError] = useState<string | null>(null);
  const [usdcError, setUsdcError] = useState<string | null>(null);

  const { address: connectedAddress } = useAccount();

  const { data: operator } = useScaffoldReadContract({
    contractName: "TreasuryManagerV2",
    functionName: "operator",
  });

  const isOperator = connectedAddress && operator && connectedAddress.toLowerCase() === String(operator).toLowerCase();

  const { writeContractAsync: writeBuybackWETH, isMining: isBuybackWETHMining } =
    useScaffoldWriteContract("TreasuryManagerV2");

  const { writeContractAsync: writeBuybackUSDC, isMining: isBuybackUSDCMining } =
    useScaffoldWriteContract("TreasuryManagerV2");

  const handleBuybackWETH = async () => {
    if (!wethAmount) return;
    setWethError(null);
    try {
      await writeBuybackWETH({
        functionName: "buybackWithWETH",
        args: [parseEther(wethAmount)],
      });
      setWethAmount("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      if (msg.includes("NotOperator")) setWethError("Not authorized — only the operator can execute buybacks.");
      else if (msg.includes("ExceedsPerActionCap")) setWethError("Exceeds per-action cap (max 0.5 ETH).");
      else if (msg.includes("ExceedsDailyCap")) setWethError("Daily cap exceeded. Try again tomorrow.");
      else if (msg.includes("CooldownNotElapsed")) setWethError("Cooldown active. Wait 60 minutes between actions.");
      else if (msg.includes("User rejected")) setWethError("Transaction cancelled.");
      else setWethError("Buyback failed. Check console for details.");
      console.error("Buyback WETH failed:", e);
    }
  };

  const handleBuybackUSDC = async () => {
    if (!usdcAmount) return;
    setUsdcError(null);
    try {
      await writeBuybackUSDC({
        functionName: "buybackWithUSDC",
        args: [parseUnits(usdcAmount, 6)],
      });
      setUsdcAmount("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      if (msg.includes("NotOperator")) setUsdcError("Not authorized — only the operator can execute buybacks.");
      else if (msg.includes("ExceedsPerActionCap")) setUsdcError("Exceeds per-action cap (max 2,000 USDC).");
      else if (msg.includes("ExceedsDailyCap")) setUsdcError("Daily cap exceeded. Try again tomorrow.");
      else if (msg.includes("CooldownNotElapsed")) setUsdcError("Cooldown active. Wait 60 minutes between actions.");
      else if (msg.includes("User rejected")) setUsdcError("Transaction cancelled.");
      else setUsdcError("Buyback failed. Check console for details.");
      console.error("Buyback USDC failed:", e);
    }
  };

  if (!connectedAddress) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl">💱 Buyback ₸USD</h2>
          <p className="text-sm text-base-content/60">Connect wallet to execute buybacks.</p>
        </div>
      </div>
    );
  }

  if (!isOperator) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl">💱 Buyback ₸USD</h2>
          <p className="text-sm text-warning">
            ⚠️ Connected wallet is not the operator. Only the operator can execute buybacks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-xl">💱 Buyback ₸USD</h2>

        <div className="space-y-4">
          {/* WETH Buyback */}
          <div>
            <label className="label">
              <span className="label-text font-semibold">Buy with WETH</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="Amount in ETH"
                className="input input-bordered flex-1"
                value={wethAmount}
                onChange={e => {
                  setWethAmount(e.target.value);
                  setWethError(null);
                }}
                disabled={isBuybackWETHMining}
              />
              <button
                className={`btn btn-primary ${isBuybackWETHMining ? "loading" : ""}`}
                onClick={handleBuybackWETH}
                disabled={isBuybackWETHMining || !wethAmount}
              >
                {isBuybackWETHMining ? "⏳ Buying..." : "Buy ₸USD"}
              </button>
            </div>
            <label className="label">
              <span className="label-text-alt text-base-content/50">Max: 0.5 ETH per action</span>
            </label>
            {wethError && <p className="text-error text-sm mt-1">{wethError}</p>}
          </div>

          <div className="divider my-0"></div>

          {/* USDC Buyback */}
          <div>
            <label className="label">
              <span className="label-text font-semibold">Buy with USDC</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="1"
                placeholder="Amount in USDC"
                className="input input-bordered flex-1"
                value={usdcAmount}
                onChange={e => {
                  setUsdcAmount(e.target.value);
                  setUsdcError(null);
                }}
                disabled={isBuybackUSDCMining}
              />
              <button
                className={`btn btn-primary ${isBuybackUSDCMining ? "loading" : ""}`}
                onClick={handleBuybackUSDC}
                disabled={isBuybackUSDCMining || !usdcAmount}
              >
                {isBuybackUSDCMining ? "⏳ Buying..." : "Buy ₸USD"}
              </button>
            </div>
            <label className="label">
              <span className="label-text-alt text-base-content/50">Max: 2,000 USDC per action</span>
            </label>
            {usdcError && <p className="text-error text-sm mt-1">{usdcError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
