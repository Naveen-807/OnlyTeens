import "server-only";

import { getFamilyByGuardian, getFamilyByTeen } from "@/lib/onboarding/familyService";
import { getBalances } from "@/lib/flow/vault";
import { getPassport } from "@/lib/flow/passport";
import { getPendingRequestsByFamily } from "@/lib/approvals/durableApprovals";
import type { UserSession, Role, TeenBalances, PassportState, ApprovalRequest } from "@/lib/types";

export interface BootstrapResult {
  session: UserSession;
  family: any | null;
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
  // Step 1: Find family record
  const family =
    params.role === "guardian"
      ? getFamilyByGuardian(params.address)
      : getFamilyByTeen(params.address);

  // Step 2: Build session (sessionSigs will be populated client-side via Lit)
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
          ? "No family found. Create family onboarding to continue."
          : "No family found. Ask your guardian to complete onboarding.",
    };
  }

  // Step 3: Load current on-chain state
  const familyId = family.familyId as `0x${string}`;
  const teenAddress = family.teenAddress as `0x${string}`;

  let balances: TeenBalances | null = null;
  let passport: PassportState | null = null;

  try {
    const raw = await getBalances(familyId, teenAddress);
    balances = raw;
  } catch {
    /* contract may not have data yet */
  }

  try {
    passport = await getPassport(familyId, teenAddress);
  } catch {
    /* passport may not exist yet */
  }

  // Step 4: Load pending approvals from durable store
  const pendingApprovals = getPendingRequestsByFamily(family.familyId);

  return {
    session,
    family,
    balances,
    passport,
    pendingApprovals,
    needsOnboarding: false,
  };
}
