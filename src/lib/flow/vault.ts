import "server-only";

import { formatEther, parseEther } from "viem";

import { CONTRACTS, VAULT_ABI } from "@/lib/constants";
import { flowPublicClient, flowWalletClient } from "@/lib/flow/clients";
import type { TeenBalances } from "@/lib/types";

export async function depositSavings(
  account: any,
  familyId: `0x${string}`,
  teenAddress: `0x${string}`,
  amountFlow: string,
): Promise<{ txHash: string; explorerUrl: string }> {
  const hash = await flowWalletClient.writeContract({
    account,
    address: CONTRACTS.vault,
    abi: VAULT_ABI,
    functionName: "depositSavings",
    args: [familyId, teenAddress],
    value: parseEther(amountFlow),
  });

  return {
    txHash: hash,
    explorerUrl: `https://evm-testnet.flowscan.io/tx/${hash}`,
  };
}

export async function fundSubscription(
  account: any,
  familyId: `0x${string}`,
  teenAddress: `0x${string}`,
  serviceName: string,
  amountFlow: string,
): Promise<{ txHash: string; explorerUrl: string }> {
  const hash = await flowWalletClient.writeContract({
    account,
    address: CONTRACTS.vault,
    abi: VAULT_ABI,
    functionName: "fundSubscription",
    args: [familyId, teenAddress, serviceName],
    value: parseEther(amountFlow),
  });

  return {
    txHash: hash,
    explorerUrl: `https://evm-testnet.flowscan.io/tx/${hash}`,
  };
}

export async function getBalances(
  familyId: `0x${string}`,
  teenAddress: `0x${string}`,
): Promise<TeenBalances> {
  const [savings, reserve] = (await flowPublicClient.readContract({
    address: CONTRACTS.vault,
    abi: VAULT_ABI,
    functionName: "getBalances",
    args: [familyId, teenAddress],
  })) as [bigint, bigint];

  return {
    savings: formatEther(savings),
    subscriptionReserve: formatEther(reserve),
    spendable: formatEther(savings + reserve),
  };
}

