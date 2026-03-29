"use client";

import { useMemo, useState } from "react";

import { PermissionsProof } from "@/components/PermissionsProof";
import { SAFE_EXECUTOR_CID } from "@/lib/constants";
import { useAuthStore } from "@/store/authStore";

export default function GuardianFamilyPage() {
  const { session, family } = useAuthStore();
  const [permissionState, setPermissionState] = useState<"active" | "revoked">("active");
  const [revoking, setRevoking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const safeExecutorCid = SAFE_EXECUTOR_CID;
  const permittedScopes = useMemo(() => ["PersonalSign"], []);

  if (!session || !family) {
    return <div className="text-sm text-gray-600">No session yet.</div>;
  }

  const handleRevoke = async () => {
    if (!family.familyId || !safeExecutorCid) return;
    setRevoking(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/family/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId: family.familyId, cid: safeExecutorCid }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to revoke executor permission");
      }
      setPermissionState("revoked");
      setStatusMessage("Executor permission revoked for the configured Lit Action.");
    } catch (error: any) {
      setStatusMessage(error?.message || "Failed to revoke executor permission.");
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <h2 className="text-lg font-bold">Family & Permissions</h2>
      <div className="rounded-lg border p-3 text-xs text-gray-600">
        <div><strong>Family ID:</strong> {family.familyId}</div>
        <div><strong>Guardian:</strong> {family.guardianAddress}</div>
        <div><strong>Teen:</strong> {family.teenAddress}</div>
        <div><strong>Clawrence:</strong> {family.clawrenceAddress}</div>
      </div>
      <PermissionsProof
        guardianPkpAddress={family.guardianAddress}
        teenPkpAddress={family.teenAddress}
        clawrencePkpAddress={family.clawrenceAddress || family.guardianAddress}
        safeExecutorCid={safeExecutorCid}
        permittedScopes={permittedScopes}
        permissionState={permissionState}
        onRevoke={handleRevoke}
        revoking={revoking}
      />
      {statusMessage ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {statusMessage}
        </div>
      ) : null}
    </div>
  );
}
