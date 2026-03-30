import "server-only";

import { keccak256, toUtf8Bytes } from "ethers";

import { sendOTP, verifyOTP, isTwilioConfigured } from "@/lib/auth/twilioAuth";
import { getSessionSigs, mintPKPWithCustomAuth } from "@/lib/lit/auth";
import { bootstrapSession } from "@/lib/auth/sessionBootstrap";
import type { Role, UserSession, AuthChannel } from "@/lib/types";

// Demo OTP store for development when Twilio is not configured
const demoOtpStore = new Map<string, { code: string; expires: number }>();

/**
 * Generate a deterministic auth method ID from phone number
 * This ensures the same phone always maps to the same PKP
 */
function generateAuthMethodId(phoneNumber: string): string {
  return keccak256(toUtf8Bytes(`proof18-phone-${phoneNumber}`));
}

/**
 * Start phone authentication - send OTP
 * Falls back to demo mode if Twilio is not configured
 */
export async function startPhoneAuth(phoneNumber: string): Promise<{
  success: boolean;
  phoneNumber: string;
  mode: "twilio" | "demo";
}> {
  // Validate phone number format
  if (!phoneNumber.startsWith("+")) {
    throw new Error("Phone number must include country code (e.g., +91...)");
  }

  if (isTwilioConfigured()) {
    // Real Twilio SMS
    const result = await sendOTP(phoneNumber);
    return {
      success: result.status === "pending",
      phoneNumber,
      mode: "twilio",
    };
  }

  // Demo mode - generate a fixed OTP for testing
  const demoCode = "123456"; // Fixed code for demo
  demoOtpStore.set(phoneNumber, {
    code: demoCode,
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes
  });
  console.log(`[DEMO MODE] OTP for ${phoneNumber}: ${demoCode}`);

  return {
    success: true,
    phoneNumber,
    mode: "demo",
  };
}

/**
 * Verify OTP code (internal helper)
 */
async function verifyOTPCode(phoneNumber: string, code: string): Promise<boolean> {
  if (isTwilioConfigured()) {
    const result = await verifyOTP(phoneNumber, code);
    return result.valid;
  }

  // Demo mode verification
  const stored = demoOtpStore.get(phoneNumber);
  if (stored && stored.expires > Date.now() && stored.code === code) {
    demoOtpStore.delete(phoneNumber);
    return true;
  }
  return false;
}

/**
 * Complete phone authentication - verify OTP and mint PKP
 */
export async function completePhoneAuth(params: {
  phoneNumber: string;
  code: string;
  role: Role;
}): Promise<{
  pkp: {
    tokenId: string;
    publicKey: string;
    ethAddress: string;
  };
  sessionSigs: any;
  role: Role;
  phoneNumber: string;
  authChannel: AuthChannel;
}> {
  // Validate phone number format
  if (!params.phoneNumber.startsWith("+")) {
    throw new Error("Phone number must include country code (e.g., +91...)");
  }

  // Verify OTP
  const verified = await verifyOTPCode(params.phoneNumber, params.code);
  if (!verified) {
    throw new Error("Invalid or expired OTP code");
  }

  // Generate deterministic auth method ID from phone number
  const authMethodId = generateAuthMethodId(params.phoneNumber);

  // Create auth method for PKP minting
  const authMethod = {
    authMethodType: 89, // Custom type for phone auth
    authMethodId: authMethodId,
    accessToken: params.phoneNumber,
  };

  // Mint PKP with custom auth
  // guardian = SignAnything (scope 1)
  // teen = PersonalSign only (scope 2)
  const pkp = await mintPKPWithCustomAuth(authMethod, params.role);

  // Get session signatures for the newly minted PKP
  const sessionSigs = await getSessionSigs(pkp.publicKey, authMethod);

  return {
    pkp: {
      tokenId: pkp.tokenId,
      publicKey: pkp.publicKey,
      ethAddress: pkp.ethAddress,
    },
    sessionSigs,
    role: params.role,
    phoneNumber: params.phoneNumber,
    authChannel: "phone",
  };
}

/**
 * Get existing PKP session for a phone number (for returning users)
 */
export async function getPhoneSession(params: {
  phoneNumber: string;
  code: string;
  pkpPublicKey: string;
}): Promise<{
  sessionSigs: any;
}> {
  const verified = await verifyOTPCode(params.phoneNumber, params.code);
  if (!verified) {
    throw new Error("Invalid or expired OTP code");
  }

  const authMethodId = generateAuthMethodId(params.phoneNumber);
  const authMethod = {
    authMethodType: 89,
    authMethodId: authMethodId,
    accessToken: params.phoneNumber,
  };

  const sessionSigs = await getSessionSigs(params.pkpPublicKey, authMethod);

  return { sessionSigs };
}

/**
 * Bootstrap a full phone session (legacy compatibility)
 */
export async function bootstrapPhoneSession(params: {
  challengeId: string;
  phoneNumber: string;
  verificationToken: string;
  role: Role;
  familyId?: string;
}): Promise<{
  session: UserSession;
  bootstrap: any;
}> {
  // For legacy compatibility - use the verificationToken as the OTP code
  // In new flow, this should use completePhoneAuth instead
  const authMethodId = generateAuthMethodId(params.phoneNumber);
  
  const authMethod = {
    authMethodType: 89,
    authMethodId: authMethodId,
    accessToken: params.phoneNumber,
  };

  const pkp = await mintPKPWithCustomAuth(authMethod, params.role);
  const sessionSigs = await getSessionSigs(pkp.publicKey, authMethod);

  const session: UserSession = {
    role: params.role,
    address: pkp.ethAddress,
    pkpPublicKey: pkp.publicKey,
    pkpTokenId: pkp.tokenId,
    familyId: params.familyId || "",
    sessionSigs,
    authMethod,
    authChannel: "phone",
    phoneNumber: params.phoneNumber,
    verificationId: params.challengeId,
  };

  const bootstrap = await bootstrapSession({
    role: params.role,
    pkpPublicKey: pkp.publicKey,
    pkpTokenId: pkp.tokenId,
    authMethod,
    address: pkp.ethAddress,
    authChannel: "phone",
    phoneNumber: params.phoneNumber,
    verificationId: params.challengeId,
  });

  return { session, bootstrap };
}
