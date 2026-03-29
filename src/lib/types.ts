import { PASSPORT_LEVELS } from "@/lib/constants";

export type Role = "guardian" | "teen" | "executor";
export type PolicyDecision = "GREEN" | "YELLOW" | "RED" | "BLOCKED";
export type ActionType = "savings" | "subscription" | "payment";
export type ScheduleType = "SAVINGS" | "SUBSCRIPTION";

export { PASSPORT_LEVELS };

export interface Family {
  familyId: string;
  guardian: string;
  teen: string;
  executor: string;
  active: boolean;
}

export interface UserSession {
  role: Role;
  address: string;
  pkpPublicKey: string;
  pkpTokenId: string;
  familyId: string;
  sessionSigs: any;
  authMethod: any;
}

export interface TeenBalances {
  savings: string;
  subscriptionReserve: string;
  spendable: string;
}

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

export interface ParsedFlowEvent {
  name: string;
  args: Record<string, any>;
  txHash: string;
  blockNumber: bigint;
}

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
