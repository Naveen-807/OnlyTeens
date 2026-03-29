"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  ApprovalRequest,
  PassportState,
  Role,
  TeenBalances,
  UserSession,
} from "@/lib/types";
import type { FamilyRecord } from "@/lib/types/onboarding";

interface AuthBootstrapPayload {
  session: UserSession;
  family?: FamilyRecord | null;
  balances?: TeenBalances | null;
  passport?: PassportState | null;
  pendingApprovals?: ApprovalRequest[];
  needsOnboarding?: boolean;
  onboardingMessage?: string;
}

interface AuthState {
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: Role | null;
  family: FamilyRecord | null;
  balances: TeenBalances | null;
  passport: PassportState | null;
  pendingApprovals: ApprovalRequest[];
  needsOnboarding: boolean;
  onboardingMessage: string | null;
  login: (params: {
    role: Role;
    pkpPublicKey: string;
    pkpTokenId: string;
    authMethod: any;
    address: string;
  }) => Promise<void>;
  hydrateSession: (payload: AuthBootstrapPayload) => void;
  setSession: (session: UserSession) => void;
  setFamilyContext: (family: FamilyRecord | null) => void;
  logout: () => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
  refreshState: () => Promise<void>;
}

const emptyAuthState = {
  session: null,
  role: null,
  family: null,
  balances: null,
  passport: null,
  pendingApprovals: [],
  isAuthenticated: false,
  needsOnboarding: false,
  onboardingMessage: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...emptyAuthState,
      isLoading: false,

      hydrateSession: (payload) =>
        set({
          session: payload.session,
          role: payload.session.role,
          family: payload.family ?? null,
          balances: payload.balances ?? null,
          passport: payload.passport ?? null,
          pendingApprovals: payload.pendingApprovals ?? [],
          isAuthenticated: true,
          needsOnboarding: Boolean(payload.needsOnboarding),
          onboardingMessage: payload.onboardingMessage ?? null,
        }),

      setSession: (session) =>
        set({
          session,
          role: session.role,
          isAuthenticated: true,
          needsOnboarding: false,
          onboardingMessage: null,
        }),

      setFamilyContext: (family) => set({ family }),

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
          get().hydrateSession(data);
          set({ isLoading: false });
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => set({ ...emptyAuthState }),
      clearSession: () => set({ ...emptyAuthState }),

      refreshState: async () => {
        const { session } = get();
        if (!session) return;

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
            get().hydrateSession(data);
          }
        } catch {
          // silent refresh failure for demo flow
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
        needsOnboarding: state.needsOnboarding,
        onboardingMessage: state.onboardingMessage,
      }),
    },
  ),
);
