import "server-only";

import OpenAI from "openai";

import { assertLiveMode, isLiveMode } from "@/lib/runtime/liveMode";
import type { PolicyDecision } from "@/lib/types";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  assertLiveMode(Boolean(apiKey), "CALMA_UNAVAILABLE:OPENAI_API_KEY is required in live mode");
  if (!apiKey) return null;
  if (!openai) openai = new OpenAI({ apiKey });
  return openai;
}

const SYSTEM_PROMPT = `You are Calma, a friendly financial guide for teenagers aged 13-17 in India.

RULES:
1. Explain money concepts simply, like talking to a smart teenager
2. Never encourage risky financial behavior
3. Always mention guardian approval for RED/YELLOW actions
4. Be encouraging about savings
5. Keep responses under 3 sentences for actions, under 5 for explanations
6. Use ₹ (rupees) as default currency
7. NEVER reveal exact guardian thresholds — those are encrypted and private
8. Frame everything in terms of the teen's financial growth and Passport journey

CONTEXT:
- GREEN = auto-approved, within safe limits
- YELLOW = needs guardian review, borderline
- RED = needs guardian approval — it is a bigger commitment
- BLOCKED = not allowed, policy violation
You CANNOT override these decisions. You explain them.

PERSONALITY:
- Warm, encouraging, slightly playful
- Uses simple analogies
- Celebrates small wins
- Never condescending`;

function modelName(): string {
  return process.env.CALMA_MODEL || process.env.CLAWRENCE_MODEL || "gpt-4o-mini";
}

function offlineMessage(message: string): string {
  if (isLiveMode()) {
    throw new Error(message);
  }
  return message;
}

export async function preActionExplanation(params: {
  teenName: string;
  action: string;
  description: string;
  amount: number;
  currency: string;
  isRecurring: boolean;
  passportLevel: number;
  passportStreak: number;
}): Promise<string> {
  const client = getOpenAI();
  if (!client) {
    return offlineMessage(
      `Calma is offline (missing OPENAI_API_KEY). Your request "${params.description}" will follow the normal policy + guardian approval flow.`,
    );
  }

  const response = await client.chat.completions.create({
    model: modelName(),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `${params.teenName} wants to ${params.action}: "${params.description}" for ${params.currency}${params.amount}${params.isRecurring ? "/month (recurring)" : " (one-time)"}. Passport level ${params.passportLevel}, streak ${params.passportStreak} weeks. Explain what this means financially, then say what happens next in the approval process.`,
      },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content || "";
}

export async function postDecisionExplanation(params: {
  teenName: string;
  action: string;
  description: string;
  amount: number;
  currency: string;
  decision: PolicyDecision;
  passportLevel: number;
}): Promise<string> {
  const hints: Record<PolicyDecision, string> = {
    GREEN: "Auto-approved! Within safe limits.",
    YELLOW: "Needs a quick review from your guardian.",
    RED: "Needs guardian approval — it is a bigger commitment.",
    BLOCKED: "Not available right now.",
  };

  const client = getOpenAI();
  if (!client) {
    return offlineMessage(
      `Decision: ${params.decision}. Calma is offline (missing OPENAI_API_KEY), but the app will still follow your family policy rules and guardian approvals.`,
    );
  }

  const response = await client.chat.completions.create({
    model: modelName(),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `${params.teenName}'s ${params.action} "${params.description}" for ${params.currency}${params.amount} was: ${params.decision}. Hint: ${hints[params.decision]}. Give a personalized, encouraging response. If GREEN, celebrate. If YELLOW/RED, reassure. If BLOCKED, suggest alternatives. Mention Passport journey.`,
      },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content || "";
}

export async function celebrationMessage(params: {
  teenName: string;
  action: string;
  amount: number;
  currency: string;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  newLevelName: string;
  receiptCid: string;
}): Promise<string> {
  const levelUpText = params.leveledUp
    ? `AMAZING: They leveled up from ${params.oldLevel} to ${params.newLevel} (${params.newLevelName})!`
    : "";

  const client = getOpenAI();
  if (!client) {
    return offlineMessage(`Done! Receipt saved (CID: ${params.receiptCid.slice(0, 12)}...).`);
  }

  const response = await client.chat.completions.create({
    model: modelName(),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `${params.teenName}'s ${params.action} of ${params.currency}${params.amount} completed! ${levelUpText} Receipt saved (CID: ${params.receiptCid.slice(0, 12)}...). Brief celebratory response. If leveled up, make it special.`,
      },
    ],
    max_tokens: 150,
    temperature: 0.8,
  });
  return response.choices[0]?.message?.content || "";
}

export async function guardianExplanation(params: {
  teenName: string;
  action: string;
  description: string;
  amount: number;
  currency: string;
  isRecurring: boolean;
  decision: PolicyDecision;
  passportLevel: number;
  passportStreak: number;
  decryptedThreshold?: number;
}): Promise<string> {
  const client = getOpenAI();
  if (!client) {
    return offlineMessage(
      `Calma is offline (missing OPENAI_API_KEY). Request: "${params.description}" for ${params.currency}${params.amount}${params.isRecurring ? "/month" : ""}. Policy decision: ${params.decision}. Passport: Lv.${params.passportLevel}, streak ${params.passportStreak}wk.`,
    );
  }

  const response = await client.chat.completions.create({
    model: modelName(),
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT.replace("teenager", "parent/guardian"),
      },
      {
        role: "user",
        content: `Speaking to ${params.teenName}'s guardian: ${params.teenName} requested ${params.action} — "${params.description}" for ${params.currency}${params.amount}${params.isRecurring ? "/month" : ""}. Policy: ${params.decision}. ${params.decryptedThreshold ? `Your threshold: ${params.currency}${params.decryptedThreshold}.` : ""} Passport: Lv.${params.passportLevel}, streak ${params.passportStreak}wk. Brief parent summary: what they are asking, why flagged, their track record. Do NOT decide for the parent.`,
      },
    ],
    max_tokens: 200,
    temperature: 0.5,
  });
  return response.choices[0]?.message?.content || "";
}

export async function answerQuestion(params: {
  teenName: string;
  question: string;
  passportLevel: number;
  savingsBalance: string;
  subscriptionReserve: string;
}): Promise<string> {
  const client = getOpenAI();
  if (!client) {
    return offlineMessage(
      `Calma is offline (missing OPENAI_API_KEY). Your savings: ${params.savingsBalance} FLOW. Subscription reserve: ${params.subscriptionReserve} FLOW.`,
    );
  }

  const response = await client.chat.completions.create({
    model: modelName(),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `${params.teenName} asks: "${params.question}". Their Passport level is ${params.passportLevel}. Savings: ${params.savingsBalance} FLOW. Subscription reserve: ${params.subscriptionReserve} FLOW. Answer helpfully.`,
      },
    ],
    max_tokens: 250,
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content || "";
}
