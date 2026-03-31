import fs from "node:fs";
import path from "node:path";

import { parseAbi, keccak256, stringToBytes, toHex, type Chain } from "viem";

type DeploymentsJson = {
  contracts?: {
    access?: { address?: string };
    vault?: { address?: string };
    scheduler?: { address?: string };
    passport?: { address?: string };
  };
};

function readDeployments(): DeploymentsJson | null {
  try {
    const deploymentsPath = path.join(process.cwd(), "deployments.json");
    if (!fs.existsSync(deploymentsPath)) return null;
    return JSON.parse(fs.readFileSync(deploymentsPath, "utf8")) as DeploymentsJson;
  } catch {
    return null;
  }
}

const deployments = readDeployments();

// ═══ Chain Config ═══
export const FLOW_TESTNET = {
  id: 545,
  name: "Flow EVM Testnet",
  nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.evm.nodes.onflow.org"] },
    public: { http: ["https://testnet.evm.nodes.onflow.org"] },
  },
  blockExplorers: {
    default: { name: "Flowscan", url: "https://evm-testnet.flowscan.io" },
  },
} as const satisfies Chain;

export const SEPOLIA = {
  id: 11155111,
  name: "Ethereum Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "SEP", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org"] },
    public: { http: [process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
} as const satisfies Chain;

// ═══ Contract Addresses ═══
export const CONTRACTS = {
  access:
    (deployments?.contracts?.access?.address ||
      process.env.NEXT_PUBLIC_ACCESS_CONTRACT ||
      process.env.ACCESS_CONTRACT ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
  vault:
    (deployments?.contracts?.vault?.address ||
      process.env.NEXT_PUBLIC_VAULT_CONTRACT ||
      process.env.VAULT_CONTRACT ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
  scheduler:
    (deployments?.contracts?.scheduler?.address ||
      process.env.NEXT_PUBLIC_SCHEDULER_CONTRACT ||
      process.env.SCHEDULER_CONTRACT ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
  passport:
    (deployments?.contracts?.passport?.address ||
      process.env.NEXT_PUBLIC_PASSPORT_CONTRACT ||
      process.env.PASSPORT_CONTRACT ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
  policy:
    (process.env.NEXT_PUBLIC_POLICY_CONTRACT ||
      process.env.POLICY_CONTRACT ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
} as const;

// ═══ ABIs (minimal, only what the app calls) ═══
export const ACCESS_ABI = parseAbi([
  "function registerFamily(bytes32 familyId, address guardian, address teen, address executor) external",
  "function updateExecutor(bytes32 familyId, address newExecutor) external",
  "function approveExecutor(bytes32 familyId, address executor) external",
  "function revokeExecutor(bytes32 familyId, address executor) external",
  "function addTeen(bytes32 familyId, address teen) external",
  "function removeTeen(bytes32 familyId, address teen) external",
  "function deactivateFamily(bytes32 familyId) external",
  "function getFamily(bytes32 familyId) external view returns (address guardian, address teen, address executor, bool active)",
  "function getTeenCount(bytes32 familyId) external view returns (uint256)",
  "function getTeenAt(bytes32 familyId, uint256 index) external view returns (address)",
  "function isGuardian(bytes32 familyId, address addr) external view returns (bool)",
  "function isTeen(bytes32 familyId, address addr) external view returns (bool)",
  "function isExecutor(bytes32 familyId, address addr) external view returns (bool)",
  "event FamilyRegistered(bytes32 indexed familyId, address guardian, address teen, address executor)",
  "event ExecutorUpdated(bytes32 indexed familyId, address oldExecutor, address newExecutor)",
  "event FamilyDeactivated(bytes32 indexed familyId)",
  "event TeenAdded(bytes32 indexed familyId, address teen)",
  "event TeenRemoved(bytes32 indexed familyId, address teen)",
  "event ExecutorApproved(bytes32 indexed familyId, address executor)",
  "event ExecutorRevoked(bytes32 indexed familyId, address executor)",
]);

export const VAULT_ABI = parseAbi([
  "function depositSavings(bytes32 familyId, address teen) external payable",
  "function withdrawSavings(bytes32 familyId, address teen, uint256 amount) external",
  "function fundSubscription(bytes32 familyId, address teen, string serviceName) external payable",
  "function executeSubscriptionPayment(bytes32 familyId, address teen, string serviceName, uint256 amount, address recipient) external",
  "function getBalances(bytes32 familyId, address teen) external view returns (uint256 savings, uint256 reserve)",
  "event SavingsDeposit(bytes32 indexed familyId, address indexed teen, uint256 amount, uint256 newBalance, uint256 timestamp)",
  "event SavingsWithdraw(bytes32 indexed familyId, address indexed teen, uint256 amount, uint256 timestamp)",
  "event SubscriptionFunded(bytes32 indexed familyId, address indexed teen, string serviceName, uint256 amount, uint256 timestamp)",
  "event SubscriptionPaid(bytes32 indexed familyId, address indexed teen, string serviceName, uint256 amount, address recipient, uint256 timestamp)",
]);

export const SCHEDULER_ABI = parseAbi([
  "function createSchedule(bytes32 familyId, address teen, uint256 amount, uint256 intervalSeconds, string label, uint8 scheduleType, address recipient) external returns (uint256)",
  "function executeSchedule(uint256 scheduleId) external payable",
  "function pauseSchedule(uint256 scheduleId) external",
  "function resumeSchedule(uint256 scheduleId) external",
  "function getSchedule(uint256 scheduleId) external view returns (bytes32 familyId, address teen, uint256 amount, uint256 interval, uint256 nextExec, string label, bool active)",
  "function scheduleCount() external view returns (uint256)",
  "event ScheduleCreated(uint256 indexed scheduleId, bytes32 indexed familyId, address teen, string label, uint8 scheduleType, uint256 amount, uint256 intervalSeconds)",
  "event ScheduleExecuted(uint256 indexed scheduleId, bytes32 indexed familyId, address teen, uint256 amount, uint256 timestamp)",
  "event SchedulePaused(uint256 indexed scheduleId, bytes32 indexed familyId)",
  "event ScheduleResumed(uint256 indexed scheduleId, bytes32 indexed familyId)",
]);

export const PASSPORT_ABI = parseAbi([
  "function createPassport(bytes32 familyId, address teen) external",
  "function recordAction(bytes32 familyId, address teen, string actionType, bool approved) external returns (bool leveledUp, uint8 newLevel)",
  "function updateStreak(bytes32 familyId, address teen, uint16 newStreak) external",
  "function getPassport(bytes32 familyId, address teen) external view returns (uint8 level, string levelName, uint16 streak, uint32 total, uint32 savings, uint32 subs, uint32 rejected)",
  "function getProgressToNextLevel(bytes32 familyId, address teen) external view returns (uint32 currentActions, uint32 nextLevelThreshold, uint32 remaining, string currentLevelName, string nextLevelName)",
  "event PassportCreated(bytes32 indexed familyId, address indexed teen, uint256 timestamp)",
  "event PassportLevelUp(bytes32 indexed familyId, address indexed teen, uint8 oldLevel, uint8 newLevel, string newLevelName, uint32 totalActions, uint256 timestamp)",
  "event PassportStreakUpdate(bytes32 indexed familyId, address indexed teen, uint16 newStreak, uint256 timestamp)",
  "event PassportActionRecorded(bytes32 indexed familyId, address indexed teen, string actionType, bool wasApproved, uint32 newTotalActions, uint256 timestamp)",
]);

export const POLICY_ABI = parseAbi([
  "function setPolicy(bytes32 familyId, uint256 encSingleCap, uint256 encRecurringCap, uint256 encTrustThreshold, uint256 encRiskFlags, bytes inputProof) external",
  "function evaluateAction(bytes32 familyId, address teen, uint256 amount, uint8 currentPassportLevel, bool isRecurring) external",
  "function getGuardianPolicyView(bytes32 familyId) external view returns (uint256 singleCap, uint256 recurringCap, uint256 trustThreshold, uint256 riskFlags)",
  "function getServerPolicyView(bytes32 familyId) external view returns (uint256 singleCap, uint256 recurringCap, uint256 trustThreshold, uint256 riskFlags)",
  "function getGuardianLatestDecisionView(bytes32 familyId) external view returns (uint256 decisionHandle, uint256 amount, bool isRecurring, address actor)",
  "function getServerLatestDecisionView(bytes32 familyId) external view returns (uint256 decisionHandle, uint256 amount, bool isRecurring, address actor)",
  "function isPolicySet(bytes32 familyId) external view returns (bool)",
  "event PolicySet(bytes32 indexed familyId, address guardian, uint256 timestamp)",
  "event PolicyEvaluated(bytes32 indexed familyId, address indexed actor, address indexed teen, string actionType, uint256 amount, bool isRecurring, uint256 timestamp)",
]);

// ═══ Helper ═══
export function makeFamilyId(label: string): `0x${string}` {
  return keccak256(toHex(stringToBytes(label))) as `0x${string}`;
}

export const CURRENCY = "₹";
export const SAFE_EXECUTOR_CID = process.env.NEXT_PUBLIC_SAFE_EXECUTOR_CID || process.env.SAFE_EXECUTOR_CID || "";
