import { NextRequest, NextResponse } from "next/server";

import { sendPhoneOtp } from "@/lib/auth/twilio";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "phoneNumber is required" },
        { status: 400 },
      );
    }

    const verification = await sendPhoneOtp(phoneNumber);
    return NextResponse.json({ success: true, verification });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to send OTP" },
      { status: 500 },
    );
  }
}
