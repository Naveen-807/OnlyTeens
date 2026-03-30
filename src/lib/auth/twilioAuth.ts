import "server-only";

import twilio from "twilio";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return null;
  }
  if (!twilioClient) {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

function isConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_VERIFY_SERVICE_SID);
}

/**
 * Send OTP via SMS using Twilio Verify
 * @param phoneNumber Phone number with country code (e.g., +919876543210)
 */
export async function sendOTP(phoneNumber: string): Promise<{
  status: string;
  to: string;
  channel: string;
}> {
  const client = getTwilioClient();
  if (!client || !TWILIO_VERIFY_SERVICE_SID) {
    throw new Error("TWILIO_NOT_CONFIGURED: Missing Twilio credentials");
  }

  // Validate phone number format
  if (!phoneNumber.startsWith("+")) {
    throw new Error("INVALID_PHONE: Phone number must include country code (e.g., +91...)");
  }

  const verification = await client.verify.v2
    .services(TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({
      to: phoneNumber,
      channel: "sms",
    });

  return {
    status: verification.status,
    to: verification.to,
    channel: verification.channel,
  };
}

/**
 * Verify OTP code entered by user
 * @param phoneNumber Phone number with country code
 * @param code 6-digit OTP code
 */
export async function verifyOTP(phoneNumber: string, code: string): Promise<{
  valid: boolean;
  status: string;
}> {
  const client = getTwilioClient();
  if (!client || !TWILIO_VERIFY_SERVICE_SID) {
    throw new Error("TWILIO_NOT_CONFIGURED: Missing Twilio credentials");
  }

  const verificationCheck = await client.verify.v2
    .services(TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({
      to: phoneNumber,
      code: code,
    });

  return {
    valid: verificationCheck.status === "approved",
    status: verificationCheck.status,
  };
}

export { isConfigured as isTwilioConfigured };
