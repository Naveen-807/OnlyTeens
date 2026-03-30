"use client";

import { CheckCircle2, CircleAlert, Clock3, FileCheck2, LockKeyhole, Shield, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { HistoryItem, NotificationItem, PolicyState } from "@/types/proof18";

export function TopNavigation({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <Card className="p-5 bg-card/80 border-border/30 backdrop-blur-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{subtitle}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
        </div>
        {actions}
      </div>
    </Card>
  );
}

export function WalletBalanceCard({
  balance,
  allowance,
  label = "current balance",
}: {
  balance: number;
  allowance: string;
  label?: string;
}) {
  return (
    <Card className="overflow-hidden p-6 bg-card/80 border-border/30 backdrop-blur-sm">
      <div className="rounded-xl bg-gradient-to-br from-primary/15 via-transparent to-accent/10 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-5xl font-semibold text-gold-gradient">${balance.toFixed(2)}</p>
        <div className="mt-5 flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
          <span>Next allowance</span>
          <span className="font-medium text-foreground">{allowance}</span>
        </div>
      </div>
    </Card>
  );
}

export function GoalProgressCard({
  name,
  saved,
  target,
  onAdd,
  loading,
}: {
  name: string;
  saved: number;
  target: number;
  onAdd?: () => void;
  loading?: boolean;
}) {
  const progress = Math.min((saved / target) * 100, 100);
  return (
    <Card className="p-5 bg-card/80 border-border/30 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">goal</p>
          <h3 className="mt-2 text-xl font-semibold text-foreground">{name}</h3>
        </div>
        <Badge className="border-primary/30 bg-primary/20 text-primary">{progress.toFixed(0)}%</Badge>
      </div>
      <Progress value={progress} className="mt-4 h-2" />
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>${saved.toFixed(2)} saved</span>
        <span>${target.toFixed(2)} target</span>
      </div>
      {onAdd && (
        <Button className="mt-5 w-full" onClick={onAdd} disabled={loading}>
          {loading ? <Spinner size="sm" className="text-primary-foreground" /> : null}
          Add money
        </Button>
      )}
    </Card>
  );
}

export function PassportBadgeCard({
  score,
  level,
  streak,
}: {
  score: number;
  level: string;
  streak: number;
}) {
  return (
    <Card className="p-5 bg-card/80 border-border/30 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">passport</p>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-4xl font-semibold text-gold-gradient">{score}</p>
          <p className="mt-1 text-sm text-muted-foreground">{level}</p>
        </div>
        <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {streak}-day streak
        </div>
      </div>
    </Card>
  );
}

export function ApprovalRequestCard({
  teen,
  title,
  amount,
  explanation,
  onApprove,
  onDeny,
  loading,
}: {
  teen: string;
  title: string;
  amount: number;
  explanation: string;
  onApprove: () => void;
  onDeny: () => void;
  loading?: boolean;
}) {
  return (
    <Card className="p-5 bg-card/80 border-border/30 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{teen}</p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-xl font-semibold text-gold-gradient">${amount.toFixed(2)}</p>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{explanation}</p>
      <div className="mt-5 flex gap-2">
        <Button className="flex-1" onClick={onApprove} disabled={loading}>
          {loading ? <Spinner size="sm" className="text-primary-foreground" /> : null}
          Approve
        </Button>
        <Button className="flex-1" variant="outline" onClick={onDeny} disabled={loading}>
          Deny
        </Button>
      </div>
    </Card>
  );
}

export function PolicyStatusChip({ policy }: { policy: PolicyState }) {
  const config = {
    green: "border-emerald-500/30 bg-emerald-950/60 text-emerald-400",
    yellow: "border-amber-500/30 bg-amber-950/60 text-amber-400",
    red: "border-rose-500/30 bg-rose-950/60 text-rose-400",
    blocked: "border-neutral-500/30 bg-neutral-900/60 text-neutral-400",
  }[policy];

  return <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]", config)}>{policy}</span>;
}

export function TransactionHistoryRow({ item }: { item: HistoryItem }) {
  return (
    <div className="grid gap-3 rounded-lg border border-border/30 bg-card/60 p-4 md:grid-cols-[1.7fr_0.8fr_0.8fr_1fr] md:items-center">
      <div>
        <p className="font-medium text-foreground">{item.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{item.date}</p>
      </div>
      <p className="font-semibold text-gold-gradient">${item.amount.toFixed(2)}</p>
      <div className="flex flex-wrap gap-2">
        <PolicyStatusChip policy={item.policy} />
        <Badge variant="outline" className="border-border/50">{item.approvalNeeded ? "approval needed" : "no approval"}</Badge>
      </div>
      <p className="text-sm text-muted-foreground truncate">{item.evidenceRef}</p>
    </div>
  );
}

export function ActionSummaryCard({
  title,
  amount,
  body,
}: {
  title: string;
  amount: string;
  body: string;
}) {
  return (
    <Card className="p-5 bg-card/80 border-border/30 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">summary</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <span className="text-lg font-semibold text-gold-gradient">{amount}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </Card>
  );
}

export function ClawrenceMessageBubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
}) {
  return (
    <div className={cn(
      "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
      role === "assistant"
        ? "bg-primary/10 border border-primary/20 text-foreground"
        : "ml-auto bg-secondary text-secondary-foreground"
    )}>
      {children}
    </div>
  );
}

export function ExplanationCard({
  title,
  body,
  tone = "neutral",
}: {
  title: string;
  body: string;
  tone?: "neutral" | "good" | "warning" | "bad";
}) {
  const config = {
    neutral: {
      icon: <Shield className="h-4 w-4 text-primary" />,
      className: "border-border/30",
    },
    good: {
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
      className: "border-emerald-500/30 bg-emerald-950/30",
    },
    warning: {
      icon: <CircleAlert className="h-4 w-4 text-amber-400" />,
      className: "border-amber-500/30 bg-amber-950/30",
    },
    bad: {
      icon: <XCircle className="h-4 w-4 text-rose-400" />,
      className: "border-rose-500/30 bg-rose-950/30",
    },
  }[tone];

  return (
    <Card className={cn("p-4 bg-card/80 backdrop-blur-sm", config.className)}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
        </div>
      </div>
    </Card>
  );
}

export function ConfirmationPanel({
  title,
  body,
  onConfirm,
  confirmLabel,
}: {
  title: string;
  body: string;
  onConfirm: () => void;
  confirmLabel: string;
}) {
  return (
    <Card className="p-5 bg-card/80 border-border/30 backdrop-blur-sm">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <Button className="mt-4" onClick={onConfirm}>
        <LockKeyhole className="h-4 w-4" />
        {confirmLabel}
      </Button>
    </Card>
  );
}

export function ResultPanel({
  tone,
  title,
  body,
}: {
  tone: "success" | "blocked" | "approval-needed";
  title: string;
  body: string;
}) {
  const config = {
    success: {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
      className: "border-emerald-500/30 bg-emerald-950/40",
    },
    blocked: {
      icon: <XCircle className="h-5 w-5 text-rose-400" />,
      className: "border-rose-500/30 bg-rose-950/40",
    },
    "approval-needed": {
      icon: <Clock3 className="h-5 w-5 text-amber-400" />,
      className: "border-amber-500/30 bg-amber-950/40",
    },
  }[tone];

  return (
    <Card className={cn("border p-5", config.className)}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-foreground/80">{body}</p>
        </div>
      </div>
    </Card>
  );
}

export function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: React.ReactNode;
}) {
  return (
    <Card className="p-8 text-center bg-card/80 border-border/30 backdrop-blur-sm">
      <FileCheck2 className="mx-auto h-8 w-8 text-primary" />
      <p className="mt-4 text-lg font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {cta ? <div className="mt-5">{cta}</div> : null}
    </Card>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <Card className="flex items-center gap-3 p-5 bg-card/80 border-border/30 backdrop-blur-sm">
      <Spinner />
      <p className="text-sm text-foreground">{label}</p>
    </Card>
  );
}

export function NotificationList({ items }: { items: NotificationItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="p-4 bg-card/80 border-border/30 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
            <Badge variant="outline" className="border-border/50 text-muted-foreground">{item.time}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
