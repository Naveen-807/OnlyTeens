import "server-only";

import { CONTRACTS, SCHEDULER_ABI } from "@/lib/constants.server";
import { flowPublicClient, flowWalletClient } from "@/lib/flow/clients";

const ONE_WEEK = 604800n;
const ONE_MONTH = 2592000n;

export async function createSavingsSchedule(
  account: any,
  familyId: `0x${string}`,
  teenAddress: `0x${string}`,
  amountWei: bigint,
  label: string,
  interval: "weekly" | "monthly" = "weekly",
): Promise<{ txHash: string; scheduleId: number }> {
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

  return { txHash: hash, scheduleId: Number(count) - 1 };
}

export async function createSubscriptionSchedule(
  account: any,
  familyId: `0x${string}`,
  teenAddress: `0x${string}`,
  amountWei: bigint,
  serviceName: string,
  recipientAddress: `0x${string}`,
): Promise<{ txHash: string; scheduleId: number }> {
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

  return { txHash: hash, scheduleId: Number(count) - 1 };
}

export async function pauseSchedule(
  guardianAccount: any,
  scheduleId: number,
): Promise<string> {
  return flowWalletClient.writeContract({
    account: guardianAccount,
    address: CONTRACTS.scheduler,
    abi: SCHEDULER_ABI,
    functionName: "pauseSchedule",
    args: [BigInt(scheduleId)],
  });
}
