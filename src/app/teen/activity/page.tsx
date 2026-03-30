"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, History, ExternalLink, Shield, Zap, Receipt, Lock } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import type { StoredReceipt } from "@/lib/receipts/receiptStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const decisionStyles: Record<string, string> = {
  GREEN: "border-emerald-500/30 bg-emerald-950/60 text-emerald-400",
  YELLOW: "border-amber-500/30 bg-amber-950/60 text-amber-400",
  RED: "border-rose-500/30 bg-rose-950/60 text-rose-400",
  BLOCKED: "border-slate-500/30 bg-slate-950/60 text-slate-400",
};

export default function ActivityPage() {
  const { family } = useAuthStore();
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [selected, setSelected] = useState<StoredReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!family?.familyId) return;
    fetch(`/api/receipts/list?familyId=${encodeURIComponent(family.familyId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setReceipts(data.receipts);
      })
      .finally(() => setIsLoading(false));
  }, [family?.familyId]);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // Detail View
  if (selected) {
    return (
      <div className="max-w-md mx-auto p-4 space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelected(null)}
          className="text-primary hover:text-primary/80"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to activity
        </Button>

        <Card className="bg-card/90 border-border/30 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/30 bg-gradient-to-br from-primary/10 via-card to-card">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{selected.description}</CardTitle>
              <Badge className={decisionStyles[selected.decision]}>
                {selected.decision}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/30 bg-card/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</p>
                <p className="mt-2 text-xl font-bold text-gold-gradient">{selected.amount} FLOW</p>
              </div>
              <div className="rounded-xl border border-border/30 bg-card/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Passport</p>
                <p className="mt-2 text-xl font-bold">
                  Level {selected.passportLevel}
                  {selected.passportLeveledUp && (
                    <span className="ml-2 text-emerald-400">+1</span>
                  )}
                </p>
              </div>
            </div>

            {/* Clawrence Explanation */}
            {selected.clawrenceExplanation && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-primary mb-2">
                  <Zap className="h-3.5 w-3.5" />
                  Clawrence said
                </div>
                <p className="text-sm text-muted-foreground">{selected.clawrenceExplanation}</p>
              </div>
            )}

            {/* Verification Links */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" />
                Verification
              </h3>

              {selected.flowTxHash && (
                <a
                  href={selected.flowExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-950/40 p-4 hover:bg-blue-950/60 transition-colors"
                >
                  <div className="rounded-lg bg-blue-500/20 p-2">
                    <ExternalLink className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-400">Flow Transaction</p>
                    <p className="text-xs text-blue-400/70 font-mono">
                      {selected.flowTxHash.slice(0, 10)}...{selected.flowTxHash.slice(-8)}
                    </p>
                  </div>
                </a>
              )}

              {selected.storachaCid && (
                <a
                  href={selected.storachaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-950/40 p-4 hover:bg-violet-950/60 transition-colors"
                >
                  <div className="rounded-lg bg-violet-500/20 p-2">
                    <Receipt className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="font-medium text-violet-400">Evidence CID</p>
                    <p className="text-xs text-violet-400/70 font-mono">
                      CID: {selected.storachaCid.slice(0, 12)}...
                    </p>
                  </div>
                </a>
              )}

              {selected.litActionCid && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-950/40 p-4">
                  <div className="rounded-lg bg-amber-500/20 p-2">
                    <Lock className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-400">Lit Execution Boundary</p>
                    <p className="text-xs text-amber-400/70 font-mono">
                      CID: {selected.litActionCid.slice(0, 12)}...
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4">
                <div className="rounded-lg bg-emerald-500/20 p-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-emerald-400">Zama Confidential Policy</p>
                  <p className="text-xs text-emerald-400/70">
                    Decision: {selected.decision} (thresholds encrypted)
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-2">
              {new Date(selected.timestamp).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List View
  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/20 p-2 border border-primary/30">
          <History className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Activity & Execution Proof</h2>
      </div>

      {receipts.length === 0 ? (
        <Card className="bg-card/90 border-border/30">
          <CardContent className="py-12 text-center">
            <div className="rounded-full bg-primary/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <History className="h-8 w-8 text-primary/60" />
            </div>
            <p className="font-medium text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your financial actions will appear here with full verification links
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {receipts.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="w-full text-left rounded-xl border border-border/30 bg-card/80 p-4 hover:bg-card hover:border-border/50 transition-all space-y-3"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{r.description}</span>
                <Badge className={cn("text-xs", decisionStyles[r.decision])}>
                  {r.decision}
                </Badge>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="font-mono">{r.amount} FLOW</span>
                <span>{new Date(r.timestamp).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-3 text-xs">
                {r.flowTxHash && (
                  <span className="text-blue-400 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Flow
                  </span>
                )}
                {r.storachaCid && (
                  <span className="text-violet-400 flex items-center gap-1">
                    <Receipt className="h-3 w-3" /> Evidence
                  </span>
                )}
                <span className="text-amber-400 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Lit
                </span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Zama
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
