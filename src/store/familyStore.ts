"use client";

import { create } from "zustand";

import type {
  ApprovalRequest,
  PassportState,
  ScheduleInfo,
  TeenBalances,
} from "@/lib/types";

interface ReceiptEntry {
  id: string;
  type: string;
  description: string;
  amount: string;
  decision: string;
  flowTxHash: string;
  storachaCid: string;
  passportLevel: number;
  timestamp: string;
}

interface FamilyState {
  familyId: string | null;
  balances: TeenBalances | null;
  passport: PassportState | null;
  pendingApprovals: ApprovalRequest[];
  receipts: ReceiptEntry[];
  schedules: ScheduleInfo[];

  setFamilyId: (id: string) => void;
  setBalances: (b: TeenBalances) => void;
  setPassport: (p: PassportState) => void;
  setPendingApprovals: (a: ApprovalRequest[]) => void;
  addReceipt: (r: ReceiptEntry) => void;
  setReceipts: (r: ReceiptEntry[]) => void;
  setSchedules: (s: ScheduleInfo[]) => void;

  refreshAll: () => Promise<void>;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  familyId: null,
  balances: null,
  passport: null,
  pendingApprovals: [],
  receipts: [],
  schedules: [],

  setFamilyId: (id) => set({ familyId: id }),
  setBalances: (b) => set({ balances: b }),
  setPassport: (p) => set({ passport: p }),
  setPendingApprovals: (a) => set({ pendingApprovals: a }),
  addReceipt: (r) => set((state) => ({ receipts: [r, ...state.receipts] })),
  setReceipts: (r) => set({ receipts: r }),
  setSchedules: (s) => set({ schedules: s }),

  refreshAll: async () => {
    const familyId = get().familyId;
    if (!familyId) return;

    const approvalsRes = await fetch(`/api/approval/list?familyId=${encodeURIComponent(familyId)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const approvalsJson = await approvalsRes.json();
    set({ pendingApprovals: approvalsJson.approvals || [] });

    const receiptsRes = await fetch(`/api/receipts/list?familyId=${encodeURIComponent(familyId)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const receiptsJson = await receiptsRes.json();
    set({ receipts: receiptsJson.receipts || [] });
  },
}));

