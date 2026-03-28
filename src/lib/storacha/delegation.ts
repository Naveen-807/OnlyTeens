import "server-only";

// UCAN delegation helpers for Storacha.
// Hackathon MVP: keep this as a placeholder for future role-scoped delegation.
export function buildDelegationNote(params: {
  familyId: string;
  role: "guardian" | "teen" | "executor";
}) {
  return {
    type: "ucan_delegation_hint",
    familyId: params.familyId,
    role: params.role,
    timestamp: new Date().toISOString(),
  };
}

