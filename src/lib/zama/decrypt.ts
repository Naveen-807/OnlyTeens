import "server-only";

import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { CONTRACTS, POLICY_ABI, SEPOLIA } from "@/lib/constants.server";
import { getFhevmInstance } from "@/lib/zama/client";

function getGuardianDecryptSigner(passedSigner?: any) {
  if (passedSigner) return passedSigner;

  const key =
    process.env.ZAMA_EVALUATOR_PRIVATE_KEY ||
    process.env.ZAMA_PRIVATE_KEY ||
    process.env.DEPLOYER_PRIVATE_KEY;
  if (!key) {
    throw new Error("POLICY_UNAVAILABLE:Missing signer for guardian policy decryption");
  }
  return privateKeyToAccount(key as `0x${string}`);
}

export async function guardianDecryptPolicy(params: {
  familyId: `0x${string}` | string;
  guardianSigner?: any;
}): Promise<{
  singleActionCap: number;
  recurringMonthlyCap: number;
  trustUnlockThreshold: number;
}> {
  const fhevm = await getFhevmInstance();
  const guardianSigner = getGuardianDecryptSigner(params.guardianSigner);

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
      account: guardianSigner.address,
    })) as [bigint, bigint, bigint];

  const singleCap = await fhevm.reencrypt(singleHandle, guardianSigner);
  const recurringCap = await fhevm.reencrypt(recurringHandle, guardianSigner);
  const trustThreshold = await fhevm.reencrypt(trustHandle, guardianSigner);

  return {
    singleActionCap: Number(singleCap),
    recurringMonthlyCap: Number(recurringCap),
    trustUnlockThreshold: Number(trustThreshold),
  };
}
