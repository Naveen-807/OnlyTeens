"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldCheck, TrendingUp, Users } from "lucide-react";

import { FamilyOnboarding } from "@/components/FamilyOnboarding";
import { PermissionsProof } from "@/components/PermissionsProof";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ValueTile } from "@/components/ui/value-tile";
import type { RuntimeCapabilities } from "@/lib/types";

export default function GuardianFamilyPage() {
  const { session, family } = useAuthStore();
  const safeExecutorCid = process.env.NEXT_PUBLIC_SAFE_EXECUTOR_CID || "";
  const [capabilities, setCapabilities] = useState<RuntimeCapabilities | null>(null);
  const vincentMode =
    capabilities?.vincent.mode === "live"
      ? "live"
      : capabilities?.vincent.mode === "blocked"
        ? "blocked"
        : "unknown";
  const defiPolicy = capabilities?.defi || family?.defiPolicy;

  useEffect(() => {
    let mounted = true;
    fetch(`/api/runtime/capabilities?familyId=${encodeURIComponent(family?.familyId || "")}`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setCapabilities(data?.capabilities || null);
      })
      .catch(() => {
        if (!mounted) return;
        setCapabilities(null);
      });

    return () => {
      mounted = false;
    };
  }, [family?.familyId]);

  if (!session || !family) {
    return (
      <div className="mx-auto max-w-md p-4">
        <FamilyOnboarding />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 lg:p-6">
      <Card className="overflow-hidden bg-card/90 border-border/30 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-border/30 bg-gradient-to-br from-primary/10 via-card to-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-primary/20 p-2 border border-primary/30">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <Badge>Family & Permissions</Badge>
          </div>
          <CardTitle className="text-xl">Family Overview</CardTitle>
        </CardHeader>

        <CardContent className="p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ValueTile
              label="Family ID"
              value={family.familyId}
              copyable
              tone="gold"
              helperText="Canonical household identifier"
            />
            <ValueTile
              label="Guardian wallet"
              value={family.guardianAddress}
              copyable
              tone="neutral"
              helperText="Verified guardian Flow address"
            />
            <ValueTile
              label="Teen wallet"
              value={family.teenAddress}
              copyable
              tone="neutral"
              helperText="Verified teen Flow address"
            />
            <ValueTile
              label="Chipotle account"
              value={family.chipotleAccountId || "local-demo"}
              tone="gold"
              helperText="Provider account or demo fallback"
            />
            <div className="rounded-[1.35rem] border border-primary/20 bg-[linear-gradient(180deg,oklch(0.12_0.01_85_/_0.96),oklch(0.08_0.006_85_/_0.98))] p-4 xl:col-span-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-primary/80 mb-3">
                <Shield className="h-3.5 w-3.5" />
                Flow runtime
              </div>
              <div className="space-y-2 text-xs leading-5 text-foreground/88">
                <p className="font-medium text-foreground">
                  {family.executionMode || "vincent-live"}
                </p>
                <p className="font-mono break-words text-muted-foreground">
                  {capabilities?.flow.walletMode || family.walletMode || "app-managed"} ·{" "}
                  {capabilities?.flow.gasMode || family.gasMode || "user-funded"}
                </p>
                <p className="font-mono break-words text-muted-foreground">
                  {capabilities?.flow.preferredSchedulerBackend ||
                    family.schedulerBackend ||
                    "evm-manual"}
                </p>
              </div>
            </div>
            <ValueTile
              label="Linked teens"
              value={String(1 + (family.linkedTeens?.filter((teen: any) => teen.active).length || 0))}
              tone="gold"
              helperText="Active teen memberships"
            />
          </div>
        </CardContent>
      </Card>

      {defiPolicy && (
        <Card className="overflow-hidden border-border/30 bg-card/90 backdrop-blur-sm">
          <CardHeader className="border-b border-border/30 bg-gradient-to-br from-emerald-500/10 via-card to-card pb-4">
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <Badge className="border-emerald-500/20 bg-emerald-950/40 text-emerald-300">
                DeFi policy
              </Badge>
            </div>
            <CardTitle className="text-xl">Flow earn limits for the family</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ValueTile
                label="Enabled"
                value={defiPolicy.enabled ? "Active" : "Paused"}
                tone={defiPolicy.enabled ? "gold" : "neutral"}
                helperText="Guardian-controlled DeFi access"
              />
              <ValueTile
                label="Strategy"
                value={defiPolicy.strategy}
                tone="gold"
                helperText={`Risk profile: ${defiPolicy.riskLevel}`}
              />
              <ValueTile
                label="Allocation cap"
                value={`${defiPolicy.maxAllocationBps / 100}%`}
                tone="neutral"
                helperText="Maximum of teen spendable balance"
              />
              <ValueTile
                label="Slippage cap"
                value={`${defiPolicy.maxSlippageBps / 100}%`}
                tone="neutral"
                helperText={defiPolicy.allowRecurringEarn ? "Recurring earn plans allowed" : "One-time plans only"}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {defiPolicy.allowedProtocols.length > 0 ? (
                defiPolicy.allowedProtocols.map((protocol) => (
                  <Badge key={protocol} variant="outline" className="border-border/40 bg-background/40">
                    {protocol}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="border-border/40 bg-background/40">
                  No approved protocols yet
                </Badge>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-[1rem] border border-emerald-500/20 bg-emerald-950/20 p-3 text-sm text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              <span>
                Teen DeFi actions are checked against this policy before the Flow executor runs.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <PermissionsProof
        guardianPkpAddress={family.guardianAddress}
        teenPkpAddress={family.teenAddress}
        clawrencePkpAddress={family.clawrenceAddress || family.guardianAddress}
        safeExecutorCid={safeExecutorCid}
        permittedScopes={["PersonalSign", "LitAction"]}
        vincentMode={vincentMode}
        capabilities={capabilities || undefined}
        proof={{
          zamaDecision: "GREEN",
          zamaSource: capabilities?.sponsorReadiness.zamaCore ? "runtime" : undefined,
          guardrailDecision: vincentMode === "live" ? "ALLOW" : "REVIEW",
          guardrailReason:
            vincentMode === "live"
              ? capabilities?.vincent.note || "Runtime reports live Vincent API mode."
              : capabilities?.vincent.note || "Runtime reports blocked Vincent guardrails.",
          litAuthorized:
            capabilities?.lit.familyProof.permissions.authorized ||
            capabilities?.lit.familyProof.litActionMatchesRuntimeCid ||
            !!session?.sessionSigs,
          litPermissionStatus: capabilities?.lit.familyProof.permissions.fetched
            ? "fetched"
            : capabilities?.lit.familyProof.available
              ? "derived"
              : "unavailable",
          litPermissionNote: capabilities?.lit.familyProof.permissions.error,
          litActionCid: family.litActionCid || safeExecutorCid,
        }}
      />
    </div>
  );
}
