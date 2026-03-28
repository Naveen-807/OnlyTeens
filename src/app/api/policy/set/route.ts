import { NextRequest, NextResponse } from "next/server";

import { submitEncryptedPolicy } from "@/lib/zama/policy";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await submitEncryptedPolicy({
      familyId: body.familyId,
      singleActionCap: body.singleActionCap,
      recurringMonthlyCap: body.recurringMonthlyCap,
      trustUnlockThreshold: body.trustUnlockThreshold,
      riskFlags: body.riskFlags || 0,
      teenAddress: body.teenAddress,
      guardianAccount: body.guardianAccount,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
}

