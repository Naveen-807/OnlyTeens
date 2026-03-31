"use client";

import Link from "next/link";
import { Award, Bot, CreditCard, History, PiggyBank, RefreshCw } from "lucide-react";

import { useDashboardData } from "@/lib/hooks/useDashboardData";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">✨</div>
        <h2 className="text-2xl font-semibold mb-2 text-foreground">Welcome to Calma</h2>
        <p className="text-muted-foreground">Please log in to continue.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  const progressPercent = passport?.progressToNext?.percentComplete ?? 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {error && (
        <Card className="border-rose-500/30 bg-rose-950/30">
          <CardContent className="p-4">
            <p className="text-sm text-rose-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Calma teen workspace</h1>
          <p className="text-sm text-muted-foreground">
            {passport
              ? `Level ${passport.level}: ${passport.levelName} with guardian-approved autonomy`
              : "Loading your guided finance lane..."}
          </p>
        </div>
        {passport && (
          <Badge className="border-primary/30 bg-primary/20 text-primary">
            🔥 {passport.weeklyStreak}wk streak
          </Badge>
        )}
      </div>

      {/* Passport Progress */}
      {passport && (
        <Card className="overflow-hidden bg-gradient-to-br from-primary/20 via-card to-accent/10 border-primary/20">
          <CardContent className="p-5">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-foreground font-medium">{passport.levelName}</span>
              <span className="text-muted-foreground">{passport.progressToNext.nextLevelName}</span>
            </div>
            <Progress value={Math.min(progressPercent, 100)} className="h-2.5" />
            <p className="text-xs mt-3 text-muted-foreground">
              {passport.progressToNext.remaining} actions to{" "}
              <span className="text-primary font-medium">{passport.progressToNext.nextLevelName}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Balances */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-emerald-950/40 border-emerald-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-emerald-400/70 mb-1">Spend</p>
            <p className="text-2xl font-bold text-emerald-400">
              {balances?.spendable || "0"}
            </p>
            <p className="text-xs text-emerald-400/50">FLOW</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-primary/70 mb-1">Saved</p>
            <p className="text-2xl font-bold text-gold-gradient">
              {balances?.savings || "0"}
            </p>
            <p className="text-xs text-primary/50">FLOW</p>
          </CardContent>
        </Card>
        <Card className="bg-violet-950/40 border-violet-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-violet-400/70 mb-1">Subs</p>
            <p className="text-2xl font-bold text-violet-400">
              {balances?.subscriptionReserve || "0"}
            </p>
            <p className="text-xs text-violet-400/50">FLOW</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: PiggyBank, label: "Save", href: "/teen/save", color: "text-emerald-400" },
          { icon: CreditCard, label: "Subscribe", href: "/teen/subscribe", color: "text-violet-400" },
          { icon: Bot, label: "Calma", href: "/teen/chat", color: "text-primary" },
          { icon: History, label: "Activity", href: "/teen/activity", color: "text-muted-foreground" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center p-4 rounded-xl bg-card/60 border border-border/20 hover:bg-card hover:border-border/40 transition-all"
          >
            <item.icon className={cn("h-6 w-6 mb-2", item.color)} />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Pending Requests */}
      {pendingApprovals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="text-amber-400">⏳</span>
              Pending Approval ({pendingApprovals.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingApprovals.map((req) => (
              <div
                key={req.id}
                className="flex justify-between items-center p-3 rounded-lg border border-amber-500/20 bg-amber-950/30"
              >
                <div>
                  <span className="text-sm font-medium text-foreground">{req.description}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Waiting for guardian review
                  </p>
                </div>
                <Badge className="border-amber-500/30 bg-amber-500/20 text-amber-400 text-xs">
                  {req.policyDecision}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Recent Activity</CardTitle>
            <Link
              href="/teen/activity"
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🌱</div>
              <p className="text-sm text-muted-foreground">No activity yet. Start by saving!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {receipts.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between items-center py-3 border-b border-border/20 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gold-gradient">{r.amount} FLOW</p>
                    <div className="flex gap-2 mt-1 justify-end">
                      {r.flowTxHash && (
                        <a
                          href={r.flowExplorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary/70 hover:text-primary transition-colors"
                        >
                          View Tx
                        </a>
                      )}
                      {r.storachaCid && (
                        <a
                          href={r.storachaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-violet-400/70 hover:text-violet-400 transition-colors"
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

      {/* Refresh Button */}
      <Button
        variant="ghost"
        onClick={refresh}
        className="w-full text-muted-foreground hover:text-foreground"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>
  );
}
