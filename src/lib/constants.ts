import { keccak256, parseAbi, stringToBytes, toHex, type Chain } from "viem";

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
    default: { http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org"] },
    public: { http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
} as const satisfies Chain;

export const ACCESS_ABI = parseAbi([
  "function registerFamily(bytes32 familyId, address guardian, address teen, address executor) external",
  "function updateExecutor(bytes32 familyId, address newExecutor) external",
  "function deactivateFamily(bytes32 familyId) external",
  "function getFamily(bytes32 familyId) external view returns (address guardian, address teen, address executor, bool active)",
  "function isGuardian(bytes32 familyId, address addr) external view returns (bool)",
  "function isTeen(bytes32 familyId, address addr) external view returns (bool)",
  "function isExecutor(bytes32 familyId, address addr) external view returns (bool)",
  "event FamilyRegistered(bytes32 indexed familyId, address guardian, address teen, address executor)",
  "event ExecutorUpdated(bytes32 indexed familyId, address oldExecutor, address newExecutor)",
  "event FamilyDeactivated(bytes32 indexed familyId)",
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
  "function evaluateAction(bytes32 familyId, uint256 amount, uint8 currentPassportLevel, bool isRecurring) external returns (uint8)",
  "function getGuardianPolicyView(bytes32 familyId) external view returns (uint256 singleCap, uint256 recurringCap, uint256 trustThreshold)",
  "function isPolicySet(bytes32 familyId) external view returns (bool)",
  "event PolicySet(bytes32 indexed familyId, address guardian, uint256 timestamp)",
  "event PolicyEvaluated(bytes32 indexed familyId, address indexed teen, string actionType, uint256 amount, uint8 decision, uint256 timestamp)",
]);

export const PASSPORT_LEVELS = [
  { level: 0, name: "Starter", threshold: 0 },
  { level: 1, name: "Explorer", threshold: 5 },
  { level: 2, name: "Saver", threshold: 15 },
  { level: 3, name: "Manager", threshold: 35 },
  { level: 4, name: "Planner", threshold: 70 },
  { level: 5, name: "Independent", threshold: 150 },
] as const;

export function makeFamilyId(label: string): `0x${string}` {
  return keccak256(toHex(stringToBytes(label))) as `0x${string}`;
}

export const CURRENCY = "₹";
export const SAFE_EXECUTOR_CID =
  process.env.NEXT_PUBLIC_SAFE_EXECUTOR_CID || process.env.SAFE_EXECUTOR_CID || "";
