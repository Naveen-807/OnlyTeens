import { NextRequest, NextResponse } from "next/server";

import { fail } from "@/lib/api/response";
import { bootstrapSession } from "@/lib/auth/sessionBootstrap";
import { getOrCreatePhoneSession } from "@/lib/auth/phoneSession";
import {
  getPhoneChallenge,
  markPhoneChallengeVerified,
  verifyPhoneChallenge,
} from "@/lib/auth/phoneOtpStore";
import { verifyOTP } from "@/lib/auth/twilioAuth";
import { assertPhoneAuthConfigForDemo } from "@/lib/runtime/config";

export async function POST(req: NextRequest) {
  try {
    assertPhoneAuthConfigForDemo();

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

    let verified;
    if (challenge.deliveryMode === "twilio") {
      const verification = await verifyOTP(challenge.phoneNumber, code);
      if (!verification.valid) {
        throw new Error("OTP_INVALID");
      }
      verified = markPhoneChallengeVerified(challengeId);
    } else {
      verified = verifyPhoneChallenge({ challengeId, code });
    }

    const storedSession = await getOrCreatePhoneSession({
      role: verified.role,
      phoneNumber: verified.phoneNumber,
      verificationSid: challengeId,
    });
    const familyId = verified.familyId || storedSession.familyId || "";
    const authMethod = {
      ...storedSession.authMethod,
      familyId,
      verificationStatus: "approved",
      verificationToken: `${challengeId}.${verified.verifiedAt ?? ""}.${code}`,
    };
    const bootstrap = await bootstrapSession({
      role: storedSession.role,
      pkpPublicKey: storedSession.pkpPublicKey,
      pkpTokenId: storedSession.pkpTokenId,
      pkpAddress: storedSession.pkpAddress,
      authMethod,
      address: storedSession.address,
      authChannel: "phone-otp",
      phoneNumber: storedSession.phoneNumber,
      verificationId: challengeId,
    });
    const session = {
      ...bootstrap.session,
      familyId,
      authMethod,
      authChannel: "phone-otp" as const,
      verificationId: challengeId,
    };

    return NextResponse.json({
      success: true,
      session,
      bootstrap: {
        ...bootstrap,
        session,
      },
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
