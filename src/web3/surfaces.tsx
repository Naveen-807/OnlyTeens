"use client";

import { AlertTriangle, FileCheck2, ShieldAlert, ShieldCheck, Wallet2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { PolicyState } from "@/types/proof18";

export function WalletAccountStatus({
  connected,
  guardianReady,
}: {
  connected: boolean;
  guardianReady: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge className={cn(connected ? "border-primary/30 bg-primary/10 text-primary" : "border-destructive/30 bg-destructive/10 text-destructive")}>
        <Wallet2 className="h-3.5 w-3.5" />
        {connected ? "wallet ready" : "wallet not ready"}
      </Badge>
      <Badge className={cn(guardianReady ? "border-primary/30 bg-primary/10 text-primary" : "")}>
        <ShieldCheck className="h-3.5 w-3.5" />
        {guardianReady ? "guardian authority live" : "guardian authority missing"}
      </Badge>
    </div>
  );
}

export function SigningRequestModalSurface({
  active,
}: {
  active: boolean;
}) {
  return (
    <Card className={cn("rounded-[1.5rem] p-4 transition", active ? "border-primary/30 bg-primary/5" : "bg-card/70")}>
      <div className="flex items-center gap-3">
        {active ? <Spinner size="sm" /> : <ShieldCheck className="h-4 w-4 text-primary" />}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">signing request</p>
          <p className="text-sm text-foreground">{active ? "Waiting for household signature confirmation." : "No signature required right now."}</p>
        </div>
      </div>
    </Card>
  );
}

export function TransactionStateSurface({
  pending,
  confirmed,
}: {
  pending: boolean;
  confirmed: boolean;
}) {
  return (
    <Card className="rounded-[1.5rem] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">transaction rail</p>
      <div className="mt-3 flex items-center gap-3">
        <div className={cn("h-2.5 w-2.5 rounded-full", pending ? "bg-amber-500 animate-pulse" : confirmed ? "bg-primary" : "bg-border")} />
        <p className="text-sm text-foreground">
          {pending ? "Movement pending confirmation." : confirmed ? "Movement confirmed and household balances updated." : "No active movement."}
        </p>
      </div>
    </Card>
  );
}

export function ConfidentialPolicyResult({
  policy,
}: {
  policy: PolicyState;
}) {
  const tone = {
    green: "border-emerald-300/70 bg-emerald-50/70 text-emerald-900",
    yellow: "border-amber-300/70 bg-amber-50/80 text-amber-900",
    red: "border-rose-300/70 bg-rose-50/80 text-rose-900",
    blocked: "border-stone-300/70 bg-stone-100/90 text-stone-700",
  }[policy];

  return (
    <Card className={cn("rounded-[1.5rem] border p-4", tone)}>
      <p className="text-xs uppercase tracking-[0.2em] opacity-70">confidential policy result</p>
      <p className="mt-2 text-sm font-medium">
        {policy === "green" && "Safe band. Action may proceed automatically."}
        {policy === "yellow" && "Allowed, but guardian receives a heads-up."}
        {policy === "red" && "Higher-risk band. Approval is required before funds move."}
        {policy === "blocked" && "Blocked by category or account pause state."}
      </p>
    </Card>
  );
}

export function EvidenceReferenceSurface({ reference }: { reference: string }) {
  return (
    <Card className="rounded-[1.5rem] p-4">
      <div className="flex items-center gap-3">
        <FileCheck2 className="h-5 w-5 text-primary" />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">evidence reference</p>
          <p className="text-sm text-foreground">{reference}</p>
        </div>
      </div>
    </Card>
  );
}

export function PausedAccountSurface({ paused }: { paused: boolean }) {
  if (!paused) return null;
  return (
    <Card className="rounded-[1.5rem] border-destructive/40 bg-destructive/10 p-4 text-destructive">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-4 w-4" />
        <p className="text-sm font-medium">Household actions are paused. Guardian intervention is required.</p>
      </div>
    </Card>
  );
}

export function GuardianAuthoritySurface({ ready }: { ready: boolean }) {
  return (
    <Card className={cn("rounded-[1.5rem] p-4", ready ? "bg-primary/8" : "bg-amber-100/70")}>
      <div className="flex items-center gap-3">
        {ready ? <ShieldCheck className="h-4 w-4 text-primary" /> : <AlertTriangle className="h-4 w-4 text-amber-700" />}
        <p className="text-sm text-foreground">
          {ready ? "Guardian control is active. Approvals can release queued requests." : "Guardian wallet still needs to connect before approvals can sign."}
        </p>
      </div>
    </Card>
  );
}
