import { NextRequest } from "next/server";

import { withCalmaAliases } from "@/lib/calma/compat";
import { attachErc8004Evidence } from "@/lib/erc8004/enrich";
import { getDefiPortfolioSnapshot } from "@/lib/defi/portfolio";
import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import {
  getCachedIdempotentResult,
  setCachedIdempotentResult,
} from "@/lib/api/idempotency";
import { executeSavingsFlow } from "@/lib/orchestration/savingsFlow";
import { getFamilyDefiPolicy } from "@/lib/defi/portfolio";

function parseAmount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export async function GET(req: NextRequest) {
  try {
    const familyId = req.nextUrl.searchParams.get("familyId");
    const teenAddress = req.nextUrl.searchParams.get("teenAddress");

    if (!familyId || !teenAddress) {
      return fail("BAD_REQUEST", "familyId and teenAddress are required", 400);
    }

    const portfolio = await getDefiPortfolioSnapshot({
      familyId,
      teenAddress,
    });

    return ok({ success: true, portfolio });
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Failed to load DeFi portfolio", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idempotencyKey = (body.idempotencyKey || req.headers.get("idempotency-key")) as string | null;

    if (!body?.session || !body?.familyId || !body?.teenAddress) {
      return fail("BAD_REQUEST", "session, familyId, and teenAddress are required", 400);
    }

    const cached = getCachedIdempotentResult(idempotencyKey);
    if (cached) return ok(cached as Record<string, unknown>);

    const familyId = String(body.familyId);
    const teenAddress = String(body.teenAddress);
    const portfolio = await getDefiPortfolioSnapshot({ familyId, teenAddress });
    const policy = getFamilyDefiPolicy(familyId);

    if (!policy.enabled) {
      return fail("DEFI_DISABLED", "DeFi planning is disabled for this family", 403);
    }

    const amount = parseAmount(body.amount);
    if (amount <= 0) {
      return fail("BAD_REQUEST", "amount must be greater than zero", 400);
    }

    const spendable = parseAmount(portfolio.balances.spendable);
    const maxAllowed = (spendable * policy.maxAllocationBps) / 10000;
    if (amount > maxAllowed) {
      return fail(
        "DEFI_LIMIT_EXCEEDED",
        `DeFi amount exceeds the family allocation cap of ${policy.maxAllocationBps / 100}%`,
        403,
      );
    }

    const actionKind = asString(body.actionKind, body.goalName ? "goal" : "earn");
    const strategy = asString(body.strategy, policy.strategy) as "conservative" | "balanced" | "growth";
    const protocolLabel = asString(body.protocolLabel, portfolio.protocolLabel || policy.allowedProtocols[0] || "Flow Savings Vault");
    const goalName = asString(body.goalName, "");
    const goalTarget = asString(body.goalTarget, "");

    const result = await executeSavingsFlow({
      session: body.session,
      familyId: body.familyId,
      teenAddress: body.teenAddress,
      guardianAddress: body.guardianAddress,
      teenName: body.teenName || "Teen",
      amount: String(amount),
      isRecurring: Boolean(body.isRecurring),
      interval: body.interval === "monthly" ? "monthly" : "weekly",
      clawrencePublicKey: body.clawrencePublicKey || body.session.pkpPublicKey,
      clawrencePkpTokenId: body.clawrencePkpTokenId || body.session.pkpTokenId,
      defi: {
        actionKind: actionKind as "earn" | "goal" | "rebalance",
        strategy,
        goalName: goalName || undefined,
        goalTarget: goalTarget || undefined,
        protocolLabel,
        riskLevel: policy.riskLevel,
      },
    });

    const enriched = await attachErc8004Evidence({
      familyId: body.familyId,
      result,
      tag2: "defi-earn-plan",
      requestURI: `${process.env.CALMA_AGENT_URI_BASE || "http://localhost:3000/api"}/proof/judges?familyId=${body.familyId}`,
      feedbackURI: `${process.env.CALMA_AGENT_URI_BASE || "http://localhost:3000/api"}/agent_log.json`,
    });

    const payload = withCalmaAliases({
      ...enriched,
      portfolio: result.defi?.portfolio || portfolio,
    });

    if (idempotencyKey) setCachedIdempotentResult(idempotencyKey, payload);
    return ok(payload);
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "DeFi action failed", 500);
  }
}
