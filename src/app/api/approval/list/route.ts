import { NextRequest, NextResponse } from "next/server";

import { getPendingRequests } from "@/lib/orchestration/approvalFlow";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const familyId = searchParams.get("familyId");
    if (!familyId) {
      return NextResponse.json({ approvals: [] });
    }

    return NextResponse.json({ approvals: getPendingRequests(familyId) });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
}

