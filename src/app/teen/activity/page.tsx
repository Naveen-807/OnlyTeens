"use client";

import { useEffect } from "react";

import { ActivityFeed, type ActivityItem } from "@/components/ActivityFeed";
import { useFamilyStore } from "@/store/familyStore";

export default function TeenActivityPage() {
  const { receipts, refreshAll } = useFamilyStore();

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const items: ActivityItem[] = receipts.map((r) => ({
    id: r.id,
    type: r.type as any,
    description: r.description,
    amount: r.amount,
    decision: r.decision as any,
    flowTxHash: r.flowTxHash,
    storachaCid: r.storachaCid,
    passportLevel: r.passportLevel,
    timestamp: r.timestamp,
  }));

  return <ActivityFeed items={items} />;
}

