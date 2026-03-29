import { NextRequest, NextResponse } from "next/server";
import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import {
  getCachedIdempotentResult,
  setCachedIdempotentResult,
} from "@/lib/api/idempotency";
import { rejectRequestDurable } from "@/lib/approvals/durableApprovals";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, guardianNote } = body;
    const idempotencyKey = (body.idempotencyKey || req.headers.get("idempotency-key")) as string | null;

    if (!requestId) return fail("BAD_REQUEST", "requestId required", 400);

    const cached = getCachedIdempotentResult(idempotencyKey);
    if (cached) return ok(cached as Record<string, unknown>);

    if (!guardianNote) {
      return fail("BAD_REQUEST", "Rejection reason required", 400);
    }

    const result = await rejectRequestDurable(requestId, guardianNote);

    const response = {
      rejected: true,
      request: result.request,
      rejectionCid: result.rejectionCid,
    };

    if (idempotencyKey) setCachedIdempotentResult(idempotencyKey, response);
    return ok(response);
  } catch (error: any) {
    return fail(mapErrorToCode(error), error.message, 500);
  }
}
