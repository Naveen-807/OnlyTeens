"use client";

import { useState } from "react";

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
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h2 className="text-lg font-bold">📱 Subscription</h2>

      <div className="space-y-2 rounded-lg border p-4">
        <label className="block text-sm font-medium">Service name</label>
        <input
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        />

        <label className="block text-sm font-medium">Monthly amount (FLOW)</label>
        <input
          value={monthlyAmount}
          onChange={(e) => setMonthlyAmount(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        />

        <button
          onClick={request}
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Request Subscription"}
        </button>
      </div>

      {result ? (
        <div className="space-y-2 rounded-lg border p-4 text-sm">
          <div className="font-semibold">Result</div>
          <div>Success: {String(result.success)}</div>
          <div>Decision: {result.decision}</div>
          <div>Requires approval: {String(result.requiresApproval)}</div>
          {result.approvalRequestId ? (
            <div className="rounded bg-amber-50 p-2">
              Approval request id: <code>{result.approvalRequestId}</code>
            </div>
          ) : null}
          {result.error ? <div className="text-red-700">{result.error}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

