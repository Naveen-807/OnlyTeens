import { Award, Flame, TrendingUp, CheckCircle2, XCircle, Sparkles } from "lucide-react";

import type { PassportState } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const levelColors: Record<string, string> = {
  Starter: "border-slate-500/30 bg-slate-950/60 text-slate-400",
  Explorer: "border-blue-500/30 bg-blue-950/60 text-blue-400",
  Saver: "border-emerald-500/30 bg-emerald-950/60 text-emerald-400",
  Manager: "border-violet-500/30 bg-violet-950/60 text-violet-400",
  Planner: "border-amber-500/30 bg-amber-950/60 text-amber-400",
  Independent: "border-primary/30 bg-primary/20 text-primary",
};

export function PassportCard({ passport }: { passport: PassportState }) {
  const levelStyle = levelColors[passport.levelName] || levelColors.Starter;

  return (
    <Card className="w-full max-w-md mx-auto bg-card/90 border-border/30 backdrop-blur-sm overflow-hidden">
      {/* Header with gold gradient */}
      <div className="relative bg-gradient-to-br from-primary/20 via-card to-card p-6 border-b border-border/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="rounded-2xl bg-primary/20 p-4 border border-primary/30 premium-glow">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Financial Passport
            </p>
            <h2 className="text-2xl font-bold text-gold-gradient">
              Level {passport.level}
            </h2>
            <Badge className={levelStyle}>
              {passport.levelName}
            </Badge>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Progress to Next Level */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Progress to {passport.progressToNext.nextLevelName}
            </span>
            <span className="font-bold text-primary">
              {passport.progressToNext.percentComplete}%
            </span>
          </div>
          <div className="relative">
            <Progress
              value={Math.min(passport.progressToNext.percentComplete, 100)}
              className="h-3"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {passport.progressToNext.remaining} more actions to level up
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/40 p-4">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Flame className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Streak</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {passport.weeklyStreak}
              <span className="text-sm font-normal ml-1">weeks</span>
            </p>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Actions</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {passport.totalActions}
            </p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="space-y-3 rounded-xl border border-border/30 bg-card/50 p-4">
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Activity Breakdown
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-border/20">
              <span className="text-sm text-muted-foreground">Savings deposits</span>
              <span className="font-mono font-semibold text-emerald-400">
                {passport.savingsCount}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Approved subscriptions
              </div>
              <span className="font-mono font-semibold text-emerald-400">
                {passport.approvedSubs}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-3.5 w-3.5 text-rose-500" />
                Rejected actions
              </div>
              <span className="font-mono font-semibold text-rose-400">
                {passport.rejectedActions}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
