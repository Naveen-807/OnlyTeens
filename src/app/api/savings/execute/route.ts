import { NextRequest, NextResponse } from "next/server";

import { executeSavingsFlow } from "@/lib/orchestration/savingsFlow";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await executeSavingsFlow({
      session: body.session,
      familyId: body.familyId,
      teenAddress: body.teenAddress,
      guardianAddress: body.guardianAddress,
      teenName: body.teenName,
      amount: body.amount,
      isRecurring: body.isRecurring,
      interval: body.interval || "weekly",
      clawrencePublicKey: body.clawrencePublicKey,
      clawrencePkpTokenId: body.clawrencePkpTokenId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
}

