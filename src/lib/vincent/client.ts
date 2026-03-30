import "server-only";

/**
 * Vincent API Client
 *
 * Vincent provides AI agents with secure, non-custodial wallets protected by
 * programmable guardrails. This client enables AI-powered guardrail evaluation
 * for Clawrence (the Proof18 AI assistant).
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

function getVincentApiKey(): string | null {
  return process.env.VINCENT_API_KEY || null;
}

function isVincentConfigured(): boolean {
  return Boolean(getVincentApiKey());
}

async function vincentFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<VincentResponse<T>> {
  const apiKey = getVincentApiKey();
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
    // When Vincent API is not configured, allow all actions
    // The local guardrails in policy.ts still apply
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
      agent_id: "proof18-clawrence",
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
 * Get Clawrence's agent wallet info from Vincent
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
 * Check if Vincent API is available and configured
 */
export { isVincentConfigured };
