"use client";

import { useMemo, useState } from "react";

import type { ClawrenceIntent, UserSession } from "@/lib/types";

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
        "Hey! I'm Clawrence, your financial guide.\n\nTry: “save ₹500 weekly” or “subscribe to Spotify for ₹119”.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const lastPreview = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].actionPreview && messages[i].intent) return messages[i];
    }
    return null;
  }, [messages]);

  const push = (msg: Message) => setMessages((prev) => [...prev, msg]);

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
          content: data?.clawrence?.celebration || data?.clawrence?.postExplanation || "Done.",
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
              : data?.clawrence?.celebration || "Submitted.",
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[600px] max-w-md flex-col">
      <div className="flex items-center gap-3 rounded-t-xl bg-indigo-600 p-4 text-white">
        <span className="text-2xl">🤖</span>
        <div>
          <h2 className="font-bold">Clawrence</h2>
          <p className="text-xs opacity-80">Your financial guide</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "teen" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-lg p-3 text-sm ${
                msg.role === "teen"
                  ? "bg-indigo-600 text-white"
                  : msg.role === "system"
                    ? "bg-red-50 text-red-800"
                    : "bg-white shadow-sm"
              }`}
            >
              {msg.content}
              {msg.actionPreview ? (
                <div className="mt-3 rounded bg-indigo-50 p-2 text-xs text-indigo-900">
                  <div className="font-semibold">Preview ready</div>
                  <div className="mt-1">
                    Confirm to run: <code>{msg.intent?.description}</code>
                  </div>
                  <button
                    onClick={confirmPreview}
                    disabled={loading}
                    className="mt-2 w-full rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Confirm
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {loading ? (
          <div className="flex justify-start">
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <span className="text-sm text-gray-400">Clawrence is thinking...</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex gap-2 border-t bg-white p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Save ₹500 weekly..."
          className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

