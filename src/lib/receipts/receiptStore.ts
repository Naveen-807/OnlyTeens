import "server-only";

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const RECEIPTS_FILE = path.join(DATA_DIR, "receipts.json");
let writeLock: Promise<void> = Promise.resolve();

export interface StoredReceipt {
  id: string;
  type: string;
  familyId: string;
  teenAddress: string;
  description: string;
  amount: string;
  currency: string;
  decision: string;
  flowTxHash: string;
  flowExplorerUrl: string;
  storachaCid: string;
  storachaUrl: string;
  passportLevel: number;
  passportLeveledUp: boolean;
  litActionCid: string;
  zamaContractAddress: string;
  zamaTxHash: string;
  clawrenceExplanation: string;
  timestamp: string;
}

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

function withWriteLock<T>(task: () => T | Promise<T>): Promise<T> {
  const next = writeLock.then(task, task);
  writeLock = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export function addReceipt(receipt: StoredReceipt): Promise<void> {
  return withWriteLock(async () => {
    const all = loadAll();
    all.unshift(receipt);
    saveAll(all);
  });
}

export function getReceiptsByFamily(familyId: string): StoredReceipt[] {
  return loadAll().filter((r) => r.familyId === familyId);
}

export function getReceiptsByTeen(teenAddress: string): StoredReceipt[] {
  return loadAll().filter(
    (r) => r.teenAddress.toLowerCase() === teenAddress.toLowerCase()
  );
}

export function getReceiptById(id: string): StoredReceipt | null {
  return loadAll().find((r) => r.id === id) || null;
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
  }
): StoredReceipt {
  return {
    id: `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: meta.type,
    familyId: meta.familyId,
    teenAddress: meta.teenAddress,
    description: meta.description,
    amount: meta.amount,
    currency: "FLOW",
    decision: flowResult.decision || "GREEN",
    flowTxHash: flowResult.flow?.txHash || "",
    flowExplorerUrl: flowResult.flow?.explorerUrl || "",
    storachaCid: flowResult.storacha?.receiptCid || "",
    storachaUrl: flowResult.storacha?.receiptUrl || "",
    passportLevel: flowResult.passport?.newLevel || 0,
    passportLeveledUp: flowResult.passport?.leveledUp || false,
    litActionCid: flowResult.lit?.actionCid || "",
    zamaContractAddress: flowResult.zama?.contractAddress || "",
    zamaTxHash: flowResult.zama?.evaluationTxHash || "",
    clawrenceExplanation: flowResult.clawrence?.preExplanation || "",
    timestamp: new Date().toISOString(),
  };
}
