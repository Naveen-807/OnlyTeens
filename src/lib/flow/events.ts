import "server-only";

import { decodeEventLog } from "viem";

import { PASSPORT_ABI, SCHEDULER_ABI, VAULT_ABI } from "@/lib/constants";
import { flowPublicClient } from "@/lib/flow/clients";
import type { ParsedFlowEvent } from "@/lib/types";

const ALL_ABIS = [...VAULT_ABI, ...SCHEDULER_ABI, ...PASSPORT_ABI];

export async function parseTransactionEvents(txHash: `0x${string}`): Promise<{
  status: string;
  blockNumber: bigint;
  gasUsed: string;
  events: ParsedFlowEvent[];
  explorerUrl: string;
}> {
  const receipt = await flowPublicClient.getTransactionReceipt({ hash: txHash });

  const events: ParsedFlowEvent[] = [];

  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: ALL_ABIS,
        data: log.data,
        topics: log.topics,
      });

      events.push({
        name: decoded.eventName,
        args: decoded.args as Record<string, any>,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
      });
    } catch {
      // ignore non-matching logs
    }
  }

  return {
    status: receipt.status,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    events,
    explorerUrl: `https://evm-testnet.flowscan.io/tx/${receipt.transactionHash}`,
  };
}

