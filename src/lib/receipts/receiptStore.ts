import "server-only";

import * as fs from "fs";
import * as path from "path";

import type {
  ApprovalMode,
  ExecutionLane,
  FlowMedium,
  PolicyMode,
  TransactionActor,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const RECEIPTS_FILE = path.join(DATA_DIR, "receipts.json");

export interface StoredReceipt {
  id: string;
  type: string;
  familyId: string;
  teenAddress: string;
  description: string;
  amount: string;
  currency: string;
  decision: string;
  executionLane?: ExecutionLane;
  transactionActor?: TransactionActor;
  approvalMode?: ApprovalMode;
  flowMedium?: FlowMedium;
  policyMode?: PolicyMode;
  guardianAutopilotEnabled?: boolean;
  flowTxHash: string;
  flowExplorerUrl: string;
  storachaCid: string;
  storachaUrl: string;
  flowBlockNumber?: number;
  flowMediumBalance?: string;
  nativeWalletBalance?: string;
  recipientAddress?: string;
  payeeLabel?: string;
  passportLevel: number;
  passportLeveledUp: boolean;
  litActionCid: string;
  zamaContractAddress: string;
  calmaExplanation?: string;
  clawrenceExplanation: string;
  guardrailApproved?: boolean;
  guardrailReasons?: string[];
  schedulerBackend?: string;
  scheduledExecutionId?: string;
  scheduledExecutionExplorerUrl?: string;
  nextExecutionAt?: string;
  scheduleId?: number;
  scheduleTxHash?: string;
  zamaTxHash?: string;
  vincentAppId?: string;
  vincentAppVersion?: string;
  vincentJwtAuthenticated?: boolean;
  vincentUserAccount?: string;
  vincentAgentWalletAddress?: string;
  erc8004AgentId?: string;
  erc8004IdentityTxHash?: string;
  erc8004ReputationTxHashes?: string[];
  erc8004ValidationTxHashes?: string[];
  timestamp: string;
}

// Hackathon-only persistence: this survives restarts for demo continuity, but
// it should not be treated as durable production storage.
function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(RECEIPTS_FILE))
    fs.writeFileSync(RECEIPTS_FILE, "[]");
}

function loadAll(): StoredReceipt[] {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(RECEIPTS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveAll(data: StoredReceipt[]): void {
  ensureFile();
  fs.writeFileSync(RECEIPTS_FILE, JSON.stringify(data, null, 2));
}

export function addReceipt(receipt: StoredReceipt): void {
  const all = loadAll();
  all.unshift(normalizeStoredReceipt(receipt)); // newest first
  saveAll(all);
}

export function listReceipts(): StoredReceipt[] {
  return loadAll().map(normalizeStoredReceipt);
}

export function getReceiptsByFamily(familyId: string): StoredReceipt[] {
  return listReceipts().filter((r) => r.familyId === familyId);
}

export function getReceiptsByTeen(teenAddress: string): StoredReceipt[] {
  return listReceipts().filter(
    (r) => r.teenAddress.toLowerCase() === teenAddress.toLowerCase()
  );
}

export function getReceiptById(id: string): StoredReceipt | null {
  return listReceipts().find((r) => r.id === id) || null;
}

export function updateReceiptByFlowTxHash(
  flowTxHash: string,
  updater: (receipt: StoredReceipt) => StoredReceipt,
): StoredReceipt | null {
  const items = loadAll().map(normalizeStoredReceipt);
  const index = items.findIndex((item) => item.flowTxHash === flowTxHash);
  if (index === -1) return null;
  items[index] = normalizeStoredReceipt(updater(items[index]));
  saveAll(items);
  return items[index];
}

export function normalizeStoredReceipt(receipt: StoredReceipt): StoredReceipt {
  const inferredLane = receipt.executionLane || inferLaneFromLegacyReceipt(receipt);
  return {
    ...receipt,
    executionLane: inferredLane,
    transactionActor: receipt.transactionActor || inferActorFromLegacyReceipt(receipt),
    approvalMode: receipt.approvalMode || inferApprovalModeFromLegacyReceipt(receipt),
    flowMedium: receipt.flowMedium || "FLOW",
    policyMode:
      receipt.policyMode ||
      (receipt.zamaTxHash
        ? "encrypted-live"
        : inferredLane === "direct-flow"
          ? "not-applicable"
          : "degraded"),
    guardianAutopilotEnabled: Boolean(receipt.guardianAutopilotEnabled),
  };
}

function inferLaneFromLegacyReceipt(receipt: StoredReceipt): ExecutionLane {
  if (receipt.guardianAutopilotEnabled) return "guardian-autopilot-flow";
  if (receipt.zamaTxHash || receipt.litActionCid || receipt.vincentAppId) {
    return "agent-assisted-flow";
  }
  return "direct-flow";
}

function inferActorFromLegacyReceipt(receipt: StoredReceipt): TransactionActor {
  if (receipt.guardianAutopilotEnabled) return "calma";
  if (receipt.type === "subscription") return "calma";
  return "teen";
}

function inferApprovalModeFromLegacyReceipt(receipt: StoredReceipt): ApprovalMode {
  if (receipt.guardianAutopilotEnabled) return "guardian-autopilot";
  if (receipt.type === "subscription" && receipt.zamaTxHash) return "guardian-approved";
  return "none";
}

export function createStoredReceipt(
  receipt: Omit<StoredReceipt, "id" | "timestamp"> & Partial<Pick<StoredReceipt, "id" | "timestamp">>,
): StoredReceipt {
  return normalizeStoredReceipt({
    id: receipt.id || `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: receipt.timestamp || new Date().toISOString(),
    ...receipt,
  });
}

// ─── Build a StoredReceipt from a FlowResult and meta ───
export function receiptFromFlowResult(
  flowResult: any,
  meta: {
    familyId: string;
    teenAddress: string;
    type: string;
    description: string;
    amount: string;
    recipientAddress?: string;
    payeeLabel?: string;
  }
): StoredReceipt {
  return createStoredReceipt({
    type: meta.type,
    familyId: meta.familyId,
    teenAddress: meta.teenAddress,
    description: meta.description,
    amount: meta.amount,
    currency: "FLOW",
    decision: flowResult.decision || "GREEN",
    executionLane: flowResult.executionLane,
    transactionActor: flowResult.transactionActor,
    approvalMode: flowResult.approvalMode,
    flowMedium: flowResult.flowMedium || "FLOW",
    policyMode: flowResult.policyMode,
    guardianAutopilotEnabled: flowResult.guardianAutopilotEnabled,
    flowTxHash: flowResult.flow?.txHash || "",
    flowExplorerUrl: flowResult.flow?.explorerUrl || "",
    storachaCid: flowResult.storacha?.receiptCid || "",
    storachaUrl: flowResult.storacha?.receiptUrl || "",
    flowBlockNumber: flowResult.flow?.blockNumber,
    flowMediumBalance: flowResult.balanceSnapshot?.spendable,
    nativeWalletBalance: flowResult.balanceSnapshot?.walletBalance,
    recipientAddress: meta.recipientAddress || flowResult.schedule?.recipientAddress,
    payeeLabel: meta.payeeLabel || flowResult.payee?.label,
    passportLevel: flowResult.passport?.newLevel || 0,
    passportLeveledUp: flowResult.passport?.leveledUp || false,
    litActionCid: flowResult.lit?.actionCid || "",
    zamaContractAddress: flowResult.zama?.contractAddress || "",
    calmaExplanation:
      flowResult.calma?.preExplanation || flowResult.clawrence?.preExplanation || "",
    clawrenceExplanation: flowResult.clawrence?.preExplanation || "",
    guardrailApproved: flowResult.guardrails?.approved,
    guardrailReasons: flowResult.guardrails?.reasons || [],
    schedulerBackend: flowResult.schedule?.backend,
    scheduledExecutionId: flowResult.schedule?.scheduledExecutionId,
    scheduledExecutionExplorerUrl: flowResult.schedule?.scheduledExecutionExplorerUrl,
    nextExecutionAt: flowResult.schedule?.nextExecutionAt,
    scheduleId: flowResult.schedule?.scheduleId,
    scheduleTxHash: flowResult.schedule?.txHash,
    zamaTxHash: flowResult.zama?.evaluationTxHash,
    vincentAppId: flowResult.vincent?.appId,
    vincentAppVersion: flowResult.vincent?.appVersion,
    vincentJwtAuthenticated: flowResult.vincent?.jwtAuthenticated,
    vincentUserAccount: flowResult.vincent?.userAccount,
    vincentAgentWalletAddress: flowResult.vincent?.agentWalletAddress,
    erc8004AgentId: flowResult.erc8004?.agentId,
    erc8004IdentityTxHash: flowResult.erc8004?.identityTxHash,
    erc8004ReputationTxHashes: flowResult.erc8004?.reputationTxHashes,
    erc8004ValidationTxHashes: flowResult.erc8004?.validationTxHashes,
  });
}
