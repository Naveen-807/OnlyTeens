import { NextRequest, NextResponse } from "next/server";

import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import { assertContractConfigForDemo } from "@/lib/runtime/config";
import { evaluateAction } from "@/lib/zama/policy";

export async function POST(req: NextRequest) {
  try {
    assertContractConfigForDemo();
    const body = await req.json();
    if (!body.familyId || !body.teenAddress || body.amount == null || body.passportLevel == null) {
      return fail("BAD_REQUEST", "familyId, teenAddress, amount, passportLevel are required", 400);
    }

    const result = await evaluateAction({
      familyId: body.familyId,
      teenAddress: body.teenAddress,
      amount: body.amount,
      passportLevel: body.passportLevel,
      isRecurring: body.isRecurring ?? false,
      account: body.account,
    });

    return ok(result);
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Policy evaluation failed", 500);
  }
}
