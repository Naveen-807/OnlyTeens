"use client";

import { useMemo, useState } from "react";

import type { FlowResult, UserSession } from "@/lib/types";

export function SubscriptionFlow({
  session,
  familyId,
  teenAddress,
  guardianAddress,
  teenName,
  clawrencePublicKey,
}: {
  session: UserSession;
  familyId: `0x${string}`;
  teenAddress: `0x${string}`;
  guardianAddress: `0x${string}` | string;
  teenName: string;
  serviceNameDefault?: string;
  clawrencePublicKey: string;
}) {
  const [serviceName, setServiceName] = useState("Spotify");
  const [monthlyAmount, setMonthlyAmount] = useState("1");
  const [result, setResult] = useState<FlowResult | null>(null);
  const [loading, setLoading] = useState(false);

  const preview = useMemo(
    () =>
      `Clawrence will evaluate whether ${serviceName} at ${monthlyAmount} FLOW/month fits your passport level and your guardian's encrypted rule set before anything executes.`,
    [monthlyAmount, serviceName],
  );

  const request = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/subscription/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          familyId,
          teenAddress,
          guardianAddress,
          teenName,
          serviceName,
          monthlyAmount,
          clawrencePublicKey,
        }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
      <h2 className="text-lg font-bold">📱 Subscription</h2>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium">Service name</label>
        <input
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          className="w-full rounded-xl border px-3 py-2"
        />

        <label className="block text-sm font-medium">Monthly amount (FLOW)</label>
        <input
          value={monthlyAmount}
          onChange={(e) => setMonthlyAmount(e.target.value)}
          className="w-full rounded-xl border px-3 py-2"
        />

        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">Clawrence preview</div>
          <div className="mt-1">{preview}</div>
        </div>

        <button
          onClick={request}
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Submitting subscription request..." : "Confirm with Clawrence"}
        </button>
      </div>

      {result ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Result</div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {result.decision}
            </span>
          </div>
          {result.clawrence?.preExplanation ? (
            <div className="rounded-xl bg-slate-50 p-3 text-slate-700">
              {result.clawrence.preExplanation}
            </div>
          ) : null}
          {result.requiresApproval ? (
            <div className="rounded-xl bg-amber-50 p-3 text-amber-800">
              Sent to guardian for approval. Pending request: <code>{result.approvalRequestId}</code>
            </div>
          ) : null}
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
              📦 Storacha receipt: {result.storacha.receiptCid}
            </a>
          ) : null}
          {result.passport ? (
            <div className="rounded-xl bg-slate-50 p-3 text-slate-700">
              Passport: Lv.{result.passport.oldLevel} → Lv.{result.passport.newLevel}
            </div>
          ) : null}
          {result.error ? <div className="text-red-700">{result.error}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
