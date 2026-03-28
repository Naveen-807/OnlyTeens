export type PolicyState = "green" | "yellow" | "red" | "blocked";
export type Actor = "teen" | "parent";

export type TeenScreen =
  | "home"
  | "wallet"
  | "goals"
  | "request"
  | "subscriptions"
  | "passport"
  | "history"
  | "chat";

export type ParentScreen =
  | "family-setup"
  | "teen-wallet-setup"
  | "treasury"
  | "rules"
  | "approvals"
  | "teen-progress"
  | "history-audit";

export type SharedScreen =
  | "action-details"
  | "execution-result"
  | "notifications"
  | "profile-settings";

export type Screen = TeenScreen | ParentScreen | SharedScreen;

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  history: { label: string; amount: number; time: string }[];
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cadence: "monthly" | "yearly";
  status: "requested" | "active" | "blocked" | "approval-pending" | "denied";
  renewsOn: string;
}

export interface PassportState {
  score: number;
  level: string;
  streak: number;
  nextUnlockTarget: number;
  unlockedPermissions: string[];
  log: { label: string; delta: number; time: string }[];
}

export interface HistoryItem {
  id: string;
  title: string;
  amount: number;
  status: "success" | "approval-pending" | "blocked" | "denied" | "processing";
  date: string;
  approvalNeeded: boolean;
  evidenceRef: string;
  policy: PolicyState;
}

export interface ApprovalRequest {
  id: string;
  teenName: string;
  actionType: string;
  amount: number;
  explanation: string;
  status: "pending" | "approved" | "denied";
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  tone: "neutral" | "good" | "warning" | "bad";
  time: string;
}

export interface RulesState {
  maxDailySpend: number;
  maxSingleSpend: number;
  recurringCap: number;
  approvedCategories: string[];
  blockedCategories: string[];
  savingsRule: string;
  advancedFeatures: boolean;
  emergencyPause: boolean;
}

export interface WalletState {
  connected: boolean;
  guardianReady: boolean;
  teenWalletReady: boolean;
  paused: boolean;
  spendableBalance: number;
  savingsBalance: number;
  treasuryBalance: number;
  nextAllowance: string;
}
