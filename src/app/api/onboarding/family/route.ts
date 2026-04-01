import { NextRequest } from "next/server";

import { CONTRACTS, SAFE_EXECUTOR_CID } from "@/lib/constants";
import { ensureFamilyChipotleProvision } from "@/lib/lit/chipotle";
import {
  addTeenOnChain,
  createPassportOnChain,
  findFamilyIdOnChain,
  registerFamilyOnChain,
  updateExecutorOnChain,
} from "@/lib/flow/access";
import { getFlowRuntimeProfile } from "@/lib/flow/runtimeProfile";
import { getFlowWalletAccount } from "@/lib/flow/walletSession";
import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import { bindPhoneSessionToWallet } from "@/lib/auth/phoneSession";
import {
  generateFamilyId,
  getFamilyByGuardian,
  loadFamilies,
  saveFamily,
} from "@/lib/onboarding/familyService";
import { assertFamilyOnboardingConfigForDemo } from "@/lib/runtime/config";
import { isDemoStrictMode } from "@/lib/runtime/demoMode";
import { assertLiveDependency, isLiveMode } from "@/lib/runtime/liveMode";
import type { ExecutionMode, UserSession } from "@/lib/types";
import type { FamilyRecord, LinkedTeenAccount } from "@/lib/types/onboarding";
import { getAgentWallet, getVincentConfig, isVincentConfigured } from "@/lib/vincent/client";

function toAddress(value: string): `0x${string}` {
  return value as `0x${string}`;
}

function nonZeroContractsConfigured() {
  return (
    CONTRACTS.access !== "0x0000000000000000000000000000000000000000" &&
    CONTRACTS.vault !== "0x0000000000000000000000000000000000000000" &&
    CONTRACTS.scheduler !== "0x0000000000000000000000000000000000000000" &&
    CONTRACTS.passport !== "0x0000000000000000000000000000000000000000"
  );
}

async function nextFamilyId(guardianAddress: string, teenAddress: string): Promise<string> {
  const existingOnChainFamilyId = await findFamilyIdOnChain({
    guardianAddress: guardianAddress as `0x${string}`,
    teenAddress: teenAddress as `0x${string}`,
  });

  if (existingOnChainFamilyId) {
    return existingOnChainFamilyId;
  }

  const all = loadFamilies();
  for (let nonce = 0; nonce < 1000; nonce += 1) {
    const candidate = generateFamilyId(guardianAddress, teenAddress, nonce);
    if (!all[candidate]) return candidate;
  }
  throw new Error("Unable to generate familyId");
}

function getExecutionMode(params: {
  vincentWalletAddress?: string;
  chipotleLive: boolean;
}): ExecutionMode {
  if (params.vincentWalletAddress) return "vincent-live";
  return params.chipotleLive ? "chipotle-fallback" : "local-fallback";
}

function buildBoundSession(params: {
  session: UserSession;
  familyId: string;
  walletAddress: string;
  pkpPublicKey: string;
  pkpTokenId: string;
  pkpAddress: string;
  chipotleWalletId?: string;
  accountId?: string;
  groupId?: string;
  usageKeyId?: string;
  vincentWalletId?: string;
  vincentWalletAddress?: string;
  vincentAppId?: string;
  vincentAppVersion?: string;
  vincentUserAccount?: string;
  vincentJwtAuthenticated?: boolean;
}): UserSession {
  const flowRuntime = getFlowRuntimeProfile();
  return {
    ...params.session,
    address: params.walletAddress,
    pkpPublicKey: params.pkpPublicKey,
    pkpTokenId: params.pkpTokenId,
    pkpAddress: params.pkpAddress,
    familyId: params.familyId,
    walletMode: flowRuntime.walletMode,
    gasMode: flowRuntime.gasMode,
    flowNativeFeaturesUsed: flowRuntime.flowNativeFeaturesUsed,
    chipotle: {
      mode: params.groupId && params.usageKeyId ? "live" : "local",
      accountId: params.accountId,
      walletId: params.chipotleWalletId,
      groupId: params.groupId,
      usageKeyId: params.usageKeyId,
    },
    vincent: {
      mode: params.vincentWalletAddress ? "live" : "emergency-fallback",
      walletId: params.vincentWalletId,
      walletAddress: params.vincentWalletAddress,
      agentWalletAddress: params.vincentWalletAddress,
      appId: params.vincentAppId,
      appVersion: params.vincentAppVersion,
      userAccount: params.vincentUserAccount,
      jwtAuthenticated: params.vincentJwtAuthenticated,
      verificationSource: params.vincentJwtAuthenticated ? "sdk" : "none",
    },
    authMethod: {
      ...(params.session.authMethod || {}),
      familyId: params.familyId,
      metadata: {
        ...(params.session.authMethod?.metadata || {}),
        flowAddress: params.walletAddress,
        pkpAddress: params.pkpAddress,
        chipotleWalletId: params.chipotleWalletId,
      },
    },
  };
}

async function loadVincentWallet(userControllerAddress: string) {
  const config = getVincentConfig();
  if (!isVincentConfigured()) {
    assertLiveDependency(
      false,
      "LIVE_DEPENDENCY_UNAVAILABLE",
      "Vincent app configuration is required for family onboarding",
    );
    return {
      walletId: undefined,
      walletAddress: undefined,
      appId: config.appId,
      appVersion: config.appVersion,
      userAccount: undefined,
      jwtAuthenticated: false,
    };
  }

  const wallet = await getAgentWallet({ userControllerAddress, appId: config.appId });
  assertLiveDependency(
    Boolean(wallet.success && wallet.data?.address),
    "LIVE_DEPENDENCY_UNAVAILABLE",
    "Vincent live wallet is required for family onboarding",
  );
  return {
    walletId: undefined,
    walletAddress: wallet.success ? wallet.data?.address : undefined,
    appId: config.appId,
    appVersion: config.appVersion,
    userAccount: undefined,
    jwtAuthenticated: false,
  };
}

function assertLiveProvisionReady(params: {
  vincentWalletAddress?: string;
  provisionMode: "live" | "local";
  fallbackActive: boolean;
}) {
  assertLiveDependency(
    Boolean(params.vincentWalletAddress),
    "LIVE_DEPENDENCY_UNAVAILABLE",
    "Vincent live wallet is required before a family becomes active",
  );
  assertLiveDependency(
    params.provisionMode === "live" && !params.fallbackActive,
    "LIVE_SIGNER_UNAVAILABLE",
    "Chipotle family provisioning must complete in live mode without fallback",
  );
}

export async function POST(req: NextRequest) {
  try {
    assertFamilyOnboardingConfigForDemo();
    const flowRuntime = getFlowRuntimeProfile();
    const body = await req.json();
    const guardianSession = body.guardianSession as UserSession;
    const teenSession = body.teenSession as UserSession;

    if (!guardianSession || !teenSession) {
      return fail(
        "BAD_REQUEST",
        "guardianSession and teenSession are required",
        400,
      );
    }
    if (guardianSession.role !== "guardian" || teenSession.role !== "teen") {
      return fail("BAD_REQUEST", "Invalid roles for onboarding", 400);
    }

    const existing = getFamilyByGuardian(guardianSession.address);
    const litActionCid = body.litActionCid || SAFE_EXECUTOR_CID || "";
    const vincent = await loadVincentWallet(guardianSession.address);

    if (existing) {
      const alreadyLinked =
        existing.teenAddress.toLowerCase() === teenSession.address.toLowerCase() ||
        existing.linkedTeens?.some(
          (teen) =>
            teen.active &&
            (teen.teenAddress.toLowerCase() === teenSession.address.toLowerCase() ||
              teen.teenPhoneNumber === teenSession.phoneNumber),
        );

      if (alreadyLinked) {
        assertLiveDependency(
          !existing.fallbackActive &&
            existing.executionMode === "vincent-live" &&
            Boolean(existing.vincentWalletAddress),
          "LIVE_DEPENDENCY_UNAVAILABLE",
          "Existing family record is not live-ready",
        );
        const reboundGuardian = buildBoundSession({
          session: guardianSession,
          familyId: existing.familyId,
          walletAddress: existing.guardianAddress,
          pkpPublicKey: existing.guardianPkpPublicKey,
          pkpTokenId: existing.guardianPkpTokenId,
          pkpAddress: existing.guardianAddress,
          chipotleWalletId: existing.chipotleGuardianWalletId,
          accountId: existing.chipotleAccountId,
          groupId: existing.chipotleGroupId,
          usageKeyId: existing.chipotleUsageKeyId,
          vincentWalletId: existing.vincentWalletId,
          vincentWalletAddress: existing.vincentWalletAddress,
          vincentAppId: existing.vincentAppId,
          vincentAppVersion: existing.vincentAppVersion,
          vincentUserAccount: existing.vincentUserAccount,
          vincentJwtAuthenticated: existing.vincentJwtAuthenticated,
        });

        bindPhoneSessionToWallet({
          role: "guardian",
          phoneNumber: guardianSession.phoneNumber || "",
          familyId: existing.familyId,
          walletAddress: existing.guardianAddress,
          pkpPublicKey: existing.guardianPkpPublicKey,
          pkpTokenId: existing.guardianPkpTokenId,
          pkpAddress: existing.guardianAddress,
          chipotleWalletId: existing.chipotleGuardianWalletId,
        });

        return ok({ family: existing, reused: true, guardianSession: reboundGuardian });
      }

      const teenProvision = await ensureFamilyChipotleProvision({
        familyId: existing.familyId,
        guardianAddress: existing.guardianAddress,
        teenAddress: teenSession.address,
        family: existing,
        safeExecutorCid: litActionCid,
      });
      assertLiveProvisionReady({
        vincentWalletAddress: vincent.walletAddress,
        provisionMode: teenProvision.mode,
        fallbackActive: teenProvision.fallbackActive,
      });

      const linkedTeen: LinkedTeenAccount = {
        teenPhoneNumber: teenSession.phoneNumber,
        teenAddress: teenProvision.teenWallet.walletAddress,
        teenPkpPublicKey: teenProvision.teenWallet.publicKey,
        teenPkpTokenId: teenProvision.teenWallet.tokenId,
        teenChipotleWalletId: teenProvision.teenWallet.id,
        calmaAddress: teenProvision.calmaWallet.walletAddress,
        calmaPkpPublicKey: teenProvision.calmaWallet.publicKey,
        calmaPkpTokenId: teenProvision.calmaWallet.tokenId,
        calmaChipotleWalletId: teenProvision.calmaWallet.id,
        clawrenceAddress: teenProvision.clawrenceWallet.walletAddress,
        clawrencePkpPublicKey: teenProvision.clawrenceWallet.publicKey,
        clawrencePkpTokenId: teenProvision.clawrenceWallet.tokenId,
        clawrenceChipotleWalletId: teenProvision.clawrenceWallet.id,
        chipotleGroupId: teenProvision.groupId,
        chipotleUsageKeyId: teenProvision.usageKeyId,
        chipotleUsageApiKey: teenProvision.usageApiKey,
        vincentAppId: vincent.appId,
        vincentAppVersion: vincent.appVersion,
        vincentUserAccount: vincent.userAccount,
        vincentJwtAuthenticated: vincent.jwtAuthenticated,
        vincentWalletId: vincent.walletId,
        vincentWalletAddress: vincent.walletAddress,
        createdAt: new Date().toISOString(),
        active: true,
      };

      const updatedFamily: FamilyRecord = {
        ...existing,
        linkedTeens: [...(existing.linkedTeens || []), linkedTeen],
        fallbackActive: false,
        executionMode: "vincent-live",
        executionLaneModes: ["direct-flow", "agent-assisted-flow", "guardian-autopilot-flow"],
        walletMode: flowRuntime.walletMode,
        gasMode: flowRuntime.gasMode,
        flowMedium: "FLOW",
        schedulerBackend: flowRuntime.schedulerBackend,
        flowNativeFeaturesUsed: flowRuntime.flowNativeFeaturesUsed,
        guardianAutopilotEnabled: existing.guardianAutopilotEnabled || false,
        policyMode: "encrypted-live",
      };

      const onchain: Record<string, any> = {};
      if (!nonZeroContractsConfigured() || !process.env.DEPLOYER_PRIVATE_KEY) {
        if (isLiveMode() || isDemoStrictMode()) {
          throw new Error(
            "CONTRACT_MISCONFIGURED:Contracts/private key are not configured for live family bootstrap",
          );
        }
      } else {
        try {
          const guardianAccount = await getFlowWalletAccount("guardian", guardianSession.phoneNumber || "");
          onchain.teenRegistration = await addTeenOnChain({
            familyId: toAddress(updatedFamily.familyId),
            teenAddress: toAddress(linkedTeen.teenAddress),
            guardianAccount,
          });
          onchain.passportCreation = await createPassportOnChain({
            familyId: toAddress(updatedFamily.familyId),
            teenAddress: toAddress(linkedTeen.teenAddress),
          });
        } catch (e: any) {
          throw new Error(
            `LIVE_DEPENDENCY_UNAVAILABLE:${e?.message || "Onchain multi-teen bootstrap failed"}`,
          );
        }
      }

      saveFamily(updatedFamily);

      bindPhoneSessionToWallet({
        role: "guardian",
        phoneNumber: guardianSession.phoneNumber || "",
        familyId: updatedFamily.familyId,
        walletAddress: updatedFamily.guardianAddress,
        pkpPublicKey: updatedFamily.guardianPkpPublicKey,
        pkpTokenId: updatedFamily.guardianPkpTokenId,
        pkpAddress: updatedFamily.guardianAddress,
        chipotleWalletId: updatedFamily.chipotleGuardianWalletId,
      });
      bindPhoneSessionToWallet({
        role: "teen",
        phoneNumber: teenSession.phoneNumber || "",
        familyId: updatedFamily.familyId,
        walletAddress: linkedTeen.teenAddress,
        pkpPublicKey: linkedTeen.teenPkpPublicKey,
        pkpTokenId: linkedTeen.teenPkpTokenId,
        pkpAddress: linkedTeen.teenAddress,
        chipotleWalletId: linkedTeen.teenChipotleWalletId,
      });

      return ok({
        family: updatedFamily,
        onchain,
        guardianSession: buildBoundSession({
          session: guardianSession,
          familyId: updatedFamily.familyId,
          walletAddress: updatedFamily.guardianAddress,
          pkpPublicKey: updatedFamily.guardianPkpPublicKey,
          pkpTokenId: updatedFamily.guardianPkpTokenId,
          pkpAddress: updatedFamily.guardianAddress,
          chipotleWalletId: updatedFamily.chipotleGuardianWalletId,
          accountId: updatedFamily.chipotleAccountId,
          groupId: updatedFamily.chipotleGroupId,
          usageKeyId: updatedFamily.chipotleUsageKeyId,
          vincentWalletId: updatedFamily.vincentWalletId,
          vincentWalletAddress: updatedFamily.vincentWalletAddress,
          vincentAppId: updatedFamily.vincentAppId,
          vincentAppVersion: updatedFamily.vincentAppVersion,
          vincentUserAccount: updatedFamily.vincentUserAccount,
          vincentJwtAuthenticated: updatedFamily.vincentJwtAuthenticated,
        }),
        teenSession: buildBoundSession({
          session: teenSession,
          familyId: updatedFamily.familyId,
          walletAddress: linkedTeen.teenAddress,
          pkpPublicKey: linkedTeen.teenPkpPublicKey,
          pkpTokenId: linkedTeen.teenPkpTokenId,
          pkpAddress: linkedTeen.teenAddress,
          chipotleWalletId: linkedTeen.teenChipotleWalletId,
          accountId: updatedFamily.chipotleAccountId,
          groupId: linkedTeen.chipotleGroupId,
          usageKeyId: linkedTeen.chipotleUsageKeyId,
          vincentWalletId: linkedTeen.vincentWalletId,
          vincentWalletAddress: linkedTeen.vincentWalletAddress,
          vincentAppId: linkedTeen.vincentAppId,
          vincentAppVersion: linkedTeen.vincentAppVersion,
          vincentUserAccount: linkedTeen.vincentUserAccount,
          vincentJwtAuthenticated: linkedTeen.vincentJwtAuthenticated,
        }),
      });
    }

    const familyId = await nextFamilyId(guardianSession.address, teenSession.address);
    const provision = await ensureFamilyChipotleProvision({
      familyId,
      guardianAddress: guardianSession.address,
      teenAddress: teenSession.address,
      safeExecutorCid: litActionCid,
    });
    assertLiveProvisionReady({
      vincentWalletAddress: vincent.walletAddress,
      provisionMode: provision.mode,
      fallbackActive: provision.fallbackActive,
    });

    const family: FamilyRecord = {
      familyId,
      guardianPhoneNumber: guardianSession.phoneNumber,
      guardianAddress: guardianSession.address,
      guardianPkpPublicKey: guardianSession.pkpPublicKey,
      guardianPkpTokenId: guardianSession.pkpTokenId,
      teenPhoneNumber: teenSession.phoneNumber,
      teenAddress: teenSession.address,
      teenPkpPublicKey: teenSession.pkpPublicKey,
      teenPkpTokenId: teenSession.pkpTokenId,
      calmaAddress: provision.calmaWallet.walletAddress,
      calmaPkpPublicKey: provision.calmaWallet.publicKey,
      calmaPkpTokenId: provision.calmaWallet.tokenId,
      clawrenceAddress: provision.clawrenceWallet.walletAddress,
      clawrencePkpPublicKey: provision.clawrenceWallet.publicKey,
      clawrencePkpTokenId: provision.clawrenceWallet.tokenId,
      litActionCid,
      accessContract: CONTRACTS.access,
      vaultContract: CONTRACTS.vault,
      schedulerContract: CONTRACTS.scheduler,
      passportContract: CONTRACTS.passport,
      policyContract: CONTRACTS.policy,
      chipotleAccountId: provision.accountId,
      chipotleAccountApiKey: provision.accountApiKey,
      chipotleGuardianWalletId: provision.guardianWallet.id,
      chipotleTeenWalletId: provision.teenWallet.id,
      chipotleCalmaWalletId: provision.calmaWallet.id,
      chipotleClawrenceWalletId: provision.clawrenceWallet.id,
      chipotleGroupId: provision.groupId,
      chipotleUsageKeyId: provision.usageKeyId,
      chipotleUsageApiKey: provision.usageApiKey,
      vincentAppId: vincent.appId,
      vincentAppVersion: vincent.appVersion,
      vincentUserAccount: vincent.userAccount,
      vincentJwtAuthenticated: vincent.jwtAuthenticated,
      vincentWalletId: vincent.walletId,
      vincentWalletAddress: vincent.walletAddress,
      executionMode: "vincent-live",
      fallbackActive: false,
      executionLaneModes: ["direct-flow", "agent-assisted-flow", "guardian-autopilot-flow"],
      walletMode: flowRuntime.walletMode,
      gasMode: flowRuntime.gasMode,
      flowMedium: "FLOW",
      schedulerBackend: flowRuntime.schedulerBackend,
      flowNativeFeaturesUsed: flowRuntime.flowNativeFeaturesUsed,
      guardianAutopilotEnabled: false,
      policyMode: "encrypted-live",
      linkedTeens: [],
      createdAt: new Date().toISOString(),
      active: true,
    };

    const onchain: Record<string, any> = {};
    if (!nonZeroContractsConfigured() || !process.env.DEPLOYER_PRIVATE_KEY) {
      if (isLiveMode() || isDemoStrictMode()) {
        throw new Error(
          "CONTRACT_MISCONFIGURED:Contracts/private key are not configured for live family bootstrap",
        );
      }
      onchain.warning = "Contracts/private key not configured; family saved locally only";
    } else {
      try {
        onchain.familyRegistration = await registerFamilyOnChain({
          familyId: toAddress(family.familyId),
          guardianAddress: toAddress(family.guardianAddress),
          teenAddress: toAddress(family.teenAddress),
        });
        onchain.passportCreation = await createPassportOnChain({
          familyId: toAddress(family.familyId),
          teenAddress: toAddress(family.teenAddress),
        });
      } catch (e: any) {
        throw new Error(
          `LIVE_DEPENDENCY_UNAVAILABLE:${e?.message || "Onchain bootstrap failed"}`,
        );
      }
    }

    saveFamily(family);

    bindPhoneSessionToWallet({
      role: "guardian",
      phoneNumber: guardianSession.phoneNumber || "",
      familyId,
      walletAddress: family.guardianAddress,
      pkpPublicKey: family.guardianPkpPublicKey,
      pkpTokenId: family.guardianPkpTokenId,
      pkpAddress: family.guardianAddress,
      chipotleWalletId: family.chipotleGuardianWalletId,
    });
    bindPhoneSessionToWallet({
      role: "teen",
      phoneNumber: teenSession.phoneNumber || "",
      familyId,
      walletAddress: family.teenAddress,
      pkpPublicKey: family.teenPkpPublicKey,
      pkpTokenId: family.teenPkpTokenId,
      pkpAddress: family.teenAddress,
      chipotleWalletId: family.chipotleTeenWalletId,
    });

    return ok({
      family,
      onchain,
      guardianSession: buildBoundSession({
        session: guardianSession,
        familyId,
        walletAddress: family.guardianAddress,
        pkpPublicKey: family.guardianPkpPublicKey,
        pkpTokenId: family.guardianPkpTokenId,
        pkpAddress: family.guardianAddress,
        chipotleWalletId: family.chipotleGuardianWalletId,
        accountId: family.chipotleAccountId,
        groupId: family.chipotleGroupId,
        usageKeyId: family.chipotleUsageKeyId,
        vincentWalletId: family.vincentWalletId,
        vincentWalletAddress: family.vincentWalletAddress,
        vincentAppId: family.vincentAppId,
        vincentAppVersion: family.vincentAppVersion,
        vincentUserAccount: family.vincentUserAccount,
        vincentJwtAuthenticated: family.vincentJwtAuthenticated,
      }),
      teenSession: buildBoundSession({
        session: teenSession,
        familyId,
        walletAddress: family.teenAddress,
        pkpPublicKey: family.teenPkpPublicKey,
        pkpTokenId: family.teenPkpTokenId,
        pkpAddress: family.teenAddress,
        chipotleWalletId: family.chipotleTeenWalletId,
        accountId: family.chipotleAccountId,
        groupId: family.chipotleGroupId,
        usageKeyId: family.chipotleUsageKeyId,
        vincentWalletId: family.vincentWalletId,
        vincentWalletAddress: family.vincentWalletAddress,
        vincentAppId: family.vincentAppId,
        vincentAppVersion: family.vincentAppVersion,
        vincentUserAccount: family.vincentUserAccount,
        vincentJwtAuthenticated: family.vincentJwtAuthenticated,
      }),
    });
  } catch (error: any) {
    return fail(
      mapErrorToCode(error),
      error?.message || "Failed to onboard family",
      500,
    );
  }
}
