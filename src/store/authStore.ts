"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchApi, extractApiError } from "@/lib/api/client";
import type {
  UserSession,
  Role,
  TeenBalances,
  PassportState,
  ApprovalRequest,
  AuthChannel,
} from "@/lib/types";
import type { FamilyRecord } from "@/lib/types/onboarding";

interface SessionBootstrapResponse {
  success: true;
  session: UserSession;
  family: FamilyRecord | null;
  balances: TeenBalances | null;
  passport: PassportState | null;
  pendingApprovals: ApprovalRequest[];
}

export interface RefreshStateResult {
  success: boolean;
  error?: string;
}

interface AuthState {
  // Session
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  role: Role | null;

  // Family context (loaded at bootstrap)
  family: FamilyRecord | null;
  balances: TeenBalances | null;
  passport: PassportState | null;
  pendingApprovals: ApprovalRequest[];

  // Actions
  login: (params: {
    role: Role;
    pkpPublicKey: string;
    pkpTokenId: string;
    pkpAddress?: string;
    phoneNumber?: string;
    authMethod: UserSession["authMethod"];
    address: string;
    authChannel?: AuthChannel;
    verificationId?: string;
  }) => Promise<void>;
  setSession: (session: UserSession) => void;
  hydrateBootstrap: (data: {
    session: UserSession;
    family: FamilyRecord | null;
    balances: TeenBalances | null;
    passport: PassportState | null;
    pendingApprovals: ApprovalRequest[];
  }) => void;
  markHydrated: () => void;
  logout: () => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
  refreshState: () => Promise<RefreshStateResult>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      role: null,
      family: null,
      balances: null,
      passport: null,
      pendingApprovals: [],

      setSession: (session) =>
        set({ session, role: session.role, isAuthenticated: true }),

      hydrateBootstrap: (data) =>
        set({
          session: data.session,
          role: data.session.role,
          family: data.family,
          balances: data.balances,
          passport: data.passport,
          pendingApprovals: data.pendingApprovals ?? [],
          isAuthenticated: true,
        }),

      markHydrated: () => set({ hasHydrated: true }),

      setLoading: (loading) => set({ isLoading: loading }),

      login: async (params) => {
        set({ isLoading: true });
        try {
          const data = await fetchApi<SessionBootstrapResponse>(
            "/api/auth/session",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(params),
            },
            "Failed to create Proof18 session",
          );

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
        } catch (error: unknown) {
          set({ isLoading: false });
          throw new Error(extractApiError({ error }, "Failed to create Proof18 session"));
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
        if (!session || !family) {
          return { success: false, error: "Missing session context" };
        }

        try {
          const data = await fetchApi<SessionBootstrapResponse>(
            "/api/auth/session",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                role: session.role,
                pkpPublicKey: session.pkpPublicKey,
                pkpTokenId: session.pkpTokenId,
                pkpAddress: session.pkpAddress,
                authMethod: session.authMethod,
                address: session.address,
                authChannel: session.authChannel,
                phoneNumber: session.phoneNumber,
                verificationId: session.verificationId,
              }),
            },
            "Failed to refresh Proof18 session",
          );

          set({
            family: data.family,
            balances: data.balances,
            passport: data.passport,
            pendingApprovals: data.pendingApprovals ?? [],
          });
          return { success: true };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to refresh Proof18 session";
          return { success: false, error: message };
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
      onRehydrateStorage: () => (state) => {
        state?.markHydrated?.();
      },
    }
  )
);
