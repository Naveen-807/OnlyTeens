import { NextRequest, NextResponse } from "next/server";

import { executeApprovedSubscription } from "@/lib/orchestration/subscriptionFlow";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await executeApprovedSubscription(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
}

