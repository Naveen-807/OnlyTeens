import type {
  ExecutionLane,
  ExecutionMode,
  FlowMedium,
  GasMode,
  PolicyMode,
  SchedulerBackend,
  WalletMode,
} from "@/lib/types";

export interface OnboardingState {
  step: "guardian-auth" | "set-policy" | "invite-teen" | "teen-auth" | "complete";
  guardianAddress?: string;
  guardianPkpPublicKey?: string;
  guardianPkpTokenId?: string;
  teenAddress?: string;
  teenPkpPublicKey?: string;
  teenPkpTokenId?: string;
  calmaAddress?: string;
  calmaPkpPublicKey?: string;
  calmaPkpTokenId?: string;
  clawrenceAddress?: string;
  clawrencePkpPublicKey?: string;
  clawrencePkpTokenId?: string;
  familyId?: string;
  policySet?: boolean;
  passportCreated?: boolean;
  error?: string;
}

export interface LinkedTeenAccount {
  teenPhoneNumber?: string;
  teenAddress: string;
  teenPkpPublicKey: string;
  teenPkpTokenId: string;
  teenChipotleWalletId?: string;
  calmaAddress?: string;
  calmaPkpPublicKey?: string;
  calmaPkpTokenId?: string;
  calmaChipotleWalletId?: string;
  clawrenceAddress: string;
  clawrencePkpPublicKey: string;
  clawrencePkpTokenId: string;
  clawrenceChipotleWalletId?: string;
  chipotleGroupId?: string;
  chipotleUsageKeyId?: string;
  chipotleUsageApiKey?: string;
  vincentAppId?: string;
  vincentAppVersion?: string;
  vincentUserAccount?: string;
  vincentJwtAuthenticated?: boolean;
  vincentWalletId?: string;
  vincentWalletAddress?: string;
  erc8004AgentId?: string;
  erc8004IdentityTxHash?: string;
  erc8004ReputationTxHashes?: string[];
  erc8004ValidationTxHashes?: string[];
  guardianAutopilotEnabled?: boolean;
  policyMode?: PolicyMode;
  createdAt: string;
  active: boolean;
}

export interface FamilyRecord {
  familyId: string;
  guardianPhoneNumber?: string;
  guardianAddress: string;
  guardianPkpPublicKey: string;
  guardianPkpTokenId: string;
  teenPhoneNumber?: string;
  teenAddress: string;
  teenPkpPublicKey: string;
  teenPkpTokenId: string;
  calmaAddress?: string;
  calmaPkpPublicKey?: string;
  calmaPkpTokenId?: string;
  clawrenceAddress: string;
  clawrencePkpPublicKey: string;
  clawrencePkpTokenId: string;
  litActionCid: string;
  accessContract: string;
  vaultContract: string;
  schedulerContract: string;
  passportContract: string;
  policyContract: string;
  chipotleAccountId?: string;
  chipotleAccountApiKey?: string;
  chipotleGuardianWalletId?: string;
  chipotleTeenWalletId?: string;
  chipotleCalmaWalletId?: string;
  chipotleClawrenceWalletId?: string;
  chipotleGroupId?: string;
  chipotleUsageKeyId?: string;
  chipotleUsageApiKey?: string;
  vincentAppId?: string;
  vincentAppVersion?: string;
  vincentUserAccount?: string;
  vincentJwtAuthenticated?: boolean;
  vincentWalletId?: string;
  vincentWalletAddress?: string;
  erc8004AgentId?: string;
  erc8004IdentityTxHash?: string;
  erc8004ReputationTxHashes?: string[];
  erc8004ValidationTxHashes?: string[];
  executionMode?: ExecutionMode;
  executionLaneModes?: ExecutionLane[];
  fallbackActive?: boolean;
  walletMode?: WalletMode;
  gasMode?: GasMode;
  flowMedium?: FlowMedium;
  schedulerBackend?: SchedulerBackend;
  flowNativeFeaturesUsed?: string[];
  guardianAutopilotEnabled?: boolean;
  policyMode?: PolicyMode;
  linkedTeens?: LinkedTeenAccount[];
  createdAt: string;
  active: boolean;
}
