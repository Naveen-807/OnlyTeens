"use client";

import { useState } from "react";
import { Shield, Lock, CheckCircle2, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

export function GuardianPolicySetup({
  onSubmit,
}: {
  onSubmit: (policy: {
    singleActionCap: number;
    recurringMonthlyCap: number;
    trustUnlockThreshold: number;
    riskFlags?: number;
  }) => Promise<void>;
}) {
  const [singleCap, setSingleCap] = useState(500);
  const [recurringCap, setRecurringCap] = useState(1000);
  const [trustThreshold, setTrustThreshold] = useState(2);
  const [riskFlags, setRiskFlags] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        singleActionCap: singleCap,
        recurringMonthlyCap: recurringCap,
        trustUnlockThreshold: trustThreshold,
        riskFlags,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to encrypt and store policy");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="mx-auto max-w-md bg-card/90 border-border/30 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="rounded-full bg-emerald-500/20 p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Lock className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-gold-gradient">Policy Encrypted & Stored</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Your family rules are now encrypted on-chain using Zama&apos;s FHE.
            <br />
            Your teen will never see the exact numbers — only whether their actions are within limits.
          </p>
          <div className="mt-6 space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-950/40 p-4 text-left text-sm">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Single-action cap: encrypted
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Monthly recurring cap: encrypted
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Trust unlock threshold: encrypted
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Lock className="h-4 w-4" />
              Only you can decrypt these values
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trustLevelOptions = [
    { value: 0, label: "Starter", desc: "All actions auto-approved" },
    { value: 1, label: "Explorer", desc: "" },
    { value: 2, label: "Saver", desc: "Recommended" },
    { value: 3, label: "Manager", desc: "" },
    { value: 4, label: "Planner", desc: "Strict" },
    { value: 5, label: "Independent", desc: "Very strict" },
  ];

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <Card className="bg-card/90 border-border/30 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/30 bg-gradient-to-br from-primary/10 via-card to-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-primary/20 p-2 border border-primary/30">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <Badge>Policy Setup</Badge>
          </div>
          <CardTitle className="text-xl">Set Family Rules</CardTitle>
          <CardDescription>
            These values will be encrypted on-chain. Your teen will only see GREEN / YELLOW / RED / BLOCKED.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Single Action Cap */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Max per single action</label>
              <span className="font-mono font-bold text-primary">{singleCap} FLOW</span>
            </div>
            <Slider
              value={[singleCap]}
              onValueChange={(v) => setSingleCap(v[0])}
              min={100}
              max={5000}
              step={100}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Actions above this will need your approval
            </p>
          </div>

          {/* Recurring Cap */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Max monthly recurring total</label>
              <span className="font-mono font-bold text-primary">{recurringCap} FLOW</span>
            </div>
            <Slider
              value={[recurringCap]}
              onValueChange={(v) => setRecurringCap(v[0])}
              min={200}
              max={10000}
              step={200}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Total monthly subscriptions allowed before RED flag
            </p>
          </div>

          {/* Trust Threshold */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Passport level for auto-approve</label>
            <div className="grid grid-cols-3 gap-2">
              {trustLevelOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTrustThreshold(opt.value)}
                  className={`rounded-lg border p-2 text-center transition-all ${
                    trustThreshold === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/30 bg-card/50 hover:border-border"
                  }`}
                >
                  <p className="text-xs font-medium">Lv.{opt.value}</p>
                  <p className="text-[10px] text-muted-foreground">{opt.label}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Until your teen reaches this level, borderline actions need approval
            </p>
          </div>

          {/* Risk Flags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Risk flags (bitmask)</label>
            <Input
              type="number"
              value={riskFlags}
              onChange={(e) => setRiskFlags(Number(e.target.value))}
              className="bg-background/50 font-mono"
              min={0}
            />
            <p className="text-xs text-muted-foreground">
              Non-zero flags will push decisions toward BLOCKED
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Note */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/40 p-4">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <Lock className="h-4 w-4" />
          <span className="font-medium text-sm">Privacy Note</span>
        </div>
        <p className="text-xs text-amber-400/80">
          These values are submitted as encrypted inputs with proofs. On-chain observers can only see the final decision classification.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-4">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full"
        size="lg"
      >
        {submitting ? (
          "Encrypting & storing on-chain..."
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            Encrypt & Save Rules
          </>
        )}
      </Button>
    </div>
  );
}
