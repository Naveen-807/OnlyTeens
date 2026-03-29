import "server-only";

import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import {
  ACCESS_ABI,
  CONTRACTS,
  PASSPORT_ABI,
  POLICY_ACCESS_CONTRACT,
  SEPOLIA,
} from "@/lib/constants.server";
import { flowWalletClient, getServiceAccount } from "@/lib/flow/clients";

function ensureConfiguredContracts() {
  if (
    CONTRACTS.access === "0x0000000000000000000000000000000000000000" ||
    CONTRACTS.passport === "0x0000000000000000000000000000000000000000"
  ) {
    throw new Error("Access/Passport contracts are not configured");
  }
}

function getPolicyAccessAccount() {
  const key =
    process.env.ZAMA_EVALUATOR_PRIVATE_KEY ||
    process.env.ZAMA_PRIVATE_KEY ||
    process.env.DEPLOYER_PRIVATE_KEY;
  if (!key) {
    throw new Error("Missing ZAMA_EVALUATOR_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY");
  }
  return privateKeyToAccount(key as `0x${string}`);
}

function getPolicyAccessWalletClient() {
  return createWalletClient({
    chain: SEPOLIA,
    transport: http(SEPOLIA.rpcUrls.default.http[0]),
  });
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

export async function registerFamilyOnPolicyAccess(params: {
  familyId: `0x${string}`;
  guardianAddress: `0x${string}`;
  teenAddress: `0x${string}`;
  executorAddress: `0x${string}`;
}): Promise<{ txHash: string; explorerUrl: string }> {
  if (POLICY_ACCESS_CONTRACT === "0x0000000000000000000000000000000000000000") {
    throw new Error("POLICY_ACCESS_CONTRACT is not configured");
  }

  const account = getPolicyAccessAccount();
  const walletClient = getPolicyAccessWalletClient();

  const txHash = await walletClient.writeContract({
    account,
    address: POLICY_ACCESS_CONTRACT,
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
    explorerUrl: `${SEPOLIA.blockExplorers.default.url}/tx/${txHash}`,
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
