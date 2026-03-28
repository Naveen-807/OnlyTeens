"use client";

import { PermissionsProof } from "@/components/PermissionsProof";
import { useAuthStore } from "@/store/authStore";

export default function GuardianFamilyPage() {
  const { session } = useAuthStore();
  const safeExecutorCid = process.env.NEXT_PUBLIC_SAFE_EXECUTOR_CID || "";

  if (!session) {
    return <div className="text-sm text-gray-600">No session yet.</div>;
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h2 className="text-lg font-bold">Family & Permissions</h2>
      <PermissionsProof
        guardianPkpAddress={session.address}
        teenPkpAddress={session.address}
        clawrencePkpAddress={session.address}
        safeExecutorCid={safeExecutorCid}
        permittedScopes={["PersonalSign"]}
      />
    </div>
  );
}
