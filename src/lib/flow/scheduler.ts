import "server-only";

import { CONTRACTS, SCHEDULER_ABI } from "@/lib/constants";
import { flowPublicClient, flowWalletClient } from "@/lib/flow/clients";
import type { SchedulerBackend } from "@/lib/types";

const ONE_WEEK = 604800n;
const ONE_MONTH = 2592000n;

export type FlowScheduleResult = {
  txHash: string;
  scheduleId: number;
  label: string;
  interval?: "weekly" | "monthly";
  backend: SchedulerBackend;
  executionSource: "flow-evm-contract" | "flow-native-scheduled";
  scheduledExecutionId?: string;
  scheduledExecutionExplorerUrl?: string;
  nextExecutionAt: string;
};

export function getFlowSchedulingRuntime(): {
  preferredSchedulerBackend: SchedulerBackend;
  nativeSchedulingConfigured: boolean;
  note: string;
} {
  const nativeSchedulingConfigured =
    process.env.FLOW_NATIVE_SCHEDULER_ENABLED === "true" &&
    process.env.FLOW_NATIVE_SCHEDULER_BACKEND === "native-explorer-verified";

  return {
    preferredSchedulerBackend: nativeSchedulingConfigured
      ? "flow-native-scheduled"
      : "evm-manual",
    nativeSchedulingConfigured,
    note: nativeSchedulingConfigured
      ? "Flow-native scheduled transactions are configured for recurring automation."
      : "Recurring automation uses the live Solidity scheduler on Flow EVM.",
  };
}

function nextExecutionIso(intervalSec: bigint): string {
  return new Date(Date.now() + Number(intervalSec) * 1000).toISOString();
}

export async function createSavingsSchedule(
  account: any,
  familyId: `0x${string}`,
  teenAddress: `0x${string}`,
  amountWei: bigint,
  label: string,
  interval: "weekly" | "monthly" = "weekly",
): Promise<FlowScheduleResult> {
  const intervalSec = interval === "weekly" ? ONE_WEEK : ONE_MONTH;

  const hash = await flowWalletClient.writeContract({
    account,
    address: CONTRACTS.scheduler,
    abi: SCHEDULER_ABI,
    functionName: "createSchedule",
    args: [
      familyId,
      teenAddress,
      amountWei,
      intervalSec,
      label,
      0,
      "0x0000000000000000000000000000000000000000" as `0x${string}`,
    ],
  });

  const count = (await flowPublicClient.readContract({
    address: CONTRACTS.scheduler,
    abi: SCHEDULER_ABI,
    functionName: "scheduleCount",
  })) as bigint;

  return {
    txHash: hash,
    scheduleId: Number(count) - 1,
    label,
    interval,
    backend: "evm-manual",
    executionSource: "flow-evm-contract",
    nextExecutionAt: nextExecutionIso(intervalSec),
  };
}

export async function createSubscriptionSchedule(
  account: any,
  familyId: `0x${string}`,
  teenAddress: `0x${string}`,
  amountWei: bigint,
  serviceName: string,
  recipientAddress: `0x${string}`,
): Promise<FlowScheduleResult> {
  const hash = await flowWalletClient.writeContract({
    account,
    address: CONTRACTS.scheduler,
    abi: SCHEDULER_ABI,
    functionName: "createSchedule",
    args: [
      familyId,
      teenAddress,
      amountWei,
      ONE_MONTH,
      serviceName,
      1,
      recipientAddress,
    ],
  });

  const count = (await flowPublicClient.readContract({
    address: CONTRACTS.scheduler,
    abi: SCHEDULER_ABI,
    functionName: "scheduleCount",
  })) as bigint;

  return {
    txHash: hash,
    scheduleId: Number(count) - 1,
    label: serviceName,
    interval: "monthly",
    backend: "evm-manual",
    executionSource: "flow-evm-contract",
    nextExecutionAt: nextExecutionIso(ONE_MONTH),
  };
}

export async function pauseSchedule(
  guardianAccount: any,
  scheduleId: number,
): Promise<string> {
  return await flowWalletClient.writeContract({
    account: guardianAccount,
    address: CONTRACTS.scheduler,
    abi: SCHEDULER_ABI,
    functionName: "pauseSchedule",
    args: [BigInt(scheduleId)],
  });
}
