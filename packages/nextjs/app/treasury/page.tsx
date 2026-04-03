"use client";

import type { NextPage } from "next";
import { BurnPanel } from "~~/components/treasury/BurnPanel";
import { BuybackPanel } from "~~/components/treasury/BuybackPanel";
import { CapacityPanel } from "~~/components/treasury/CapacityPanel";
import { RebalancePanel } from "~~/components/treasury/RebalancePanel";
import { StakingPanel } from "~~/components/treasury/StakingPanel";
import { StrategicTokenPanel } from "~~/components/treasury/StrategicTokenPanel";

const TreasuryDashboard: NextPage = () => {
  return (
    <div className="flex flex-col items-center pt-10 px-4">
      <h1 className="text-4xl font-bold mb-2">₸USD Treasury Manager</h1>
      <p className="text-lg text-base-content/70 mb-8 text-center max-w-2xl">
        Manage treasury operations: buybacks, burns, staking, and strategic token rebalancing. Powered by AI Agent
        Operator (AMI).
      </p>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <CapacityPanel />
        <BuybackPanel />
        <BurnPanel />
        <StakingPanel />
        <RebalancePanel />
        <StrategicTokenPanel />
      </div>
    </div>
  );
};

export default TreasuryDashboard;
