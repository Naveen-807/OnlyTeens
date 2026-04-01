import "server-only";

import fs from "node:fs";
import path from "node:path";

import { formatEther } from "viem";

import { getBalances } from "@/lib/flow/vault";
import { getFamilyById } from "@/lib/onboarding/familyService";
import type {
  DeFiActionKind,
  DeFiGoal,
  DeFiPortfolioAction,
  DeFiPortfolioState,
  DeFiPolicy,
  DeFiRiskLevel,
  DeFiStrategy,
  TeenBalances,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const PORTFOLIO_FILE = path.join(DATA_DIR, "defi-portfolios.json");
const DEFAULT_PROTOCOL_LABEL = "Flow Savings Vault";

const APR_BY_STRATEGY: Record<DeFiStrategy, number> = {
  conservative: 4.2,
  balanced: 7.8,
  growth: 11.6,
};

const RISK_BY_STRATEGY: Record<DeFiStrategy, DeFiRiskLevel> = {
  conservative: "low",
  balanced: "medium",
  growth: "high",
};

type StoredPortfolioRecord = {
  strategy: DeFiStrategy;
  protocolLabel: string;
  goals: DeFiGoal[];
  recentActions: DeFiPortfolioAction[];
  lastUpdatedAt: string;
};

function keyFor(familyId: string, teenAddress: string) {
  return `${familyId}:${teenAddress.toLowerCase()}`;
}

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PORTFOLIO_FILE)) fs.writeFileSync(PORTFOLIO_FILE, "{}");
}

function loadStore(): Record<string, StoredPortfolioRecord> {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(PORTFOLIO_FILE, "utf-8")) as Record<
      string,
      StoredPortfolioRecord
    >;
  } catch {
    return {};
  }
}

function saveStore(store: Record<string, StoredPortfolioRecord>) {
  ensureFile();
  fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(store, null, 2));
}

function defaultPolicy(): DeFiPolicy {
  return {
    enabled: true,
    strategy: "balanced",
    riskLevel: "low",
    allowedProtocols: [DEFAULT_PROTOCOL_LABEL],
    maxAllocationBps: 2500,
    maxSlippageBps: 100,
    allowRecurringEarn: true,
  };
}

function parseAmount(value: string | number | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  return value.toFixed(2);
}

function getStoredRecord(familyId: string, teenAddress: string): StoredPortfolioRecord {
  const store = loadStore();
  const key = keyFor(familyId, teenAddress);
  const existing = store[key];
  if (existing) return existing;

  const family = getFamilyById(familyId);
  const baseStrategy = family?.defiPolicy?.strategy || defaultPolicy().strategy;
  const record: StoredPortfolioRecord = {
    strategy: baseStrategy,
    protocolLabel: family?.defiPolicy?.allowedProtocols?.[0] || DEFAULT_PROTOCOL_LABEL,
    goals: [],
    recentActions: [],
    lastUpdatedAt: new Date().toISOString(),
  };
  store[key] = record;
  saveStore(store);
  return record;
}

function persistRecord(familyId: string, teenAddress: string, record: StoredPortfolioRecord) {
  const store = loadStore();
  store[keyFor(familyId, teenAddress)] = record;
  saveStore(store);
}

function resolvePolicy(familyId: string): DeFiPolicy {
  return getFamilyById(familyId)?.defiPolicy || defaultPolicy();
}

function computeMonthlyYield(savingsValue: number, apr: number): number {
  return (savingsValue * apr) / 1200;
}

export function getDefaultDefiPolicy() {
  return defaultPolicy();
}

export function getFamilyDefiPolicy(familyId: string): DeFiPolicy {
  return resolvePolicy(familyId);
}

export function getStrategyApr(strategy: DeFiStrategy): number {
  return APR_BY_STRATEGY[strategy];
}

export function getStrategyRiskLevel(strategy: DeFiStrategy): DeFiRiskLevel {
  return RISK_BY_STRATEGY[strategy];
}

export async function getDefiPortfolioSnapshot(params: {
  familyId: string;
  teenAddress: string;
}): Promise<DeFiPortfolioState> {
  const policy = resolvePolicy(params.familyId);
  const record = getStoredRecord(params.familyId, params.teenAddress);
  const balances = await getBalances(params.familyId as `0x${string}`, params.teenAddress as `0x${string}`);
  const savingsValue = parseAmount(balances.savings);
  const reserveValue = parseAmount(balances.subscriptionReserve);
  const totalValue = savingsValue + reserveValue;
  const strategy = record.strategy || policy.strategy;
  const estimatedApr = APR_BY_STRATEGY[strategy];
  const estimatedMonthlyYield = computeMonthlyYield(savingsValue, estimatedApr);

  return {
    familyId: params.familyId,
    teenAddress: params.teenAddress,
    policy,
    strategy,
    riskLevel: policy.riskLevel,
    protocolLabel: record.protocolLabel || policy.allowedProtocols[0] || DEFAULT_PROTOCOL_LABEL,
    estimatedApr,
    estimatedMonthlyYield: formatAmount(estimatedMonthlyYield),
    totalValue: formatAmount(totalValue),
    balances,
    goals: record.goals,
    recentActions: record.recentActions,
    lastUpdatedAt: record.lastUpdatedAt,
  };
}

export async function recordDefiAction(params: {
  familyId: string;
  teenAddress: string;
  actionKind: DeFiActionKind;
  amount: string;
  strategy: DeFiStrategy;
  goalName?: string;
  goalTarget?: string;
  flowTxHash?: string;
  receiptCid?: string;
}): Promise<DeFiPortfolioState> {
  const policy = resolvePolicy(params.familyId);
  const record = getStoredRecord(params.familyId, params.teenAddress);
  const now = new Date().toISOString();
  const nextStrategy = params.strategy || record.strategy || policy.strategy;
  const protocolLabel = record.protocolLabel || policy.allowedProtocols[0] || DEFAULT_PROTOCOL_LABEL;

  let goals: DeFiGoal[] = [...record.goals];
  if (params.goalName) {
    const goalIndex = goals.findIndex((goal) => goal.name.toLowerCase() === params.goalName!.toLowerCase());
    const existingGoal = goalIndex >= 0 ? goals[goalIndex] : null;
    const previousSaved = existingGoal ? parseAmount(existingGoal.savedAmount) : 0;
    const increment = parseAmount(params.amount);
    const targetAmount = existingGoal?.targetAmount || params.goalTarget || params.amount;
    const nextSaved = previousSaved + increment;
    const completed = parseAmount(targetAmount) > 0 && nextSaved >= parseAmount(targetAmount);
    const nextGoal: DeFiGoal = {
      id: existingGoal?.id || `goal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: params.goalName,
      targetAmount,
      savedAmount: formatAmount(nextSaved),
      status: completed ? "completed" : "active",
      createdAt: existingGoal?.createdAt || now,
      updatedAt: now,
    };

    if (goalIndex >= 0) {
      goals[goalIndex] = nextGoal;
    } else {
      goals = [nextGoal, ...goals];
    }
  }

  const recentAction: DeFiPortfolioAction = {
    kind: params.actionKind,
    amount: params.amount,
    description: params.goalName
      ? `${params.actionKind} plan for ${params.goalName}`
      : `${params.actionKind} plan`,
    strategy: nextStrategy,
    goalName: params.goalName,
    flowTxHash: params.flowTxHash,
    receiptCid: params.receiptCid,
    timestamp: now,
  };

  const nextRecord: StoredPortfolioRecord = {
    strategy: nextStrategy,
    protocolLabel,
    goals,
    recentActions: [recentAction, ...record.recentActions].slice(0, 8),
    lastUpdatedAt: now,
  };

  persistRecord(params.familyId, params.teenAddress, nextRecord);
  return getDefiPortfolioSnapshot({ familyId: params.familyId, teenAddress: params.teenAddress });
}

export function summarizePortfolioBalances(balances: TeenBalances) {
  const savingsValue = parseAmount(balances.savings);
  const reserveValue = parseAmount(balances.subscriptionReserve);
  const spendableValue = parseAmount(balances.spendable);
  return {
    savingsValue,
    reserveValue,
    spendableValue,
    totalValue: formatAmount(savingsValue + reserveValue),
  };
}
