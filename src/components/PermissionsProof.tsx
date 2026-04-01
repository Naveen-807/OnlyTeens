import Link from "next/link";
import { Shield, Lock, Zap, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PermissionsProofState, RuntimeCapabilities } from "@/lib/types";
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
  vincentMode = "unknown",
  capabilities,
  className,
}: {
  guardianPkpAddress: string;
  teenPkpAddress: string;
  clawrencePkpAddress: string;
  safeExecutorCid: string;
  permittedScopes?: string[];
  proof?: PermissionsProofState;
  vincentMode?: "live" | "blocked" | "unknown";
  capabilities?: RuntimeCapabilities;
  className?: string;
}) {
  const vincentLabel =
    vincentMode === "live"
      ? "LIVE API"
      : vincentMode === "blocked"
        ? "BLOCKED"
        : "RUNTIME";

  const vincentLabelClass =
    vincentMode === "live"
      ? "border-emerald-500/30 bg-emerald-950/60 text-emerald-400"
      : vincentMode === "blocked"
        ? "border-rose-500/30 bg-rose-950/60 text-rose-300"
        : "border-blue-500/30 bg-blue-950/60 text-blue-300";

  const vincentCopy =
    vincentMode === "live"
      ? "Guardian-delegated Vincent API guardrails are active for this run"
      : vincentMode === "blocked"
        ? "Vincent live mode is not ready, so execution is blocked until the dependency is fixed"
        : "Vincent mode is detected at runtime before execution";

  return (
    <Card className={cn("overflow-hidden border-primary/15 bg-[linear-gradient(180deg,oklch(0.11_0.008_85_/_0.96),oklch(0.075_0.005_85_/_0.98))] p-5 sm:p-6", className)}>
      <div className="flex flex-col gap-5">
        <div>
          <Badge>Consumer DeFi on Flow</Badge>
          <h3 className="font-display mt-4 text-3xl leading-none tracking-[-0.04em] text-foreground">
            Flow execution with private policy before money moves
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Proof18 is designed to feel like consumer finance, not wallet ops. Flow
            handles user-facing execution and automation, while Zama, Vincent, and
            Lit keep the action inside guardian-defined safety boundaries.
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-primary/20 bg-[linear-gradient(180deg,oklch(0.13_0.012_85),oklch(0.08_0.006_85))] p-4 sm:p-5">
          <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary/80">
            <Shield className="h-3.5 w-3.5" />
            Safety Layers
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-[1.2rem] border border-border/55 bg-card/55 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 font-bold text-primary">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Zama FHE Policy</span>
                  <Badge className={cn("text-xs", getDecisionBadgeColor(proof?.zamaDecision))}>
                    {proof?.zamaDecision || "PENDING"}
                  </Badge>
                  {proof?.zamaSource ? (
                    <Badge className="border-violet-500/25 bg-violet-950/40 text-[10px] text-violet-200">
                      {proof.zamaSource.toUpperCase()}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Encrypted policy decides if action is within family rules
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[1.2rem] border border-border/55 bg-card/55 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 font-bold text-primary">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Vincent Guardrails</span>
                  <Badge className={cn("text-xs", getDecisionBadgeColor(proof?.guardrailDecision))}>
                    {proof?.guardrailDecision || "PENDING"}
                  </Badge>
                  <Badge className={cn("text-[10px]", vincentLabelClass)}>
                    {vincentLabel}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {vincentCopy}
                </p>
                {proof?.guardrailReason ? (
                  <p className="mt-1.5 text-xs text-foreground/80">
                    {proof.guardrailReason}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[1.2rem] border border-border/55 bg-card/55 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 font-bold text-primary">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Lit Execution Boundary</span>
                  <Badge className={cn(
                    "text-xs",
                    proof?.litAuthorized
                      ? "border-emerald-500/30 bg-emerald-950/60 text-emerald-400"
                      : "border-slate-500/30 bg-slate-950/60 text-slate-400"
                  )}>
                    {proof?.litAuthorized ? "AUTHORIZED" : "PENDING"}
                  </Badge>
                  {proof?.litPermissionStatus ? (
                    <Badge className="border-blue-500/25 bg-blue-950/40 text-[10px] text-blue-200">
                      {proof.litPermissionStatus.toUpperCase()}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Immutable signing policy controls when the delegated executor can act
                </p>
                {proof?.litPermissionNote ? (
                  <p className="mt-1.5 text-xs text-foreground/80">
                    {proof.litPermissionNote}
                  </p>
                ) : null}
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
            <div className="rounded-[1.2rem] border border-border/55 bg-card/55 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-foreground">
                  Guardian authority
                </p>
                <Badge className="border-emerald-500/30 bg-emerald-950/60 text-emerald-400 text-[10px]">
                  SignAnything
                </Badge>
              </div>
              <p className="mt-2 font-mono text-xs text-foreground/85">{shorten(guardianPkpAddress)}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Full signing authority</p>
            </div>
            <div className="rounded-[1.2rem] border border-border/55 bg-card/55 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-foreground">
                  Teen session
                </p>
                <Badge className="border-blue-500/30 bg-blue-950/60 text-blue-400 text-[10px]">
                  PersonalSign
                </Badge>
              </div>
              <p className="mt-2 font-mono text-xs text-foreground/85">{shorten(teenPkpAddress)}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Limited to messages</p>
            </div>
            <div className="rounded-[1.2rem] border border-border/55 bg-card/55 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-foreground">
                  Calma executor
                </p>
                <Badge className="border-violet-500/30 bg-violet-950/60 text-violet-400 text-[10px]">
                  Lit Action
                </Badge>
              </div>
              <p className="mt-2 font-mono text-xs text-foreground/85">{shorten(clawrencePkpAddress)}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Bound to CID: {shorten(safeExecutorCid)}</p>
            </div>
          </div>
        </div>

        {capabilities ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-[1.2rem] border border-border/55 bg-card/55 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Runtime capability truth
              </p>
              <div className="mt-3 grid gap-3 text-sm text-foreground/85">
                <div className="flex items-center justify-between rounded-xl border border-border/55 px-3 py-2">
                  <span>Flow core</span>
                  <Badge className={cn("text-[10px]", capabilities.sponsorReadiness.flowCore ? getDecisionBadgeColor("ALLOW") : getDecisionBadgeColor("BLOCK"))}>
                    {capabilities.sponsorReadiness.flowCore ? "READY" : "INCOMPLETE"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/55 px-3 py-2">
                  <span>Wallet mode</span>
                  <Badge className="border-blue-500/30 bg-blue-950/50 text-[10px] text-blue-300">
                    {capabilities.flow.walletMode}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/55 px-3 py-2">
                  <span>Gas mode</span>
                  <Badge className={cn("text-[10px]", capabilities.flow.gasMode === "sponsored" ? getDecisionBadgeColor("ALLOW") : getDecisionBadgeColor("REVIEW"))}>
                    {capabilities.flow.gasMode}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/55 px-3 py-2">
                  <span>Scheduler backend</span>
                  <Badge className={cn("text-[10px]", capabilities.flow.preferredSchedulerBackend === "flow-native-scheduled" ? getDecisionBadgeColor("ALLOW") : getDecisionBadgeColor("REVIEW"))}>
                    {capabilities.flow.preferredSchedulerBackend}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/55 px-3 py-2">
                  <span>Zama confidential policy</span>
                  <Badge className={cn("text-[10px]", capabilities.sponsorReadiness.zamaCore ? getDecisionBadgeColor("ALLOW") : getDecisionBadgeColor("BLOCK"))}>
                    {capabilities.sponsorReadiness.zamaCore ? "READY" : "INCOMPLETE"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/55 px-3 py-2">
                  <span>Lit delegated execution</span>
                  <Badge className={cn("text-[10px]", capabilities.sponsorReadiness.litDelegation ? getDecisionBadgeColor("ALLOW") : getDecisionBadgeColor("REVIEW"))}>
                    {capabilities.sponsorReadiness.litDelegation ? "LIVE PROOF" : "NEEDS DEMO"}
                  </Badge>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {capabilities.vincent.note}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {capabilities.flow.flowNativeFeaturesUsed.map((feature) => (
                  <Badge key={feature} className="border-primary/25 bg-primary/10 text-[10px] text-primary">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-[1.2rem] border border-border/55 bg-card/55 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Chain responsibilities
              </p>
              <div className="mt-3 space-y-3 text-sm">
                <div className="rounded-xl border border-border/55 px-3 py-2">
                  <p className="font-medium text-foreground">Flow Testnet ({capabilities.flow.chainId})</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    access {shorten(capabilities.flow.accessContract)} · vault {shorten(capabilities.flow.vaultContract)} · scheduler {shorten(capabilities.flow.schedulerContract)} · passport {shorten(capabilities.flow.passportContract)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {capabilities.flow.nativeSchedulingConfigured
                      ? "Flow-native scheduled transactions are configured for recurring automation."
                      : "Recurring automation currently falls back to the EVM scheduler path on Flow."}
                  </p>
                </div>
                <div className="rounded-xl border border-border/55 px-3 py-2">
                  <p className="font-medium text-foreground">{capabilities.zama.network}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    policy {shorten(capabilities.zama.policyContract)}
                  </p>
                </div>
                <div className="rounded-xl border border-border/55 px-3 py-2">
                  <p className="font-medium text-foreground">{capabilities.lit.network}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    safe executor {shorten(capabilities.lit.safeExecutorCid || "not-configured")}
                  </p>
                </div>
                <div className="rounded-xl border border-border/55 px-3 py-2">
                  <p className="font-medium text-foreground">Chipotle household</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    account {shorten(capabilities.lit.familyProof.chipotleAccountId)} · group{" "}
                    {shorten(capabilities.lit.familyProof.chipotlePrimaryGroupId)}
                  </p>
                </div>
                <div className="rounded-xl border border-border/55 px-3 py-2">
                  <p className="font-medium text-foreground">Runtime mode</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {capabilities.lit.familyProof.executionMode || "vincent-live"}
                    {capabilities.lit.familyProof.fallbackActive ? " · emergency" : " · live"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {capabilities?.lit.familyProof.available ? (
          <div className="rounded-[1.2rem] border border-border/55 bg-card/55 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Selected family proof
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Family</p>
                <p className="mt-2 font-mono text-xs text-foreground">{shorten(capabilities.lit.familyProof.familyId)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Guardian</p>
                <p className="mt-2 font-mono text-xs text-foreground">{shorten(capabilities.lit.familyProof.guardianAddress)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Teen</p>
                <p className="mt-2 font-mono text-xs text-foreground">{shorten(capabilities.lit.familyProof.teenAddress)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Calma</p>
                <p className="mt-2 font-mono text-xs text-foreground">{shorten(capabilities.lit.familyProof.clawrenceAddress)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(capabilities.lit.familyProof.permissions.permittedActions.length
                ? capabilities.lit.familyProof.permissions.permittedActions
                : [capabilities.lit.familyProof.litActionCid || safeExecutorCid]
              )
                .filter(Boolean)
                .map((actionCid) => (
                  <Badge key={actionCid} className="border-primary/25 bg-primary/10 text-primary">
                    {shorten(actionCid)}
                  </Badge>
                ))}
            </div>
            {capabilities.lit.familyProof.permissions.error ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Permission fetch note: {capabilities.lit.familyProof.permissions.error}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.2rem] border border-border/55 bg-card/55 p-4">
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
          <div className="rounded-[1.2rem] border border-border/55 bg-card/55 p-4">
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
          <div className="rounded-[1.2rem] border border-border/55 bg-card/55 p-4">
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
          <div className="rounded-[1.2rem] border border-border/55 bg-card/55 p-4">
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
