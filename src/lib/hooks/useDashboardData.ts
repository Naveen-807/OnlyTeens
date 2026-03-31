"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api/client";
import { useAuthStore } from "@/store/authStore";
import type { TeenBalances, PassportState, ApprovalRequest } from "@/lib/types";
import type { StoredReceipt } from "@/lib/receipts/receiptStore";

interface ReceiptsListResponse {
  success: true;
  receipts: StoredReceipt[];
  items?: StoredReceipt[];
  count: number;
}

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
      const refreshResult = await useAuthStore.getState().refreshState();

      // Fetch receipts from durable store
      const data = await fetchApi<ReceiptsListResponse>(
        `/api/receipts/list?familyId=${encodeURIComponent(family.familyId)}`,
        undefined,
        "Failed to load receipts",
      );
      setReceipts(data.receipts ?? data.items ?? []);

      if (!refreshResult.success) {
        setError(refreshResult.error || "Failed to refresh dashboard state");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
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
