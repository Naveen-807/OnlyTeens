"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles } from "lucide-react";

import type { ClawrenceIntent, UserSession } from "@/lib/types";
import { fetchJson, extractApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "clawrence" | "teen" | "system";
  content: string;
  timestamp: string;
  intent?: ClawrenceIntent;
  actionPreview?: boolean;
}

interface ChatResponse {
  type: "answer" | "action_preview" | "unknown" | "error";
  explanation?: string;
  error?: string;
  intent?: ClawrenceIntent;
}

export function ClawrenceChat({
  session,
  familyId,
  teenAddress,
  teenName,
  guardianAddress,
  clawrencePublicKey,
  clawrencePkpTokenId,
}: {
  session: UserSession;
  familyId: `0x${string}`;
  teenAddress: `0x${string}`;
  teenName: string;
  guardianAddress: `0x${string}` | string;
  clawrencePublicKey: string;
  clawrencePkpTokenId: string;
}) {
  const cachedPassport = useAuthStore((state) => state.passport);
  const cachedBalances = useAuthStore((state) => state.balances);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "clawrence",
      content:
        'Hey! I\'m Calma, your financial guide.\n\nTry: "earn 50 FLOW for tuition" or "goal laptop 100 FLOW".',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const lastPreview = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].actionPreview && messages[i].intent) return messages[i];
    }
    return null;
  }, [messages]);

  const push = (msg: Message) => setMessages((prev) => [...prev, msg]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const text = input;
    push({
      id: `msg_${Date.now()}`,
      role: "teen",
      content: text,
      timestamp: new Date().toISOString(),
    });
    setInput("");
    setLoading(true);

    try {
      const data = await fetchJson<ChatResponse>(
        "/api/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            familyId,
            teenAddress,
            teenName,
            session,
            cachedPassport,
            cachedBalances,
          }),
        },
        "Calma could not respond",
      );

      if (data.type === "error") {
        throw new Error(data.error || "Calma could not respond");
      }

      push({
        id: `msg_${Date.now()}_cl`,
        role: "clawrence",
        content: data.explanation || "I need another try to answer that clearly.",
        timestamp: new Date().toISOString(),
        intent: data.intent,
        actionPreview: data.type === "action_preview",
      });
    } catch (err: unknown) {
      push({
        id: `err_${Date.now()}`,
        role: "system",
        content: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmPreview = async () => {
    const intent = lastPreview?.intent;
    if (!intent) return;
    if (
      intent.type !== "savings" &&
      intent.type !== "subscription" &&
      intent.type !== "earn" &&
      intent.type !== "goal" &&
      intent.type !== "rebalance"
    ) {
      return;
    }

    setLoading(true);
    try {
      if (intent.type === "savings") {
        const data = await fetchJson<{
          success: boolean;
          error?: string;
          calma?: { celebration?: string; postExplanation?: string };
          clawrence?: { celebration?: string; postExplanation?: string };
        }>(
          "/api/savings/execute",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session,
              familyId,
              teenAddress,
              guardianAddress,
              teenName,
              amount: String(intent.amount || 0),
              isRecurring: Boolean(intent.isRecurring),
              interval: intent.interval || "weekly",
              clawrencePublicKey,
              clawrencePkpTokenId,
            }),
          },
          "Savings action failed",
        );
        push({
          id: `result_${Date.now()}`,
          role: "clawrence",
          content: data?.calma?.celebration || data?.calma?.postExplanation || data?.clawrence?.celebration || data?.clawrence?.postExplanation || "Done.",
          timestamp: new Date().toISOString(),
        });
        await useAuthStore.getState().refreshState();
      } else if (intent.type === "subscription") {
        const data = await fetchJson<{
          success: boolean;
          error?: string;
          requiresApproval?: boolean;
          calma?: { celebration?: string };
          clawrence?: { celebration?: string };
        }>(
          "/api/subscription/request",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session,
              familyId,
              teenAddress,
              guardianAddress,
              teenName,
              serviceName: intent.serviceName || intent.description,
              monthlyAmount: String(intent.amount || 0),
              clawrencePublicKey,
            }),
          },
          "Subscription request failed",
        );
        push({
          id: `result_${Date.now()}`,
          role: "clawrence",
          content:
            data?.requiresApproval
              ? "Sent to your guardian for approval."
              : data?.calma?.celebration || data?.clawrence?.celebration || "Submitted.",
          timestamp: new Date().toISOString(),
        });
        await useAuthStore.getState().refreshState();
      } else {
        const data = await fetchJson<{
          success: boolean;
          error?: string;
          calma?: { celebration?: string; postExplanation?: string };
          clawrence?: { celebration?: string; postExplanation?: string };
        }>(
          "/api/defi",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session,
              familyId,
              teenAddress,
              guardianAddress,
              teenName,
              amount: String(intent.amount || 0),
              goalName: intent.goalName,
              goalTarget: String(intent.amount || 0),
              strategy: intent.strategy || "balanced",
              protocolLabel: intent.protocolLabel || "Flow Savings Vault",
              actionKind: intent.type,
              isRecurring: Boolean(intent.isRecurring),
              interval: intent.interval || "weekly",
              clawrencePublicKey,
              clawrencePkpTokenId,
            }),
          },
          "DeFi plan failed",
        );

        push({
          id: `result_${Date.now()}`,
          role: "clawrence",
          content:
            data?.calma?.celebration ||
            data?.calma?.postExplanation ||
            data?.clawrence?.celebration ||
            data?.clawrence?.postExplanation ||
            "Your earn plan is active.",
          timestamp: new Date().toISOString(),
        });
        await useAuthStore.getState().refreshState();
      }
    } catch (error: unknown) {
      push({
        id: `result_err_${Date.now()}`,
        role: "system",
        content: extractApiError(error, "Action failed"),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-16rem)] max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-border/30 bg-[linear-gradient(180deg,oklch(0.11_0.008_85_/_0.96),oklch(0.075_0.005_85_/_0.98))] backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/30 bg-gradient-to-r from-primary/10 via-card to-card p-4">
        <div className="rounded-[1rem] border border-primary/20 bg-primary/12 p-2.5 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.05)]">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-gold-gradient">Calma</h2>
          <p className="text-xs text-muted-foreground">Your AI financial guide</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Online
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex", msg.role === "teen" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[min(85%,42rem)] min-w-0 whitespace-pre-wrap break-words rounded-2xl p-4 text-sm leading-6",
                  msg.role === "teen"
                    ? "rounded-br-md border border-primary/20 bg-primary/12 text-foreground"
                    : msg.role === "system"
                      ? "bg-rose-950/60 border border-rose-500/30 text-rose-400"
                      : "rounded-bl-md border border-border/30 bg-card/70 text-foreground"
                )}
              >
                {msg.role === "clawrence" && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-primary">
                    <Sparkles className="h-3 w-3" />
                    Calma
                  </div>
                )}
                {msg.content}
                {msg.actionPreview && (
                  <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2">
                      <Sparkles className="h-3 w-3" />
                      Action Ready
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Confirm to execute: <code className="text-primary">{msg.intent?.description}</code>
                    </p>
                    <Button
                      onClick={confirmPreview}
                      disabled={loading}
                      size="sm"
                      className="w-full"
                    >
                      {loading ? "Processing..." : "Confirm & Execute"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-secondary/80 border border-border/30 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  Calma is thinking...
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border/30 bg-card/55 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Save 500 FLOW weekly or earn 50 FLOW for tuition..."
            className="flex-1 bg-background/50"
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground text-center">
          Try: "save 100 FLOW" or "earn 50 FLOW for tuition"
        </p>
      </div>
    </div>
  );
}
