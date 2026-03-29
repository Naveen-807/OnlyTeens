"use client";

import { useMemo, useState } from "react";

import type { FlowResult, UserSession } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

const FLOW_STEPS = [
  "Lit checking",
  "Zama evaluating",
  "Flow executing",
  "Storacha storing",
  "Passport updating",
];

export function SavingsFlow({
  session,
  familyId,
  teenAddress,
  guardianAddress,
  teenName,
  clawrencePublicKey,
  clawrencePkpTokenId,
}: {
  session: UserSession;
  familyId: `0x${string}`;
  teenAddress: `0x${string}`;
  guardianAddress: `0x${string}` | string;
  teenName: string;
  clawrencePublicKey: string;
  clawrencePkpTokenId: string;
}) {
  const [amount, setAmount] = useState("1");
  const [isRecurring, setIsRecurring] = useState(false);
  const [interval, setInterval] = useState<"weekly" | "monthly">("weekly");
  const [result, setResult] = useState<FlowResult | null>(null);
  const [loading, setLoading] = useState(false);

  const activeStep = useMemo(() => {
    if (loading) return FLOW_STEPS.length - 1;
    if (result?.success) return FLOW_STEPS.length - 1;
    return -1;
  }, [loading, result?.success]);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/savings/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          familyId,
          teenAddress,
          guardianAddress,
          teenName,
          amount,
          isRecurring,
          interval,
          clawrencePublicKey,
          clawrencePkpTokenId,
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        await useAuthStore.getState().refreshState();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
      <h2 className="text-lg font-bold">💰 Savings</h2>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium">Amount (FLOW)</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border px-3 py-2"
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
          Make it recurring
        </label>

        {isRecurring ? (
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as "weekly" | "monthly")}
            className="w-full rounded-xl border px-3 py-2"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        ) : null}

        <button
          onClick={run}
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Running savings flow..." : "Run savings flow"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-slate-700">Sponsor journey</div>
        <div className="space-y-2">
          {FLOW_STEPS.map((step, index) => {
            const state = loading || result?.success
              ? index < activeStep
                ? "done"
                : index === activeStep
                  ? "active"
                  : "pending"
              : "pending";
            return (
              <div key={step} className="flex items-center gap-3 text-sm">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    state === "done"
                      ? "bg-emerald-100 text-emerald-700"
                      : state === "active"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {index + 1}
                </span>
                <span className={state === "pending" ? "text-slate-400" : "text-slate-700"}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {result ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Result</div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {result.decision}
            </span>
          </div>
          {result.flow?.txHash ? (
            <a
              className="block rounded-xl bg-blue-50 p-3 text-blue-700 hover:bg-blue-100"
              href={result.flow.explorerUrl}
              target="_blank"
              rel="noreferrer"
            >
              🌊 Flow transaction
            </a>
          ) : null}
          {result.lit?.actionCid ? (
            <a
              className="block rounded-xl bg-orange-50 p-3 text-orange-700 hover:bg-orange-100"
              href={`https://ipfs.io/ipfs/${result.lit.actionCid}`}
              target="_blank"
              rel="noreferrer"
            >
              🔐 Lit Action CID: {result.lit.actionCid}
            </a>
          ) : null}
          {result.zama?.decision ? (
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800">
              🔒 Zama decision: {result.zama.decision}
            </div>
          ) : null}
          {result.storacha?.receiptCid ? (
            <a
              className="block rounded-xl bg-purple-50 p-3 text-purple-700 hover:bg-purple-100"
              href={result.storacha.receiptUrl}
              target="_blank"
              rel="noreferrer"
            >
              📦 Storacha CID: {result.storacha.receiptCid}
            </a>
          ) : null}
          {result.clawrence?.celebration ? (
            <div className="rounded-xl bg-slate-50 p-3 text-slate-700">
              {result.clawrence.celebration}
            </div>
          ) : null}
          {result.error ? <div className="text-red-700">{result.error}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
