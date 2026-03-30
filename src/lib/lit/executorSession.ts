import "server-only";

import { getFamilyById } from "@/lib/onboarding/familyService";
import { getClawrenceAuthMethod, getSessionSigs } from "@/lib/lit/auth";
import { getPkpAccount } from "@/lib/lit/viemAccount";
import type { UserSession } from "@/lib/types";

export async function getClawrenceSession(
  familyId: string,
): Promise<UserSession> {
  const family = getFamilyById(familyId);
  if (!family || !family.active) {
    throw new Error(`FAMILY_NOT_FOUND:${familyId}`);
  }
  if (!family.clawrencePkpPublicKey || !family.litActionCid) {
    throw new Error(`EXECUTOR_NOT_CONFIGURED:${familyId}`);
  }

  const authMethod = getClawrenceAuthMethod(family.litActionCid);
  const sessionSigs = await getSessionSigs(
    family.clawrencePkpPublicKey,
    authMethod,
  );

  return {
    role: "executor",
    address: family.clawrenceAddress,
    pkpPublicKey: family.clawrencePkpPublicKey,
    pkpTokenId: family.clawrencePkpTokenId,
    familyId: family.familyId,
    sessionSigs,
    authMethod,
  };
}

export async function getClawrenceAccount(familyId: string) {
  const session = await getClawrenceSession(familyId);
  const account = await getPkpAccount(session.pkpPublicKey, session.sessionSigs);
  return { session, account };
}
