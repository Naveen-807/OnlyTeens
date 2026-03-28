"use client";

import { create } from "zustand";

import type { ApprovalRequest } from "@/lib/types";

interface ApprovalState {
  pending: ApprovalRequest[];
  setPending: (pending: ApprovalRequest[]) => void;
  upsert: (req: ApprovalRequest) => void;
  remove: (id: string) => void;
}

export const useApprovalStore = create<ApprovalState>((set) => ({
  pending: [],
  setPending: (pending) => set({ pending }),
  upsert: (req) =>
    set((state) => ({
      pending: [req, ...state.pending.filter((r) => r.id !== req.id)],
    })),
  remove: (id) =>
    set((state) => ({ pending: state.pending.filter((r) => r.id !== id) })),
}));

