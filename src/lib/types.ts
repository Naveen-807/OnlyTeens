// ═══ Roles ═══
export type Role = "guardian" | "teen" | "executor";
export type AuthChannel = "google" | "phone" | "phone-otp" | "passkey" | "demo";
export type GuardrailDecision = "ALLOW" | "BLOCK" | "REVIEW";
export type ExecutionMode = "vincent-live" | "chipotle-fallback" | "local-fallback";
export type SchedulerBackend = "flow-native-scheduled" | "evm-manual";
export type WalletMode = "app-managed" | "delegated" | "linked-self-custody";
export type GasMode = "sponsored" | "user-funded";
export type ExecutionLane =
  | "direct-flow"
  | "agent-assisted-flow"
  | "guardian-autopilot-flow";
export type TransactionActor = "guardian" | "teen" | "calma";
export type ApprovalMode =
  | "none"
  | "guardian-approval-required"
  | "guardian-approved"
  | "guardian-autopilot";
export type PolicyMode = "encrypted-live" | "degraded";
export type FlowMedium = "FLOW";

// ═══ Policy Decisions ═══
export type PolicyDecision = "GREEN" | "YELLOW" | "RED" | "BLOCKED";

// ═══ Action Types ═══
export type ActionType = "savings" | "subscription" | "payment";

// ═══ Schedule Types ═══
export type ScheduleType = "SAVINGS" | "SUBSCRIPTION";

export interface VincentSessionContext {
  mode: "live" | "fallback";
  walletId?: string;
  walletAddress?: string;
  agentWalletAddress?: string;
  appId?: string;
  appVersion?: string;
  userAccount?: string;
  jwtAuthenticated?: boolean;
  verificationSource?: "sdk" | "payload-check" | "none";
}

export interface ERC8004Proof {
  chainId: number;
  agentId?: string;
  registry?: {
    identity: string;
    reputation: string;
    validation: string;
  };
  identityTxHash?: string;
  reputationTxHashes?: string[];
  validationTxHashes?: string[];
  agentUri?: string;
}

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
  sessionSigs?: any;
  authMethod?: any;
  authChannel?: AuthChannel;
  verificationId?: string;
  walletMode?: WalletMode;
  gasMode?: GasMode;
  flowNativeFeaturesUsed?: string[];
  flowMedium?: FlowMedium;
  guardianAutopilotEnabled?: boolean;
  chipotle?: {
    mode: "live" | "local";
    accountId?: string;
    walletId?: string;
    groupId?: string;
    usageKeyId?: string;
  };
  vincent?: VincentSessionContext;
  erc8004?: ERC8004Proof;
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
  calmaPreExplanation?: string;
  calmaGuardianExplanation?: string;
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
  executionLane?: ExecutionLane;
  transactionActor?: TransactionActor;
  approvalMode?: ApprovalMode;
  flowMedium?: FlowMedium;
  policyMode?: PolicyMode;
  guardianAutopilotEnabled?: boolean;
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
  guardrails?: GuardrailResult;
  execution: {
    litActionCid: string;
    litSigned: boolean;
    litSignatureResponse?: any;
    flowTxHash: string;
    flowExplorerUrl: string;
    flowBlockNumber?: number;
    gasUsed?: string;
    executionSource?: "flow-evm-contract" | "flow-native-scheduled";
    schedulerBackend?: SchedulerBackend;
    scheduleTxHash?: string;
    scheduleId?: number;
    scheduleLabel?: string;
    scheduledExecutionId?: string;
    scheduledExecutionExplorerUrl?: string;
    nextExecutionAt?: string;
  };
  passport: {
    levelBefore: number;
    levelAfter: number;
    leveledUp: boolean;
    totalActions: number;
  };
  calma?: {
    preExplanation: string;
    postExplanation: string;
    celebration?: string;
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
  delegation?: {
    role: "guardian" | "teen" | "executor";
    capabilities: Array<string | { can: string; with: string }>;
    delegationCid?: string;
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
  executionLane?: ExecutionLane;
  transactionActor?: TransactionActor;
  approvalMode?: ApprovalMode;
  flowMedium?: FlowMedium;
  policyMode?: PolicyMode;
  guardianAutopilotEnabled?: boolean;
  executionMode?: ExecutionMode;
  fallbackActive?: boolean;
  guardrail?: {
    decision: GuardrailDecision;
    reason?: string;
    source?: string;
  };
  guardrails?: GuardrailResult;
  approvalRequestId?: string;
  flow?: {
    txHash: string;
    explorerUrl: string;
    events: ParsedFlowEvent[];
    gasUsed: string;
    blockNumber?: number;
  };
  lit?: {
    signed: boolean;
    actionCid: string;
    response: any;
  };
  chipotle?: {
    configured: boolean;
    accountId?: string;
    groupId?: string;
    pkpId?: string;
    walletId?: string;
    safeExecutorCid?: string;
    usageKeyId?: string;
    usageKeyScope?: "execute-only" | "full-access" | "local-fallback";
    mode?: "live" | "local";
  };
  vincent?: {
    configured: boolean;
    live: boolean;
    walletAddress?: string;
    walletId?: string;
    appId?: string;
    appVersion?: string;
    jwtAuthenticated?: boolean;
    userAccount?: string;
    agentWalletAddress?: string;
    note?: string;
  };
  zama?: {
    decision: PolicyDecision;
    contractAddress: string;
    evaluationTxHash: string;
    source?: "encrypted" | "heuristic"; // Track if real encrypted eval or fallback
    guardianView?: string;
    teenView?: string;
  };
  erc8004?: ERC8004Proof;
  storacha?: {
    receiptCid: string;
    receiptUrl: string;
    passportCid?: string;
    passportUrl?: string;
    conversationCid?: string;
  };
  balanceSnapshot?: {
    savings?: string;
    subscriptionReserve?: string;
    spendable?: string;
    walletBalance?: string;
  };
  payee?: {
    address: string;
    label?: string;
  };
  passport?: {
    oldLevel: number;
    newLevel: number;
    leveledUp: boolean;
  };
  schedule?: {
    txHash: string;
    scheduleId: number;
    label: string;
    interval?: "weekly" | "monthly";
    recipientAddress?: string;
    backend?: SchedulerBackend;
    executionSource?: "flow-evm-contract" | "flow-native-scheduled";
    scheduledExecutionId?: string;
    scheduledExecutionExplorerUrl?: string;
    nextExecutionAt?: string;
  };
  calma?: {
    preExplanation: string;
    postExplanation: string;
    celebration?: string;
  };
  clawrence?: {
    preExplanation: string;
    postExplanation: string;
    celebration?: string;
  };
  error?: string;
}

export interface GuardrailResult {
  approved: boolean;
  provider: "vincent-local" | "vincent-api";
  version: string;
  chain: string;
  action: ActionType;
  recipientAddress: string;
  reasons: string[];
  checks: {
    allowedActionType: boolean;
    allowedChain: boolean;
    allowedRecipient: boolean;
    maxSingleTransfer: boolean;
    recurringWithinLimit: boolean;
  };
  aiDecision?: GuardrailDecision;
  aiReasoning?: string;
}

export interface PermissionsProofState {
  zamaDecision: PolicyDecision;
  zamaSource?: "encrypted" | "heuristic" | "runtime";
  guardrailDecision?: GuardrailDecision;
  guardrailReason?: string;
  litAuthorized: boolean;
  litPermissionStatus?: "fetched" | "derived" | "unavailable";
  litPermissionNote?: string;
  litActionCid: string;
  flowTxHash?: string;
  flowExplorerUrl?: string;
  storachaCid?: string;
  storachaUrl?: string;
  evaluationTxHash?: string;
}

export interface RuntimeFamilyProof {
  available: boolean;
  source: "live-family-record" | "config-only";
  familyId?: string;
  createdAt?: string;
  guardianAddress?: string;
  teenAddress?: string;
  calmaAddress?: string;
  clawrenceAddress?: string;
  guardianPkpTokenId?: string;
  teenPkpTokenId?: string;
  calmaPkpTokenId?: string;
  clawrencePkpTokenId?: string;
  guardianPkpPublicKey?: string;
  teenPkpPublicKey?: string;
  calmaPkpPublicKey?: string;
  clawrencePkpPublicKey?: string;
  litActionCid?: string;
  litActionMatchesRuntimeCid?: boolean;
  chipotleAccountId?: string;
  chipotlePrimaryGroupId?: string;
  chipotlePrimaryUsageKeyId?: string;
  chipotlePrimaryCalmaWalletId?: string;
  chipotlePrimaryPkpId?: string;
  vincentWalletAddress?: string;
  vincentWalletId?: string;
  vincentAppId?: string;
  vincentAppVersion?: string;
  vincentUserAccount?: string;
  vincentJwtAuthenticated?: boolean;
  executionMode?: ExecutionMode;
  executionLaneModes?: ExecutionLane[];
  fallbackActive?: boolean;
  walletMode?: WalletMode;
  gasMode?: GasMode;
  flowMedium?: FlowMedium;
  schedulerBackend?: SchedulerBackend;
  flowNativeFeaturesUsed?: string[];
  guardianAutopilotEnabled?: boolean;
  erc8004?: ERC8004Proof;
  permittedScopes: string[];
  permissions: {
    fetched: boolean;
    authorized: boolean;
    permittedActions: string[];
    error?: string;
  };
}

export interface RuntimeCapabilities {
  generatedAt: string;
  liveMode?: {
    enabled: boolean;
    degradedModeAllowed: boolean;
  };
  vincent: {
    mode: "live" | "local-only";
    baseUrl: string;
    note: string;
    appId?: string;
    appVersion?: string;
    redirectUri?: string;
    jwtAudience?: string;
  };
  lit: {
    network: string;
    baseUrl?: string;
    safeExecutorCid: string;
    configured: boolean;
    familyProof: RuntimeFamilyProof;
  };
  zama: {
    network: string;
    policyContract: string;
    evaluatorConfigured: boolean;
    note: string;
  };
  flow: {
    network: string;
    chainId: number;
    accessContract: string;
    vaultContract: string;
    schedulerContract: string;
    passportContract: string;
    gaslessRpcUrl: string;
    gasMode: GasMode;
    walletMode: WalletMode;
    flowMedium: FlowMedium;
    preferredSchedulerBackend: SchedulerBackend;
    nativeSchedulingConfigured: boolean;
    flowNativeFeaturesUsed: string[];
  };
  executionLanes?: ExecutionLane[];
  autopilot?: {
    guardianAutopilotEnabled: boolean;
    teenAutonomyAllowed: false;
    schedulerBackend: SchedulerBackend;
  };
  sponsorReadiness: {
    flowCore: boolean;
    zamaCore: boolean;
    litDelegation: boolean;
  };
  erc8004?: {
    enabled: boolean;
    chainId: number;
    identityRegistry: string;
    reputationRegistry: string;
    validationRegistry: string;
    note: string;
  };
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
