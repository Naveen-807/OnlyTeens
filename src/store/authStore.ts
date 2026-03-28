"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Role, UserSession } from "@/lib/types";

interface AuthState {
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (session: UserSession) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
  role: Role | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      setSession: (session) => set({ session, role: session.role, isAuthenticated: true }),
      clearSession: () => set({ session: null, role: null, isAuthenticated: false }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    { name: "proof18-auth" },
  ),
);

