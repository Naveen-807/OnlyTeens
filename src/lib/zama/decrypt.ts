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
}> {
  const fhevm = await getFhevmInstance();

  const publicClient = createPublicClient({
    chain: SEPOLIA as any,
    transport: http(SEPOLIA.rpcUrls.default.http[0]),
  });

  const [singleHandle, recurringHandle, trustHandle] =
    (await publicClient.readContract({
      address: CONTRACTS.policy,
      abi: POLICY_ABI,
      functionName: "getGuardianPolicyView",
      args: [params.familyId as `0x${string}`],
      account: params.guardianSigner?.address,
    })) as [bigint, bigint, bigint];

  const singleCap = await fhevm.reencrypt(singleHandle, params.guardianSigner);
  const recurringCap = await fhevm.reencrypt(recurringHandle, params.guardianSigner);
  const trustThreshold = await fhevm.reencrypt(trustHandle, params.guardianSigner);

  return {
    singleActionCap: Number(singleCap),
    recurringMonthlyCap: Number(recurringCap),
    trustUnlockThreshold: Number(trustThreshold),
  };
}

