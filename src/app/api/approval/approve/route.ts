import { NextRequest, NextResponse } from "next/server";

import { approveRequest } from "@/lib/orchestration/approvalFlow";
import { executeApprovedSubscription } from "@/lib/orchestration/subscriptionFlow";
import { getPassport } from "@/lib/flow/passport";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, guardianNote, session } = body;

    const approval = await approveRequest(requestId, guardianNote);
    const request = approval.request;

    const passportBefore = await getPassport(
      request.familyId as `0x${string}`,
      request.teenAddress as `0x${string}`,
    );

    const serviceName =
      request.description.split(" subscription")[0] || request.description;

    const result = await executeApprovedSubscription({
      session,
      familyId: request.familyId as `0x${string}`,
      teenAddress: request.teenAddress as `0x${string}`,
      guardianAddress: session.address,
      teenName: request.teenName,
      serviceName,
      monthlyAmount: String(request.amount),
      clawrencePublicKey: session.pkpPublicKey,
      decision: request.policyDecision,
      passportBefore,
      preExplanation: request.clawrencePreExplanation,
      postExplanation: "",
      guardianApproved: true,
      guardianNote,
      approvalCid: approval.approvalCid,
    });

    return NextResponse.json({
      ...result,
      approval: {
        cid: approval.approvalCid,
        url: approval.approvalUrl,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
}

