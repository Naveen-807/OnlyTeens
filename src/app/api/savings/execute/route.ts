import { NextRequest, NextResponse } from "next/server";

import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import {
  getCachedIdempotentResult,
  setCachedIdempotentResult,
} from "@/lib/api/idempotency";
import { executeSavingsFlow } from "@/lib/orchestration/savingsFlow";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idempotencyKey = (body.idempotencyKey || req.headers.get("idempotency-key")) as string | null;

    if (!body?.session || !body?.familyId || !body?.teenAddress || !body?.amount) {
      return fail("BAD_REQUEST", "session, familyId, teenAddress, amount are required", 400);
    }

    const cached = getCachedIdempotentResult(idempotencyKey);
    if (cached) return ok(cached as Record<string, unknown>);

    const result = await executeSavingsFlow({
      session: body.session,
      familyId: body.familyId,
      teenAddress: body.teenAddress,
      guardianAddress: body.guardianAddress,
      teenName: body.teenName,
      amount: body.amount,
      isRecurring: body.isRecurring,
      interval: body.interval || "weekly",
      clawrencePublicKey: body.clawrencePublicKey,
      clawrencePkpTokenId: body.clawrencePkpTokenId,
    });

    if (idempotencyKey) setCachedIdempotentResult(idempotencyKey, result);
    return ok(result);
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Savings execution failed", 500);
  }
}
