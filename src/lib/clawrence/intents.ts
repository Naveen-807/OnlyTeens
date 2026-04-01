import type { ClawrenceIntent } from "@/lib/types";

export function parseIntent(message: string): ClawrenceIntent {
  const lower = message.toLowerCase().trim();

  const strategyMatch = lower.match(/\b(conservative|balanced|growth)\b/);
  const goalMatch =
    lower.match(/(?:toward|for|goal:?|save for)\s+([a-z0-9][a-z0-9\s-]{2,40})/i) ||
    lower.match(/goal\s+([a-z0-9][a-z0-9\s-]{2,40})/i);

  const strategy = (strategyMatch?.[1] as ClawrenceIntent["strategy"]) || undefined;
  const goalName = goalMatch?.[1]?.trim();

  const savingsPatterns = [
    /save\s+(?:flow|₹|rs\.?|inr\s*)?\s*(\d+)\s*(weekly|every\s*week|per\s*week)/i,
    /save\s+(?:flow|₹|rs\.?|inr\s*)?\s*(\d+)\s*(monthly|every\s*month|per\s*month)/i,
    /save\s+(?:flow|₹|rs\.?|inr\s*)?\s*(\d+)/i,
    /put\s+(?:flow|₹|rs\.?|inr\s*)?\s*(\d+)\s*(?:in|into)\s*savings/i,
    /auto[\s-]*save\s+(?:flow|₹|rs\.?|inr\s*)?\s*(\d+)/i,
  ];

  for (const pattern of savingsPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const amount = parseInt(match[1], 10);
      const intervalText = match[2] || "";
      const isRecurring =
        /week|month|every|auto/i.test(intervalText) || /auto/i.test(lower);
      const interval = /month/i.test(intervalText) ? "monthly" : "weekly";

      return {
        type: "savings",
        amount,
        currency: "FLOW",
        description: `Save ${amount} FLOW${isRecurring ? ` ${interval}` : ""}`,
        isRecurring,
        interval: isRecurring ? interval : undefined,
        confidence: 0.9,
      };
    }
  }

  const earnPatterns = [
    /(?:earn|yield|compound|grow)\s+(?:flow|₹|rs\.?|inr\s*)?\s*(\d+)\s*(weekly|every\s*week|per\s*week|monthly|every\s*month|per\s*month)?/i,
    /(?:invest|convert|swap)\s+(?:flow|₹|rs\.?|inr\s*)?\s*(\d+)\s*(?:into|to)?\s*(?:earn|vault|portfolio)?/i,
  ];

  for (const pattern of earnPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const amount = parseInt(match[1], 10);
      const intervalText = match[2] || "";
      const isRecurring = /week|month|auto|compound/i.test(intervalText) || /auto/i.test(lower);
      const interval = /month/i.test(intervalText) ? "monthly" : "weekly";

      return {
        type: "earn",
        amount,
        currency: "FLOW",
        description: goalName
          ? `Earn ${amount} FLOW toward ${goalName}`
          : `Earn ${amount} FLOW${isRecurring ? ` ${interval}` : ""}`,
        isRecurring,
        interval: isRecurring ? interval : undefined,
        strategy,
        goalName,
        confidence: 0.87,
      };
    }
  }

  const goalPatterns = [
    /goal\s+([a-z0-9][a-z0-9\s-]{2,40})\s+(?:flow|₹|rs\.?|inr\s*)?\s*(\d+)/i,
    /save\s+for\s+([a-z0-9][a-z0-9\s-]{2,40})\s+(?:flow|₹|rs\.?|inr\s*)?\s*(\d+)/i,
  ];

  for (const pattern of goalPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const derivedGoal = match[1].trim();
      const amount = parseInt(match[2], 10);

      return {
        type: "goal",
        amount,
        currency: "FLOW",
        description: `Goal plan for ${derivedGoal}`,
        isRecurring: false,
        goalName: derivedGoal,
        strategy,
        confidence: 0.84,
      };
    }
  }

  if (/portfolio|earnings|net\s*worth|growth\s*plan|vault\s*status/i.test(lower)) {
    return {
      type: "portfolio",
      currency: "FLOW",
      description: message,
      isRecurring: false,
      strategy,
      goalName,
      confidence: 0.74,
    };
  }

  const subPatterns = [
    /subscribe\s+(?:to\s+)?(.+?)\s+(?:for\s+)?(?:flow|₹|rs\.?|inr\s*)?\s*(\d+)/i,
    /(?:get|start|begin)\s+(.+?)\s+subscription\s+(?:flow|₹|rs\.?|inr\s*)?\s*(\d+)/i,
    /(.+?)\s+subscription\s+(?:flow|₹|rs\.?|inr\s*)?\s*(\d+)/i,
    /(?:flow|₹|rs\.?|inr\s*)?\s*(\d+)\s+(?:for\s+)?(.+?)\s+(?:subscription|sub|monthly)/i,
  ];

  for (const pattern of subPatterns) {
    const match = lower.match(pattern);
    if (match) {
      let serviceName: string;
      let amount: number;

      if (isNaN(parseInt(match[1], 10))) {
        serviceName = match[1].trim();
        amount = parseInt(match[2], 10);
      } else {
        amount = parseInt(match[1], 10);
        serviceName = match[2].trim();
      }

      return {
        type: "subscription",
        amount,
        currency: "FLOW",
        description: `${serviceName} subscription ${amount} FLOW/month`,
        isRecurring: true,
        interval: "monthly",
        serviceName,
        confidence: 0.85,
      };
    }
  }

  if (/balance|how\s*much|saved|passport|level|streak/i.test(lower)) {
    return {
      type: "portfolio",
      currency: "FLOW",
      description: message,
      isRecurring: false,
      strategy,
      goalName,
      confidence: 0.7,
    };
  }

  if (/what|how|why|when|can\s*i|should|explain/i.test(lower)) {
    return {
      type: "question",
      currency: "FLOW",
      description: message,
      isRecurring: false,
      confidence: 0.6,
    };
  }

  return {
    type: "unknown",
    currency: "FLOW",
    description: message,
    isRecurring: false,
    confidence: 0.3,
  };
}

