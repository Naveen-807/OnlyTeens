"use client";

import { useEffect, useState } from "react";

import { ActivityFeed, type ActivityItem } from "@/components/ActivityFeed";
import { useAuthStore } from "@/store/authStore";

export default function GuardianActivityPage() {
  const { family } = useAuthStore();
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!family?.familyId) return;
      const res = await fetch(
        `/api/receipts/list?familyId=${encodeURIComponent(family.familyId)}`
      );
      const data = await res.json();
      if (!data.success) return;

      const mapped: ActivityItem[] = (data.receipts || []).map((r: any) => ({
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
      setItems(mapped);
    };
    void run();
  }, [family?.familyId]);

  return <ActivityFeed items={items} />;
}
