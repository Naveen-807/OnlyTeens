"use client";

import Link from "next/link";

import { LoginButton } from "@/components/LoginButton";

export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <div className="max-w-2xl space-y-3">
        <div className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
          Flow + Lit + Zama + Storacha
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Proof18
        </h1>
        <p className="text-base text-slate-600">
          Teen-first money guardrails with encrypted family rules, Lit-controlled execution,
          Flow settlement, and Storacha evidence.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Guardian
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">Start family onboarding</h2>
            <p className="text-sm leading-6 text-slate-600">
              Authenticate, set encrypted policy thresholds, mint the dedicated Clawrence PKP,
              and register the family on-chain.
            </p>
          </div>
          <div className="mt-6 space-y-4">
            <LoginButton role="guardian" redirectTo="/guardian/onboarding" />
            <Link
              href="/guardian/onboarding"
              className="inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Open guardian onboarding →
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
          <div className="space-y-3">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Teen
            </div>
            <h2 className="text-2xl font-semibold">Enter the teen dashboard</h2>
            <p className="text-sm leading-6 text-slate-300">
              Log in with Google, recover your PKP session, and use save, subscribe, and chat
              flows once your guardian has finished onboarding.
            </p>
          </div>
          <div className="mt-6">
            <LoginButton role="teen" redirectTo="/teen" />
          </div>
        </section>
      </div>
    </main>
  );
}
