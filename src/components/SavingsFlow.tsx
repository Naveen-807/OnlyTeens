"use client";

import { useState } from "react";
import { PiggyBank, CheckCircle2, Clock, XCircle, ExternalLink, Receipt } from "lucide-react";

import { fetchApi, hasRenderableLink } from "@/lib/api/client";
import type { FlowResult, UserSession } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

function getFailureLayer(result: FlowResult): string {
  if (result.guardrail?.decision === "BLOCK") {
    return `Guardrails (${result.guardrail.source || "vincent-local"})`;
  }
  if (result.lit && !result.lit.signed) {
    return "Lit execution boundary";
  }
  if (result.decision === "BLOCKED") {
    return "Zama policy decision";
  }
  if (result.error?.toLowerCase().includes("transaction")) {
    return "Flow execution";
  }
  return "Execution pipeline";
}

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
  const [submitError, setSubmitError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setResult(null);
    setSubmitError(null);
    try {
      const data = await fetchApi<FlowResult>(
        "/api/savings/execute",
        {
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
        },
        "Savings request failed",
      );
      setResult(data);
      if (data.success) {
        const refreshResult = await useAuthStore.getState().refreshState();
        if (!refreshResult.success) {
          setSubmitError(refreshResult.error || "Saved, but the dashboard could not refresh.");
        }
      }
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : "Savings request failed");
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

      {submitError ? (
        <Card className="border-rose-500/30 bg-rose-950/30">
          <CardContent className="p-4">
            <p className="text-sm text-rose-300">{submitError}</p>
          </CardContent>
        </Card>
      ) : null}

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
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {result.executionMode ? (
                    <Badge className="border-emerald-500/30 bg-emerald-950/50 text-[10px] text-emerald-300">
                      {result.executionMode}
                    </Badge>
                  ) : null}
                  {result.fallbackActive ? (
                    <Badge className="border-slate-500/30 bg-slate-950/50 text-[10px] text-slate-300">
                      fallback
                    </Badge>
                  ) : null}
                  {result.zama?.source ? (
                    <Badge className="border-violet-500/30 bg-violet-950/50 text-[10px] text-violet-300">
                      Zama {result.zama.source}
                    </Badge>
                  ) : null}
                  {result.guardrails?.provider ? (
                    <Badge className="border-amber-500/30 bg-amber-950/50 text-[10px] text-amber-300">
                      {result.guardrails.provider}
                    </Badge>
                  ) : null}
                  {result.lit?.actionCid ? (
                    <Badge className="border-blue-500/30 bg-blue-950/50 text-[10px] text-blue-300">
                      Lit executor
                    </Badge>
                  ) : null}
                  {result.vincent?.walletAddress ? (
                    <Badge className="border-amber-500/30 bg-amber-950/50 text-[10px] text-amber-300">
                      Vincent wallet
                    </Badge>
                  ) : null}
                  {result.schedule?.backend ? (
                    <Badge className={cn(
                      "text-[10px]",
                      result.schedule.backend === "flow-native-scheduled"
                        ? "border-emerald-500/30 bg-emerald-950/50 text-emerald-300"
                        : "border-slate-500/30 bg-slate-950/50 text-slate-300"
                    )}>
                      {result.schedule.backend}
                    </Badge>
                  ) : null}
                </div>
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
              {hasRenderableLink(result.flow?.txHash, result.flow?.explorerUrl) && (
                <a
                  href={result.flow?.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-950/40 px-3 py-2 text-xs text-blue-400 hover:bg-blue-950/60 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Flow Explorer
                </a>
              )}
              {hasRenderableLink(result.storacha?.receiptCid, result.storacha?.receiptUrl) && (
                <a
                  href={result.storacha?.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-950/40 px-3 py-2 text-xs text-violet-400 hover:bg-violet-950/60 transition-colors"
                >
                  <Receipt className="h-3 w-3" />
                  Evidence CID
                </a>
              )}
            </div>

            {result.schedule ? (
              <div className="rounded-lg border border-border/40 bg-background/40 p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Recurring automation
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {result.schedule.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Backend: {result.schedule.backend || "evm-manual"}
                  {result.schedule.nextExecutionAt
                    ? ` • next run ${new Date(result.schedule.nextExecutionAt).toLocaleString()}`
                    : ""}
                </p>
              </div>
            ) : null}

            {result.clawrence?.celebration && (
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
                <p className="text-sm text-primary">{result.clawrence.celebration}</p>
              </div>
            )}

            {result.error && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-950/40 p-3">
                <p className="text-xs uppercase tracking-wider text-rose-300/80">
                  Blocked at: {getFailureLayer(result)}
                </p>
                <p className="mt-1 text-sm text-rose-300">{result.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
