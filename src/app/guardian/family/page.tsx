"use client";

import { FamilyOnboarding } from "@/components/FamilyOnboarding";
import { PermissionsProof } from "@/components/PermissionsProof";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function GuardianFamilyPage() {
  const { session, family } = useAuthStore();
  const safeExecutorCid = process.env.NEXT_PUBLIC_SAFE_EXECUTOR_CID || "";

  if (!session || !family) {
    return (
      <div className="mx-auto max-w-md p-4">
        <FamilyOnboarding />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <Card className="p-5">
        <Badge className="border-primary/20 bg-primary/10 text-primary">
          Family & permissions
        </Badge>
        <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <div className="rounded-[1.1rem] border border-border/70 bg-white/70 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em]">Family ID</p>
            <p className="mt-2 font-mono text-xs break-all">{family.familyId}</p>
          </div>
          <div className="rounded-[1.1rem] border border-border/70 bg-white/70 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em]">Guardian</p>
            <p className="mt-2 font-mono text-xs break-all">{family.guardianAddress}</p>
          </div>
          <div className="rounded-[1.1rem] border border-border/70 bg-white/70 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em]">Teen</p>
            <p className="mt-2 font-mono text-xs break-all">{family.teenAddress}</p>
          </div>
        </div>
      </Card>

      <PermissionsProof
        guardianPkpAddress={family.guardianAddress}
        teenPkpAddress={family.teenAddress}
        clawrencePkpAddress={family.clawrenceAddress || family.guardianAddress}
        safeExecutorCid={safeExecutorCid}
        permittedScopes={["PersonalSign", "LitAction"]}
        proof={{
          zamaDecision: "GREEN",
          guardrailDecision: "REVIEW",
          guardrailReason:
            "The guardrail API is currently a placeholder on this surface.",
          litAuthorized: !!session?.sessionSigs,
          litActionCid: family.litActionCid || safeExecutorCid,
        }}
      />
    </div>
  );
}
