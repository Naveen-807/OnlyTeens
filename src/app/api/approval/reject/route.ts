import { NextRequest, NextResponse } from "next/server";

import { rejectRequest } from "@/lib/orchestration/approvalFlow";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, guardianNote } = body;

    const result = await rejectRequest(requestId, guardianNote);

    return NextResponse.json({
      success: true,
      rejected: true,
      request: result.request,
      rejectionCid: result.rejectionCid,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
}

