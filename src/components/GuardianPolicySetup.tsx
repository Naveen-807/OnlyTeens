"use client";

import { useState } from "react";

export function GuardianPolicySetup({
  onSubmit,
}: {
  onSubmit: (policy: {
    singleActionCap: number;
    recurringMonthlyCap: number;
    trustUnlockThreshold: number;
    riskFlags?: number;
  }) => Promise<void>;
}) {
  const [singleCap, setSingleCap] = useState(500);
  const [recurringCap, setRecurringCap] = useState(1000);
  const [trustThreshold, setTrustThreshold] = useState(2);
  const [riskFlags, setRiskFlags] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        singleActionCap: singleCap,
        recurringMonthlyCap: recurringCap,
        trustUnlockThreshold: trustThreshold,
        riskFlags,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to encrypt and store policy");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <span className="text-5xl">🔒</span>
        <h2 className="mt-3 text-lg font-bold">Policy Encrypted & Stored</h2>
        <p className="mt-2 text-sm text-gray-500">
          Your family rules are now encrypted on-chain using Zama&apos;s FHE.
          <br />
          Your teen will never see the exact numbers — only whether their actions are within limits.
        </p>
        <div className="mt-4 space-y-1 rounded-lg bg-gray-50 p-3 text-left text-xs">
          <p>✅ Single-action cap: encrypted</p>
          <p>✅ Monthly recurring cap: encrypted</p>
          <p>✅ Trust unlock threshold: encrypted</p>
          <p>🔐 Only you can decrypt these values</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <div>
        <h2 className="text-lg font-bold">Set Family Rules</h2>
        <p className="text-sm text-gray-500">
          These values will be encrypted on-chain. Your teen will only see GREEN / YELLOW / RED / BLOCKED — never the actual numbers.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Max per single action
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">₹</span>
            <input
              type="range"
              min={100}
              max={5000}
              step={100}
              value={singleCap}
              onChange={(e) => setSingleCap(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-16 text-right font-mono font-bold">₹{singleCap}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Actions above this → need your approval
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Max monthly recurring total
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">₹</span>
            <input
              type="range"
              min={200}
              max={10000}
              step={200}
              value={recurringCap}
              onChange={(e) => setRecurringCap(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-16 text-right font-mono font-bold">₹{recurringCap}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Total monthly subscriptions allowed before RED flag
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Passport level for auto-approve
          </label>
          <select
            value={trustThreshold}
            onChange={(e) => setTrustThreshold(Number(e.target.value))}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value={0}>Lv.0 — Starter (all actions auto-approved)</option>
            <option value={1}>Lv.1 — Explorer</option>
            <option value={2}>Lv.2 — Saver (recommended)</option>
            <option value={3}>Lv.3 — Manager</option>
            <option value={4}>Lv.4 — Planner (strict)</option>
            <option value={5}>Lv.5 — Independent (very strict)</option>
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Until your teen reaches this level, borderline actions need approval
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Risk flags (bitmask)
          </label>
          <input
            type="number"
            value={riskFlags}
            onChange={(e) => setRiskFlags(Number(e.target.value))}
            className="w-full rounded-lg border px-3 py-2"
            min={0}
          />
          <p className="mt-1 text-xs text-gray-400">
            Non-zero flags will push decisions toward BLOCKED.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
        <p className="font-medium text-amber-800">🔐 Privacy Note</p>
        <p className="mt-1 text-xs text-amber-700">
          These values are submitted as encrypted inputs with proofs. On-chain observers can only see the final decision classification.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-xl bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Encrypting & storing on-chain..." : "🔒 Encrypt & Save Rules"}
      </button>
    </div>
  );
}
