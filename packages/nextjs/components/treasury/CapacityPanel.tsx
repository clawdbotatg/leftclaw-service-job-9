"use client";

import { Address } from "@scaffold-ui/components";
import { formatEther, formatUnits } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const CapacityPanel = () => {
  const { data: wethCap } = useScaffoldReadContract({
    contractName: "TreasuryManagerV2",
    functionName: "getRemainingDailyCap",
    args: [0] as const, // BuybackWETH
  });

  const { data: usdcCap } = useScaffoldReadContract({
    contractName: "TreasuryManagerV2",
    functionName: "getRemainingDailyCap",
    args: [1], // BuybackUSDC
  });

  const { data: burnCap } = useScaffoldReadContract({
    contractName: "TreasuryManagerV2",
    functionName: "getRemainingDailyCap",
    args: [2], // Burn
  });

  const { data: stakeCap } = useScaffoldReadContract({
    contractName: "TreasuryManagerV2",
    functionName: "getRemainingDailyCap",
    args: [3], // Stake
  });

  const { data: wethCooldown } = useScaffoldReadContract({
    contractName: "TreasuryManagerV2",
    functionName: "getCooldownRemaining",
    args: [0],
  });

  const { data: operator } = useScaffoldReadContract({
    contractName: "TreasuryManagerV2",
    functionName: "operator",
  });

  const formatCooldown = (seconds: bigint | undefined) => {
    if (!seconds || seconds === 0n) return "Ready";
    const mins = Number(seconds) / 60;
    return `${Math.ceil(mins)}m remaining`;
  };

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-xl">📊 Capacity & Status</h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span>Operator:</span>
            <span>{operator ? <Address address={operator as `0x${string}`} /> : "Not set"}</span>
          </div>

          <div className="divider my-1"></div>

          <div className="font-semibold">Daily Caps Remaining:</div>

          <div className="flex justify-between">
            <span>WETH Buyback:</span>
            <span>{wethCap !== undefined ? formatEther(wethCap) : "..."} ETH</span>
          </div>

          <div className="flex justify-between">
            <span>USDC Buyback:</span>
            <span>{usdcCap !== undefined ? formatUnits(usdcCap, 6) : "..."} USDC</span>
          </div>

          <div className="flex justify-between">
            <span>Burn:</span>
            <span>{burnCap !== undefined ? formatEther(burnCap) : "..."} ₸USD</span>
          </div>

          <div className="flex justify-between">
            <span>Stake:</span>
            <span>{stakeCap !== undefined ? formatEther(stakeCap) : "..."} ₸USD</span>
          </div>

          <div className="divider my-1"></div>

          <div className="flex justify-between">
            <span>WETH Cooldown:</span>
            <span className={wethCooldown === 0n ? "text-success" : "text-warning"}>
              {formatCooldown(wethCooldown)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
