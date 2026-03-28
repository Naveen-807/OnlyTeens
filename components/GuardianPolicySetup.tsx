import { useState } from "react";

export function GuardianPolicySetup({
  onSubmit,
}: {
  onSubmit: (policy: {
    singleActionCap: number;
    recurringMonthlyCap: number;
    trustUnlockThreshold: number;
  }) => Promise<void>;
}) {
  const [singleCap, setSingleCap] = useState(500);
  const [recurringCap, setRecurringCap] = useState(1000);
  const [trustThreshold, setTrustThreshold] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({
      singleActionCap: singleCap,
      recurringMonthlyCap: recurringCap,
      trustUnlockThreshold: trustThreshold,
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <span className="text-5xl">🔒</span>
        <h2 className="text-lg font-bold mt-3">Policy Encrypted & Stored</h2>
        <p className="text-sm text-gray-500 mt-2">
          Your family rules are now encrypted on-chain using Zama's FHE.
          <br />
          Your teen will never see the exact numbers — only whether their
          actions are within limits.
        </p>
        <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-left space-y-1">
          <p>✅ Single-action cap: encrypted</p>
          <p>✅ Monthly recurring cap: encrypted</p>
          <p>✅ Trust unlock threshold: encrypted</p>
          <p>🔐 Only you can decrypt these values</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <div>
        <h2 className="text-lg font-bold">Set Family Rules</h2>
        <p className="text-sm text-gray-500">
          These values will be encrypted on-chain. Your teen will only see
          GREEN / YELLOW / RED / BLOCKED — never the actual numbers.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Max per single action
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">₹</span>
            <input
              type="range" min={100} max={5000} step={100}
              value={singleCap}
              onChange={(e) => setSingleCap(Number(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono font-bold w-16 text-right">₹{singleCap}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Actions above this → need your approval
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Max monthly recurring total
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">₹</span>
            <input
              type="range" min={200} max={10000} step={200}
              value={recurringCap}
              onChange={(e) => setRecurringCap(Number(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono font-bold w-16 text-right">₹{recurringCap}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Total monthly subscriptions allowed before RED flag
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Passport level for auto-approve
          </label>
          <select
            value={trustThreshold}
            onChange={(e) => setTrustThreshold(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value={0}>Lv.0 — Starter (all actions auto-approved)</option>
            <option value={1}>Lv.1 — Explorer</option>
            <option value={2}>Lv.2 — Saver (recommended)</option>
            <option value={3}>Lv.3 — Manager</option>
            <option value={4}>Lv.4 — Planner (strict)</option>
            <option value={5}>Lv.5 — Independent (very strict)</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Until your teen reaches this level, borderline actions need approval
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
        <p className="font-medium text-amber-800">🔐 Privacy Note</p>
        <p className="text-amber-700 text-xs mt-1">
          These values will be submitted as encrypted inputs with
          zero-knowledge proofs. They cannot be read by anyone on-chain —
          not even the smart contract reveals them. Only the
          GREEN/YELLOW/RED/BLOCKED decision is visible.
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Encrypting & storing on-chain..." : "🔒 Encrypt & Save Rules"}
      </button>
    </div>
  );
}
