"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ApprovalRequest } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

type InboxStatus =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export default function GuardianInbox() {
  const { session, family } = useAuthStore();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<InboxStatus>({ kind: "idle" });

  const familyId = family?.familyId;

  const fetchRequests = useCallback(async () => {
    if (!familyId) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/approval/list?familyId=${encodeURIComponent(familyId)}`
      );
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests ?? data.approvals ?? []);
        setStatus({ kind: "idle" });
      } else {
        setStatus({
          kind: "error",
          message: data.error || "Failed to load approval requests",
        });
      }
    } catch (err: any) {
      setStatus({
        kind: "error",
        message: err?.message || "Failed to load approval requests",
      });
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    void fetchRequests();
    const interval = setInterval(() => void fetchRequests(), 10000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const sortedRequests = useMemo(
    () => [...requests].sort((a, b) => +new Date(b.requestedAt) - +new Date(a.requestedAt)),
    [requests],
  );

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    setStatus({ kind: "idle" });
    try {
      const guardianNote = notes[requestId]?.trim() || "Approved";
      const res = await fetch("/api/approval/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, guardianNote, session }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Approval failed");
      }

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setStatus({
        kind: "success",
        message: `Approved ${requestId}. Receipt CID: ${
          data.execution?.storacha?.receiptCid || "stored"
        }`,
      });
    } catch (err: any) {
      setStatus({
        kind: "error",
        message: err?.message || "Approval failed",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const guardianNote = notes[requestId]?.trim();
    if (!guardianNote) {
      setStatus({
        kind: "error",
        message: "Add a rejection reason before declining.",
      });
      return;
    }

    setProcessing(requestId);
    setStatus({ kind: "idle" });
    try {
      const res = await fetch("/api/approval/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, guardianNote, session }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Rejection failed");
      }

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setStatus({
        kind: "success",
        message: `Rejected ${requestId}. Rejection CID: ${data.rejectionCid}`,
      });
    } catch (err: any) {
      setStatus({
        kind: "error",
        message: err?.message || "Rejection failed",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (!session || !family) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-gray-500">Please log in as guardian.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        📬 Approval Inbox
        {sortedRequests.length > 0 && (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
            {sortedRequests.length}
          </span>
        )}
      </h2>

      {status.kind !== "idle" ? (
        <div
          className={`rounded-lg p-3 text-sm ${
            status.kind === "success"
              ? "bg-green-50 text-green-900"
              : "bg-red-50 text-red-900"
          }`}
        >
          {status.message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="animate-pulse py-8 text-center text-gray-400">
          Loading requests...
        </div>
      ) : sortedRequests.length === 0 ? (
        <div className="py-8 text-center text-gray-400">
          <p className="mb-2 text-4xl">✨</p>
          <p>No pending requests</p>
          <p className="mt-1 text-xs">
            Requests from your teen will appear here.
          </p>
        </div>
      ) : (
        sortedRequests.map((req) => (
          <div key={req.id} className="space-y-3 rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {req.teenName} wants to {req.actionType}
                </p>
                <p className="text-sm text-gray-600">{req.description}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-bold ${
                  req.policyDecision === "RED"
                    ? "bg-red-100 text-red-800"
                    : req.policyDecision === "BLOCKED"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {req.policyDecision}
              </span>
            </div>

            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="mb-1 font-medium text-gray-600">🤖 Clawrence says</p>
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

            <p className="text-xs text-gray-400">
              Requested {new Date(req.requestedAt).toLocaleString()}
            </p>

            <label className="block space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Guardian note
              </span>
              <textarea
                value={notes[req.id] || ""}
                onChange={(e) =>
                  setNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                }
                className="min-h-20 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="Explain why you approve or reject this request..."
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => void handleApprove(req.id)}
                disabled={processing === req.id}
                className="rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {processing === req.id ? "Processing..." : "✅ Approve"}
              </button>
              <button
                onClick={() => void handleReject(req.id)}
                disabled={processing === req.id}
                className="rounded-lg bg-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                ❌ Decline
              </button>
            </div>
          </div>
        ))
      )}

      <button
        onClick={() => void fetchRequests()}
        className="w-full py-2 text-center text-xs text-gray-400 hover:text-gray-600"
      >
        ↻ Refresh
      </button>
    </div>
  );
}
