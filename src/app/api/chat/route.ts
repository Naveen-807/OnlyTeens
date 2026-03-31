import { NextRequest, NextResponse } from "next/server";

import { withCalmaAliases } from "@/lib/calma/compat";
import { parseIntent } from "@/lib/clawrence/intents";
import { answerQuestion, preActionExplanation } from "@/lib/clawrence/engine";
import { getPassport } from "@/lib/flow/passport";
import { getBalances } from "@/lib/flow/vault";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, familyId, teenAddress, teenName } = body;

    const intent = parseIntent(message);

    const passport = await getPassport(familyId, teenAddress);
    const balances = await getBalances(familyId, teenAddress);

    if (
      intent.type === "question" ||
      intent.type === "status" ||
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
      intent.type === "payment"
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
        "I am not sure what you mean. Try: 'save ₹500 weekly' or 'subscribe to Spotify for ₹119'",
      calma: {
        explanation:
          "I am not sure what you mean. Try: 'save ₹500 weekly' or 'subscribe to Spotify for ₹119'",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      withCalmaAliases({ type: "error", error: error?.message }),
      { status: 500 },
    );
  }
}
