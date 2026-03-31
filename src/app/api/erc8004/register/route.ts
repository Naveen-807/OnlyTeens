import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import { registerCalmaAgent, updateCalmaAgentURI } from "@/lib/erc8004/client";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const agentURI =
      body.agentURI || `${process.env.CALMA_AGENT_URI_BASE || "http://localhost:3000/api"}/agent.json`;

    if (body.agentId) {
      const result = await updateCalmaAgentURI(BigInt(body.agentId), agentURI);
      return ok({ erc8004: { mode: "update", agentURI, ...result } });
    }

    const result = await registerCalmaAgent(agentURI);
    return ok({ erc8004: { mode: "register", agentURI, ...result } });
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Failed to register Calma", 500);
  }
}
