"use client";

import { useState } from "react";

import { GuardianPolicySetup } from "@/components/GuardianPolicySetup";
import { useAuthStore } from "@/store/authStore";

type DecryptedPolicy = {
  singleActionCap: number;
  recurringMonthlyCap: number;
  trustUnlockThreshold: number;
};

export default function GuardianSetupPage() {
  const { session, family } = useAuthStore();
  const familyId = family?.familyId;
  const teenAddress = family?.teenAddress;
  const [decryptedPolicy, setDecryptedPolicy] = useState<DecryptedPolicy | null>(null);
  const [viewingRules, setViewingRules] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  const handleViewRules = async () => {
    if (!familyId) return;
    setViewingRules(true);
    setViewError(null);
    try {
      const res = await fetch(`/api/policy/view?familyId=${encodeURIComponent(familyId)}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to decrypt policy");
      }
      setDecryptedPolicy(data.data ?? data);
    } catch (error: any) {
      setViewError(error?.message || "Failed to decrypt policy");
    } finally {
      setViewingRules(false);
    }
  };

  return (
    <div className="space-y-4">
      <GuardianPolicySetup
        onSubmit={async (policy) => {
          if (!session || !familyId || !teenAddress) {
            throw new Error("Missing session/family context");
          }
          const res = await fetch("/api/policy/set", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              familyId,
              teenAddress,
              ...policy,
            }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error || "Policy set failed");
        }}
      />

      <div className="mx-auto max-w-md space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          onClick={handleViewRules}
          disabled={!familyId || viewingRules}
          className="w-full rounded-xl bg-slate-900 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {viewingRules ? "Decrypting policy..." : "View My Rules"}
        </button>
        {decryptedPolicy ? (
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <div><strong>Single cap:</strong> {decryptedPolicy.singleActionCap}</div>
            <div><strong>Recurring cap:</strong> {decryptedPolicy.recurringMonthlyCap}</div>
            <div><strong>Trust threshold:</strong> {decryptedPolicy.trustUnlockThreshold}</div>
            <p className="mt-3 text-xs text-slate-500">
              Only you can see these values. Your teen sees only GREEN, YELLOW, RED, or BLOCKED.
            </p>
          </div>
        ) : null}
        {viewError ? <div className="text-sm text-red-600">{viewError}</div> : null}
      </div>
    </div>
  );
}
