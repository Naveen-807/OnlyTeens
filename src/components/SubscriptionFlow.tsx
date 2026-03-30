"use client";

import { useState } from "react";
import { CreditCard, CheckCircle2, Clock, XCircle, Music, Tv, Gamepad2, ShoppingBag } from "lucide-react";

import type { FlowResult, UserSession } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const popularServices = [
  { name: "Spotify", icon: Music, color: "text-emerald-400", bgColor: "bg-emerald-500/20", amount: "9.99" },
  { name: "Netflix", icon: Tv, color: "text-rose-400", bgColor: "bg-rose-500/20", amount: "15.99" },
  { name: "Xbox Game Pass", icon: Gamepad2, color: "text-emerald-400", bgColor: "bg-emerald-500/20", amount: "14.99" },
  { name: "Amazon Prime", icon: ShoppingBag, color: "text-blue-400", bgColor: "bg-blue-500/20", amount: "12.99" },
];

export function SubscriptionFlow({
  session,
  familyId,
  teenAddress,
  guardianAddress,
  teenName,
  clawrencePublicKey,
}: {
  session: UserSession;
  familyId: `0x${string}`;
  teenAddress: `0x${string}`;
  guardianAddress: `0x${string}` | string;
  teenName: string;
  serviceNameDefault?: string;
  clawrencePublicKey: string;
}) {
  const [serviceName, setServiceName] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [result, setResult] = useState<FlowResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const request = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/subscription/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          familyId,
          teenAddress,
          guardianAddress,
          teenName,
          serviceName,
          monthlyAmount,
          clawrencePublicKey,
        }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const selectService = (service: typeof popularServices[0]) => {
    setServiceName(service.name);
    setMonthlyAmount(service.amount);
    setShowCustom(false);
  };

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <Card className="bg-card/90 border-border/30 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/30 bg-gradient-to-br from-violet-500/10 via-card to-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-violet-500/20 p-2 border border-violet-500/30">
              <CreditCard className="h-5 w-5 text-violet-400" />
            </div>
            <Badge className="border-violet-500/30 bg-violet-950/60 text-violet-400">
              Subscriptions
            </Badge>
          </div>
          <CardTitle className="text-xl">Request Subscription</CardTitle>
          <CardDescription>
            Request a new monthly subscription. Some may auto-approve based on your passport level.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Popular Services Grid */}
          <div className="space-y-3">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Popular Services
            </label>
            <div className="grid grid-cols-2 gap-3">
              {popularServices.map((service) => (
                <button
                  key={service.name}
                  onClick={() => selectService(service)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    serviceName === service.name
                      ? "border-primary bg-primary/10"
                      : "border-border/30 bg-card/50 hover:border-border hover:bg-card"
                  )}
                >
                  <div className={cn("rounded-lg p-2", service.bgColor)}>
                    <service.icon className={cn("h-4 w-4", service.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">${service.amount}/mo</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Service Toggle */}
          <div className="text-center">
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="text-xs text-primary hover:underline"
            >
              {showCustom ? "Hide custom service" : "Or enter a custom service"}
            </button>
          </div>

          {/* Custom Service Form */}
          {showCustom && (
            <div className="space-y-4 p-4 rounded-xl border border-border/30 bg-card/50">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Service Name
                </label>
                <Input
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="bg-background/50"
                  placeholder="e.g., Disney+"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Monthly Amount (FLOW)
                </label>
                <Input
                  type="number"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  className="bg-background/50 font-mono"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          )}

          {/* Selected Service Summary */}
          {serviceName && monthlyAmount && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Selected:</span>
                <span className="font-semibold">{serviceName}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-muted-foreground">Monthly:</span>
                <span className="font-mono font-semibold text-primary">{monthlyAmount} FLOW</span>
              </div>
            </div>
          )}

          <Button
            onClick={request}
            disabled={loading || !serviceName || !monthlyAmount}
            className="w-full"
            size="lg"
          >
            {loading ? (
              "Submitting..."
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Request {serviceName || "Subscription"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Result Card */}
      {result && (
        <Card className={cn(
          "border backdrop-blur-sm overflow-hidden",
          result.success
            ? "bg-emerald-950/40 border-emerald-500/30"
            : result.requiresApproval
              ? "bg-amber-950/40 border-amber-500/30"
              : "bg-rose-950/40 border-rose-500/30"
        )}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              {result.success ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              ) : result.requiresApproval ? (
                <Clock className="h-6 w-6 text-amber-400" />
              ) : (
                <XCircle className="h-6 w-6 text-rose-400" />
              )}
              <div>
                <h3 className={cn(
                  "font-semibold",
                  result.success ? "text-emerald-400" : result.requiresApproval ? "text-amber-400" : "text-rose-400"
                )}>
                  {result.success
                    ? "Subscription Active!"
                    : result.requiresApproval
                      ? "Awaiting Guardian Approval"
                      : "Request Failed"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Decision: <span className="font-mono">{result.decision}</span>
                  {result.zama?.evaluationTxHash && (
                    <> • Policy verified</>
                  )}
                </p>
              </div>
            </div>

            {result.approvalRequestId && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-950/40 p-3">
                <p className="text-xs text-amber-400">
                  Your guardian will review this request.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Request ID: <code className="font-mono">{result.approvalRequestId}</code>
                </p>
              </div>
            )}

            {result.error && (
              <p className="text-sm text-rose-400">{result.error}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
