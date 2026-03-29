"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  UserSession,
  Role,
  TeenBalances,
  PassportState,
  ApprovalRequest,
} from "@/lib/types";

interface AuthState {
  // Session
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: Role | null;

  // Family context (loaded at bootstrap)
  family: any | null;
  balances: TeenBalances | null;
  passport: PassportState | null;
  pendingApprovals: ApprovalRequest[];

  // Actions
  login: (params: {
    role: Role;
    pkpPublicKey: string;
    pkpTokenId: string;
    authMethod: any;
    address: string;
  }) => Promise<void>;
  setSession: (session: UserSession) => void;
  logout: () => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
  refreshState: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      isAuthenticated: false,
      isLoading: false,
      role: null,
      family: null,
      balances: null,
      passport: null,
      pendingApprovals: [],

      setSession: (session) =>
        set({ session, role: session.role, isAuthenticated: true }),

      setLoading: (loading) => set({ isLoading: loading }),

      login: async (params) => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
          });
          const data = await res.json();

          if (!data.success) throw new Error(data.error);

          set({
            session: data.session,
            role: data.session?.role || params.role,
            family: data.family,
            balances: data.balances,
            passport: data.passport,
            pendingApprovals: data.pendingApprovals ?? [],
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          session: null,
          role: null,
          family: null,
          balances: null,
          passport: null,
          pendingApprovals: [],
          isAuthenticated: false,
        });
      },

      clearSession: () => {
        set({
          session: null,
          role: null,
          family: null,
          balances: null,
          passport: null,
          pendingApprovals: [],
          isAuthenticated: false,
        });
      },

      refreshState: async () => {
        const { session, family } = get();
        if (!session || !family) return;

        try {
          const res = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: session.role,
              pkpPublicKey: session.pkpPublicKey,
              pkpTokenId: session.pkpTokenId,
              authMethod: session.authMethod,
              address: session.address,
            }),
          });
          const data = await res.json();
          if (data.success) {
            set({
              balances: data.balances,
              passport: data.passport,
              pendingApprovals: data.pendingApprovals ?? [],
            });
          }
        } catch {
          /* silent refresh failure */
        }
      },
    }),
    {
      name: "proof18-auth",
      partialize: (state) => ({
        session: state.session,
        role: state.role,
        family: state.family,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
