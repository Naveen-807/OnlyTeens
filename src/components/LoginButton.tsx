"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { Role } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface LoginButtonProps {
  role: Extract<Role, "guardian" | "teen">;
  familyId?: string;
  redirectTo?: string;
  label?: string;
  onSuccess?: (payload: any) => Promise<void> | void;
}

export function LoginButton({
  role,
  familyId,
  redirectTo,
  label,
  onSuccess,
}: LoginButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const route = role === "guardian" ? "/api/auth/guardian" : "/api/auth/teen";

  const buttonText = useMemo(() => {
    if (label) return label;
    return role === "guardian" ? "Continue as Guardian" : "Continue as Teen";
  }, [label, role]);

  useEffect(() => {
    if (!clientId || !buttonRef.current || !window.google?.accounts?.id) return;

    const element = buttonRef.current;
    element.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(route, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ googleIdToken: credential, familyId }),
          });
          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error || "Authentication failed");
          }

          useAuthStore.getState().hydrateSession(data);
          await useAuthStore.getState().refreshState();
          await onSuccess?.(data);

          if (!onSuccess) {
            const fallback = role === "guardian" ? "/guardian/onboarding" : "/teen";
            const destination = data.needsOnboarding ? fallback : redirectTo || fallback;
            router.push(destination);
          }
        } catch (caughtError: any) {
          setError(caughtError?.message || "Authentication failed");
        } finally {
          setLoading(false);
        }
      },
    });

    window.google.accounts.id.renderButton(element, {
      theme: "outline",
      size: "large",
      width: 320,
      text: role === "guardian" ? "continue_with" : "signup_with",
      shape: "pill",
      logo_alignment: "left",
    });
  }, [clientId, familyId, onSuccess, redirectTo, role, route, router]);

  if (!clientId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Missing `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-700">{buttonText}</div>
      <div ref={buttonRef} className="min-h-10" />
      {loading ? <div className="text-xs text-slate-500">Minting PKP and opening session...</div> : null}
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </div>
  );
}
