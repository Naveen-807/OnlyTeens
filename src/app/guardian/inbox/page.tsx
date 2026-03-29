"use client";

import { useState, useEffect, useCallback } from "react";

import type { ApprovalRequest, FlowResult } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

type ApprovalOutcome = {
  requestId: string;
  type: "approved" | "rejected";
  note: string;
  execution?: FlowResult;
  approvalUrl?: string;
};

export default function GuardianInbox() {
  const { session, family } = useAuthStore();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastOutcome, setLastOutcome] = useState<ApprovalOutcome | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!family?.familyId) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/approval/list?familyId=${encodeURIComponent(family.familyId)}`,
      );
      const data = await res.json();
      if (data.success) setRequests(data.requests ?? data.approvals ?? []);
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
    } finally {
      setIsLoading(false);
    }
  }, [family?.familyId]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleApprove = async (requestId: string) => {
    const note = prompt("Add a note (optional):") ?? "Approved";
    setProcessing(requestId);
    try {
      const res = await fetch("/api/approval/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, guardianNote: note, session }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Approval failed");
      }

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setLastOutcome({
        requestId,
        type: "approved",
        note,
        execution: data.execution,
        approvalUrl: data.approval?.url,
      });
    } catch (err: any) {
      setLastOutcome({
        requestId,
        type: "rejected",
        note: err?.message || "Approval failed",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt("Why are you declining? (required)");
    if (!reason) return;
    setProcessing(requestId);
    try {
      const res = await fetch("/api/approval/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, guardianNote: reason }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Decline failed");
      }
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setLastOutcome({ requestId, type: "rejected", note: reason });
    } catch (err: any) {
      setLastOutcome({
        requestId,
        type: "rejected",
        note: err?.message || "Decline failed",
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
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2">
        📬 Approval Inbox
        {requests.length > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {requests.length}
          </span>
        )}
      </h2>

      {lastOutcome ? (
        <div
          className={`rounded-xl border p-4 text-sm ${
            lastOutcome.type === "approved"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          <div className="font-semibold">
            {lastOutcome.type === "approved" ? "Approval executed" : "Request declined"}
          </div>
          <div className="mt-1">{lastOutcome.note}</div>
          {lastOutcome.approvalUrl ? (
            <a
              className="mt-3 block text-emerald-700 underline"
              href={lastOutcome.approvalUrl}
              target="_blank"
              rel="noreferrer"
            >
              View approval record
            </a>
          ) : null}
          {lastOutcome.execution?.flow?.explorerUrl ? (
            <a
              className="mt-2 block text-emerald-700 underline"
              href={lastOutcome.execution.flow.explorerUrl}
              target="_blank"
              rel="noreferrer"
            >
              View Flow execution
            </a>
          ) : null}
          {lastOutcome.execution?.storacha?.receiptUrl ? (
            <a
              className="mt-2 block text-emerald-700 underline"
              href={lastOutcome.execution.storacha.receiptUrl}
              target="_blank"
              rel="noreferrer"
            >
              View Storacha receipt
            </a>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-center py-8 text-gray-400 animate-pulse">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-4xl mb-2">✨</p>
          <p>No pending requests</p>
          <p className="text-xs mt-1">Requests from your teen will appear here</p>
        </div>
      ) : (
        requests.map((req) => (
          <div key={req.id} className="border rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{req.teenName} wants to {req.actionType}</p>
                <p className="text-sm text-gray-600">{req.description}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-bold ${
                  req.policyDecision === "RED"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {req.policyDecision}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-600 mb-1">🤖 Clawrence says:</p>
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

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(req.id)}
                disabled={processing === req.id}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {processing === req.id ? "Processing..." : "✅ Approve"}
              </button>
              <button
                onClick={() => handleReject(req.id)}
                disabled={processing === req.id}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
              >
                ❌ Decline
              </button>
            </div>
          </div>
        ))
      )}

      <button
        onClick={fetchRequests}
        className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-2"
      >
        ↻ Refresh
      </button>
    </div>
  );
}
