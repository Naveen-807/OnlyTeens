"use client";

import { create } from "zustand";

import {
  ApprovalRequest,
  Goal,
  HistoryItem,
  NotificationItem,
  PassportState,
  RulesState,
  Subscription,
  WalletState,
} from "@/types/proof18";

type Proof18Store = {
  familyCreated: boolean;
  teenAdded: boolean;
  guardianWalletConnected: boolean;
  treasuryFunded: boolean;
  currentSigningRequest: string | null;
  policyPreview: "green" | "yellow" | "red" | "blocked";
  lastResult: {
    title: string;
    body: string;
    tone: "success" | "blocked" | "approval-needed";
  } | null;
  wallet: WalletState;
  rules: RulesState;
  goals: Goal[];
  subscriptions: Subscription[];
  history: HistoryItem[];
  approvals: ApprovalRequest[];
  notifications: NotificationItem[];
  passport: PassportState;
  loadingAction: string | null;
  createFamily: () => void;
  addTeen: () => void;
  connectGuardianWallet: () => void;
  fundTreasury: (amount: number) => void;
  setRulesPreset: () => void;
  setPolicyPreview: (value: Proof18Store["policyPreview"]) => void;
  addGoalContribution: (goalId: string, amount: number) => void;
  requestSubscription: (name: string, amount: number) => void;
  approveRequest: (requestId: string) => void;
  denyRequest: (requestId: string) => void;
  clearResult: () => void;
  pushNotification: (item: NotificationItem) => void;
};

const timestamp = () =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

export const useProof18Store = create<Proof18Store>((set, get) => ({
  familyCreated: false,
  teenAdded: false,
  guardianWalletConnected: false,
  treasuryFunded: false,
  currentSigningRequest: null,
  policyPreview: "yellow",
  lastResult: null,
  loadingAction: null,
  wallet: {
    connected: false,
    guardianReady: false,
    teenWalletReady: false,
    paused: false,
    spendableBalance: 48,
    savingsBalance: 86,
    treasuryBalance: 0,
    nextAllowance: "Saturday · 9:00 AM",
  },
  rules: {
    maxDailySpend: 25,
    maxSingleSpend: 15,
    recurringCap: 9.99,
    approvedCategories: ["education", "music", "games", "food"],
    blockedCategories: ["gambling", "age-restricted", "cash-out"],
    savingsRule: "Every allowance auto-reserves 20% for a goal.",
    advancedFeatures: false,
    emergencyPause: false,
  },
  goals: [
    {
      id: "goal-headphones",
      name: "Studio headphones",
      target: 240,
      saved: 86,
      history: [
        { label: "Allowance reserve", amount: 24, time: "Mar 22" },
        { label: "Goal top-up", amount: 12, time: "Mar 24" },
      ],
    },
  ],
  subscriptions: [
    {
      id: "sub-language",
      name: "LinguaLab",
      amount: 7.99,
      cadence: "monthly",
      status: "active",
      renewsOn: "Apr 14",
    },
  ],
  approvals: [],
  history: [
    {
      id: "hist-1",
      title: "Saved into Studio headphones",
      amount: 12,
      status: "success",
      date: "Mar 24",
      approvalNeeded: false,
      evidenceRef: "fil://bafy...headphones",
      policy: "green",
    },
    {
      id: "hist-2",
      title: "LinguaLab renewal",
      amount: 7.99,
      status: "success",
      date: "Mar 14",
      approvalNeeded: false,
      evidenceRef: "fil://bafy...lingualab",
      policy: "yellow",
    },
  ],
  notifications: [
    {
      id: "note-1",
      title: "Clawrence noticed a strong week",
      body: "Three responsible actions in a row. Passport streak held.",
      tone: "good",
      time: "2m ago",
    },
  ],
  passport: {
    score: 72,
    level: "Steady Hands",
    streak: 5,
    nextUnlockTarget: 85,
    unlockedPermissions: ["Small purchases", "Goal transfers", "Auto-renew under 8 FLOW"],
    log: [
      { label: "Saved before spending", delta: 6, time: "Today" },
      { label: "Subscription stayed within category limits", delta: 3, time: "Yesterday" },
    ],
  },
  createFamily: () =>
    set((state) => ({
      familyCreated: true,
      notifications: [
        {
          id: crypto.randomUUID(),
          title: "Family vault created",
          body: "You now have a household treasury shell ready for funding.",
          tone: "good",
          time: timestamp(),
        },
        ...state.notifications,
      ],
    })),
  addTeen: () =>
    set((state) => ({
      teenAdded: true,
      wallet: { ...state.wallet, teenWalletReady: true, connected: true },
      notifications: [
        {
          id: crypto.randomUUID(),
          title: "Teen wallet drafted",
          body: "Proof18 created a governed wallet surface for the teen profile.",
          tone: "good",
          time: timestamp(),
        },
        ...state.notifications,
      ],
    })),
  connectGuardianWallet: () =>
    set((state) => ({
      guardianWalletConnected: true,
      wallet: { ...state.wallet, guardianReady: true },
      notifications: [
        {
          id: crypto.randomUUID(),
          title: "Guardian authority connected",
          body: "Approvals can now sign and release household actions.",
          tone: "good",
          time: timestamp(),
        },
        ...state.notifications,
      ],
    })),
  fundTreasury: (amount) =>
    set((state) => ({
      treasuryFunded: true,
      wallet: { ...state.wallet, treasuryBalance: state.wallet.treasuryBalance + amount },
      history: [
        {
          id: crypto.randomUUID(),
          title: "Treasury funded",
          amount,
          status: "success",
          date: timestamp(),
          approvalNeeded: false,
          evidenceRef: "fil://bafy...treasury-seed",
          policy: "green",
        },
        ...state.history,
      ],
    })),
  setRulesPreset: () =>
    set((state) => ({
      rules: {
        ...state.rules,
        advancedFeatures: true,
      },
      notifications: [
        {
          id: crypto.randomUUID(),
          title: "Rules published",
          body: "Daily, single, and recurring limits are now active.",
          tone: "neutral",
          time: timestamp(),
        },
        ...state.notifications,
      ],
    })),
  setPolicyPreview: (value) => set({ policyPreview: value }),
  addGoalContribution: (goalId, amount) => {
    set({ loadingAction: `goal-${goalId}`, currentSigningRequest: "goal-transfer" });
    window.setTimeout(() => {
      set((state) => {
        const goals = state.goals.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                saved: goal.saved + amount,
                history: [{ label: "Clawrence-guided save", amount, time: timestamp() }, ...goal.history],
              }
            : goal,
        );
        return {
          loadingAction: null,
          currentSigningRequest: null,
          goals,
          wallet: {
            ...state.wallet,
            spendableBalance: state.wallet.spendableBalance - amount,
            savingsBalance: state.wallet.savingsBalance + amount,
          },
          passport: {
            ...state.passport,
            score: state.passport.score + 4,
            streak: state.passport.streak + 1,
            log: [{ label: "Moved allowance into savings", delta: 4, time: timestamp() }, ...state.passport.log],
          },
          history: [
            {
              id: crypto.randomUUID(),
              title: "Goal contribution executed",
              amount,
              status: "success",
              date: timestamp(),
              approvalNeeded: false,
              evidenceRef: "fil://bafy...goal-proof",
              policy: "green",
            },
            ...state.history,
          ],
          lastResult: {
            title: "Savings executed",
            body: "Clawrence moved the selected amount into the goal vault and updated Passport.",
            tone: "success",
          },
          notifications: [
            {
              id: crypto.randomUUID(),
              title: "Goal progress moved forward",
              body: `$${amount.toFixed(2)} was added to the selected goal.`,
              tone: "good",
              time: timestamp(),
            },
            ...state.notifications,
          ],
        };
      });
    }, 1500);
  },
  requestSubscription: (name, amount) => {
    const requestId = crypto.randomUUID();
    set((state) => ({
      subscriptions: [
        {
          id: requestId,
          name,
          amount,
          cadence: "monthly",
          status: "approval-pending",
          renewsOn: "Awaiting approval",
        },
        ...state.subscriptions,
      ],
      approvals: [
        {
          id: requestId,
          teenName: "Maya",
          actionType: `Subscription · ${name}`,
          amount,
          explanation: "Recurring request exceeds the auto-renew cap, so a guardian signature is required.",
          status: "pending",
        },
        ...state.approvals,
      ],
      history: [
        {
          id: crypto.randomUUID(),
          title: `Requested ${name}`,
          amount,
          status: "approval-pending",
          date: timestamp(),
          approvalNeeded: true,
          evidenceRef: "fil://bafy...request-pending",
          policy: "red",
        },
        ...state.history,
      ],
      lastResult: {
        title: "Approval required",
        body: "This recurring request sits above the safe auto-renew band and has been queued for a guardian.",
        tone: "approval-needed",
      },
    }));
  },
  approveRequest: (requestId) => {
    set({ loadingAction: `approval-${requestId}`, currentSigningRequest: requestId });
    window.setTimeout(() => {
      set((state) => ({
        loadingAction: null,
        currentSigningRequest: null,
        approvals: state.approvals.map((request) =>
          request.id === requestId ? { ...request, status: "approved" } : request,
        ),
        subscriptions: state.subscriptions.map((subscription) =>
          subscription.id === requestId
            ? { ...subscription, status: "active", renewsOn: "Apr 28" }
            : subscription,
        ),
        history: [
          {
            id: crypto.randomUUID(),
            title: "Guardian approved recurring request",
            amount:
              state.subscriptions.find((subscription) => subscription.id === requestId)?.amount ?? 0,
            status: "success",
            date: timestamp(),
            approvalNeeded: true,
            evidenceRef: "fil://bafy...guardian-approved",
            policy: "red",
          },
          ...state.history,
        ],
        lastResult: {
          title: "Request approved",
          body: "The recurring action is active, the teen sees the success state, and the evidence reference is pinned.",
          tone: "success",
        },
        notifications: [
          {
            id: crypto.randomUUID(),
            title: "Approval resolved",
            body: "The queued subscription was signed and released from treasury.",
            tone: "good",
            time: timestamp(),
          },
          ...state.notifications,
        ],
      }));
    }, 1800);
  },
  denyRequest: (requestId) =>
    set((state) => ({
      approvals: state.approvals.map((request) =>
        request.id === requestId ? { ...request, status: "denied" } : request,
      ),
      subscriptions: state.subscriptions.map((subscription) =>
        subscription.id === requestId ? { ...subscription, status: "denied" } : subscription,
      ),
      history: [
        {
          id: crypto.randomUUID(),
          title: "Guardian denied recurring request",
          amount: state.subscriptions.find((subscription) => subscription.id === requestId)?.amount ?? 0,
          status: "denied",
          date: timestamp(),
          approvalNeeded: true,
          evidenceRef: "fil://bafy...guardian-denied",
          policy: "blocked",
        },
        ...state.history,
      ],
      lastResult: {
        title: "Request denied",
        body: "The guardian declined this action. Clawrence can suggest lower-risk alternatives.",
        tone: "blocked",
      },
    })),
  clearResult: () => set({ lastResult: null }),
  pushNotification: (item) => set((state) => ({ notifications: [item, ...state.notifications] })),
}));
