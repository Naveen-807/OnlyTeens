import { NextRequest, NextResponse } from "next/server";

import { evaluateAction } from "@/lib/zama/policy";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await evaluateAction({
      familyId: body.familyId,
      amount: body.amount,
      passportLevel: body.passportLevel,
      isRecurring: body.isRecurring,
      account: body.account,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
}

