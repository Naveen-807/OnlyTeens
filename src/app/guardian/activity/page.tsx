"use client";

import { useEffect, useState } from "react";

import { fetchApi } from "@/lib/api/client";
import { ActivityFeed, type ActivityItem } from "@/components/ActivityFeed";
import { useAuthStore } from "@/store/authStore";
import type { StoredReceipt } from "@/lib/receipts/receiptStore";

export default function GuardianActivityPage() {
  const { family } = useAuthStore();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!family?.familyId) {
        setItems([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchApi<{ success: true; receipts: StoredReceipt[] }>(
          `/api/receipts/list?familyId=${encodeURIComponent(family.familyId)}`,
          undefined,
          "Failed to load activity",
        );

        const mapped: ActivityItem[] = (data.receipts || []).map((receipt) => ({
          id: receipt.id,
          type: receipt.type as ActivityItem["type"],
          description: receipt.description,
          amount: receipt.amount,
          decision: receipt.decision as ActivityItem["decision"],
          flowTxHash: receipt.flowTxHash,
          storachaCid: receipt.storachaCid,
          passportLevel: receipt.passportLevel,
          timestamp: receipt.timestamp,
        }));

        if (!cancelled) {
          setItems(mapped);
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setItems([]);
          setError(loadError instanceof Error ? loadError.message : "Failed to load activity");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
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
