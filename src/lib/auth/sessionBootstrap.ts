import "server-only";

import { getPendingRequestsByFamily } from "@/lib/approvals/durableApprovals";
import { getPassport } from "@/lib/flow/passport";
import { getBalances } from "@/lib/flow/vault";
import { getFamilyByGuardian, getFamilyByTeen } from "@/lib/onboarding/familyService";
import type {
  ApprovalRequest,
  PassportState,
  Role,
  TeenBalances,
  UserSession,
} from "@/lib/types";
import type { FamilyRecord } from "@/lib/types/onboarding";

export interface BootstrapResult {
  session: UserSession;
  family: FamilyRecord | null;
  balances: TeenBalances | null;
  passport: PassportState | null;
  pendingApprovals: ApprovalRequest[];
  needsOnboarding: boolean;
  onboardingMessage?: string;
}

export async function bootstrapSession(params: {
  role: Role;
  pkpPublicKey: string;
  pkpTokenId: string;
  authMethod: any;
  address: string;
}): Promise<BootstrapResult> {
  const family =
    params.role === "guardian"
      ? getFamilyByGuardian(params.address)
      : getFamilyByTeen(params.address);

  const session: UserSession = {
    role: params.role,
    address: params.address,
    pkpPublicKey: params.pkpPublicKey,
    pkpTokenId: params.pkpTokenId,
    familyId: family?.familyId || "",
    sessionSigs: params.authMethod?.sessionSigs || null,
    authMethod: params.authMethod,
  };

  if (!family) {
    return {
      session,
      family: null,
      balances: null,
      passport: null,
      pendingApprovals: [],
      needsOnboarding: true,
      onboardingMessage:
        params.role === "guardian"
          ? "No family found. Start guardian onboarding to continue."
          : "No family found. Ask your guardian to complete onboarding first.",
    };
  }

  const familyId = family.familyId as `0x${string}`;
  const teenAddress = family.teenAddress as `0x${string}`;

  let balances: TeenBalances | null = null;
  let passport: PassportState | null = null;

  try {
    balances = await getBalances(familyId, teenAddress);
  } catch {
    // contract state may not exist yet during onboarding bootstrap
  }

  try {
    passport = await getPassport(familyId, teenAddress);
  } catch {
    // passport may not exist yet during bootstrap
  }

  return {
    session,
    family,
    balances,
    passport,
    pendingApprovals: getPendingRequestsByFamily(family.familyId),
    needsOnboarding: false,
  };
}
