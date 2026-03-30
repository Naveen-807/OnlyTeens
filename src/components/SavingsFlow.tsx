"use client";

import { useState } from "react";

import type { FlowResult, UserSession } from "@/lib/types";

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
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h2 className="text-lg font-bold">💰 Savings</h2>

      <div className="space-y-2 rounded-lg border p-4">
        <label className="block text-sm font-medium">Amount (FLOW)</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
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
            onChange={(e) => setInterval(e.target.value as any)}
            className="w-full rounded-lg border px-3 py-2"
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
          {loading ? "Running..." : "Run Savings Flow"}
        </button>
      </div>

      {result ? (
        <div className="space-y-2 rounded-lg border p-4 text-sm">
          <div className="font-semibold">Result</div>
          <div
            className={`rounded-lg p-3 ${
              result.success
                ? "bg-green-50 text-green-900"
                : result.requiresApproval
                  ? "bg-amber-50 text-amber-900"
                  : "bg-red-50 text-red-900"
            }`}
          >
            <div className="font-medium">
              {result.success
                ? "Savings executed on Flow"
                : result.requiresApproval
                  ? "Waiting for guardian approval"
                  : "Savings flow failed"}
            </div>
            <div className="mt-1 text-xs opacity-80">
              Decision: {result.decision}
              {result.zama?.evaluationTxHash ? ` • Zama tx ${result.zama.evaluationTxHash}` : ""}
            </div>
          </div>
          {result.approvalRequestId ? (
            <div className="rounded bg-amber-100 p-2 text-xs">
              Approval request id: <code>{result.approvalRequestId}</code>
            </div>
          ) : null}
          {result.flow?.txHash ? (
            <a
              className="text-blue-600 hover:underline"
              href={result.flow.explorerUrl}
              target="_blank"
              rel="noreferrer"
            >
              Flow tx →
            </a>
          ) : null}
          {result.storacha?.receiptCid ? (
            <a
              className="text-purple-600 hover:underline"
              href={result.storacha.receiptUrl}
              target="_blank"
              rel="noreferrer"
            >
              Receipt →
            </a>
          ) : null}
          {result.clawrence?.celebration ? (
            <div className="rounded bg-gray-50 p-2">{result.clawrence.celebration}</div>
          ) : null}
          {result.error ? <div className="text-red-700">{result.error}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
