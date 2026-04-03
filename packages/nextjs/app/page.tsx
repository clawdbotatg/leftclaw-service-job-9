"use client";

import Link from "next/link";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 text-center">
        <h1 className="text-center">
          <span className="block text-4xl font-bold">₸USD Treasury Manager v2</span>
          <span className="block text-2xl mt-2 text-base-content/70">AI Agent Operator Dashboard</span>
        </h1>
        <p className="text-lg mt-4 max-w-xl mx-auto text-base-content/60">
          Onchain treasury management for ₸USD (TurboUSD) on Base, operated by AMI (Artificial Monetary Intelligence).
          One-directional token flows: tokens are accumulated, ₸USD can only be bought, staked, or burned — never sold.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 mt-8">
        <Link href="/treasury" className="btn btn-primary btn-lg">
          🏦 Open Treasury Dashboard
        </Link>

        <Link href="/debug" className="btn btn-ghost btn-sm">
          🔧 Debug Contracts
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 px-4 max-w-4xl w-full">
        <div className="card bg-base-200 shadow-md">
          <div className="card-body items-center text-center">
            <h3 className="card-title">💱 Buyback</h3>
            <p className="text-sm">WETH/USDC → ₸USD with daily caps and cooldowns</p>
          </div>
        </div>
        <div className="card bg-base-200 shadow-md">
          <div className="card-body items-center text-center">
            <h3 className="card-title">🔥 Burn</h3>
            <p className="text-sm">Permanently remove ₸USD from supply</p>
          </div>
        </div>
        <div className="card bg-base-200 shadow-md">
          <div className="card-body items-center text-center">
            <h3 className="card-title">⚖️ Rebalance</h3>
            <p className="text-sm">Strategic token rebalancing with permissionless fallback</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
