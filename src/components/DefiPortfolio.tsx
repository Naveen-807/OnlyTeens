"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Flame,
  PiggyBank,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { fetchApi, fetchJson, hasRenderableLink } from "@/lib/api/client";
import type { DeFiPortfolioState, FlowResult, UserSession } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface PortfolioResponse {
  success: true;
  portfolio: DeFiPortfolioState;
}

interface DefiResult extends FlowResult {
  portfolio?: DeFiPortfolioState;
}

const strategyCopy: Record<DeFiPortfolioState["strategy"], { label: string; description: string }> = {
  conservative: {
    label: "Conservative",
    description: "Safer growth with tighter limits and smaller allocations.",
  },
  balanced: {
    label: "Balanced",
    description: "A middle lane for steady earn plans and milestone saving.",
  },
  growth: {
    label: "Growth",
    description: "A more ambitious plan, still bounded by guardian policy.",
  },
};

export function DefiPortfolio({
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
  const [portfolio, setPortfolio] = useState<DeFiPortfolioState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DefiResult | null>(null);
  const [mode, setMode] = useState<"earn" | "goal">("earn");
  const [amount, setAmount] = useState("10");
  const [goalName, setGoalName] = useState("tuition fund");
  const [goalTarget, setGoalTarget] = useState("100");
  const [strategy, setStrategy] = useState<DeFiPortfolioState["strategy"]>("balanced");
  const [isRecurring, setIsRecurring] = useState(true);
  const [interval, setInterval] = useState<"weekly" | "monthly">("weekly");

  const portfolioBalance = useMemo(() => {
    if (!portfolio) return null;
    return {
      savings: portfolio.balances.savings,
      reserve: portfolio.balances.subscriptionReserve,
      spendable: portfolio.balances.spendable,
    };
  }, [portfolio]);

  const loadPortfolio = async () => {
    try {
      const data = await fetchApi<PortfolioResponse>(
        `/api/defi?familyId=${encodeURIComponent(familyId)}&teenAddress=${encodeURIComponent(teenAddress)}`,
        undefined,
        "Failed to load DeFi portfolio",
      );
      setPortfolio(data.portfolio);
      setStrategy(data.portfolio.strategy);
      setError(null);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load DeFi portfolio");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadPortfolio();
  }, [familyId, teenAddress]);

  const submit = async () => {
    if (!amount || Number(amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (mode === "goal" && !goalName.trim()) {
      setError("Add a goal name before executing a goal plan.");
      return;
    }

    setLoadingAction(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchJson<DefiResult>(
        "/api/defi",
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
            goalName: mode === "goal" ? goalName : undefined,
            goalTarget: mode === "goal" ? goalTarget : undefined,
            strategy,
            protocolLabel: portfolio?.protocolLabel || "Flow Savings Vault",
            actionKind: mode,
            isRecurring,
            interval,
            clawrencePublicKey,
            clawrencePkpTokenId,
          }),
        },
        "DeFi action failed",
      );

      setResult(data);
      if (data.portfolio) {
        setPortfolio(data.portfolio);
      } else {
        await loadPortfolio();
      }
      const refreshResult = await useAuthStore.getState().refreshState();
      if (!refreshResult.success) {
        setError(refreshResult.error || "DeFi executed, but the dashboard could not refresh.");
      }
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "DeFi action failed");
    } finally {
      setLoadingAction(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadPortfolio();
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        <Card className="h-40 rounded-[1.5rem] border-border/30 bg-card/80" />
        <Card className="h-64 rounded-[1.5rem] border-border/30 bg-card/80" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 lg:p-6">
      <Card className="overflow-hidden border-primary/20 bg-[linear-gradient(180deg,oklch(0.12_0.01_85_/_0.98),oklch(0.08_0.006_85_/_0.98))]">
        <CardHeader className="border-b border-border/30 bg-gradient-to-br from-emerald-500/12 via-card to-card pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-[1rem] border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <Badge className="border-emerald-500/20 bg-emerald-950/50 text-emerald-400">
                Flow Earn Studio
              </Badge>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">Earn, goal, and grow on Flow</h2>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
            This is the guided DeFi lane for {teenName}. Guardian policy sets the strategy and limits,
            while Calma keeps the execution inside the family’s Flow vault rails.
          </p>
        </CardHeader>

        <CardContent className="grid gap-4 p-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.25rem] border border-border/30 bg-card/70 p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">Spendable</p>
              <p className="mt-2 text-2xl font-semibold text-gold-gradient">
                {portfolioBalance?.spendable || "0"}
              </p>
              <p className="text-xs text-muted-foreground">FLOW</p>
            </div>
            <div className="rounded-[1.25rem] border border-emerald-500/20 bg-emerald-950/30 p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-emerald-400/80">Savings</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-400">
                {portfolioBalance?.savings || "0"}
              </p>
              <p className="text-xs text-emerald-400/70">On Flow vault</p>
            </div>
            <div className="rounded-[1.25rem] border border-border/30 bg-card/70 p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">APR</p>
              <p className="mt-2 text-2xl font-semibold text-primary">
                {portfolio?.estimatedApr?.toFixed(1) || "0.0"}%
              </p>
              <p className="text-xs text-muted-foreground">Strategy estimated</p>
            </div>
            <div className="rounded-[1.25rem] border border-border/30 bg-card/70 p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">Strategy</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{portfolio?.strategy || strategy}</p>
              <p className="text-xs text-muted-foreground capitalize">{portfolio?.riskLevel || "low"} risk</p>
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-border/30 bg-card/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Guardian policy
              </div>
              <Badge className="border-primary/20 bg-primary/10 text-primary">
                {portfolio?.protocolLabel || "Flow Savings Vault"}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Allowed protocols stay within the family policy. DeFi requests above the allocation cap
              are blocked until your guardian raises the limit.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {portfolio?.policy.allowedProtocols?.length ? (
                portfolio.policy.allowedProtocols.map((protocol) => (
                  <Badge key={protocol} variant="outline" className="border-border/40 bg-background/40">
                    {protocol}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="border-border/40 bg-background/40">
                  Flow Savings Vault
                </Badge>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-[1rem] border border-emerald-500/20 bg-emerald-950/20 p-3 text-sm text-emerald-300">
              <BadgeCheck className="h-4 w-4" />
              <span>
                {strategyCopy[portfolio?.strategy || strategy].label}: {strategyCopy[portfolio?.strategy || strategy].description}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {portfolio?.goals?.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {portfolio.goals.map((goal) => {
            const saved = Number(goal.savedAmount || "0");
            const target = Number(goal.targetAmount || "0");
            const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
            return (
              <Card key={goal.id} className="border-border/30 bg-card/80">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Goal</p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">{goal.name}</h3>
                    </div>
                    <Badge
                      className={cn(
                        goal.status === "completed"
                          ? "border-emerald-500/20 bg-emerald-950/40 text-emerald-300"
                          : "border-amber-500/20 bg-amber-950/40 text-amber-300",
                      )}
                    >
                      {goal.status}
                    </Badge>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-border/30">
                    <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-primary" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {goal.savedAmount} / {goal.targetAmount} FLOW saved
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      <Card className="overflow-hidden border-border/30 bg-card/85">
        <CardHeader className="border-b border-border/20 bg-gradient-to-br from-primary/10 via-card to-card pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Build an earn plan</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Start with a small amount, let the family policy manage the risk, and keep the goal visible.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={refreshing}>
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-5">
          <Tabs value={mode} onValueChange={(value) => setMode(value as "earn" | "goal")}>
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
              <TabsTrigger value="earn">Earn</TabsTrigger>
              <TabsTrigger value="goal">Goal</TabsTrigger>
            </TabsList>

            <TabsContent value="earn" className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Amount (FLOW)
                  </label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    min="0"
                    step="0.1"
                    className="bg-background/50 font-mono text-lg"
                    placeholder="10.0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Strategy
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["conservative", "balanced", "growth"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setStrategy(value)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-left transition-all",
                          strategy === value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/30 bg-card/50 text-muted-foreground hover:border-border/60",
                        )}
                      >
                        <p className="text-xs font-medium capitalize">{value}</p>
                        <p className="text-[10px] text-muted-foreground">{strategyCopy[value].label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Frequency
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={isRecurring ? "default" : "outline"} onClick={() => setIsRecurring(true)}>
                      Recurring
                    </Button>
                    <Button type="button" variant={!isRecurring ? "default" : "outline"} onClick={() => setIsRecurring(false)}>
                      One-time
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Interval
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={interval === "weekly" ? "default" : "outline"} onClick={() => setInterval("weekly")}>Weekly</Button>
                    <Button type="button" variant={interval === "monthly" ? "default" : "outline"} onClick={() => setInterval("monthly")}>Monthly</Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="goal" className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Goal name
                  </label>
                  <Input
                    value={goalName}
                    onChange={(event) => setGoalName(event.target.value)}
                    className="bg-background/50"
                    placeholder="tuition fund"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Goal target (FLOW)
                  </label>
                  <Input
                    type="number"
                    value={goalTarget}
                    onChange={(event) => setGoalTarget(event.target.value)}
                    min="0"
                    step="1"
                    className="bg-background/50 font-mono"
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Contribution amount (FLOW)
                  </label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    min="0"
                    step="0.1"
                    className="bg-background/50 font-mono text-lg"
                    placeholder="10.0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Strategy
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["conservative", "balanced", "growth"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setStrategy(value)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-left transition-all",
                          strategy === value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/30 bg-card/50 text-muted-foreground hover:border-border/60",
                        )}
                      >
                        <p className="text-xs font-medium capitalize">{value}</p>
                        <p className="text-[10px] text-muted-foreground">{strategyCopy[value].label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            onClick={() => void submit()}
            disabled={loadingAction || Number(amount) <= 0}
            className="w-full"
            size="lg"
          >
            {loadingAction ? (
              "Processing..."
            ) : (
              <>
                <PiggyBank className="mr-2 h-4 w-4" />
                {mode === "goal" ? `Start ${goalName || "goal"}` : `Start ${strategy} earn plan`}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result?.flow?.txHash && hasRenderableLink(result.flow.txHash, result.flow.explorerUrl) ? (
        <Card className="border-border/30 bg-card/80">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-[1rem] border border-primary/20 bg-primary/10 p-2 text-primary">
                <ArrowRight className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Plan executed on Flow</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.defi?.goalName || goalName} is now tracked with a {result.defi?.strategy || strategy} strategy.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.flow?.explorerUrl ? (
                    <a
                      href={result.flow.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary transition-colors hover:text-primary/80"
                    >
                      View Flow Tx →
                    </a>
                  ) : null}
                  {result.storacha?.receiptUrl ? (
                    <a
                      href={result.storacha.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary transition-colors hover:text-primary/80"
                    >
                      Evidence CID →
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-rose-500/30 bg-rose-950/25">
          <CardContent className="p-4 text-sm text-rose-300">{error}</CardContent>
        </Card>
      ) : null}

      {portfolio?.recentActions?.length ? (
        <Card className="border-border/30 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Flame className="h-4 w-4 text-amber-400" />
              Recent plan activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {portfolio.recentActions.slice(0, 4).map((action) => (
              <div key={`${action.timestamp}-${action.description}`} className="flex items-center justify-between gap-3 rounded-[1rem] border border-border/30 bg-card/50 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{action.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(action.timestamp).toLocaleString()}</p>
                </div>
                <Badge className="border-primary/20 bg-primary/10 text-primary">{action.kind}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
