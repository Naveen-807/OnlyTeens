import { NextRequest, NextResponse } from "next/server";

import { createPhoneChallenge } from "@/lib/auth/phoneOtpStore";
import { startPhoneAuth } from "@/lib/auth/phoneAuth";
import { isTwilioConfigured } from "@/lib/auth/twilioAuth";
import { fail } from "@/lib/api/response";
import { isDemoStrictMode } from "@/lib/runtime/demoMode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phoneNumber = String(body.phoneNumber || "").trim();
    const role = body.role;

    if (!phoneNumber || (role !== "guardian" && role !== "teen")) {
      return fail("BAD_REQUEST", "phoneNumber and role are required", 400);
    }

    // Validate phone number format
    if (!phoneNumber.startsWith("+")) {
      return fail(
        "BAD_REQUEST",
        "Phone number must include country code (e.g., +91...)",
        400
      );
    }

    // Try Twilio first if configured
    if (isTwilioConfigured()) {
      try {
        const result = await startPhoneAuth(phoneNumber);
        
        // Also create a local challenge for tracking
        const challenge = createPhoneChallenge({
          phoneNumber,
          role,
          familyId: body.familyId ? String(body.familyId) : undefined,
          deliveryMode: "twilio",
        });

        return NextResponse.json({
          success: result.success,
          challengeId: challenge.challengeId,
          maskedPhone: challenge.maskedPhone,
          expiresAt: challenge.expiresAt,
          delivery: "sms",
          mode: "twilio",
        });
      } catch (twilioError: any) {
        console.warn("[Phone Auth] Twilio failed, falling back to demo:", twilioError.message);
        // Fall through to demo mode
      }
    }

    // Demo mode fallback
    const challenge = createPhoneChallenge({
      phoneNumber,
      role,
      familyId: body.familyId ? String(body.familyId) : undefined,
      deliveryMode: "demo",
    });

    return NextResponse.json({
      success: true,
      challengeId: challenge.challengeId,
      maskedPhone: challenge.maskedPhone,
      expiresAt: challenge.expiresAt,
      delivery: "demo-console",
      mode: "demo",
      demoCode: isDemoStrictMode() ? undefined : challenge.demoCode,
      message: isDemoStrictMode()
        ? "OTP sent (check server console)"
        : `Demo mode: Use code ${challenge.demoCode}`,
    });
  } catch (error: any) {
    console.error("[Phone Auth Send] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}
