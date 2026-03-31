import "server-only";

import * as fs from "node:fs";
import * as path from "node:path";

import type { PolicyMode, SchedulerBackend } from "@/lib/types";

export interface GuardianAutopilotRecord {
  id: string;
  familyId: string;
  guardianAddress: string;
  teenAddress: string;
  actionType: "savings" | "subscription";
  amount: string;
  interval: "weekly" | "monthly";
  label: string;
  serviceName?: string;
  scheduleId?: number;
  scheduleTxHash?: string;
  flowTxHash?: string;
  flowExplorerUrl?: string;
  schedulerBackend: SchedulerBackend;
  policyMode: PolicyMode;
  zamaTxHash?: string;
  enabled: boolean;
  createdAt: string;
  cancelledAt?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const AUTOPILOT_FILE = path.join(DATA_DIR, "guardian-autopilot.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(AUTOPILOT_FILE)) fs.writeFileSync(AUTOPILOT_FILE, "[]");
}

function loadAll(): GuardianAutopilotRecord[] {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(AUTOPILOT_FILE, "utf8")) as GuardianAutopilotRecord[];
  } catch {
    return [];
  }
}

function saveAll(items: GuardianAutopilotRecord[]) {
  ensureStore();
  fs.writeFileSync(AUTOPILOT_FILE, JSON.stringify(items, null, 2));
}

export function listGuardianAutopilotRecords(familyId?: string) {
  const items = loadAll();
  return familyId ? items.filter((item) => item.familyId === familyId) : items;
}

export function addGuardianAutopilotRecord(
  record: Omit<GuardianAutopilotRecord, "id" | "createdAt"> &
    Partial<Pick<GuardianAutopilotRecord, "id" | "createdAt">>,
) {
  const entry: GuardianAutopilotRecord = {
    id: record.id || `autopilot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: record.createdAt || new Date().toISOString(),
    ...record,
  };
  const items = loadAll();
  items.unshift(entry);
  saveAll(items);
  return entry;
}

export function cancelGuardianAutopilotRecord(id: string) {
  const items = loadAll();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  items[index] = {
    ...items[index],
    enabled: false,
    cancelledAt: new Date().toISOString(),
  };
  saveAll(items);
  return items[index];
}
