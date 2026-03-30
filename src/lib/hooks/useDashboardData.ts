"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import type { TeenBalances, PassportState, ApprovalRequest } from "@/lib/types";
import type { StoredReceipt } from "@/lib/receipts/receiptStore";

interface DashboardData {
  balances: TeenBalances | null;
  passport: PassportState | null;
  pendingApprovals: ApprovalRequest[];
  receipts: StoredReceipt[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
  const { family } = useAuthStore();
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!family?.familyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setReceipts([]);

    try {
      // Refresh auth store (balances, passport, approvals)
      await useAuthStore.getState().refreshState();

      // Fetch receipts from durable store
      const res = await fetch(
        `/api/receipts/list?familyId=${encodeURIComponent(family.familyId)}`
      );
      const data = await res.json();
      if (data.success) {
        setReceipts(data.receipts);
      } else {
        setError(data.error || "Failed to load receipts");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [family?.familyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const state = useAuthStore.getState();

  return {
    balances: state.balances,
    passport: state.passport,
    pendingApprovals: state.pendingApprovals,
    receipts,
    isLoading,
    error,
    refresh,
  };
}
