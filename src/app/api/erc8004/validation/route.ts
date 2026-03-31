import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import {
  getCalmaValidationStatus,
  requestCalmaValidation,
} from "@/lib/erc8004/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestHash = searchParams.get("requestHash");
    if (!requestHash) {
      return fail("BAD_REQUEST", "requestHash is required", 400);
    }

    const status = await getCalmaValidationStatus(requestHash as `0x${string}`);
    return ok({ erc8004: { mode: "status", requestHash, status } });
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Failed to read validation status", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.agentId || !body.validatorAddress || !body.requestURI) {
      return fail("BAD_REQUEST", "agentId, validatorAddress, and requestURI are required", 400);
    }

    const result = await requestCalmaValidation({
      validatorAddress: body.validatorAddress as `0x${string}`,
      agentId: BigInt(body.agentId),
      requestURI: body.requestURI,
    });

    return ok({ erc8004: { mode: "request", ...result } });
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Failed to request validation", 500);
  }
}
