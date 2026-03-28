"use client";

import { useState } from "react";

import type { ApprovalRequest } from "@/lib/types";

export function GuardianInbox({
  requests,
  onApprove,
  onReject,
  decryptedThresholds,
}: {
  requests: ApprovalRequest[];
  onApprove: (id: string, note?: string) => Promise<void>;
  onReject: (id: string, note: string) => Promise<void>;
  decryptedThresholds?: { singleCap: number; recurringCap: number };
}) {
  const [processing, setProcessing] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        📬 Approval Inbox
        {requests.length > 0 ? (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
            {requests.length}
          </span>
        ) : null}
      </h2>

      {decryptedThresholds ? (
        <div className="rounded-lg bg-gray-50 p-3 text-sm">
          <p className="mb-1 font-medium text-gray-600">🔓 Your Family Limits</p>
          <div className="flex gap-4">
            <span>Single: ₹{decryptedThresholds.singleCap}</span>
            <span>Monthly recurring: ₹{decryptedThresholds.recurringCap}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Decrypted for you only — your teen sees only the classification
          </p>
        </div>
      ) : null}

      {requests.length === 0 ? (
        <div className="py-8 text-center text-gray-400">
          <p className="mb-2 text-4xl">✨</p>
          <p>No pending requests</p>
        </div>
      ) : (
        requests.map((req) => (
          <div key={req.id} className="space-y-3 rounded-xl border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{req.teenName} requested</p>
                <p className="text-sm text-gray-600">{req.description}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-bold ${
                  req.policyDecision === "RED"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {req.policyDecision}
              </span>
            </div>

            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="mb-1 font-medium text-gray-600">🤖 Clawrence says:</p>
              <p>{req.clawrenceGuardianExplanation}</p>
            </div>

            <div className="flex justify-between text-sm text-gray-500">
              <span>
                {req.currency}
                {req.amount}
                {req.isRecurring ? "/month" : ""}
              </span>
              <span>
                Passport Lv.{req.teenPassportLevel} • {req.teenStreak}wk streak
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setProcessing(req.id);
                  await onApprove(req.id);
                  setProcessing(null);
                }}
                disabled={processing === req.id}
                className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                ✅ Approve
              </button>
              <button
                onClick={async () => {
                  const note =
                    prompt("Reason for declining (optional):") ||
                    "Guardian declined";
                  setProcessing(req.id);
                  await onReject(req.id, note);
                  setProcessing(null);
                }}
                disabled={processing === req.id}
                className="flex-1 rounded-lg bg-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                ❌ Decline
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

