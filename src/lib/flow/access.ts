import "server-only";

import { ACCESS_ABI, CONTRACTS, PASSPORT_ABI } from "@/lib/constants";
import { flowWalletClient, getServiceAccount } from "@/lib/flow/clients";

function ensureConfiguredContracts() {
  if (
    CONTRACTS.access === "0x0000000000000000000000000000000000000000" ||
    CONTRACTS.passport === "0x0000000000000000000000000000000000000000"
  ) {
    throw new Error("Access/Passport contracts are not configured");
  }
}

export async function registerFamilyOnChain(params: {
  familyId: `0x${string}`;
  guardianAddress: `0x${string}`;
  teenAddress: `0x${string}`;
  executorAddress: `0x${string}`;
}): Promise<{ txHash: string; explorerUrl: string }> {
  ensureConfiguredContracts();
  const account = getServiceAccount();

  const txHash = await flowWalletClient.writeContract({
    account,
    address: CONTRACTS.access,
    abi: ACCESS_ABI,
    functionName: "registerFamily",
    args: [
      params.familyId,
      params.guardianAddress,
      params.teenAddress,
      params.executorAddress,
    ],
  });

  return {
    txHash,
    explorerUrl: `https://evm-testnet.flowscan.io/tx/${txHash}`,
  };
}

export async function addTeenOnChain(params: {
  familyId: `0x${string}`;
  teenAddress: `0x${string}`;
}): Promise<{ txHash: string; explorerUrl: string }> {
  ensureConfiguredContracts();
  const account = getServiceAccount();

  const txHash = await flowWalletClient.writeContract({
    account,
    address: CONTRACTS.access,
    abi: ACCESS_ABI,
    functionName: "addTeen",
    args: [params.familyId, params.teenAddress],
  });

  return {
    txHash,
    explorerUrl: `https://evm-testnet.flowscan.io/tx/${txHash}`,
  };
}

export async function updateExecutorOnChain(params: {
  guardianAccount: any;
  familyId: `0x${string}`;
  executorAddress: `0x${string}`;
}): Promise<{ txHash: string; explorerUrl: string }> {
  ensureConfiguredContracts();

  const txHash = await flowWalletClient.writeContract({
    account: params.guardianAccount,
    address: CONTRACTS.access,
    abi: ACCESS_ABI,
    functionName: "updateExecutor",
    args: [params.familyId, params.executorAddress],
  });

  return {
    txHash,
    explorerUrl: `https://evm-testnet.flowscan.io/tx/${txHash}`,
  };
}

export async function createPassportOnChain(params: {
  familyId: `0x${string}`;
  teenAddress: `0x${string}`;
}): Promise<{ txHash: string; explorerUrl: string }> {
  ensureConfiguredContracts();
  const account = getServiceAccount();

  const txHash = await flowWalletClient.writeContract({
    account,
    address: CONTRACTS.passport,
    abi: PASSPORT_ABI,
    functionName: "createPassport",
    args: [params.familyId, params.teenAddress],
  });

  return {
    txHash,
    explorerUrl: `https://evm-testnet.flowscan.io/tx/${txHash}`,
  };
}
