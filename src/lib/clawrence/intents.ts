import type { ClawrenceIntent } from "@/lib/types";

export function parseIntent(message: string): ClawrenceIntent {
  const lower = message.toLowerCase().trim();

  const savingsPatterns = [
    /save\s+(?:₹|rs\.?|inr\s*)?\s*(\d+)\s*(weekly|every\s*week|per\s*week)/i,
    /save\s+(?:₹|rs\.?|inr\s*)?\s*(\d+)\s*(monthly|every\s*month|per\s*month)/i,
    /save\s+(?:₹|rs\.?|inr\s*)?\s*(\d+)/i,
    /put\s+(?:₹|rs\.?|inr\s*)?\s*(\d+)\s*(?:in|into)\s*savings/i,
    /auto[\s-]*save\s+(?:₹|rs\.?|inr\s*)?\s*(\d+)/i,
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
        currency: "₹",
        description: `Save ₹${amount}${isRecurring ? ` ${interval}` : ""}`,
        isRecurring,
        interval: isRecurring ? interval : undefined,
        confidence: 0.9,
      };
    }
  }

  const subPatterns = [
    /subscribe\s+(?:to\s+)?(.+?)\s+(?:for\s+)?(?:₹|rs\.?|inr\s*)?\s*(\d+)/i,
    /(?:get|start|begin)\s+(.+?)\s+subscription\s+(?:₹|rs\.?|inr\s*)?\s*(\d+)/i,
    /(.+?)\s+subscription\s+(?:₹|rs\.?|inr\s*)?\s*(\d+)/i,
    /(?:₹|rs\.?|inr\s*)?\s*(\d+)\s+(?:for\s+)?(.+?)\s+(?:subscription|sub|monthly)/i,
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
        currency: "₹",
        description: `${serviceName} subscription ₹${amount}/month`,
        isRecurring: true,
        interval: "monthly",
        serviceName,
        confidence: 0.85,
      };
    }
  }

  if (/balance|how\s*much|saved|passport|level|streak/i.test(lower)) {
    return {
      type: "status",
      currency: "₹",
      description: message,
      isRecurring: false,
      confidence: 0.7,
    };
  }

  if (/what|how|why|when|can\s*i|should|explain/i.test(lower)) {
    return {
      type: "question",
      currency: "₹",
      description: message,
      isRecurring: false,
      confidence: 0.6,
    };
  }

  return {
    type: "unknown",
    currency: "₹",
    description: message,
    isRecurring: false,
    confidence: 0.3,
  };
}

