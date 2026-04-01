import { NextRequest, NextResponse } from "next/server";

import { withCalmaAliases } from "@/lib/calma/compat";
import { parseIntent } from "@/lib/clawrence/intents";
import { answerQuestion, preActionExplanation } from "@/lib/clawrence/engine";
import { getPassport } from "@/lib/flow/passport";
import { getBalances } from "@/lib/flow/vault";
import { PASSPORT_LEVELS, type PassportState, type TeenBalances } from "@/lib/types";

function defaultPassportState(): PassportState {
  const nextLevel = PASSPORT_LEVELS[1];

  return {
    level: PASSPORT_LEVELS[0].level,
    levelName: PASSPORT_LEVELS[0].name,
    weeklyStreak: 0,
    totalActions: 0,
    savingsCount: 0,
    approvedSubs: 0,
    rejectedActions: 0,
    progressToNext: {
      current: 0,
      needed: nextLevel.threshold,
      remaining: nextLevel.threshold,
      nextLevelName: nextLevel.name,
      percentComplete: 0,
    },
  };
}

function defaultBalances(): TeenBalances {
  return {
    savings: "0",
    subscriptionReserve: "0",
    spendable: "0",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      familyId,
      teenAddress,
      teenName,
      cachedPassport,
      cachedBalances,
    } = body;

    const intent = parseIntent(message);

    const [passportResult, balancesResult] = await Promise.allSettled([
      getPassport(familyId, teenAddress),
      getBalances(familyId, teenAddress),
    ]);

    const passport =
      passportResult.status === "fulfilled"
        ? passportResult.value
        : cachedPassport || defaultPassportState();
    const balances =
      balancesResult.status === "fulfilled"
        ? balancesResult.value
        : cachedBalances || defaultBalances();

    if (passportResult.status === "rejected" || balancesResult.status === "rejected") {
      console.warn("[api/chat] Using cached or fallback family context", {
        passportSource:
          passportResult.status === "fulfilled"
            ? "live"
            : cachedPassport
              ? "cached"
              : "default",
        balancesSource:
          balancesResult.status === "fulfilled"
            ? "live"
            : cachedBalances
              ? "cached"
              : "default",
      });
    }

    if (
      intent.type === "question" ||
      intent.type === "status" ||
      intent.type === "portfolio" ||
      intent.type === "unknown"
    ) {
      const answer = await answerQuestion({
        teenName,
        question: message,
        passportLevel: passport.level,
        savingsBalance: balances.savings,
        subscriptionReserve: balances.subscriptionReserve,
      });

      return NextResponse.json({
        type: "answer",
        explanation: answer,
        calma: { explanation: answer },
        intent,
        passport,
        balances,
      });
    }

    if (
      intent.type === "savings" ||
      intent.type === "subscription" ||
      intent.type === "payment" ||
      intent.type === "earn" ||
      intent.type === "goal" ||
      intent.type === "rebalance"
    ) {
      const explanation = await preActionExplanation({
        teenName,
        action: intent.type,
        description: intent.description,
        amount: intent.amount || 0,
        currency: intent.currency,
        isRecurring: intent.isRecurring,
        passportLevel: passport.level,
        passportStreak: passport.weeklyStreak,
      });

      return NextResponse.json({
        type: "action_preview",
        explanation,
        calma: { explanation },
        intent,
        passport,
        balances,
      });
    }

    return NextResponse.json({
      type: "unknown",
      explanation:
        "I am not sure what you mean. Try: 'save 500 FLOW weekly' or 'subscribe to Spotify for 12 FLOW'",
      calma: {
        explanation:
          "I am not sure what you mean. Try: 'save 500 FLOW weekly' or 'subscribe to Spotify for 12 FLOW'",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      withCalmaAliases({ type: "error", error: error?.message }),
      { status: 500 },
    );
  }
}
