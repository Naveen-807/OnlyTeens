"use client";

import { useEffect, useState } from "react";
import { Users, Shield, User, Bot } from "lucide-react";

import { FamilyOnboarding } from "@/components/FamilyOnboarding";
import { PermissionsProof } from "@/components/PermissionsProof";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RuntimeCapabilities } from "@/lib/types";

export default function GuardianFamilyPage() {
  const { session, family } = useAuthStore();
  const safeExecutorCid = process.env.NEXT_PUBLIC_SAFE_EXECUTOR_CID || "";
  const [capabilities, setCapabilities] = useState<RuntimeCapabilities | null>(null);
  const vincentMode =
    capabilities?.vincent.mode === "live"
      ? "live"
      : capabilities?.vincent.mode === "local-only"
        ? "local-only"
        : "unknown";

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
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <Card className="bg-card/90 border-border/30 backdrop-blur-sm overflow-hidden">
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border/30 bg-card/50 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
                <Shield className="h-3.5 w-3.5" />
                Family ID
              </div>
              <p className="font-mono text-xs text-foreground break-all">{family.familyId}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/40 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-400 mb-3">
                <User className="h-3.5 w-3.5" />
                Guardian
              </div>
              <p className="font-mono text-xs text-emerald-400/80 break-all">{family.guardianAddress}</p>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-950/40 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-blue-400 mb-3">
                <User className="h-3.5 w-3.5" />
                Teen
              </div>
              <p className="font-mono text-xs text-blue-400/80 break-all">{family.teenAddress}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border/30 bg-card/50 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Chipotle account
              </div>
              <p className="font-mono text-xs text-foreground break-all">
                {family.chipotleAccountId || "local-demo"}
              </p>
            </div>
            <div className="rounded-xl border border-border/30 bg-card/50 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Flow runtime
              </div>
              <p className="font-mono text-xs text-foreground break-all leading-5">
                {family.executionMode || "local-fallback"}
                <br />
                {capabilities?.flow.walletMode || family.walletMode || "app-managed"} ·{" "}
                {capabilities?.flow.gasMode || family.gasMode || "user-funded"}
                <br />
                {capabilities?.flow.preferredSchedulerBackend ||
                  family.schedulerBackend ||
                  "evm-manual"}
              </p>
            </div>
            <div className="rounded-xl border border-border/30 bg-card/50 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Linked teens
              </div>
              <p className="font-mono text-xs text-foreground break-all">
                {1 + (family.linkedTeens?.filter((teen: any) => teen.active).length || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
              : capabilities?.vincent.note || "Runtime reports local guardrails mode.",
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
