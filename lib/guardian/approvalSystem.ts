
export interface ApprovalRequest {
  id: string;
  familyId: string;
  teenAddress: string;
  teenName: string;
  actionType: "savings" | "subscription" | "payment";
  description: string;
  amount: number;
  currency: string;
  isRecurring: boolean;
  policyDecision: "YELLOW" | "RED";
  clawrenceExplanation: string;
  teenPassportLevel: number;
  teenStreak: number;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  guardianNote?: string;
  storachaCid?: string;
}

// In-memory for hackathon MVP (production: use database)
const pendingRequests: Map<string, ApprovalRequest> = new Map();

export function createApprovalRequest(
  request: Omit<ApprovalRequest, "id" | "status" | "requestedAt">
): ApprovalRequest {
  const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const fullRequest: ApprovalRequest = {
    ...request,
    id,
    status: "pending",
    requestedAt: new Date().toISOString(),
  };
  pendingRequests.set(id, fullRequest);
  return fullRequest;
}

export function getPendingRequests(guardianAddress: string): ApprovalRequest[] {
  return Array.from(pendingRequests.values())
    .filter((r) => r.status === "pending")
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
}

export function approveRequest(
  requestId: string,
  guardianNote?: string
): ApprovalRequest | null {
  const request = pendingRequests.get(requestId);
  if (!request) return null;
  request.status = "approved";
  request.guardianNote = guardianNote;
  return request;
}

export function rejectRequest(
  requestId: string,
  guardianNote: string
): ApprovalRequest | null {
  const request = pendingRequests.get(requestId);
  if (!request) return null;
  request.status = "rejected";
  request.guardianNote = guardianNote;
  return request;
}
