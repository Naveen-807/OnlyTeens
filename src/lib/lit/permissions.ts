import "server-only";

import { SAFE_EXECUTOR_CID } from "@/lib/constants";
import { loadFamilies, saveFamily } from "@/lib/onboarding/familyService";

function findFamilyByClawrenceToken(tokenId: string) {
  return Object.values(loadFamilies()).find(
    (family) => family.clawrencePkpTokenId === tokenId && family.active,
  );
}

export async function grantExecutorPermission(
  clawrencePkpTokenId: string,
): Promise<void> {
  const family = findFamilyByClawrenceToken(clawrencePkpTokenId);
  if (!family) return;
  family.litActionCid = SAFE_EXECUTOR_CID;
  saveFamily(family);
}

export async function revokeExecutorPermission(
  clawrencePkpTokenId: string,
  cidToRevoke: string,
): Promise<void> {
  const family = findFamilyByClawrenceToken(clawrencePkpTokenId);
  if (!family) return;
  if (family.litActionCid === cidToRevoke) {
    family.litActionCid = "";
    saveFamily(family);
  }
}

export async function getPermissions(pkpTokenId: string): Promise<any> {
  const family = findFamilyByClawrenceToken(pkpTokenId);
  if (!family) {
    throw new Error("CHIPOTLE_PERMISSIONS_UNAVAILABLE");
  }

  return {
    provider: "chipotle-derived",
    accountId: family.chipotleAccountId || null,
    groupId: family.chipotleGroupId || null,
    usageKeyId: family.chipotleUsageKeyId || null,
    permittedActions: family.litActionCid ? [family.litActionCid] : [],
    walletIds: [
      family.chipotleGuardianWalletId,
      family.chipotleTeenWalletId,
      family.chipotleClawrenceWalletId,
    ].filter(Boolean),
  };
}
