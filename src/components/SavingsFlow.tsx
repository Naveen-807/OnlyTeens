"use client";

import { useState } from "react";
import { PiggyBank, CheckCircle2, Clock, XCircle, ExternalLink, Receipt } from "lucide-react";

import type { FlowResult, UserSession } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
    <div className="mx-auto max-w-md space-y-6 p-4">
      <Card className="bg-card/90 border-border/30 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/30 bg-gradient-to-br from-emerald-500/10 via-card to-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-emerald-500/20 p-2 border border-emerald-500/30">
              <PiggyBank className="h-5 w-5 text-emerald-400" />
            </div>
            <Badge className="border-emerald-500/30 bg-emerald-950/60 text-emerald-400">
              Save Money
            </Badge>
          </div>
          <CardTitle className="text-xl">Start Saving</CardTitle>
          <CardDescription>
            Move funds to your savings account. Recurring saves build streaks faster.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <Tabs defaultValue="one-time" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
              <TabsTrigger value="one-time" onClick={() => setIsRecurring(false)}>
                One-time
              </TabsTrigger>
              <TabsTrigger value="recurring" onClick={() => setIsRecurring(true)}>
                Recurring
              </TabsTrigger>
            </TabsList>

            <TabsContent value="one-time" className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Amount (FLOW)
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-background/50 text-lg font-mono"
                  placeholder="0.00"
                  min="0"
                  step="0.1"
                />
              </div>
            </TabsContent>

            <TabsContent value="recurring" className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Amount per {interval} (FLOW)
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-background/50 text-lg font-mono"
                  placeholder="0.00"
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Frequency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={interval === "weekly" ? "default" : "outline"}
                    onClick={() => setInterval("weekly")}
                    className="w-full"
                  >
                    Weekly
                  </Button>
                  <Button
                    type="button"
                    variant={interval === "monthly" ? "default" : "outline"}
                    onClick={() => setInterval("monthly")}
                    className="w-full"
                  >
                    Monthly
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            onClick={run}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="w-full"
            size="lg"
          >
            {loading ? (
              "Processing..."
            ) : (
              <>
                <PiggyBank className="h-4 w-4 mr-2" />
                {isRecurring ? `Save ${amount} FLOW ${interval}` : `Save ${amount} FLOW`}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Result Card */}
      {result && (
        <Card className={cn(
          "border backdrop-blur-sm overflow-hidden",
          result.success
            ? "bg-emerald-950/40 border-emerald-500/30"
            : result.requiresApproval
              ? "bg-amber-950/40 border-amber-500/30"
              : "bg-rose-950/40 border-rose-500/30"
        )}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              {result.success ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              ) : result.requiresApproval ? (
                <Clock className="h-6 w-6 text-amber-400" />
              ) : (
                <XCircle className="h-6 w-6 text-rose-400" />
              )}
              <div>
                <h3 className={cn(
                  "font-semibold",
                  result.success ? "text-emerald-400" : result.requiresApproval ? "text-amber-400" : "text-rose-400"
                )}>
                  {result.success
                    ? "Savings Executed!"
                    : result.requiresApproval
                      ? "Awaiting Approval"
                      : "Transaction Failed"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Decision: <span className="font-mono">{result.decision}</span>
                  {result.zama?.evaluationTxHash && (
                    <> • Zama verified</>
                  )}
                </p>
              </div>
            </div>

            {result.approvalRequestId && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-950/40 p-3">
                <p className="text-xs text-amber-400">
                  Approval request: <code className="font-mono">{result.approvalRequestId}</code>
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {result.flow?.txHash && (
                <a
                  href={result.flow.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-950/40 px-3 py-2 text-xs text-blue-400 hover:bg-blue-950/60 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Flow Explorer
                </a>
              )}
              {result.storacha?.receiptCid && (
                <a
                  href={result.storacha.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-950/40 px-3 py-2 text-xs text-violet-400 hover:bg-violet-950/60 transition-colors"
                >
                  <Receipt className="h-3 w-3" />
                  Evidence CID
                </a>
              )}
            </div>

            {result.clawrence?.celebration && (
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
                <p className="text-sm text-primary">{result.clawrence.celebration}</p>
              </div>
            )}

            {result.error && (
              <p className="text-sm text-rose-400">{result.error}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
