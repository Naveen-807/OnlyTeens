import { useState } from "react";

interface Message {
  id: string;
  role: "clawrence" | "teen" | "system";
  content: string;
  policyDecision?: "GREEN" | "YELLOW" | "RED" | "BLOCKED";
  receiptCid?: string;
  flowTxHash?: string;
  timestamp: string;
}

export function ClawrenceChat({
  onAction,
}: {
  onAction: (action: string, params: any) => Promise<any>;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "clawrence",
      content:
        "Hey! I'm Clawrence, your financial guide 🤖\n\nI can help you save money, manage subscriptions, or explain anything about your finances. What would you like to do?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: "teen",
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const result = await onAction("chat", { message: input });

      const clawrenceMsg: Message = {
        id: `msg_${Date.now()}_cl`,
        role: "clawrence",
        content: result.explanation,
        policyDecision: result.policyDecision,
        receiptCid: result.receiptCid,
        flowTxHash: result.flowTxHash,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, clawrenceMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "system",
          content: "Something went wrong. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    setLoading(false);
  };

  const decisionBadge = (d: string) => {
    const styles: Record<string, string> = {
      GREEN: "bg-green-100 text-green-800",
      YELLOW: "bg-yellow-100 text-yellow-800",
      RED: "bg-red-100 text-red-800",
      BLOCKED: "bg-gray-200 text-gray-800",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[d]}`}>
        {d}
      </span>
    );
  };

  return (
    <div className="max-w-md mx-auto flex flex-col h-[600px]">
      <div className="bg-indigo-600 text-white p-4 rounded-t-xl flex items-center gap-3">
        <span className="text-2xl">🤖</span>
        <div>
          <h2 className="font-bold">Clawrence</h2>
          <p className="text-xs opacity-80">Your financial guide</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "teen" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === "teen"
                  ? "bg-indigo-600 text-white"
                  : msg.role === "system"
                  ? "bg-red-50 text-red-800"
                  : "bg-white shadow-sm"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

              {msg.policyDecision && (
                <div className="mt-2">{decisionBadge(msg.policyDecision)}</div>
              )}

              {(msg.receiptCid || msg.flowTxHash) && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {msg.flowTxHash && (
                    <a
                      href={`https://evm-testnet.flowscan.io/tx/${msg.flowTxHash}`}
                      target="_blank"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      🌊 View on Flow →
                    </a>
                  )}
                  {msg.receiptCid && (
                    <a
                      href={`https://storacha.link/ipfs/${msg.receiptCid}`}
                      target="_blank"
                      className="text-xs text-purple-600 hover:underline"
                    >
                      📦 View Receipt →
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white shadow-sm rounded-lg p-3">
              <span className="text-sm text-gray-400">Clawrence is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Save ₹500 weekly..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
