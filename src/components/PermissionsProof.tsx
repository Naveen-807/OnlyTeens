import Link from "next/link";

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
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "YELLOW":
    case "REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "RED":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "BLOCKED":
    case "BLOCK":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
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
    <Card className={cn("overflow-hidden p-5", className)}>
      <div className="flex flex-col gap-5">
        <div>
          <Badge className="border-primary/20 bg-primary/10 text-primary">
            Permissions proof
          </Badge>
          <h3 className="mt-3 text-lg font-semibold text-foreground">
            Three-Layer Safety Model
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Every action must pass through three independent safety layers before execution.
            All three must agree before money moves.
          </p>
        </div>

        {/* Three-Layer Safety Model */}
        <div className="rounded-[1.2rem] border-2 border-primary/30 bg-gradient-to-b from-primary/5 to-transparent p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-primary font-medium">
            Safety Layers
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {/* Layer 1: Zama */}
            <div className="flex items-center gap-3 rounded-lg bg-purple-50/80 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-purple-900">Zama FHE Policy</span>
                  <Badge className={cn("text-xs", getDecisionBadgeColor(proof?.zamaDecision))}>
                    {proof?.zamaDecision || "PENDING"}
                  </Badge>
                </div>
                <p className="text-xs text-purple-700 mt-0.5">
                  Encrypted policy decides if action is within family rules
                </p>
              </div>
            </div>

            {/* Layer 2: Vincent */}
            <div className="flex items-center gap-3 rounded-lg bg-orange-50/80 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700 font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-orange-900">Vincent Guardrails</span>
                  <Badge className={cn("text-xs", getDecisionBadgeColor(proof?.guardrailDecision))}>
                    {proof?.guardrailDecision || "PENDING"}
                  </Badge>
                </div>
                <p className="text-xs text-orange-700 mt-0.5">
                  AI guardrails limit what Clawrence wallet can do
                </p>
              </div>
            </div>

            {/* Layer 3: Lit */}
            <div className="flex items-center gap-3 rounded-lg bg-blue-50/80 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-900">Lit Protocol Signing</span>
                  <Badge className={cn(
                    "text-xs",
                    proof?.litAuthorized
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  )}>
                    {proof?.litAuthorized ? "AUTHORIZED" : "PENDING"}
                  </Badge>
                </div>
                <p className="text-xs text-blue-700 mt-0.5">
                  Immutable Lit Action on IPFS controls PKP signing
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PKP Role Separation */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
            PKP Role Separation (Lit Protocol)
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.2rem] border-2 border-green-300 bg-green-50/50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.18em] text-green-700 font-medium">
                  Guardian PKP
                </p>
                <Badge className="border-green-300 bg-green-100 text-green-800 text-[10px]">
                  SignAnything
                </Badge>
              </div>
              <p className="mt-2 font-mono text-xs">{shorten(guardianPkpAddress)}</p>
              <p className="mt-1 text-[10px] text-green-600">Full signing authority</p>
            </div>
            <div className="rounded-[1.2rem] border-2 border-blue-300 bg-blue-50/50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.18em] text-blue-700 font-medium">
                  Teen PKP
                </p>
                <Badge className="border-blue-300 bg-blue-100 text-blue-800 text-[10px]">
                  PersonalSign
                </Badge>
              </div>
              <p className="mt-2 font-mono text-xs">{shorten(teenPkpAddress)}</p>
              <p className="mt-1 text-[10px] text-blue-600">Limited to messages</p>
            </div>
            <div className="rounded-[1.2rem] border-2 border-purple-300 bg-purple-50/50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.18em] text-purple-700 font-medium">
                  Clawrence PKP
                </p>
                <Badge className="border-purple-300 bg-purple-100 text-purple-800 text-[10px]">
                  Lit Action
                </Badge>
              </div>
              <p className="mt-2 font-mono text-xs">{shorten(clawrencePkpAddress)}</p>
              <p className="mt-1 text-[10px] text-purple-600">Bound to CID: {shorten(safeExecutorCid)}</p>
            </div>
          </div>
        </div>

        {/* Evidence Links */}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.2rem] border border-border/70 bg-white/70 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
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
          <div className="rounded-[1.2rem] border border-border/70 bg-white/70 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Flow execution
            </p>
            {proof?.flowTxHash ? (
              proof.flowExplorerUrl ? (
                <Link
                  href={proof.flowExplorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block font-mono text-sm text-primary hover:underline"
                >
                  {shorten(proof.flowTxHash)}
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
          <div className="rounded-[1.2rem] border border-border/70 bg-white/70 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Storacha evidence
            </p>
            {proof?.storachaCid ? (
              proof.storachaUrl ? (
                <Link
                  href={proof.storachaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block font-mono text-sm text-primary hover:underline"
                >
                  {shorten(proof.storachaCid)}
                </Link>
              ) : (
                <p className="mt-2 font-mono text-sm text-foreground">
                  {shorten(proof.storachaCid)}
                </p>
              )
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Waiting to store receipt.</p>
            )}
          </div>
        </div>

        {permittedScopes.length > 0 ? (
          <div className="rounded-[1.2rem] border border-border/70 bg-white/70 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Permitted scopes
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {permittedScopes.map((scope) => (
                <Badge key={scope} className="border-primary/20 bg-primary/10 text-primary">
                  {scope}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
