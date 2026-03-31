"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, AlertCircle } from "lucide-react";

import type { ClawrenceIntent, UserSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "clawrence" | "teen" | "system";
  content: string;
  timestamp: string;
  intent?: ClawrenceIntent;
  actionPreview?: boolean;
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "clawrence",
      content:
        'Hey! I\'m Calma, your financial guide.\n\nTry: "save ₹500 weekly" or "subscribe to Spotify for ₹119".',
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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          familyId,
          teenAddress,
          teenName,
          session,
        }),
      });

      const data = await res.json();
      push({
        id: `msg_${Date.now()}_cl`,
        role: "clawrence",
        content: data.explanation,
        timestamp: new Date().toISOString(),
        intent: data.intent,
        actionPreview: data.type === "action_preview",
      });
    } catch (err) {
      push({
        id: `err_${Date.now()}`,
        role: "system",
        content: "Something went wrong. Please try again.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmPreview = async () => {
    const intent = lastPreview?.intent;
    if (!intent) return;
    if (intent.type !== "savings" && intent.type !== "subscription") return;

    setLoading(true);
    try {
      if (intent.type === "savings") {
        const res = await fetch("/api/savings/execute", {
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
        });
        const data = await res.json();
        push({
          id: `result_${Date.now()}`,
          role: "clawrence",
          content: data?.calma?.celebration || data?.calma?.postExplanation || data?.clawrence?.celebration || data?.clawrence?.postExplanation || "Done.",
          timestamp: new Date().toISOString(),
        });
      } else {
        const res = await fetch("/api/subscription/request", {
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
        });
        const data = await res.json();
        push({
          id: `result_${Date.now()}`,
          role: "clawrence",
          content:
            data?.requiresApproval
              ? "Sent to your guardian for approval."
              : data?.calma?.celebration || data?.clawrence?.celebration || "Submitted.",
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-2xl flex-col rounded-2xl border border-border/30 bg-card/90 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/30 bg-gradient-to-r from-primary/10 via-card to-card p-4">
        <div className="rounded-xl bg-primary/20 p-2.5 border border-primary/30">
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
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex", msg.role === "teen" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl p-4 text-sm",
                  msg.role === "teen"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : msg.role === "system"
                      ? "bg-rose-950/60 border border-rose-500/30 text-rose-400"
                      : "bg-secondary/80 border border-border/30 rounded-bl-md"
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
      <div className="border-t border-border/30 bg-card/50 p-4">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Save ₹500 weekly..."
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
          Try: "save 100 FLOW" or "subscribe to Netflix for 15 FLOW"
        </p>
      </div>
    </div>
  );
}
