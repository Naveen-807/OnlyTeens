import "server-only";

import { CONTRACTS } from "@/lib/constants";
import { evaluateWithVincentAPI, isVincentConfigured } from "@/lib/vincent/client";
import type { ActionType, GuardrailResult } from "@/lib/types";

const DEFAULT_CHAIN = "flow-testnet";
const DEFAULT_MAX_SINGLE_TRANSFER_FLOW = 50;
const DEFAULT_MAX_RECURRING_TRANSFER_FLOW = 20;

function parseList(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  return value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function getVincentConfig() {
  const actionTypes = parseList(
    process.env.VINCENT_ALLOWED_ACTION_TYPES,
    ["savings", "subscription"],
  );
  const allowedChains = parseList(
    process.env.VINCENT_ALLOWED_CHAINS,
    [DEFAULT_CHAIN],
  );
  const configuredRecipients = parseList(
    process.env.VINCENT_ALLOWED_RECIPIENTS,
    [],
  );
  const defaultRecipients = [CONTRACTS.vault.toLowerCase()];
  const subscriptionRecipient = process.env.SUBSCRIPTION_RECIPIENT_ADDRESS?.toLowerCase();

  if (subscriptionRecipient) {
    defaultRecipients.push(subscriptionRecipient);
  }

  return {
    actionTypes,
    allowedChains,
    allowedRecipients: Array.from(
      new Set([...defaultRecipients, ...configuredRecipients]),
    ),
    maxSingleTransferFlow: Number(
      process.env.VINCENT_MAX_SINGLE_TRANSFER_FLOW ||
        DEFAULT_MAX_SINGLE_TRANSFER_FLOW,
    ),
    maxRecurringTransferFlow: Number(
      process.env.VINCENT_MAX_RECURRING_TRANSFER_FLOW ||
        process.env.VINCENT_MAX_SINGLE_TRANSFER_FLOW ||
        DEFAULT_MAX_RECURRING_TRANSFER_FLOW,
    ),
  };
}

export function evaluateVincentGuardrails(params: {
  action: ActionType;
  amount: string;
  isRecurring: boolean;
  recipientAddress?: string;
  chain?: string;
}): GuardrailResult {
  const config = getVincentConfig();
  const chain = (params.chain || DEFAULT_CHAIN).toLowerCase();
  const action = params.action.toLowerCase() as ActionType;
  const amount = Number(params.amount);
  const recipientAddress = (
    params.recipientAddress || CONTRACTS.vault
  ).toLowerCase();

  const checks = {
    allowedActionType: config.actionTypes.includes(action),
    allowedChain: config.allowedChains.includes(chain),
    allowedRecipient: config.allowedRecipients.includes(recipientAddress),
    maxSingleTransfer:
      Number.isFinite(amount) && amount > 0 && amount <= config.maxSingleTransferFlow,
    recurringWithinLimit:
      !params.isRecurring ||
      (Number.isFinite(amount) && amount <= config.maxRecurringTransferFlow),
  };

  const reasons: string[] = [];
  if (!checks.allowedActionType) {
    reasons.push(`Action type "${params.action}" is not permitted by Vincent.`);
  }
  if (!checks.allowedChain) {
    reasons.push(`Chain "${params.chain || DEFAULT_CHAIN}" is not permitted.`);
  }
  if (!checks.allowedRecipient) {
    reasons.push(`Recipient ${recipientAddress} is not on the Vincent allowlist.`);
  }
  if (!checks.maxSingleTransfer) {
    reasons.push(
      `Transfer exceeds Vincent single-transfer limit of ${config.maxSingleTransferFlow} FLOW.`,
    );
  }
  if (!checks.recurringWithinLimit) {
    reasons.push(
      `Recurring transfer exceeds Vincent recurring limit of ${config.maxRecurringTransferFlow} FLOW.`,
    );
  }

  return {
    approved: reasons.length === 0,
    provider: "vincent-local",
    version: "2026-03-30",
    chain: params.chain || DEFAULT_CHAIN,
    action: params.action,
    recipientAddress,
    reasons,
    checks,
  };
}

/**
 * Enhanced guardrails evaluation with optional Vincent API layer
 *
 * This combines:
 * 1. Local config-based guardrails (fast, always available)
 * 2. Vincent API AI guardrails (when configured)
 *
 * Both layers must pass for action to be approved.
 */
export async function evaluateVincentGuardrailsAsync(params: {
  action: ActionType;
  amount: string;
  isRecurring: boolean;
  description?: string;
  recipientAddress?: string;
  chain?: string;
  familyContext?: {
    teenAge?: number;
    passportLevel?: number;
    weeklySpending?: number;
  };
}): Promise<GuardrailResult & { aiLayer?: { decision: string; reasoning: string } }> {
  // Layer 1: Local config-based guardrails (always run first)
  const localResult = evaluateVincentGuardrails({
    action: params.action,
    amount: params.amount,
    isRecurring: params.isRecurring,
    recipientAddress: params.recipientAddress,
    chain: params.chain,
  });

  // If local guardrails fail, don't bother with API
  if (!localResult.approved) {
    return localResult;
  }

  // Layer 2: Vincent API AI guardrails (if configured)
  if (isVincentConfigured()) {
    const recipientAddress = (
      params.recipientAddress || CONTRACTS.vault
    ).toLowerCase();

    const apiResult = await evaluateWithVincentAPI({
      action: params.action,
      amount: params.amount,
      description: params.description || `${params.action} of ${params.amount} FLOW`,
      recipientAddress,
      familyContext: params.familyContext,
    });

    if (apiResult.success && apiResult.data) {
      const aiDecision = apiResult.data.decision;

      if (aiDecision === "BLOCK") {
        return {
          ...localResult,
          approved: false,
          reasons: [
            ...localResult.reasons,
            `Vincent AI: ${apiResult.data.reasoning}`,
          ],
          aiLayer: {
            decision: aiDecision,
            reasoning: apiResult.data.reasoning,
          },
        };
      }

      // ALLOW or REVIEW - add AI layer info but keep approved
      return {
        ...localResult,
        aiLayer: {
          decision: aiDecision,
          reasoning: apiResult.data.reasoning,
        },
      };
    } else {
      // API error - log but don't block (fail-open for API issues)
      console.warn("[Vincent] API evaluation failed:", apiResult.error);
    }
  }

  return localResult;
}
