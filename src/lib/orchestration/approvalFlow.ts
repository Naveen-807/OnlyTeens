import "server-only";

import { uploadJSON } from "@/lib/storacha/client";
import { guardianDecryptPolicy } from "@/lib/zama/decrypt";
import type { ApprovalRequest } from "@/lib/types";

const pendingRequests = new Map<string, ApprovalRequest>();

export function addPendingRequest(request: ApprovalRequest): void {
  pendingRequests.set(request.id, request);
}

export function getPendingRequests(familyId: string): ApprovalRequest[] {
  return Array.from(pendingRequests.values())
    .filter((r) => r.familyId === familyId && r.status === "pending")
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    );
}

export function getRequest(requestId: string): ApprovalRequest | undefined {
  return pendingRequests.get(requestId);
}

export async function approveRequest(
  requestId: string,
  guardianNote?: string,
): Promise<{ request: ApprovalRequest; approvalCid: string; approvalUrl: string }> {
  const request = pendingRequests.get(requestId);
  if (!request) throw new Error("Request not found");
  if (request.status !== "pending") throw new Error("Request already processed");

  request.status = "approved";
  request.guardianNote = guardianNote || "Approved";

  const approvalRecord = await uploadJSON({
    type: "guardian_approval",
    requestId,
    familyId: request.familyId,
    teen: request.teenAddress,
    actionType: request.actionType,
    description: request.description,
    amount: request.amount,
    approved: true,
    guardianNote: request.guardianNote,
    originalPolicyDecision: request.policyDecision,
    timestamp: new Date().toISOString(),
  });

  return {
    request,
    approvalCid: approvalRecord.cid,
    approvalUrl: approvalRecord.url,
  };
}

export async function rejectRequest(
  requestId: string,
  guardianNote: string,
): Promise<{ request: ApprovalRequest; rejectionCid: string }> {
  const request = pendingRequests.get(requestId);
  if (!request) throw new Error("Request not found");
  if (request.status !== "pending") throw new Error("Request already processed");

  request.status = "rejected";
  request.guardianNote = guardianNote;

  const rejectionRecord = await uploadJSON({
    type: "guardian_rejection",
    requestId,
    familyId: request.familyId,
    teen: request.teenAddress,
    description: request.description,
    amount: request.amount,
    approved: false,
    guardianNote,
    timestamp: new Date().toISOString(),
  });

  return {
    request,
    rejectionCid: rejectionRecord.cid,
  };
}

export async function getGuardianDecryptedContext(params: {
  familyId: string;
  guardianSigner: any;
}): Promise<{
  singleActionCap: number;
  recurringMonthlyCap: number;
  trustUnlockThreshold: number;
}> {
  return guardianDecryptPolicy({
    familyId: params.familyId as any,
    guardianSigner: params.guardianSigner,
  });
}

