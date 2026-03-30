import "server-only";

import { createPublicClient, http } from "viem";

import { CONTRACTS, POLICY_ABI, SEPOLIA } from "@/lib/constants";
import { getFhevmInstance } from "@/lib/zama/client";

export async function guardianDecryptPolicy(params: {
  familyId: `0x${string}` | string;
  guardianSigner: any;
}): Promise<{
  singleActionCap: number;
  recurringMonthlyCap: number;
  trustUnlockThreshold: number;
  riskFlags: number;
}> {
  const fhevm = await getFhevmInstance();

  const publicClient = createPublicClient({
    chain: SEPOLIA as any,
    transport: http(SEPOLIA.rpcUrls.default.http[0]),
  });

  const [singleHandle, recurringHandle, trustHandle, riskFlagsHandle] =
    (await publicClient.readContract({
      address: CONTRACTS.policy,
      abi: POLICY_ABI,
      functionName: "getGuardianPolicyView",
      args: [params.familyId as `0x${string}`],
      account: params.guardianSigner?.address,
    })) as [bigint, bigint, bigint, bigint];

  const singleCap = await fhevm.reencrypt(singleHandle, params.guardianSigner);
  const recurringCap = await fhevm.reencrypt(recurringHandle, params.guardianSigner);
  const trustThreshold = await fhevm.reencrypt(trustHandle, params.guardianSigner);
  const riskFlags = await fhevm.reencrypt(riskFlagsHandle, params.guardianSigner);

  return {
    singleActionCap: Number(singleCap),
    recurringMonthlyCap: Number(recurringCap),
    trustUnlockThreshold: Number(trustThreshold),
    riskFlags: Number(riskFlags),
  };
}

export async function serverDecryptPolicy(params: {
  familyId: `0x${string}` | string;
  viewerSigner: any;
}): Promise<{
  singleActionCap: number;
  recurringMonthlyCap: number;
  trustUnlockThreshold: number;
  riskFlags: number;
}> {
  const fhevm = await getFhevmInstance();

  const publicClient = createPublicClient({
    chain: SEPOLIA as any,
    transport: http(SEPOLIA.rpcUrls.default.http[0]),
  });

  const [singleHandle, recurringHandle, trustHandle, riskFlagsHandle] =
    (await publicClient.readContract({
      address: CONTRACTS.policy,
      abi: POLICY_ABI,
      functionName: "getServerPolicyView",
      args: [params.familyId as `0x${string}`],
      account: params.viewerSigner?.address,
    })) as [bigint, bigint, bigint, bigint];

  const singleCap = await fhevm.reencrypt(singleHandle, params.viewerSigner);
  const recurringCap = await fhevm.reencrypt(recurringHandle, params.viewerSigner);
  const trustThreshold = await fhevm.reencrypt(trustHandle, params.viewerSigner);
  const riskFlags = await fhevm.reencrypt(riskFlagsHandle, params.viewerSigner);

  return {
    singleActionCap: Number(singleCap),
    recurringMonthlyCap: Number(recurringCap),
    trustUnlockThreshold: Number(trustThreshold),
    riskFlags: Number(riskFlags),
  };
}

export async function guardianDecryptLatestDecision(params: {
  familyId: `0x${string}` | string;
  guardianSigner: any;
}): Promise<{
  decision: number;
  amount: number;
  isRecurring: boolean;
  actor: string;
}> {
  const fhevm = await getFhevmInstance();

  const publicClient = createPublicClient({
    chain: SEPOLIA as any,
    transport: http(SEPOLIA.rpcUrls.default.http[0]),
  });

  const [decisionHandle, amount, isRecurring, actor] =
    (await publicClient.readContract({
      address: CONTRACTS.policy,
      abi: POLICY_ABI,
      functionName: "getGuardianLatestDecisionView",
      args: [params.familyId as `0x${string}`],
      account: params.guardianSigner?.address,
    })) as [bigint, bigint, boolean, string];

  const decision = await fhevm.reencrypt(decisionHandle, params.guardianSigner);

  return {
    decision: Number(decision),
    amount: Number(amount),
    isRecurring,
    actor,
  };
}

export async function serverDecryptLatestDecision(params: {
  familyId: `0x${string}` | string;
  viewerSigner: any;
}): Promise<{
  decision: number;
  amount: number;
  isRecurring: boolean;
  actor: string;
}> {
  const fhevm = await getFhevmInstance();

  const publicClient = createPublicClient({
    chain: SEPOLIA as any,
    transport: http(SEPOLIA.rpcUrls.default.http[0]),
  });

  const [decisionHandle, amount, isRecurring, actor] =
    (await publicClient.readContract({
      address: CONTRACTS.policy,
      abi: POLICY_ABI,
      functionName: "getServerLatestDecisionView",
      args: [params.familyId as `0x${string}`],
      account: params.viewerSigner?.address,
    })) as [bigint, bigint, boolean, string];

  const decision = await fhevm.reencrypt(decisionHandle, params.viewerSigner);

  return {
    decision: Number(decision),
    amount: Number(amount),
    isRecurring,
    actor,
  };
}
