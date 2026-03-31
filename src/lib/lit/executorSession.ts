import "server-only";

import { getServiceAccount } from "@/lib/flow/clients";
import { getFamilyById } from "@/lib/onboarding/familyService";
import type { UserSession } from "@/lib/types";

export async function getClawrenceSession(
  familyId: string,
  teenAddress?: `0x${string}`,
): Promise<UserSession> {
  const family = getFamilyById(familyId);
  if (!family || !family.active) {
    throw new Error(`FAMILY_NOT_FOUND:${familyId}`);
  }
  const selectedTeen =
    teenAddress && family.teenAddress.toLowerCase() !== teenAddress.toLowerCase()
      ? family.linkedTeens?.find(
          (teen) => teen.active && teen.teenAddress.toLowerCase() === teenAddress.toLowerCase(),
        )
      : null;

  const clawrenceAddress =
    selectedTeen?.calmaAddress ||
    selectedTeen?.clawrenceAddress ||
    family.calmaAddress ||
    family.clawrenceAddress;
  const clawrencePkpPublicKey =
    selectedTeen?.calmaPkpPublicKey ||
    selectedTeen?.clawrencePkpPublicKey ||
    family.calmaPkpPublicKey ||
    family.clawrencePkpPublicKey;
  const clawrencePkpTokenId =
    selectedTeen?.calmaPkpTokenId ||
    selectedTeen?.clawrencePkpTokenId ||
    family.calmaPkpTokenId ||
    family.clawrencePkpTokenId;
  const chipotleWalletId =
    selectedTeen?.calmaChipotleWalletId ||
    selectedTeen?.clawrenceChipotleWalletId ||
    family.chipotleCalmaWalletId ||
    family.chipotleClawrenceWalletId;
  const chipotleGroupId = selectedTeen?.chipotleGroupId || family.chipotleGroupId;
  const chipotleUsageKeyId =
    selectedTeen?.chipotleUsageKeyId || family.chipotleUsageKeyId;
  const vincentWalletId = selectedTeen?.vincentWalletId || family.vincentWalletId;
  const vincentWalletAddress =
    selectedTeen?.vincentWalletAddress || family.vincentWalletAddress;

  if (!clawrencePkpPublicKey || !family.litActionCid) {
    throw new Error(`EXECUTOR_NOT_CONFIGURED:${familyId}`);
  }

  return {
    role: "executor",
    address: clawrenceAddress,
    pkpPublicKey: clawrencePkpPublicKey,
    pkpTokenId: clawrencePkpTokenId,
    familyId: family.familyId,
    chipotle: {
      mode: (selectedTeen?.chipotleUsageApiKey || family.chipotleUsageApiKey)
        ? "live"
        : "local",
      accountId: family.chipotleAccountId,
      walletId: chipotleWalletId,
      groupId: chipotleGroupId,
      usageKeyId: chipotleUsageKeyId,
    },
    vincent: {
      mode: vincentWalletAddress ? "live" : "emergency-fallback",
      walletId: vincentWalletId,
      walletAddress: vincentWalletAddress,
      appId: family.vincentAppId,
      appVersion: family.vincentAppVersion,
      userAccount: family.vincentUserAccount,
      jwtAuthenticated: family.vincentJwtAuthenticated,
    },
  };
}

export async function getClawrenceAccount(
  familyId: string,
  teenAddress?: `0x${string}`,
) {
  const session = await getClawrenceSession(familyId, teenAddress);
  const account = getServiceAccount();
  return { session, account };
}
