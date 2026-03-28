"use client";

import { useMemo } from "react";

import { useProof18Store } from "@/state/proof18-store";

export function useProof18Flows() {
  const store = useProof18Store();

  return useMemo(
    () => ({
      runParentSetupFlow() {
        if (!store.familyCreated) store.createFamily();
        if (!store.teenAdded) store.addTeen();
        if (!store.guardianWalletConnected) store.connectGuardianWallet();
        if (!store.treasuryFunded) store.fundTreasury(450);
        store.setRulesPreset();
      },
      runSavingsFlow(goalId: string) {
        store.addGoalContribution(goalId, 18);
      },
      runSubscriptionFlow() {
        store.requestSubscription("FocusFlow Premium", 14.99);
      },
      approveSubscription(requestId: string) {
        store.approveRequest(requestId);
      },
      denySubscription(requestId: string) {
        store.denyRequest(requestId);
      },
    }),
    [store],
  );
}
