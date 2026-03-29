"use client";

import { PermissionsProof } from "@/components/PermissionsProof";
import { useAuthStore } from "@/store/authStore";

export default function GuardianFamilyPage() {
  const { session, family } = useAuthStore();
  const safeExecutorCid = process.env.NEXT_PUBLIC_SAFE_EXECUTOR_CID || "";

  if (!session || !family) {
    return <div className="text-sm text-gray-600">No session yet.</div>;
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h2 className="text-lg font-bold">Family & Permissions</h2>
      <div className="rounded-lg border p-3 text-xs text-gray-600">
        <div><strong>Family ID:</strong> {family.familyId}</div>
        <div><strong>Guardian:</strong> {family.guardianAddress}</div>
        <div><strong>Teen:</strong> {family.teenAddress}</div>
      </div>
      <PermissionsProof
        guardianPkpAddress={family.guardianAddress}
        teenPkpAddress={family.teenAddress}
        clawrencePkpAddress={family.clawrenceAddress || family.guardianAddress}
        safeExecutorCid={safeExecutorCid}
        permittedScopes={["PersonalSign"]}
      />
    </div>
  );
}
