"use client";

import Link from "next/link";
import { Bot, CreditCard, History, PiggyBank, RefreshCw, TrendingUp } from "lucide-react";

import { useDashboardData } from "@/lib/hooks/useDashboardData";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const quickActions = [
  { icon: PiggyBank, label: "Save", href: "/teen/save", color: "text-primary" },
  { icon: TrendingUp, label: "DeFi", href: "/teen/defi", color: "text-emerald-400" },
  { icon: CreditCard, label: "Subscribe", href: "/teen/subscribe", color: "text-primary" },
  { icon: Bot, label: "Calma", href: "/teen/chat", color: "text-primary" },
  { icon: History, label: "Activity", href: "/teen/activity", color: "text-muted-foreground" },
] as const;

export default function TeenDashboard() {
  const { session, family } = useAuthStore();
  const {
    balances,
    passport,
    receipts,
    pendingApprovals,
    isLoading,
    error,
    refresh,
  } = useDashboardData();

  if (!session || !family) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 text-6xl">✨</div>
        <h2 className="mb-2 text-2xl font-semibold text-foreground">Welcome to Calma</h2>
        <p className="text-muted-foreground">Please log in to continue.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  const progressPercent = passport?.progressToNext?.percentComplete ?? 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {error && (
        <Card className="border-rose-500/30 bg-rose-950/25">
          <CardContent className="p-4">
            <p className="text-sm text-rose-400">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Calma teen workspace
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {passport
              ? `Level ${passport.level}: ${passport.levelName} with guardian-approved autonomy`
              : "Loading your guided finance lane..."}
          </p>
        </div>
        {passport && (
          <Badge className="border-primary/30 bg-primary/10 text-primary">
            🔥 {passport.weeklyStreak}wk streak
          </Badge>
        )}
      </div>

      {passport && (
        <Card className="overflow-hidden border-primary/20 bg-[linear-gradient(180deg,oklch(0.11_0.008_85_/_0.95),oklch(0.08_0.006_85_/_0.98))]">
          <CardContent className="p-5">
            <div className="mb-3 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="font-medium text-foreground">{passport.levelName}</span>
              <span className="text-muted-foreground">{passport.progressToNext.nextLevelName}</span>
            </div>
            <Progress value={Math.min(progressPercent, 100)} className="h-2.5" />
            <p className="mt-3 text-xs text-muted-foreground">
              {passport.progressToNext.remaining} actions to{" "}
              <span className="font-medium text-primary">{passport.progressToNext.nextLevelName}</span>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-border/30 bg-card/80">
          <CardContent className="p-4 text-center">
            <p className="mb-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">Spend</p>
            <p className="text-2xl font-bold text-primary">{balances?.spendable || "0"}</p>
            <p className="text-xs text-muted-foreground">FLOW</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/10">
          <CardContent className="p-4 text-center">
            <p className="mb-1 text-xs uppercase tracking-[0.24em] text-primary/70">Saved</p>
            <p className="text-2xl font-bold text-gold-gradient">{balances?.savings || "0"}</p>
            <p className="text-xs text-primary/50">FLOW</p>
          </CardContent>
        </Card>
        <Card className="border-border/30 bg-card/80">
          <CardContent className="p-4 text-center">
            <p className="mb-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">Subs</p>
            <p className="text-2xl font-bold text-primary">{balances?.subscriptionReserve || "0"}</p>
            <p className="text-xs text-muted-foreground">FLOW</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-w-0 flex-col items-center rounded-[1.25rem] border border-border/30 bg-card/70 p-4 text-center transition-all hover:border-primary/30 hover:bg-card/90"
          >
            <item.icon className={cn("mb-2 h-6 w-6", item.color)} />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </Link>
        ))}
      </div>

      {pendingApprovals.length > 0 && (
        <Card className="border-border/30 bg-card/85">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="text-amber-400">⏳</span>
              Pending Approval ({pendingApprovals.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingApprovals.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-amber-500/20 bg-amber-950/25 p-3"
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium text-foreground">{req.description}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Waiting for guardian review
                  </p>
                </div>
                <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs">
                  {req.policyDecision}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/30 bg-card/85">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm">Recent Activity</CardTitle>
            <Link
              href="/teen/activity"
              className="text-xs text-primary transition-colors hover:text-primary/80"
            >
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mb-3 text-4xl">🌱</div>
              <p className="text-sm text-muted-foreground">No activity yet. Start by saving!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {receipts.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-4 border-b border-border/20 py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gold-gradient">{r.amount} FLOW</p>
                    <div className="mt-1 flex justify-end gap-2">
                      {r.flowTxHash && (
                        <a
                          href={r.flowExplorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary/70 transition-colors hover:text-primary"
                        >
                          View Tx
                        </a>
                      )}
                      {r.storachaCid && (
                        <a
                          href={r.storachaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary/70 transition-colors hover:text-primary"
                        >
                          Evidence CID
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={refresh}
        className="w-full border-border/30 bg-card/70 text-muted-foreground hover:border-primary/30 hover:text-foreground"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh
      </Button>
    </div>
  );
}
