// ═══ Roles ═══
export type Role = "guardian" | "teen" | "executor";

// ═══ Policy Decisions ═══
export type PolicyDecision = "GREEN" | "YELLOW" | "RED" | "BLOCKED";

// ═══ Action Types ═══
export type ActionType = "savings" | "subscription" | "payment";

// ═══ Schedule Types ═══
export type ScheduleType = "SAVINGS" | "SUBSCRIPTION";

// ═══ Passport Levels ═══
export const PASSPORT_LEVELS = [
  { level: 0, name: "Starter", threshold: 0 },
  { level: 1, name: "Explorer", threshold: 5 },
  { level: 2, name: "Saver", threshold: 15 },
  { level: 3, name: "Manager", threshold: 35 },
  { level: 4, name: "Planner", threshold: 70 },
  { level: 5, name: "Independent", threshold: 150 },
] as const;

// ═══ Family ═══
export interface Family {
  familyId: string;
  guardian: string;
  teen: string;
  executor: string;
  active: boolean;
}

// ═══ Session ═══
export interface UserSession {
  role: Role;
  address: string;
  pkpPublicKey: string;
  pkpTokenId: string;
  pkpAddress?: string;
  familyId: string;
  phoneNumber?: string;
  verificationSid?: string;
  authProvider?: "twilio-verify";
  sessionSigs: any;
  authMethod: any;
}

// ═══ Balances ═══
export interface TeenBalances {
  savings: string;
  subscriptionReserve: string;
  spendable: string;
}

// ═══ Passport ═══
export interface PassportState {
  level: number;
  levelName: string;
  weeklyStreak: number;
  totalActions: number;
  savingsCount: number;
  approvedSubs: number;
  rejectedActions: number;
  progressToNext: {
    current: number;
    needed: number;
    remaining: number;
    nextLevelName: string;
    percentComplete: number;
  };
}

// ═══ Approval Request ═══
export interface ApprovalRequest {
  id: string;
  familyId: string;
  teenAddress: string;
  teenName: string;
  actionType: ActionType;
  description: string;
  amount: number;
  currency: string;
  isRecurring: boolean;
  intervalSeconds?: number;
  recipientAddress?: string;
  policyDecision: PolicyDecision;
  clawrencePreExplanation: string;
  clawrenceGuardianExplanation: string;
  teenPassportLevel: number;
  teenStreak: number;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  guardianNote?: string;
  storachaCid?: string;
}

// ═══ Receipt (stored on Storacha) ═══
export interface Proof18Receipt {
  version: "v1";
  type: ActionType | "approval" | "passport_update";
  familyId: string;
  teen: string;
  guardian: string;
  action: {
    description: string;
    amount: string;
    currency: string;
    isRecurring: boolean;
    serviceName?: string;
  };
  policy: {
    decision: PolicyDecision;
    contractAddress: string;
    evaluationTxHash?: string;
  };
  execution: {
    litActionCid: string;
    litSigned: boolean;
    litSignatureResponse?: any;
    flowTxHash: string;
    flowExplorerUrl: string;
    flowBlockNumber?: number;
    gasUsed?: string;
  };
  passport: {
    levelBefore: number;
    levelAfter: number;
    leveledUp: boolean;
    totalActions: number;
  };
  clawrence: {
    preExplanation: string;
    postExplanation: string;
    celebration?: string;
  };
  approvalRecord?: {
    guardianApproved: boolean;
    guardianNote?: string;
    approvedAt?: string;
    approvalStorachaCid?: string;
  };
  timestamp: string;
  storachaCid?: string;
}

// ═══ Flow Event Parsed ═══
export interface ParsedFlowEvent {
  name: string;
  args: Record<string, any>;
  txHash: string;
  blockNumber: bigint;
}

// ═══ Orchestration Result ═══
export interface FlowResult {
  success: boolean;
  decision: PolicyDecision;
  requiresApproval: boolean;
  approvalRequestId?: string;
  flow?: {
    txHash: string;
    explorerUrl: string;
    events: ParsedFlowEvent[];
    gasUsed: string;
  };
  lit?: {
    signed: boolean;
    actionCid: string;
    response: any;
  };
  zama?: {
    decision: PolicyDecision;
    contractAddress: string;
    evaluationTxHash: string;
  };
  storacha?: {
    receiptCid: string;
    receiptUrl: string;
    passportCid?: string;
    passportUrl?: string;
    conversationCid?: string;
  };
  passport?: {
    oldLevel: number;
    newLevel: number;
    leveledUp: boolean;
  };
  clawrence?: {
    preExplanation: string;
    postExplanation: string;
    celebration?: string;
  };
  error?: string;
}

// ═══ Clawrence Intent ═══
export interface ClawrenceIntent {
  type: ActionType | "question" | "status" | "unknown";
  amount?: number;
  currency: string;
  description: string;
  isRecurring: boolean;
  interval?: "weekly" | "monthly";
  serviceName?: string;
  confidence: number;
}

// ═══ Schedule ═══
export interface ScheduleInfo {
  scheduleId: number;
  familyId: string;
  teen: string;
  amount: string;
  intervalSeconds: number;
  nextExecution: number;
  label: string;
  scheduleType: ScheduleType;
  active: boolean;
}
