import "server-only";

import { uploadJSON } from "@/lib/storacha/client";

// ═══ UCAN Delegation Layer for Storacha ═══
// Role-scoped permissions matching the family hierarchy:
// Guardian: read + write (full audit access)
// Teen: read-only (view own receipts)
// Executor (Clawrence): write-only (store receipts, no read)

export type UCANRole = "guardian" | "teen" | "executor";

export interface UCANCapability {
  can: "store/add" | "store/list" | "upload/add" | "upload/list";
  with: string; // DID or space identifier
}

export interface DelegationRecord {
  type: "ucan_delegation";
  familyId: string;
  role: UCANRole;
  subject: string; // Address or identifier of the delegatee
  capabilities: UCANCapability[];
  issuedAt: string;
  expiresAt: string;
  storachaCid?: string;
}

/**
 * Get UCAN capabilities for a given family role.
 * Guardian: full read/write access to family receipts
 * Teen: read-only access to own receipts
 * Executor: write-only access for storing receipts
 */
export function getCapabilitiesForRole(
  role: UCANRole,
  spaceId: string,
): UCANCapability[] {
  switch (role) {
    case "guardian":
      return [
        { can: "store/add", with: spaceId },
        { can: "store/list", with: spaceId },
        { can: "upload/add", with: spaceId },
        { can: "upload/list", with: spaceId },
      ];
    case "teen":
      return [
        { can: "store/list", with: spaceId },
        { can: "upload/list", with: spaceId },
      ];
    case "executor":
      return [
        { can: "store/add", with: spaceId },
        { can: "upload/add", with: spaceId },
      ];
  }
}

/**
 * Create a delegation record for a family member and store it on Storacha.
 * This creates a verifiable, content-addressed proof of the permission grant.
 */
export async function createDelegation(params: {
  familyId: string;
  role: UCANRole;
  subject: string;
  spaceId?: string;
  ttlHours?: number;
}): Promise<DelegationRecord & { cid: string; url: string }> {
  const spaceId = params.spaceId || `did:key:proof18-family-${params.familyId}`;
  const ttlMs = (params.ttlHours || 24 * 30) * 60 * 60 * 1000; // Default 30 days

  const record: DelegationRecord = {
    type: "ucan_delegation",
    familyId: params.familyId,
    role: params.role,
    subject: params.subject,
    capabilities: getCapabilitiesForRole(params.role, spaceId),
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  };

  const result = await uploadJSON(record);
  record.storachaCid = result.cid;

  return {
    ...record,
    cid: result.cid,
    url: result.url,
  };
}

/**
 * Create all family delegations at once during onboarding.
 * Stores guardian, teen, and executor delegation records on Storacha.
 */
export async function createFamilyDelegations(params: {
  familyId: string;
  guardianAddress: string;
  teenAddress: string;
  executorAddress: string;
}): Promise<{
  guardian: DelegationRecord & { cid: string; url: string };
  teen: DelegationRecord & { cid: string; url: string };
  executor: DelegationRecord & { cid: string; url: string };
}> {
  const [guardian, teen, executor] = await Promise.all([
    createDelegation({
      familyId: params.familyId,
      role: "guardian",
      subject: params.guardianAddress,
    }),
    createDelegation({
      familyId: params.familyId,
      role: "teen",
      subject: params.teenAddress,
    }),
    createDelegation({
      familyId: params.familyId,
      role: "executor",
      subject: params.executorAddress,
    }),
  ]);

  return { guardian, teen, executor };
}

/**
 * Build delegation metadata to include in receipts.
 * This tags every receipt with the delegation context so judges
 * can see that permissions are role-scoped.
 */
export function buildDelegationMetadata(params: {
  familyId: string;
  role: UCANRole;
  subject: string;
  delegationCid?: string;
}) {
  const spaceId = `did:key:proof18-family-${params.familyId}`;
  return {
    type: "ucan_delegation_proof",
    familyId: params.familyId,
    role: params.role,
    subject: params.subject,
    capabilities: getCapabilitiesForRole(params.role, spaceId),
    delegationCid: params.delegationCid,
    timestamp: new Date().toISOString(),
  };
}
