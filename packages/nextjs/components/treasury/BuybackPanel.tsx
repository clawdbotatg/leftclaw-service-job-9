"use client";

import { useState } from "react";
import { parseEther, parseUnits } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const BuybackPanel = () => {
  const [wethAmount, setWethAmount] = useState("");
  const [usdcAmount, setUsdcAmount] = useState("");

  const { writeContractAsync: writeBuybackWETH, isMining: isBuybackWETHMining } =
    useScaffoldWriteContract("TreasuryManagerV2");

  const { writeContractAsync: writeBuybackUSDC, isMining: isBuybackUSDCMining } =
    useScaffoldWriteContract("TreasuryManagerV2");

  const handleBuybackWETH = async () => {
    if (!wethAmount) return;
    try {
      await writeBuybackWETH({
        functionName: "buybackWithWETH",
        args: [parseEther(wethAmount)],
      });
      setWethAmount("");
    } catch (e) {
      console.error("Buyback WETH failed:", e);
    }
  };

  const handleBuybackUSDC = async () => {
    if (!usdcAmount) return;
    try {
      await writeBuybackUSDC({
        functionName: "buybackWithUSDC",
        args: [parseUnits(usdcAmount, 6)],
      });
      setUsdcAmount("");
    } catch (e) {
      console.error("Buyback USDC failed:", e);
    }
  };

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
                onChange={e => setWethAmount(e.target.value)}
                disabled={isBuybackWETHMining}
              />
              <button
                className={`btn btn-primary ${isBuybackWETHMining ? "loading" : ""}`}
                onClick={handleBuybackWETH}
                disabled={isBuybackWETHMining || !wethAmount}
              >
                {isBuybackWETHMining ? "⏳" : "Execute"}
              </button>
            </div>
            <label className="label">
              <span className="label-text-alt text-base-content/50">Max: 0.5 ETH per action</span>
            </label>
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
                onChange={e => setUsdcAmount(e.target.value)}
                disabled={isBuybackUSDCMining}
              />
              <button
                className={`btn btn-primary ${isBuybackUSDCMining ? "loading" : ""}`}
                onClick={handleBuybackUSDC}
                disabled={isBuybackUSDCMining || !usdcAmount}
              >
                {isBuybackUSDCMining ? "⏳" : "Execute"}
              </button>
            </div>
            <label className="label">
              <span className="label-text-alt text-base-content/50">Max: 2,000 USDC per action</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
