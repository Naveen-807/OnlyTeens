import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import {
  getCachedIdempotentResult,
  setCachedIdempotentResult,
} from "@/lib/api/idempotency";
import { executeDirectSavingsFlow } from "@/lib/orchestration/directFlow";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idempotencyKey = (body.idempotencyKey ||
      req.headers.get("idempotency-key")) as string | null;

    if (!body?.session || !body?.familyId || !body?.teenAddress || !body?.amount) {
      return fail("BAD_REQUEST", "session, familyId, teenAddress, and amount are required", 400);
    }

    const cached = getCachedIdempotentResult(idempotencyKey);
    if (cached) return ok(cached as Record<string, unknown>);

    const result = await executeDirectSavingsFlow({
      session: body.session,
      familyId: body.familyId,
      teenAddress: body.teenAddress,
      guardianAddress: body.guardianAddress,
      amount: body.amount,
      operation: body.operation,
      isRecurring: body.isRecurring,
      interval: body.interval,
    });

    if (idempotencyKey) setCachedIdempotentResult(idempotencyKey, result);
    return ok(result);
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Direct savings failed", 500);
  }
}
