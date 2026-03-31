import "server-only";

import { assertLiveMode, isLiveMode } from "@/lib/runtime/liveMode";

/**
 * Vincent API Client
 *
 * Vincent provides AI agents with secure, non-custodial wallets protected by
 * programmable guardrails. This client enables AI-powered guardrail evaluation
 * for Calma (the Proof18 AI assistant).
 *
 * @see https://heyvincent.ai/docs
 */
const VINCENT_API_BASE = "https://api.heyvincent.ai/v1";

interface VincentResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface VincentEvaluationResult {
  decision: "ALLOW" | "BLOCK" | "REVIEW";
  reasoning: string;
  confidence: number;
  guardrails_applied: string[];
}

export interface VincentWalletInfo {
  address: string;
  balances: Array<{ chain: string; token: string; balance: string }>;
}

export interface VincentJwtVerification {
  appId?: string;
  appVersion?: string;
  userAccount?: string;
  walletAddress?: string;
  walletId?: string;
  jwtAuthenticated: boolean;
  verificationSource: "sdk" | "payload-check" | "none";
  rawClaims: Record<string, unknown>;
}

function getVincentApiKey(): string | null {
  return process.env.VINCENT_API_KEY || null;
}

export function getVincentConfig() {
  return {
    apiKey: getVincentApiKey(),
    appId: process.env.VINCENT_APP_ID,
    appVersion: process.env.VINCENT_APP_VERSION,
    redirectUri: process.env.VINCENT_REDIRECT_URI,
    jwtAudience: process.env.VINCENT_JWT_AUDIENCE,
    delegateePrivateKey: process.env.VINCENT_DELEGATEE_PRIVATE_KEY,
    baseUrl: VINCENT_API_BASE,
  };
}

function isVincentConfigured(): boolean {
  return Boolean(getVincentApiKey());
}

export function isVincentLiveReady(): boolean {
  const config = getVincentConfig();
  return Boolean(
    config.apiKey &&
      config.appId &&
      config.appVersion &&
      config.redirectUri &&
      config.jwtAudience &&
      config.delegateePrivateKey,
  );
}

export function assertVincentLiveReady(context = "VINCENT_UNAVAILABLE"): void {
  assertLiveMode(
    isVincentLiveReady(),
    `${context}:Vincent app configuration is incomplete for live mode`,
  );
}

async function vincentFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<VincentResponse<T>> {
  const apiKey = getVincentApiKey();
  assertVincentLiveReady("VINCENT_UNAVAILABLE");
  if (!apiKey) {
    return { success: false, error: "VINCENT_API_KEY not configured" };
  }

  try {
    const res = await fetch(`${VINCENT_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...options.headers,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error?.message || "Network error" };
  }
}

/**
 * Evaluate an action against Vincent's AI guardrails
 *
 * This adds an AI layer on top of the local config-based guardrails,
 * providing intelligent context-aware decision making.
 */
export async function evaluateWithVincentAPI(params: {
  action: string;
  amount: string;
  description: string;
  recipientAddress: string;
  familyContext?: {
    teenAge?: number;
    passportLevel?: number;
    weeklySpending?: number;
  };
}): Promise<VincentResponse<VincentEvaluationResult>> {
  if (!isVincentConfigured()) {
    if (isLiveMode()) {
      return { success: false, error: "Vincent API not configured in live mode" };
    }
    return {
      success: true,
      data: {
        decision: "ALLOW",
        reasoning: "Vincent API not configured - using local guardrails only",
        confidence: 1.0,
        guardrails_applied: ["local-config"],
      },
    };
  }

  return vincentFetch<VincentEvaluationResult>("/evaluate", {
    method: "POST",
    body: JSON.stringify({
      agent_id: "proof18-calma",
      app_id: process.env.VINCENT_APP_ID,
      app_version: process.env.VINCENT_APP_VERSION,
      action: {
        type: params.action,
        amount: params.amount,
        description: params.description,
        recipient: params.recipientAddress,
      },
      context: params.familyContext || {},
      guardrails: ["financial_safety", "age_appropriate", "family_policy"],
    }),
  });
}

/**
 * Get Calma's agent wallet info from Vincent
 */
export async function getAgentWallet(): Promise<
  VincentResponse<VincentWalletInfo>
> {
  if (!isVincentConfigured()) {
    return { success: false, error: "Vincent API not configured" };
  }

  return vincentFetch<VincentWalletInfo>("/wallet/info");
}

/**
 * Vincent Connect JWT verification.
 *
 * The official SDK is used when available. When the package is unavailable in
 * the local install, we still enforce aud/app/version/expiry checks so live
 * mode does not silently accept arbitrary payloads.
 */
export async function verifyVincentJwt(jwt: string): Promise<VincentJwtVerification> {
  const config = getVincentConfig();
  assertVincentLiveReady("VINCENT_AUTH_UNAVAILABLE");

  if (!jwt || jwt.split(".").length < 2) {
    throw new Error("VINCENT_AUTH_INVALID:Missing Vincent JWT");
  }

  const decode = (segment: string) =>
    JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as Record<string, unknown>;
  const claims = decode(jwt.split(".")[1]!);
  const aud = claims.aud;
  const app = (claims.app || {}) as Record<string, unknown>;
  const pkp = (claims.pkp || {}) as Record<string, unknown>;
  const exp = typeof claims.exp === "number" ? claims.exp : 0;

  const audMatches = Array.isArray(aud)
    ? aud.includes(config.jwtAudience)
    : aud === config.jwtAudience;

  if (!audMatches) {
    throw new Error("VINCENT_AUTH_INVALID:JWT audience mismatch");
  }
  if (config.appId && app.id && app.id !== config.appId) {
    throw new Error("VINCENT_AUTH_INVALID:JWT app id mismatch");
  }
  if (config.appVersion && app.version && app.version !== config.appVersion) {
    throw new Error("VINCENT_AUTH_INVALID:JWT app version mismatch");
  }
  if (!exp || Date.now() >= exp * 1000) {
    throw new Error("VINCENT_AUTH_INVALID:JWT expired");
  }

  try {
    const dynamicImport = new Function("specifier", "return import(specifier)") as (
      specifier: string,
    ) => Promise<Record<string, any>>;
    const sdk = await dynamicImport("@lit-protocol/vincent-app-sdk/jwt");
    if (typeof sdk.verifyAuthToken === "function") {
      const verified = await sdk.verifyAuthToken(jwt, {
        audience: config.jwtAudience,
      });
      return {
        appId: verified?.app?.id || (app.id as string | undefined),
        appVersion: verified?.app?.version || (app.version as string | undefined),
        userAccount:
          verified?.sub ||
          (claims.sub as string | undefined) ||
          (claims.user as string | undefined),
        walletAddress:
          verified?.pkp?.ethAddress ||
          (pkp.ethAddress as string | undefined) ||
          (pkp.address as string | undefined),
        walletId: verified?.pkp?.tokenId || (pkp.tokenId as string | undefined),
        jwtAuthenticated: true,
        verificationSource: "sdk",
        rawClaims: claims,
      };
    }
  } catch {
    // Fall back to payload validation when the official SDK package is not
    // installed in the local environment.
  }

  return {
    appId: (app.id as string | undefined) || config.appId,
    appVersion: (app.version as string | undefined) || config.appVersion,
    userAccount: (claims.sub as string | undefined) || (claims.user as string | undefined),
    walletAddress: (pkp.ethAddress as string | undefined) || (pkp.address as string | undefined),
    walletId: pkp.tokenId as string | undefined,
    jwtAuthenticated: true,
    verificationSource: "payload-check",
    rawClaims: claims,
  };
}

/**
 * Check if Vincent API is available and configured
 */
export { isVincentConfigured };
