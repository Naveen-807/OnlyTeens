import Link from "next/link";
import { Shield, Lock, Zap, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PermissionsProofState } from "@/lib/types";
import { cn } from "@/lib/utils";

function shorten(value?: string | null) {
  if (!value) return "n/a";
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function getDecisionBadgeColor(decision?: string) {
  switch (decision) {
    case "GREEN":
    case "ALLOW":
      return "border-emerald-500/30 bg-emerald-950/60 text-emerald-400";
    case "YELLOW":
    case "REVIEW":
      return "border-amber-500/30 bg-amber-950/60 text-amber-400";
    case "RED":
      return "border-orange-500/30 bg-orange-950/60 text-orange-400";
    case "BLOCKED":
    case "BLOCK":
      return "border-rose-500/30 bg-rose-950/60 text-rose-400";
    default:
      return "border-slate-500/30 bg-slate-950/60 text-slate-400";
  }
}

export function PermissionsProof({
  guardianPkpAddress,
  teenPkpAddress,
  clawrencePkpAddress,
  safeExecutorCid,
  permittedScopes = [],
  proof,
  className,
}: {
  guardianPkpAddress: string;
  teenPkpAddress: string;
  clawrencePkpAddress: string;
  safeExecutorCid: string;
  permittedScopes?: string[];
  proof?: PermissionsProofState;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden p-5 sm:p-6", className)}>
      <div className="flex flex-col gap-5">
        <div>
          <Badge>Delegated execution proof</Badge>
          <h3 className="font-display mt-4 text-3xl leading-none tracking-[-0.04em] text-foreground">
            Private policy before money moves
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Proof18 only executes after confidential policy, delegated authorization,
            and bounded signing all line up. The guardian sets authority. Clawrence
            operates inside the granted scope.
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-primary/25 bg-[linear-gradient(180deg,oklch(0.13_0.012_85),oklch(0.08_0.006_85))] p-4 sm:p-5">
          <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary/80">
            <Shield className="h-3.5 w-3.5" />
            Safety Layers
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-[1.2rem] border border-violet-500/25 bg-violet-950/30 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-400/20 bg-violet-500/14 text-violet-300 font-bold">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-violet-200">Zama FHE Policy</span>
                  <Badge className={cn("text-xs", getDecisionBadgeColor(proof?.zamaDecision))}>
                    {proof?.zamaDecision || "PENDING"}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-violet-200/65">
                  Encrypted policy decides if action is within family rules
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[1.2rem] border border-amber-500/25 bg-amber-950/25 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/20 bg-amber-500/14 text-amber-300 font-bold">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-amber-100">Vincent Guardrails</span>
                  <Badge className={cn("text-xs", getDecisionBadgeColor(proof?.guardrailDecision))}>
                    {proof?.guardrailDecision || "PENDING"}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-amber-100/65">
                  Guardian-delegated authority stays scoped, revocable, and auditable
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[1.2rem] border border-blue-500/25 bg-blue-950/25 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/14 text-blue-300 font-bold">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-100">Lit Execution Boundary</span>
                  <Badge className={cn(
                    "text-xs",
                    proof?.litAuthorized
                      ? "border-emerald-500/30 bg-emerald-950/60 text-emerald-400"
                      : "border-slate-500/30 bg-slate-950/60 text-slate-400"
                  )}>
                    {proof?.litAuthorized ? "AUTHORIZED" : "PENDING"}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-blue-100/65">
                  Immutable signing policy controls when the delegated executor can act
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-3 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Delegated role separation
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.2rem] border border-emerald-500/25 bg-emerald-950/24 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-emerald-200 font-medium">
                  Guardian authority
                </p>
                <Badge className="border-emerald-500/30 bg-emerald-950/60 text-emerald-400 text-[10px]">
                  SignAnything
                </Badge>
              </div>
              <p className="mt-2 font-mono text-xs text-emerald-100/80">{shorten(guardianPkpAddress)}</p>
              <p className="mt-1 text-[10px] text-emerald-100/58">Full signing authority</p>
            </div>
            <div className="rounded-[1.2rem] border border-blue-500/25 bg-blue-950/24 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-blue-100 font-medium">
                  Teen session
                </p>
                <Badge className="border-blue-500/30 bg-blue-950/60 text-blue-400 text-[10px]">
                  PersonalSign
                </Badge>
              </div>
              <p className="mt-2 font-mono text-xs text-blue-100/80">{shorten(teenPkpAddress)}</p>
              <p className="mt-1 text-[10px] text-blue-100/58">Limited to messages</p>
            </div>
            <div className="rounded-[1.2rem] border border-violet-500/25 bg-violet-950/24 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-violet-100 font-medium">
                  Clawrence executor
                </p>
                <Badge className="border-violet-500/30 bg-violet-950/60 text-violet-400 text-[10px]">
                  Lit Action
                </Badge>
              </div>
              <p className="mt-2 font-mono text-xs text-violet-100/80">{shorten(clawrencePkpAddress)}</p>
              <p className="mt-1 text-[10px] text-violet-100/58">Bound to CID: {shorten(safeExecutorCid)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.2rem] border border-border/55 bg-background/24 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Zama evaluation tx
            </p>
            {proof?.evaluationTxHash ? (
              <p className="mt-2 font-mono text-sm text-foreground">
                {shorten(proof.evaluationTxHash)}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No evaluation yet.</p>
            )}
          </div>
          <div className="rounded-[1.2rem] border border-border/55 bg-background/24 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Flow execution
            </p>
            {proof?.flowTxHash ? (
              proof.flowExplorerUrl ? (
                <Link
                  href={proof.flowExplorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 font-mono text-sm text-primary hover:underline"
                >
                  {shorten(proof.flowTxHash)}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ) : (
                <p className="mt-2 font-mono text-sm text-foreground">
                  {shorten(proof.flowTxHash)}
                </p>
              )
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No transaction yet.</p>
            )}
          </div>
          <div className="rounded-[1.2rem] border border-border/55 bg-background/24 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Evidence CID
            </p>
            {proof?.storachaCid ? (
              proof.storachaUrl ? (
                <Link
                  href={proof.storachaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 font-mono text-sm text-primary hover:underline"
                >
                  {shorten(proof.storachaCid)}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ) : (
                <p className="mt-2 font-mono text-sm text-foreground">
                  {shorten(proof.storachaCid)}
                </p>
              )
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Appendix evidence appears here after execution.</p>
            )}
          </div>
        </div>

        {permittedScopes.length > 0 && (
          <div className="rounded-[1.2rem] border border-border/55 bg-background/24 p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Zap className="h-3.5 w-3.5" />
              Permitted scopes
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {permittedScopes.map((scope) => (
                <Badge key={scope} className="border-primary/30 bg-primary/10 text-primary">
                  {scope}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
