import "server-only";

type TwilioVerificationResponse = {
  sid?: string;
  status?: string;
  valid?: boolean;
  to?: string;
  channel?: string;
  message?: string;
  code?: number;
  more_info?: string;
  error_message?: string;
};

function requireTwilioEnv() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  const useApiKeyAuth = process.env.TWILIO_USE_API_KEY_AUTH === "true";

  if (!verifyServiceSid) {
    throw new Error("MISSING_CONFIG:TWILIO_VERIFY_SERVICE_SID is required");
  }

  if (!useApiKeyAuth && accountSid && authToken) {
    return {
      verifyServiceSid,
      authMode: "account" as const,
      authHeader: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    };
  }

  if (apiKeySid && apiKeySecret) {
    return {
      verifyServiceSid,
      authMode: "api_key" as const,
      authHeader: `Basic ${Buffer.from(`${apiKeySid}:${apiKeySecret}`).toString("base64")}`,
    };
  }

  if (accountSid && authToken) {
    return {
      verifyServiceSid,
      authMode: "account" as const,
      authHeader: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    };
  }

  if (!apiKeySid || !apiKeySecret) {
    throw new Error(
      "MISSING_CONFIG:Provide either TWILIO_API_KEY_SID/TWILIO_API_KEY_SECRET or TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN",
    );
  }
  return {
    verifyServiceSid,
    authMode: "api_key" as const,
    authHeader: `Basic ${Buffer.from(`${apiKeySid}:${apiKeySecret}`).toString("base64")}`,
  };
}

function normalizePhoneNumber(phoneNumber: string): string {
  const trimmed = phoneNumber.trim();
  if (!trimmed) {
    throw new Error("Phone number is required");
  }

  const compact = trimmed.replace(/[^\d+]/g, "");
  if (!compact.startsWith("+")) {
    throw new Error("Phone number must include country code, e.g. +14155552671");
  }

  if (compact.length < 8) {
    throw new Error("Phone number is too short");
  }

  return compact;
}

function twilioHeaders(authHeader: string) {
  return {
    Authorization: authHeader,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

function twilioErrorMessage(
  action: "send" | "verify",
  response: Response,
  data: TwilioVerificationResponse,
  verifyServiceSid: string,
  authMode: "account" | "api_key",
) {
  const details = [
    data.message || data.error_message,
    data.code ? `code ${data.code}` : "",
    data.more_info ? `more_info ${data.more_info}` : "",
    `service ${verifyServiceSid}`,
    `auth ${authMode}`,
    `status ${response.status}`,
  ]
    .filter(Boolean)
    .join(" | ");

  if (response.status === 404) {
    return new Error(
      `Twilio Verify service not found or not accessible while trying to ${action} OTP (${details})`,
    );
  }

  return new Error(
    data.error_message ||
      data.message ||
      `Twilio Verify failed to ${action} code (${response.status})`,
  );
}

export function normalizeVerifiedPhone(phoneNumber: string): string {
  return normalizePhoneNumber(phoneNumber);
}

export async function sendPhoneOtp(phoneNumber: string) {
  const { verifyServiceSid, authHeader, authMode } = requireTwilioEnv();
  const to = normalizePhoneNumber(phoneNumber);

  const body = new URLSearchParams({
    To: to,
    Channel: "sms",
  });

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`,
    {
      method: "POST",
      headers: twilioHeaders(authHeader),
      body,
    },
  );

  const data = (await response.json()) as TwilioVerificationResponse;
  if (!response.ok) {
    throw twilioErrorMessage("send", response, data, verifyServiceSid, authMode);
  }

  return {
    sid: data.sid || "",
    status: data.status || "pending",
    to,
    channel: data.channel || "sms",
  };
}

export async function verifyPhoneOtp(phoneNumber: string, code: string) {
  const { verifyServiceSid, authHeader, authMode } = requireTwilioEnv();
  const to = normalizePhoneNumber(phoneNumber);
  const otp = code.trim();

  if (!otp) {
    throw new Error("OTP code is required");
  }

  const body = new URLSearchParams({
    To: to,
    Code: otp,
  });

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`,
    {
      method: "POST",
      headers: twilioHeaders(authHeader),
      body,
    },
  );

  const data = (await response.json()) as TwilioVerificationResponse;
  if (!response.ok) {
    throw twilioErrorMessage("verify", response, data, verifyServiceSid, authMode);
  }

  if (data.status !== "approved" && !data.valid) {
    throw new Error("OTP verification failed");
  }

  return {
    sid: data.sid || "",
    status: data.status || "approved",
    to,
  };
}
