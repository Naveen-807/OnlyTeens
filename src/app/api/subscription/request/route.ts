import { NextRequest, NextResponse } from "next/server";

import { addPendingRequest } from "@/lib/orchestration/approvalFlow";
import { requestSubscription } from "@/lib/orchestration/subscriptionFlow";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await requestSubscription({
      session: body.session,
      familyId: body.familyId,
      teenAddress: body.teenAddress,
      guardianAddress: body.guardianAddress,
      teenName: body.teenName,
      serviceName: body.serviceName,
      monthlyAmount: body.monthlyAmount,
      clawrencePublicKey: body.clawrencePublicKey,
    });

    if (result.requiresApproval && result.approvalRequest) {
      addPendingRequest(result.approvalRequest);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
}

