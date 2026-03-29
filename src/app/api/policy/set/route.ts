import { NextRequest, NextResponse } from "next/server";

import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import { assertContractConfigForDemo } from "@/lib/runtime/config";
import { submitEncryptedPolicy } from "@/lib/zama/policy";

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

    return ok(result);
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Policy set failed", 500);
  }
}
