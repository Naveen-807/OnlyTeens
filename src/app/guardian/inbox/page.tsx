"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, RefreshCw, XCircle } from "lucide-react";

import type { ApprovalRequest } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load approval requests";
      setStatus({
        kind: "error",
        message: errorMessage,
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
        message: `Approved successfully. Receipt stored.`,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Approval failed";
      setStatus({
        kind: "error",
        message: errorMessage,
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
        message: `Request declined.`,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Rejection failed";
      setStatus({
        kind: "error",
        message: errorMessage,
      });
    } finally {
      setProcessing(null);
    }
  };

  if (!session || !family) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-xl font-semibold mb-2 text-foreground">Guardian Access Required</h2>
        <p className="text-muted-foreground">Please log in as guardian to continue.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-foreground">Approval Inbox</h2>
          {sortedRequests.length > 0 && (
            <Badge className="border-rose-500/30 bg-rose-500/20 text-rose-400">
              {sortedRequests.length}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => void fetchRequests()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Status Messages */}
      {status.kind !== "idle" && (
        <Card className={cn(
          "border",
          status.kind === "success"
            ? "border-emerald-500/30 bg-emerald-950/30"
            : "border-rose-500/30 bg-rose-950/30"
        )}>
          <CardContent className="p-4 flex items-center gap-3">
            {status.kind === "success" ? (
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-400" />
            )}
            <p className={cn(
              "text-sm",
              status.kind === "success" ? "text-emerald-400" : "text-rose-400"
            )}>
              {status.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedRequests.length === 0 ? (
        <Card className="bg-card/60">
          <CardContent className="py-12 text-center">
            <div className="text-5xl mb-4">✨</div>
            <p className="text-lg font-medium text-foreground mb-1">All caught up!</p>
            <p className="text-sm text-muted-foreground">
              Requests from your teen will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedRequests.map((req) => (
            <Card key={req.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {req.teenName} wants to {req.actionType}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{req.description}</p>
                  </div>
                  <Badge
                    className={cn(
                      "shrink-0",
                      req.policyDecision === "RED"
                        ? "border-rose-500/30 bg-rose-950/60 text-rose-400"
                        : req.policyDecision === "BLOCKED"
                          ? "border-neutral-500/30 bg-neutral-900/60 text-neutral-400"
                          : "border-amber-500/30 bg-amber-950/60 text-amber-400"
                    )}
                  >
                    {req.policyDecision}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Calma Explanation */}
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                  <p className="text-xs uppercase tracking-wider text-primary/70 mb-2">
                    🤖 Calma says
                  </p>
                  <p className="text-sm text-foreground">{req.clawrenceGuardianExplanation}</p>
                </div>

                {/* Meta Info */}
                <div className="flex justify-between text-sm">
                  <span className="text-gold-gradient font-medium">
                    {req.currency}{req.amount}
                    {req.isRecurring ? "/month" : ""}
                  </span>
                  <span className="text-muted-foreground">
                    Passport Lv.{req.teenPassportLevel} • {req.teenStreak}wk streak
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Requested {new Date(req.requestedAt).toLocaleString()}
                </p>

                {/* Note Input */}
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Guardian note
                  </label>
                  <textarea
                    value={notes[req.id] || ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                    }
                    className="min-h-20 w-full rounded-lg border border-border/30 bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                    placeholder="Explain why you approve or reject this request..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => void handleApprove(req.id)}
                    disabled={processing === req.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {processing === req.id ? "Processing..." : "Approve"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleReject(req.id)}
                    disabled={processing === req.id}
                  >
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
