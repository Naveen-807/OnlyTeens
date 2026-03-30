import { NextRequest, NextResponse } from "next/server";

import { CONTRACTS, SAFE_EXECUTOR_CID } from "@/lib/constants";
import { getPkpAccount } from "@/lib/lit/viemAccount";
import { mintClawrencePKP } from "@/lib/lit/auth";
import {
  generateFamilyId,
  getFamilyByGuardian,
  loadFamilies,
  saveFamily,
} from "@/lib/onboarding/familyService";
import {
  createPassportOnChain,
  registerFamilyOnChain,
  updateExecutorOnChain,
} from "@/lib/flow/access";
import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import { assertFamilyOnboardingConfigForDemo } from "@/lib/runtime/config";
import { isDemoStrictMode } from "@/lib/runtime/demoMode";
import type { UserSession } from "@/lib/types";
import type { FamilyRecord } from "@/lib/types/onboarding";

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

function nextFamilyId(guardianAddress: string, teenAddress: string): string {
  const all = loadFamilies();
  for (let nonce = 0; nonce < 1000; nonce += 1) {
    const candidate = generateFamilyId(guardianAddress, teenAddress, nonce);
    if (!all[candidate]) return candidate;
  }
  throw new Error("Unable to generate familyId");
}

export async function POST(req: NextRequest) {
  try {
    assertFamilyOnboardingConfigForDemo();
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
    if (existing) {
      if (existing.clawrenceAddress === guardianSession.address) {
        const litActionCid = existing.litActionCid || SAFE_EXECUTOR_CID || "";
        const clawrencePkp = await mintClawrencePKP(litActionCid);
        existing.clawrenceAddress = clawrencePkp.ethAddress;
        existing.clawrencePkpPublicKey = clawrencePkp.publicKey;
        existing.clawrencePkpTokenId = clawrencePkp.tokenId;
        existing.litActionCid = litActionCid;
        saveFamily(existing);

        if (
          nonZeroContractsConfigured() &&
          guardianSession.sessionSigs &&
          existing.familyId
        ) {
          const guardianAccount = await getPkpAccount(guardianSession);

          try {
            await updateExecutorOnChain({
              guardianAccount,
              familyId: toAddress(existing.familyId),
              executorAddress: toAddress(existing.clawrenceAddress),
            });
          } catch (error: any) {
            if (isDemoStrictMode()) {
              throw error;
            }
          }
        }
      }

      return ok({ family: existing, reused: true });
    }

    const familyId = nextFamilyId(guardianSession.address, teenSession.address);
    const litActionCid = body.litActionCid || SAFE_EXECUTOR_CID || "";
    const clawrencePkp = await mintClawrencePKP(litActionCid);

    const family: FamilyRecord = {
      familyId,
      guardianAddress: guardianSession.address,
      guardianPkpPublicKey: guardianSession.pkpPublicKey,
      guardianPkpTokenId: guardianSession.pkpTokenId,
      teenAddress: teenSession.address,
      teenPkpPublicKey: teenSession.pkpPublicKey,
      teenPkpTokenId: teenSession.pkpTokenId,
      clawrenceAddress: clawrencePkp.ethAddress,
      clawrencePkpPublicKey: clawrencePkp.publicKey,
      clawrencePkpTokenId: clawrencePkp.tokenId,
      litActionCid,
      accessContract: CONTRACTS.access,
      vaultContract: CONTRACTS.vault,
      schedulerContract: CONTRACTS.scheduler,
      passportContract: CONTRACTS.passport,
      policyContract: CONTRACTS.policy,
      createdAt: new Date().toISOString(),
      active: true,
    };

    saveFamily(family);

    const onchain: Record<string, any> = {};
    if (nonZeroContractsConfigured() && process.env.DEPLOYER_PRIVATE_KEY) {
      try {
        onchain.familyRegistration = await registerFamilyOnChain({
          familyId: toAddress(family.familyId),
          guardianAddress: toAddress(family.guardianAddress),
          teenAddress: toAddress(family.teenAddress),
          executorAddress: toAddress(family.clawrenceAddress),
        });
        onchain.passportCreation = await createPassportOnChain({
          familyId: toAddress(family.familyId),
          teenAddress: toAddress(family.teenAddress),
        });
      } catch (e: any) {
        onchain.warning = e?.message || "Onchain bootstrap failed";
      }
    } else {
      if (isDemoStrictMode()) {
        throw new Error(
          "MISSING_CONFIG:Contracts/private key not configured for strict demo",
        );
      }
      onchain.warning = "Contracts/private key not configured; family saved locally only";
    }

    return ok({ family, onchain });
  } catch (error: any) {
    return fail(
      mapErrorToCode(error),
      error?.message || "Failed to onboard family",
      500,
    );
  }
}
