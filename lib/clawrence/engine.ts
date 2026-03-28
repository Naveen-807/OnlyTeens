import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Clawrence's personality and constraints ───
const SYSTEM_PROMPT = `You are Clawrence, a friendly financial guide for teenagers aged 13-17.

RULES:
1. Always explain money concepts simply, like talking to a smart teenager
2. Never encourage risky financial behavior
3. Always mention the guardian approval requirement for RED/YELLOW actions
4. Be encouraging about savings habits
5. Keep responses under 3 sentences for quick actions, under 5 for explanations
6. Use ₹ (rupees) as the default currency
7. Never reveal exact guardian-set thresholds — those are private
8. Frame every action in terms of the teen's financial growth

CONTEXT: You help teens understand their financial actions before they happen,
and celebrate their progress after. You work within a system where:
- GREEN = auto-approved (within safe limits)
- YELLOW = needs review (borderline)  
- RED = needs guardian approval (exceeds limits)
- BLOCKED = not allowed (policy violation)

You CANNOT override these decisions. You can only explain them.`;

export interface ClawrenceContext {
  action: "savings" | "subscription" | "payment" | "request";
  amount: number;
  currency: string;
  description: string;
  passportLevel: number;
  passportStreak: number;
  policyDecision?: "GREEN" | "YELLOW" | "RED" | "BLOCKED";
  isRecurring: boolean;
  teenName: string;
}

// ─── Pre-action explanation ───
export async function explainBeforeAction(
  ctx: ClawrenceContext
): Promise<string> {
  const userPrompt = `
${ctx.teenName} wants to ${ctx.action}: "${ctx.description}" for ${ctx.currency}${ctx.amount}${ctx.isRecurring ? "/month (recurring)" : " (one-time)"}.

Their Passport level is ${ctx.passportLevel}, streak is ${ctx.passportStreak} weeks.

Explain what this action means for them financially, in a friendly way.
If recurring, mention the total yearly cost.
End with what will happen next in the approval process.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });

  return response.choices[0].message.content || "";
}

// ─── Post-decision explanation ───
export async function explainAfterDecision(
  ctx: ClawrenceContext
): Promise<string> {
  const decisionExplanations = {
    GREEN: "This was auto-approved because it's within your safe spending limits.",
    YELLOW:
      "This needs a quick review. Your guardian will take a look to make sure everything's good.",
    RED: "This needs your guardian's approval because it's a bigger commitment. Don't worry — just ask them!",
    BLOCKED:
      "This action isn't available right now. It might be outside your current Passport level or against family rules.",
  };

  const userPrompt = `
${ctx.teenName}'s ${ctx.action} "${ctx.description}" for ${ctx.currency}${ctx.amount} was evaluated as: ${ctx.policyDecision}.

Base explanation: ${decisionExplanations[ctx.policyDecision!]}

Give a personalized, encouraging response. 
If GREEN: celebrate the good habit.
If YELLOW/RED: reassure them it's normal and explain what happens next.
If BLOCKED: be kind and suggest alternatives.
Mention how this affects their Passport journey.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });

  return response.choices[0].message.content || "";
}

// ─── Post-execution celebration ───
export async function celebrateCompletion(
  ctx: ClawrenceContext & {
    newPassportLevel: number;
    receiptCid: string;
    flowTxHash: string;
  }
): Promise<string> {
  const leveledUp = ctx.newPassportLevel > ctx.passportLevel;

  const userPrompt = `
${ctx.teenName}'s ${ctx.action} "${ctx.description}" for ${ctx.currency}${ctx.amount} was completed successfully!

${leveledUp ? `AMAZING: They just leveled up from Passport Level ${ctx.passportLevel} to ${ctx.newPassportLevel}!` : `Current Passport Level: ${ctx.passportLevel}, streak: ${ctx.passportStreak + 1} weeks.`}

A tamper-proof receipt has been stored (CID: ${ctx.receiptCid.slice(0, 12)}...).

Give a brief, celebratory response. If they leveled up, make it special.
Mention their receipt is permanently saved as proof of their good financial behavior.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 150,
    temperature: 0.8,
  });

  return response.choices[0].message.content || "";
}

// ─── Guardian-facing explanation ───
export async function explainForGuardian(
  ctx: ClawrenceContext & { decryptedThreshold?: number }
): Promise<string> {
  const userPrompt = `
Speaking to ${ctx.teenName}'s guardian:

${ctx.teenName} requested: ${ctx.action} — "${ctx.description}" for ${ctx.currency}${ctx.amount}${ctx.isRecurring ? "/month" : ""}.

Policy decision: ${ctx.policyDecision}
${ctx.decryptedThreshold ? `Your confidential threshold: ${ctx.currency}${ctx.decryptedThreshold}` : "Threshold details are encrypted."}
Teen's Passport level: ${ctx.passportLevel}, streak: ${ctx.passportStreak} weeks.

Give a brief, parent-appropriate summary. Include:
1. What the teen is asking for
2. Why the policy flagged it
3. Whether it seems reasonable given their track record
Do NOT make the decision for the parent. Just inform.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 200,
    temperature: 0.5,
  });

  return response.choices[0].message.content || "";
}
