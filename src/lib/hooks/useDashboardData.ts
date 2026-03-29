"use client";

import { useCallback, useEffect, useState } from "react";

import type { ApprovalRequest, PassportState, TeenBalances } from "@/lib/types";
import type { StoredReceipt } from "@/lib/receipts/receiptStore";
import { useAuthStore } from "@/store/authStore";

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
  const familyId = useAuthStore((state) => state.family?.familyId);
  const balances = useAuthStore((state) => state.balances);
  const passport = useAuthStore((state) => state.passport);
  const pendingApprovals = useAuthStore((state) => state.pendingApprovals);
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!familyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      await useAuthStore.getState().refreshState();

      const res = await fetch(`/api/receipts/list?familyId=${encodeURIComponent(familyId)}`);
      const data = await res.json();
      if (data.success) {
        setReceipts(data.receipts);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (pendingApprovals.length === 0) return;
    const interval = window.setInterval(() => {
      void refresh();
    }, 10000);
    return () => window.clearInterval(interval);
  }, [pendingApprovals.length, refresh]);

  return {
    balances,
    passport,
    pendingApprovals,
    receipts,
    isLoading,
    error,
    refresh,
  };
}
