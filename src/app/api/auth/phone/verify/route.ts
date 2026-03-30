import { NextRequest, NextResponse } from "next/server";

import { fail } from "@/lib/api/response";
import { bootstrapPhoneSession } from "@/lib/auth/phoneAuth";
import { getPhoneChallenge, verifyPhoneChallenge } from "@/lib/auth/phoneOtpStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const challengeId = String(body.challengeId || "");
    const code = String(body.code || "").trim();

    if (!challengeId || !code) {
      return fail("BAD_REQUEST", "challengeId and code are required", 400);
    }

    const challenge = getPhoneChallenge(challengeId);
    if (!challenge) {
      return fail("NOT_FOUND", "OTP challenge not found", 404);
    }

    const verified = verifyPhoneChallenge({ challengeId, code });
    const { session, bootstrap } = await bootstrapPhoneSession({
      challengeId,
      phoneNumber: verified.phoneNumber,
      verificationToken: `${challengeId}.${verified.verifiedAt ?? ""}.${code}`,
      role: verified.role,
      familyId: verified.familyId,
    });

    return NextResponse.json({
      success: true,
      session,
      bootstrap,
      challengeId,
      maskedPhone: verified.maskedPhone,
      family: bootstrap.family,
      onboardingMessage: bootstrap.onboardingMessage,
    });
  } catch (error: any) {
    const message = error?.message || "Failed to verify OTP";
    const status =
      message === "OTP_INVALID"
        ? 400
        : message === "OTP_EXPIRED"
          ? 410
          : message === "OTP_LOCKED"
            ? 429
            : 500;
    return NextResponse.json(
      { success: false, error: message },
      { status },
    );
  }
}
