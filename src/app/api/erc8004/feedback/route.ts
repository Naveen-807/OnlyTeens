import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import { giveCalmaFeedback } from "@/lib/erc8004/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.agentId) {
      return fail("BAD_REQUEST", "agentId is required", 400);
    }

    const result = await giveCalmaFeedback({
      agentId: BigInt(body.agentId),
      value: Number(body.value ?? 100),
      tag1: body.tag1,
      tag2: body.tag2,
      endpoint: body.endpoint,
      feedbackURI: body.feedbackURI,
    });

    return ok({ erc8004: { mode: "feedback", ...result } });
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Failed to write feedback", 500);
  }
}
