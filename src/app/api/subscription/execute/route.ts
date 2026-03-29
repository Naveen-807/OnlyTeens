import { NextRequest, NextResponse } from "next/server";

import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import {
  getCachedIdempotentResult,
  setCachedIdempotentResult,
} from "@/lib/api/idempotency";
import { executeApprovedSubscription } from "@/lib/orchestration/subscriptionFlow";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idempotencyKey = (body.idempotencyKey || req.headers.get("idempotency-key")) as string | null;

    if (!body?.session || !body?.familyId || !body?.teenAddress || !body?.serviceName) {
      return fail("BAD_REQUEST", "session, familyId, teenAddress, serviceName are required", 400);
    }

    const cached = getCachedIdempotentResult(idempotencyKey);
    if (cached) return ok(cached as Record<string, unknown>);

    const result = await executeApprovedSubscription(body);
    if (idempotencyKey) await setCachedIdempotentResult(idempotencyKey, result);
    return ok(result);
  } catch (error: any) {
    return fail(
      mapErrorToCode(error),
      error?.message || "Subscription execution failed",
      500,
    );
  }
}
