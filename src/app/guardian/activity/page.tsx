"use client";

import { useEffect, useState } from "react";

import { ActivityFeed, type ActivityItem } from "@/components/ActivityFeed";
import { useAuthStore } from "@/store/authStore";

export default function GuardianActivityPage() {
  const { family } = useAuthStore();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!family?.familyId) return;
      setIsLoading(true);
      setError(null);
      const res = await fetch(
        `/api/receipts/list?familyId=${encodeURIComponent(family.familyId)}`
      );
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to load activity");
        setIsLoading(false);
        return;
      }

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
      setIsLoading(false);
    };
    void run();
  }, [family?.familyId]);

  if (!family?.familyId) {
    return (
      <div className="mx-auto max-w-md p-6 text-center text-sm text-gray-500">
        Complete onboarding to view activity.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md p-6 text-center text-sm text-gray-400">
        Loading activity...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-4 space-y-3">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      <ActivityFeed items={items} />
    </div>
  );
}
