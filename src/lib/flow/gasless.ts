import "server-only";

import { GelatoRelay, type SponsoredCallRequest } from "@gelatonetwork/relay-sdk";
import { encodeFunctionData, type Address } from "viem";

import { FLOW_TESTNET } from "@/lib/constants";

// ═══ Gelato Relay Configuration ═══
// For sponsored/gasless transactions on Flow EVM
// Docs: https://docs.gelato.network/web3-services/relay

const GELATO_API_KEY = process.env.GELATO_API_KEY || "";

const relay = new GelatoRelay();

export type GaslessResult = {
  taskId: string;
  status: "pending" | "submitted" | "confirmed" | "failed";
  txHash?: string;
  error?: string;
};

/**
 * Check if gasless transactions are enabled (Gelato API key is configured)
 */
export function isGaslessEnabled(): boolean {
  return !!GELATO_API_KEY;
}

/**
 * Execute a contract call as a sponsored (gasless) transaction via Gelato
 * The user doesn't pay gas - Gelato's relay network sponsors it
 */
export async function sponsoredCall(params: {
  target: Address;
  data: `0x${string}`;
  user?: Address;
}): Promise<GaslessResult> {
  if (!GELATO_API_KEY) {
    throw new Error("GELATO_API_KEY not configured - gasless transactions disabled");
  }

  const request: SponsoredCallRequest = {
    chainId: BigInt(FLOW_TESTNET.id),
    target: params.target,
    data: params.data,
  };

  try {
    const response = await relay.sponsoredCall(request, GELATO_API_KEY);

    return {
      taskId: response.taskId,
      status: "submitted",
    };
  } catch (error) {
    return {
      taskId: "",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown relay error",
    };
  }
}

/**
 * Check the status of a Gelato relay task
 */
export async function getTaskStatus(taskId: string): Promise<GaslessResult> {
  try {
    const status = await relay.getTaskStatus(taskId);

    if (!status) {
      return { taskId, status: "pending" };
    }

    // Map Gelato task states to our simplified states
    const taskState = status.taskState;
    
    if (taskState === "ExecSuccess") {
      return {
        taskId,
        status: "confirmed",
        txHash: status.transactionHash,
      };
    }
    
    if (taskState === "ExecReverted" || taskState === "Cancelled") {
      return {
        taskId,
        status: "failed",
        error: status.lastCheckMessage || "Task failed or was cancelled",
      };
    }

    // Still pending (CheckPending, ExecPending, WaitingForConfirmation, etc.)
    return {
      taskId,
      status: "pending",
      txHash: status.transactionHash,
    };
  } catch (error) {
    return {
      taskId,
      status: "failed",
      error: error instanceof Error ? error.message : "Failed to get task status",
    };
  }
}

/**
 * Wait for a task to complete with polling
 */
export async function waitForTask(
  taskId: string,
  maxWaitMs: number = 60000,
  pollIntervalMs: number = 2000
): Promise<GaslessResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const result = await getTaskStatus(taskId);

    if (result.status === "confirmed" || result.status === "failed") {
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return {
    taskId,
    status: "pending",
    error: "Timeout waiting for task completion",
  };
}

// ═══ Flow-specific Gasless Helpers ═══

/**
 * Execute a gasless savings deposit
 * Teen never sees or pays gas fees
 */
export async function gaslessDepositSavings(params: {
  vaultAddress: Address;
  familyId: `0x${string}`;
  teenAddress: Address;
  amountWei: bigint;
  abi: readonly unknown[];
}): Promise<GaslessResult> {
  const data = encodeFunctionData({
    abi: params.abi as any,
    functionName: "depositSavings",
    args: [params.familyId, params.teenAddress],
  });

  // Note: For deposits with value, we'd need to use a different approach
  // (e.g., ERC20 tokens or a wrapper contract)
  // For native FLOW deposits, we use the sponsored call pattern
  return sponsoredCall({
    target: params.vaultAddress,
    data,
  });
}

/**
 * Execute a gasless passport action recording
 */
export async function gaslessRecordAction(params: {
  passportAddress: Address;
  familyId: `0x${string}`;
  teenAddress: Address;
  actionType: string;
  approved: boolean;
  abi: readonly unknown[];
}): Promise<GaslessResult> {
  const data = encodeFunctionData({
    abi: params.abi as any,
    functionName: "recordAction",
    args: [params.familyId, params.teenAddress, params.actionType, params.approved],
  });

  return sponsoredCall({
    target: params.passportAddress,
    data,
  });
}

/**
 * Execute a gasless schedule creation
 */
export async function gaslessCreateSchedule(params: {
  schedulerAddress: Address;
  familyId: `0x${string}`;
  teenAddress: Address;
  amountWei: bigint;
  intervalSeconds: bigint;
  label: string;
  scheduleType: number;
  recipient: Address;
  abi: readonly unknown[];
}): Promise<GaslessResult> {
  const data = encodeFunctionData({
    abi: params.abi as any,
    functionName: "createSchedule",
    args: [
      params.familyId,
      params.teenAddress,
      params.amountWei,
      params.intervalSeconds,
      params.label,
      params.scheduleType,
      params.recipient,
    ],
  });

  return sponsoredCall({
    target: params.schedulerAddress,
    data,
  });
}
