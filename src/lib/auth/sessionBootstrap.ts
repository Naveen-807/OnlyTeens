import "server-only";

import { getFamilyByGuardian, getFamilyByTeen } from "@/lib/onboarding/familyService";
import { getFlowRuntimeProfile } from "@/lib/flow/runtimeProfile";
import { getBalances } from "@/lib/flow/vault";
import { getPassport } from "@/lib/flow/passport";
import { getPendingRequestsByFamily } from "@/lib/approvals/durableApprovals";
import type {
  ExecutionLane,
  UserSession,
  Role,
  TeenBalances,
  PassportState,
  ApprovalRequest,
  AuthChannel,
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
  pkpAddress?: string;
  authMethod?: UserSession["authMethod"];
  address: string;
  authChannel?: AuthChannel;
  phoneNumber?: string;
  verificationId?: string;
}): Promise<BootstrapResult> {
  const flowRuntime = getFlowRuntimeProfile();

  // Step 1: Find family record
  const familyRecord =
    params.role === "guardian"
      ? getFamilyByGuardian(params.address)
      : getFamilyByTeen(params.address);

  const selectedTeen =
    params.role === "teen" && familyRecord
      ? familyRecord.teenAddress.toLowerCase() === params.address.toLowerCase()
        ? null
        : familyRecord.linkedTeens?.find(
            (teen) => teen.active && teen.teenAddress.toLowerCase() === params.address.toLowerCase(),
          ) || null
      : null;

  const family: FamilyRecord | null = familyRecord
    ? {
        ...familyRecord,
        teenAddress: selectedTeen?.teenAddress || familyRecord.teenAddress,
        teenPkpPublicKey:
          selectedTeen?.teenPkpPublicKey || familyRecord.teenPkpPublicKey,
        teenPkpTokenId: selectedTeen?.teenPkpTokenId || familyRecord.teenPkpTokenId,
        calmaAddress:
          selectedTeen?.calmaAddress || selectedTeen?.clawrenceAddress || familyRecord.calmaAddress || familyRecord.clawrenceAddress,
        calmaPkpPublicKey:
          selectedTeen?.calmaPkpPublicKey || selectedTeen?.clawrencePkpPublicKey || familyRecord.calmaPkpPublicKey || familyRecord.clawrencePkpPublicKey,
        calmaPkpTokenId:
          selectedTeen?.calmaPkpTokenId || selectedTeen?.clawrencePkpTokenId || familyRecord.calmaPkpTokenId || familyRecord.clawrencePkpTokenId,
        clawrenceAddress:
          selectedTeen?.calmaAddress || selectedTeen?.clawrenceAddress || familyRecord.calmaAddress || familyRecord.clawrenceAddress,
        clawrencePkpPublicKey:
          selectedTeen?.calmaPkpPublicKey || selectedTeen?.clawrencePkpPublicKey || familyRecord.calmaPkpPublicKey || familyRecord.clawrencePkpPublicKey,
        clawrencePkpTokenId:
          selectedTeen?.calmaPkpTokenId || selectedTeen?.clawrencePkpTokenId || familyRecord.calmaPkpTokenId || familyRecord.clawrencePkpTokenId,
        chipotleTeenWalletId:
          selectedTeen?.teenChipotleWalletId || familyRecord.chipotleTeenWalletId,
        chipotleCalmaWalletId:
          selectedTeen?.calmaChipotleWalletId || selectedTeen?.clawrenceChipotleWalletId || familyRecord.chipotleCalmaWalletId || familyRecord.chipotleClawrenceWalletId,
        chipotleClawrenceWalletId:
          selectedTeen?.calmaChipotleWalletId || selectedTeen?.clawrenceChipotleWalletId || familyRecord.chipotleCalmaWalletId || familyRecord.chipotleClawrenceWalletId,
        chipotleGroupId:
          selectedTeen?.chipotleGroupId || familyRecord.chipotleGroupId,
        chipotleUsageKeyId:
          selectedTeen?.chipotleUsageKeyId || familyRecord.chipotleUsageKeyId,
        chipotleUsageApiKey:
          selectedTeen?.chipotleUsageApiKey || familyRecord.chipotleUsageApiKey,
        vincentWalletId:
          selectedTeen?.vincentWalletId || familyRecord.vincentWalletId,
        vincentWalletAddress:
          selectedTeen?.vincentWalletAddress || familyRecord.vincentWalletAddress,
        vincentAppId: selectedTeen?.vincentAppId || familyRecord.vincentAppId,
        vincentAppVersion:
          selectedTeen?.vincentAppVersion || familyRecord.vincentAppVersion,
        vincentUserAccount:
          selectedTeen?.vincentUserAccount || familyRecord.vincentUserAccount,
        vincentJwtAuthenticated:
          selectedTeen?.vincentJwtAuthenticated || familyRecord.vincentJwtAuthenticated,
      }
    : null;
  const executionLaneModes: ExecutionLane[] =
    family?.executionLaneModes || ["direct-flow", "agent-assisted-flow", "guardian-autopilot-flow"];

  // Step 2: Build session (sessionSigs will be populated client-side via Lit)
  const session: UserSession = {
    role: params.role,
    address: params.address,
    pkpPublicKey: params.pkpPublicKey,
    pkpTokenId: params.pkpTokenId,
    pkpAddress: params.pkpAddress,
    familyId: family?.familyId || "",
    phoneNumber: params.phoneNumber || params.authMethod?.phoneNumber || params.authMethod?.metadata?.phoneNumber,
    sessionSigs: params.authMethod?.sessionSigs || null,
    authMethod: params.authMethod,
    authChannel: params.authChannel,
    verificationId: params.verificationId,
    walletMode: family?.walletMode || flowRuntime.walletMode,
    gasMode: family?.gasMode || flowRuntime.gasMode,
    flowMedium: family?.flowMedium || "FLOW",
    flowNativeFeaturesUsed:
      family?.flowNativeFeaturesUsed || flowRuntime.flowNativeFeaturesUsed,
    guardianAutopilotEnabled: family?.guardianAutopilotEnabled || false,
    chipotle: {
      mode: params.authMethod?.metadata?.chipotleWalletId ? "live" : "local",
      walletId: params.authMethod?.metadata?.chipotleWalletId,
      accountId: family?.chipotleAccountId,
      groupId: family?.chipotleGroupId,
      usageKeyId: family?.chipotleUsageKeyId,
    },
    vincent: {
      mode: family?.vincentWalletAddress ? "live" : "emergency-fallback",
      walletId: family?.vincentWalletId,
      walletAddress: family?.vincentWalletAddress,
      appId: family?.vincentAppId,
      appVersion: family?.vincentAppVersion,
      userAccount: family?.vincentUserAccount,
      jwtAuthenticated: family?.vincentJwtAuthenticated,
    },
  };

  if (family) {
    session.vincent = {
      mode: session.vincent?.mode || "emergency-fallback",
      ...session.vincent,
      agentWalletAddress: family.vincentWalletAddress,
    };
  }

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
