"use client";

import Link from "next/link";
import { useEffect } from "react";

import { LoginButton } from "@/components/LoginButton";
import { useAuthStore } from "@/store/authStore";

export default function TeenLayout({ children }: { children: React.ReactNode }) {
  const { session, family, refreshState, logout } = useAuthStore();

  useEffect(() => {
    if (session) {
      void refreshState();
    }
  }, [refreshState, session]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Link href="/" className="font-bold">
            Proof18
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/teen">Home</Link>
            <Link href="/teen/save">Save</Link>
            <Link href="/teen/subscribe">Subscribe</Link>
            <Link href="/teen/chat">Chat</Link>
            <Link href="/teen/activity">Activity</Link>
            <Link href="/teen/passport">Passport</Link>
            {session ? (
              <button
                onClick={logout}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700"
              >
                Logout
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      {!session ? (
        <div className="mx-auto max-w-3xl p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Teen login required</h2>
            <p className="mt-2 text-sm text-slate-600">
              Authenticate with Google to recover your teen PKP and open the dashboard.
            </p>
            <div className="mt-4">
              <LoginButton role="teen" redirectTo="/teen" />
            </div>
          </div>
        </div>
      ) : null}

      {session && !family ? (
        <div className="mx-auto max-w-3xl p-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            Your guardian still needs to finish onboarding. Once the family is created you will
            see your balances, passport, and approvals here.
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl p-4">{children}</div>
    </div>
  );
}
