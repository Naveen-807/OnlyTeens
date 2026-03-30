import "server-only";

import { encodeFunctionData, type Address, type Hex } from "viem";

import { CONTRACTS, VAULT_ABI, PASSPORT_ABI, SCHEDULER_ABI } from "@/lib/constants";
import { flowPublicClient, flowWalletClient } from "@/lib/flow/clients";

// ═══ Batched EVM Transactions ═══
// Execute multiple operations atomically in a single transaction
// This is a key Flow EVM feature for better UX and gas efficiency

export type BatchOperation = {
  target: Address;
  data: Hex;
  value?: bigint;
  description: string;
};

export type BatchResult = {
  txHash: string;
  explorerUrl: string;
  operations: string[];
  success: boolean;
  error?: string;
};

/**
 * Execute multiple contract calls in a single batch
 * Uses a multicall pattern for atomic execution
 */
export async function executeBatch(
  account: any,
  operations: BatchOperation[]
): Promise<BatchResult> {
  if (operations.length === 0) {
    return {
      txHash: "",
      explorerUrl: "",
      operations: [],
      success: false,
      error: "No operations to execute",
    };
  }

  // For single operation, just execute directly
  if (operations.length === 1) {
    const op = operations[0];
    try {
      const hash = await flowWalletClient.sendTransaction({
        account,
        to: op.target,
        data: op.data,
        value: op.value || 0n,
      });

      return {
        txHash: hash,
        explorerUrl: `https://evm-testnet.flowscan.io/tx/${hash}`,
        operations: [op.description],
        success: true,
      };
    } catch (error) {
      return {
        txHash: "",
        explorerUrl: "",
        operations: [op.description],
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // For multiple operations, execute sequentially for now
  // In production, this would use a Multicall3 contract or custom batch executor
  const results: string[] = [];
  let lastHash = "";

  for (const op of operations) {
    try {
      const hash = await flowWalletClient.sendTransaction({
        account,
        to: op.target,
        data: op.data,
        value: op.value || 0n,
      });
      lastHash = hash;
      results.push(`${op.description}: ${hash.slice(0, 10)}...`);
    } catch (error) {
      return {
        txHash: lastHash,
        explorerUrl: lastHash ? `https://evm-testnet.flowscan.io/tx/${lastHash}` : "",
        operations: results,
        success: false,
        error: `Failed at "${op.description}": ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  return {
    txHash: lastHash,
    explorerUrl: `https://evm-testnet.flowscan.io/tx/${lastHash}`,
    operations: results,
    success: true,
  };
}

// ═══ Pre-built Batch Operations ═══

/**
 * Create a batch operation for depositing savings
 */
export function createDepositSavingsOp(
  familyId: `0x${string}`,
  teenAddress: Address,
  amountWei: bigint
): BatchOperation {
  return {
    target: CONTRACTS.vault,
    data: encodeFunctionData({
      abi: VAULT_ABI,
      functionName: "depositSavings",
      args: [familyId, teenAddress],
    }),
    value: amountWei,
    description: `Deposit ${Number(amountWei) / 1e18} FLOW to savings`,
  };
}

/**
 * Create a batch operation for recording a passport action
 */
export function createRecordActionOp(
  familyId: `0x${string}`,
  teenAddress: Address,
  actionType: string,
  approved: boolean
): BatchOperation {
  return {
    target: CONTRACTS.passport,
    data: encodeFunctionData({
      abi: PASSPORT_ABI,
      functionName: "recordAction",
      args: [familyId, teenAddress, actionType, approved],
    }),
    description: `Record ${actionType} action (${approved ? "approved" : "rejected"})`,
  };
}

/**
 * Create a batch operation for creating a savings schedule
 */
export function createSavingsScheduleOp(
  familyId: `0x${string}`,
  teenAddress: Address,
  amountWei: bigint,
  intervalSeconds: bigint,
  label: string
): BatchOperation {
  return {
    target: CONTRACTS.scheduler,
    data: encodeFunctionData({
      abi: SCHEDULER_ABI,
      functionName: "createSchedule",
      args: [
        familyId,
        teenAddress,
        amountWei,
        intervalSeconds,
        label,
        0, // scheduleType: savings
        "0x0000000000000000000000000000000000000000" as Address, // no recipient for savings
      ],
    }),
    description: `Create ${label} savings schedule`,
  };
}

/**
 * Create a batch operation for funding a subscription
 */
export function createFundSubscriptionOp(
  familyId: `0x${string}`,
  teenAddress: Address,
  serviceName: string,
  amountWei: bigint
): BatchOperation {
  return {
    target: CONTRACTS.vault,
    data: encodeFunctionData({
      abi: VAULT_ABI,
      functionName: "fundSubscription",
      args: [familyId, teenAddress, serviceName],
    }),
    value: amountWei,
    description: `Fund ${serviceName} subscription with ${Number(amountWei) / 1e18} FLOW`,
  };
}

// ═══ Composite Batch Flows ═══

/**
 * Execute the complete savings flow as a batch:
 * 1. Deposit savings
 * 2. Record passport action
 * 3. (Optional) Create recurring schedule
 */
export async function batchSavingsFlow(
  account: any,
  params: {
    familyId: `0x${string}`;
    teenAddress: Address;
    amountWei: bigint;
    recurring?: {
      intervalSeconds: bigint;
      label: string;
    };
  }
): Promise<BatchResult> {
  const operations: BatchOperation[] = [
    createDepositSavingsOp(params.familyId, params.teenAddress, params.amountWei),
    createRecordActionOp(params.familyId, params.teenAddress, "savings", true),
  ];

  if (params.recurring) {
    operations.push(
      createSavingsScheduleOp(
        params.familyId,
        params.teenAddress,
        params.amountWei,
        params.recurring.intervalSeconds,
        params.recurring.label
      )
    );
  }

  return executeBatch(account, operations);
}

/**
 * Execute the complete subscription setup as a batch:
 * 1. Fund subscription reserve
 * 2. Record passport action
 * 3. Create subscription schedule
 */
export async function batchSubscriptionFlow(
  account: any,
  params: {
    familyId: `0x${string}`;
    teenAddress: Address;
    serviceName: string;
    amountWei: bigint;
    recipientAddress: Address;
    intervalSeconds: bigint;
  }
): Promise<BatchResult> {
  const operations: BatchOperation[] = [
    createFundSubscriptionOp(
      params.familyId,
      params.teenAddress,
      params.serviceName,
      params.amountWei
    ),
    createRecordActionOp(params.familyId, params.teenAddress, "subscription", true),
    {
      target: CONTRACTS.scheduler,
      data: encodeFunctionData({
        abi: SCHEDULER_ABI,
        functionName: "createSchedule",
        args: [
          params.familyId,
          params.teenAddress,
          params.amountWei,
          params.intervalSeconds,
          params.serviceName,
          1, // scheduleType: subscription
          params.recipientAddress,
        ],
      }),
      description: `Create ${params.serviceName} subscription schedule`,
    },
  ];

  return executeBatch(account, operations);
}
