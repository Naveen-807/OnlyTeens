import { NextRequest, NextResponse } from "next/server";

import { getOrCreatePhoneSession } from "@/lib/auth/phoneSession";
import { verifyPhoneOtp } from "@/lib/auth/twilio";
import type { UserSession } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, code, familyId } = body;

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { success: false, error: "phoneNumber and code are required" },
        { status: 400 },
      );
    }

    const verification = await verifyPhoneOtp(phoneNumber, code);
    const session = await getOrCreatePhoneSession({
      role: "guardian",
      phoneNumber: verification.to,
      verificationSid: verification.sid,
    });

    const authMethod = {
      ...session.authMethod,
      familyId: familyId || session.familyId || "",
      verificationStatus: verification.status,
    };

    const responseSession: UserSession = {
      ...session,
      familyId: familyId || session.familyId || "",
      authMethod,
      authChannel: "google",
    };

    return NextResponse.json({ success: true, session: responseSession });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
}
