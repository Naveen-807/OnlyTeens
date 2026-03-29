import "server-only";

import * as fs from "fs";
import * as path from "path";
import { uploadJSON } from "@/lib/storacha/client";
import type { ApprovalRequest } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const APPROVALS_FILE = path.join(DATA_DIR, "approvals.json");
let writeLock: Promise<void> = Promise.resolve();

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(APPROVALS_FILE))
    fs.writeFileSync(APPROVALS_FILE, "{}");
}

function loadAll(): Record<string, ApprovalRequest> {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(APPROVALS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, ApprovalRequest>): void {
  ensureFile();
  fs.writeFileSync(APPROVALS_FILE, JSON.stringify(data, null, 2));
}

function withWriteLock<T>(task: () => T | Promise<T>): Promise<T> {
  const next = writeLock.then(task, task);
  writeLock = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

// ─── CREATE ───
export async function createApprovalRequest(
  request: Omit<ApprovalRequest, "id" | "status" | "requestedAt">
): Promise<ApprovalRequest> {
  return withWriteLock(async () => {
    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fullRequest: ApprovalRequest = {
      ...request,
      id,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };

    const all = loadAll();
    all[id] = fullRequest;
    saveAll(all);

    return fullRequest;
  });
}

// ─── READ ───
export function getRequest(requestId: string): ApprovalRequest | null {
  const all = loadAll();
  return all[requestId] || null;
}

export function getPendingRequestsByFamily(
  familyId: string
): ApprovalRequest[] {
  const all = loadAll();
  return Object.values(all)
    .filter((r) => r.familyId === familyId && r.status === "pending")
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
}

export function getAllRequestsByFamily(familyId: string): ApprovalRequest[] {
  const all = loadAll();
  return Object.values(all)
    .filter((r) => r.familyId === familyId)
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
}

export function getRequestsByTeen(teenAddress: string): ApprovalRequest[] {
  const all = loadAll();
  return Object.values(all)
    .filter(
      (r) => r.teenAddress.toLowerCase() === teenAddress.toLowerCase()
    )
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
}

// ─── UPDATE: Approve ───
export async function approveRequestDurable(
  requestId: string,
  guardianNote?: string
): Promise<{
  request: ApprovalRequest;
  approvalCid: string;
  approvalUrl: string;
}> {
  const all = loadAll();
  const request = all[requestId];
  if (!request) throw new Error("Request not found");
  if (request.status !== "pending")
    throw new Error(`Request already ${request.status}`);

  request.status = "approved";
  request.guardianNote = guardianNote || "Approved by guardian";

  const storachaResult = await uploadJSON(
    {
      type: "guardian_approval",
      requestId,
      familyId: request.familyId,
      teen: request.teenAddress,
      actionType: request.actionType,
      description: request.description,
      amount: request.amount,
      decision: request.policyDecision,
      approved: true,
      guardianNote: request.guardianNote,
      timestamp: new Date().toISOString(),
    },
    { familyId: request.familyId, role: "guardian" },
  );

  await withWriteLock(async () => {
    const latest = loadAll();
    const current = latest[requestId];
    if (!current) throw new Error("Request not found");
    if (current.status !== "pending")
      throw new Error(`Request already ${current.status}`);

    current.status = "approved";
    current.guardianNote = guardianNote || "Approved by guardian";
    current.storachaCid = storachaResult.cid;
    latest[requestId] = current;
    saveAll(latest);
  });

  return {
    request,
    approvalCid: storachaResult.cid,
    approvalUrl: storachaResult.url,
  };
}

// ─── UPDATE: Reject ───
export async function rejectRequestDurable(
  requestId: string,
  guardianNote: string
): Promise<{ request: ApprovalRequest; rejectionCid: string }> {
  const all = loadAll();
  const request = all[requestId];
  if (!request) throw new Error("Request not found");
  if (request.status !== "pending")
    throw new Error(`Request already ${request.status}`);

  request.status = "rejected";
  request.guardianNote = guardianNote;

  const storachaResult = await uploadJSON(
    {
      type: "guardian_rejection",
      requestId,
      familyId: request.familyId,
      teen: request.teenAddress,
      description: request.description,
      amount: request.amount,
      approved: false,
      guardianNote,
      timestamp: new Date().toISOString(),
    },
    { familyId: request.familyId, role: "guardian" },
  );

  await withWriteLock(async () => {
    const latest = loadAll();
    const current = latest[requestId];
    if (!current) throw new Error("Request not found");
    if (current.status !== "pending")
      throw new Error(`Request already ${current.status}`);

    current.status = "rejected";
    current.guardianNote = guardianNote;
    current.storachaCid = storachaResult.cid;
    latest[requestId] = current;
    saveAll(latest);
  });

  return {
    request,
    rejectionCid: storachaResult.cid,
  };
}

// ─── Mark as executed (after Flow tx succeeds) ───
export function markExecuted(
  requestId: string,
  flowTxHash: string,
  receiptCid: string
): Promise<void> {
  return withWriteLock(async () => {
    const all = loadAll();
    const request = all[requestId];
    if (!request) return;

    (request as any).executionResult = {
      flowTxHash,
      receiptCid,
      executedAt: new Date().toISOString(),
    };

    all[requestId] = request;
    saveAll(all);
  });
}
