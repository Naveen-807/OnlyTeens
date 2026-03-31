import "server-only";

import { parseEther } from "viem";

import { CONTRACTS } from "@/lib/constants";
import { flowWalletClient } from "@/lib/flow/clients";
import { parseTransactionEvents } from "@/lib/flow/events";
import { getPassport, recordAction } from "@/lib/flow/passport";
import { createSavingsSchedule, createSubscriptionSchedule, pauseSchedule } from "@/lib/flow/scheduler";
import { getFlowAccount } from "@/lib/lit/viemAccount";
import { addReceipt, createStoredReceipt } from "@/lib/receipts/receiptStore";
import { assertContractConfigForDemo } from "@/lib/runtime/config";
import { buildLaneMetadata } from "@/lib/runtime/lanes";
import type { FlowResult, UserSession } from "@/lib/types";
import {
  depositSavings,
  fundSubscription,
  getBalances,
  getNativeWalletBalance,
  withdrawSavings,
} from "@/lib/flow/vault";

function explorerUrl(txHash: string) {
  return `https://evm-testnet.flowscan.io/tx/${txHash}`;
}

function getHouseholdBalances(familyId: `0x${string}`, teenAddress: `0x${string}`, actorAddress: `0x${string}`) {
  return Promise.all([
    getBalances(familyId, teenAddress),
    getNativeWalletBalance(actorAddress),
  ]);
}

function whitelistedRecipientList(params: {
  guardianAddress?: string;
  teenAddress: string;
  requestRecipients?: string[];
}) {
  const envList = (process.env.FLOW_DIRECT_PAY_ALLOWLIST || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const requestList = (params.requestRecipients || [])
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(
    new Set(
      [
        ...envList,
        ...requestList,
        params.guardianAddress?.toLowerCase(),
        params.teenAddress.toLowerCase(),
      ].filter(Boolean) as string[],
    ),
  );
}

export async function executeDirectSavingsFlow(params: {
  session: UserSession;
  familyId: `0x${string}`;
  teenAddress: `0x${string}`;
  guardianAddress: `0x${string}` | string;
  amount: string;
  operation?: "deposit" | "withdraw";
  isRecurring?: boolean;
  interval?: "weekly" | "monthly";
}): Promise<FlowResult> {
  assertContractConfigForDemo();

  const operation = params.operation || "deposit";
  if (operation === "withdraw" && params.session.role !== "guardian") {
    throw new Error("DIRECT_FLOW_GUARDIAN_REQUIRED:Only guardians can withdraw savings");
  }

  const account = await getFlowAccount(params.session);
  const lane = buildLaneMetadata({
    session: params.session,
    executionLane: "direct-flow",
    policyMode: "not-applicable",
  });

  const passportBefore = await getPassport(params.familyId, params.teenAddress);
  const tx =
    operation === "withdraw"
      ? await withdrawSavings(account, params.familyId, params.teenAddress, params.amount)
      : await depositSavings(account, params.familyId, params.teenAddress, params.amount);

  const schedule =
    operation === "deposit" && params.isRecurring
      ? await createSavingsSchedule(
          account,
          params.familyId,
          params.teenAddress,
          parseEther(params.amount),
          `guardian-top-up-${params.interval || "weekly"}`,
          params.interval || "weekly",
        )
      : undefined;

  const parsed = await parseTransactionEvents(tx.txHash as `0x${string}`);
  await recordAction(account, params.familyId, params.teenAddress, "savings", true);
  const passportAfter = await getPassport(params.familyId, params.teenAddress);
  const [balances, walletBalance] = await getHouseholdBalances(
    params.familyId,
    params.teenAddress,
    account.address,
  );

  addReceipt(
    createStoredReceipt({
      type: "savings",
      familyId: params.familyId,
      teenAddress: params.teenAddress,
      description:
        operation === "withdraw"
          ? `Direct savings withdraw ${params.amount} FLOW`
          : `Direct savings ${params.isRecurring ? "top-up" : "deposit"} ${params.amount} FLOW`,
      amount: params.amount,
      currency: "FLOW",
      decision: "GREEN",
      ...lane,
      flowTxHash: tx.txHash,
      flowExplorerUrl: tx.explorerUrl,
      storachaCid: "",
      storachaUrl: "",
      flowBlockNumber: Number(parsed.blockNumber),
      flowMediumBalance: balances.spendable,
      nativeWalletBalance: walletBalance,
      passportLevel: passportAfter.level,
      passportLeveledUp: passportAfter.level > passportBefore.level,
      litActionCid: "",
      zamaContractAddress: "",
      clawrenceExplanation: "",
      schedulerBackend: schedule?.backend,
      scheduledExecutionId: schedule?.scheduledExecutionId,
      scheduledExecutionExplorerUrl: schedule?.scheduledExecutionExplorerUrl,
      nextExecutionAt: schedule?.nextExecutionAt,
      scheduleId: schedule?.scheduleId,
      scheduleTxHash: schedule?.txHash,
    }),
  );

  return {
    success: true,
    decision: "GREEN",
    requiresApproval: false,
    ...lane,
    flow: {
      txHash: tx.txHash,
      explorerUrl: tx.explorerUrl,
      events: parsed.events,
      gasUsed: parsed.gasUsed,
      blockNumber: Number(parsed.blockNumber),
    },
    balanceSnapshot: {
      ...balances,
      walletBalance,
    },
    passport: {
      oldLevel: passportBefore.level,
      newLevel: passportAfter.level,
      leveledUp: passportAfter.level > passportBefore.level,
    },
    schedule: schedule
      ? {
          txHash: schedule.txHash,
          scheduleId: schedule.scheduleId,
          label: schedule.label,
          interval: schedule.interval,
          backend: schedule.backend,
          executionSource: schedule.executionSource,
          scheduledExecutionId: schedule.scheduledExecutionId,
          scheduledExecutionExplorerUrl: schedule.scheduledExecutionExplorerUrl,
          nextExecutionAt: schedule.nextExecutionAt,
        }
      : undefined,
  };
}

export async function executeDirectPaymentFlow(params: {
  session: UserSession;
  familyId: `0x${string}`;
  teenAddress: `0x${string}`;
  guardianAddress: `0x${string}` | string;
  amount: string;
  recipientAddress: `0x${string}`;
  payeeLabel?: string;
  allowedRecipients?: string[];
}): Promise<FlowResult> {
  assertContractConfigForDemo();

  const allowlist = whitelistedRecipientList({
    guardianAddress: params.guardianAddress,
    teenAddress: params.teenAddress,
    requestRecipients: params.allowedRecipients,
  });

  if (!allowlist.includes(params.recipientAddress.toLowerCase())) {
    throw new Error("DIRECT_FLOW_PAYEE_NOT_WHITELISTED");
  }

  const account = await getFlowAccount(params.session);
  const lane = buildLaneMetadata({
    session: params.session,
    executionLane: "direct-flow",
    policyMode: "not-applicable",
  });
  const passportBefore = await getPassport(params.familyId, params.teenAddress);
  const txHash = await flowWalletClient.sendTransaction({
    account,
    to: params.recipientAddress,
    value: parseEther(params.amount),
  });
  const parsed = await parseTransactionEvents(txHash as `0x${string}`);
  await recordAction(account, params.familyId, params.teenAddress, "payment", true);
  const passportAfter = await getPassport(params.familyId, params.teenAddress);
  const [balances, walletBalance] = await getHouseholdBalances(
    params.familyId,
    params.teenAddress,
    account.address,
  );

  addReceipt(
    createStoredReceipt({
      type: "payment",
      familyId: params.familyId,
      teenAddress: params.teenAddress,
      description: `Direct pay ${params.amount} FLOW${params.payeeLabel ? ` to ${params.payeeLabel}` : ""}`,
      amount: params.amount,
      currency: "FLOW",
      decision: "GREEN",
      ...lane,
      flowTxHash: txHash,
      flowExplorerUrl: explorerUrl(txHash),
      storachaCid: "",
      storachaUrl: "",
      flowBlockNumber: Number(parsed.blockNumber),
      flowMediumBalance: balances.spendable,
      nativeWalletBalance: walletBalance,
      recipientAddress: params.recipientAddress,
      payeeLabel: params.payeeLabel,
      passportLevel: passportAfter.level,
      passportLeveledUp: passportAfter.level > passportBefore.level,
      litActionCid: "",
      zamaContractAddress: "",
      clawrenceExplanation: "",
    }),
  );

  return {
    success: true,
    decision: "GREEN",
    requiresApproval: false,
    ...lane,
    flow: {
      txHash,
      explorerUrl: explorerUrl(txHash),
      events: parsed.events,
      gasUsed: parsed.gasUsed,
      blockNumber: Number(parsed.blockNumber),
    },
    balanceSnapshot: {
      ...balances,
      walletBalance,
    },
    passport: {
      oldLevel: passportBefore.level,
      newLevel: passportAfter.level,
      leveledUp: passportAfter.level > passportBefore.level,
    },
    payee: {
      address: params.recipientAddress,
      label: params.payeeLabel,
    },
  };
}

export async function executeDirectSubscriptionFlow(params: {
  session: UserSession;
  familyId: `0x${string}`;
  teenAddress: `0x${string}`;
  guardianAddress: `0x${string}` | string;
  serviceName: string;
  amount?: string;
  recipientAddress?: `0x${string}`;
  operation?: "fund" | "cancel";
  scheduleId?: number;
}): Promise<FlowResult> {
  assertContractConfigForDemo();

  if (params.session.role !== "guardian") {
    throw new Error("DIRECT_FLOW_GUARDIAN_REQUIRED:Only guardians can manage subscription reserves directly");
  }

  const operation = params.operation || "fund";
  const account = await getFlowAccount(params.session);
  const lane = buildLaneMetadata({
    session: params.session,
    executionLane: "direct-flow",
    policyMode: "not-applicable",
  });

  const passportBefore = await getPassport(params.familyId, params.teenAddress);
  let txHash = "";
  let flowTxUrl = "";
  let schedule;

  if (operation === "cancel") {
    if (typeof params.scheduleId !== "number") {
      throw new Error("DIRECT_FLOW_SCHEDULE_REQUIRED");
    }
    txHash = await pauseSchedule(account, params.scheduleId);
    flowTxUrl = explorerUrl(txHash);
  } else {
    if (!params.amount) throw new Error("DIRECT_FLOW_AMOUNT_REQUIRED");
    const fundTx = await fundSubscription(
      account,
      params.familyId,
      params.teenAddress,
      params.serviceName,
      params.amount,
    );
    txHash = fundTx.txHash;
    flowTxUrl = fundTx.explorerUrl;
    schedule = await createSubscriptionSchedule(
      account,
      params.familyId,
      params.teenAddress,
      parseEther(params.amount),
      params.serviceName,
      params.recipientAddress ||
        ((process.env.SUBSCRIPTION_RECIPIENT_ADDRESS ||
          "0x0000000000000000000000000000000000000000") as `0x${string}`),
    );
    await recordAction(account, params.familyId, params.teenAddress, "subscription", true);
  }

  const parsed = await parseTransactionEvents(txHash as `0x${string}`);
  const passportAfter = await getPassport(params.familyId, params.teenAddress);
  const [balances, walletBalance] = await getHouseholdBalances(
    params.familyId,
    params.teenAddress,
    account.address,
  );

  addReceipt(
    createStoredReceipt({
      type: "subscription",
      familyId: params.familyId,
      teenAddress: params.teenAddress,
      description:
        operation === "cancel"
          ? `Direct subscription reserve cancel for ${params.serviceName}`
          : `Direct subscription reserve fund for ${params.serviceName}`,
      amount: params.amount || "0",
      currency: "FLOW",
      decision: "GREEN",
      ...lane,
      flowTxHash: txHash,
      flowExplorerUrl: flowTxUrl,
      storachaCid: "",
      storachaUrl: "",
      flowBlockNumber: Number(parsed.blockNumber),
      flowMediumBalance: balances.spendable,
      nativeWalletBalance: walletBalance,
      recipientAddress: params.recipientAddress,
      payeeLabel: params.serviceName,
      passportLevel: passportAfter.level,
      passportLeveledUp: passportAfter.level > passportBefore.level,
      litActionCid: "",
      zamaContractAddress: "",
      clawrenceExplanation: "",
      schedulerBackend: schedule?.backend,
      scheduledExecutionId: schedule?.scheduledExecutionId,
      scheduledExecutionExplorerUrl: schedule?.scheduledExecutionExplorerUrl,
      nextExecutionAt: schedule?.nextExecutionAt,
      scheduleId: schedule?.scheduleId ?? params.scheduleId,
      scheduleTxHash: schedule?.txHash,
    }),
  );

  return {
    success: true,
    decision: "GREEN",
    requiresApproval: false,
    ...lane,
    flow: {
      txHash,
      explorerUrl: flowTxUrl,
      events: parsed.events,
      gasUsed: parsed.gasUsed,
      blockNumber: Number(parsed.blockNumber),
    },
    balanceSnapshot: {
      ...balances,
      walletBalance,
    },
    passport: {
      oldLevel: passportBefore.level,
      newLevel: passportAfter.level,
      leveledUp: passportAfter.level > passportBefore.level,
    },
    schedule: schedule
      ? {
          txHash: schedule.txHash,
          scheduleId: schedule.scheduleId,
          label: schedule.label,
          interval: schedule.interval,
          recipientAddress: params.recipientAddress,
          backend: schedule.backend,
          executionSource: schedule.executionSource,
          scheduledExecutionId: schedule.scheduledExecutionId,
          scheduledExecutionExplorerUrl: schedule.scheduledExecutionExplorerUrl,
          nextExecutionAt: schedule.nextExecutionAt,
        }
      : params.scheduleId
        ? {
            txHash,
            scheduleId: params.scheduleId,
            label: params.serviceName,
          }
        : undefined,
  };
}
