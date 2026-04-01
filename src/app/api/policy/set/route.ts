import { NextRequest, NextResponse } from "next/server";

import { getDefaultDefiPolicy } from "@/lib/defi/portfolio";
import { getFamilyById, saveFamily } from "@/lib/onboarding/familyService";
import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import { assertContractConfigForDemo } from "@/lib/runtime/config";
import { submitEncryptedPolicy } from "@/lib/zama/policy";

function normalizeProtocolList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

export async function POST(req: NextRequest) {
  try {
    assertContractConfigForDemo();
    const body = await req.json();
    if (!body.familyId || !body.teenAddress) {
      return fail("BAD_REQUEST", "familyId and teenAddress are required", 400);
    }

    const result = await submitEncryptedPolicy({
      familyId: body.familyId,
      singleActionCap: body.singleActionCap,
      recurringMonthlyCap: body.recurringMonthlyCap,
      trustUnlockThreshold: body.trustUnlockThreshold,
      riskFlags: body.riskFlags || 0,
      teenAddress: body.teenAddress,
      guardianAccount: body.guardianAccount,
    });

    const family = getFamilyById(body.familyId);
    const configuredProtocols = normalizeProtocolList(body.defiAllowedProtocols);
    const fallbackProtocols = normalizeProtocolList(body.allowedProtocols);
    const defiPolicy = {
      ...getDefaultDefiPolicy(),
      enabled: body.defiEnabled ?? true,
      strategy: body.defiStrategy || body.strategy || "balanced",
      riskLevel: body.defiRiskLevel || body.defiRisk || "low",
      allowedProtocols:
        configuredProtocols.length > 0
          ? configuredProtocols
          : fallbackProtocols.length > 0
            ? fallbackProtocols
            : getDefaultDefiPolicy().allowedProtocols,
      maxAllocationBps: Number(body.defiMaxAllocationBps || body.maxAllocationBps || 2500),
      maxSlippageBps: Number(body.defiMaxSlippageBps || body.maxSlippageBps || 100),
      allowRecurringEarn: body.defiAllowRecurringEarn ?? body.allowRecurringEarn ?? true,
    };

    if (family) {
      saveFamily({
        ...family,
        defiPolicy,
      });
    }

    return ok({
      ...result,
      defiPolicy,
    });
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Policy set failed", 500);
  }
}
