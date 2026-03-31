"use client";

import { useState } from "react";
import { Users, CheckCircle2 } from "lucide-react";

import { PhoneOtpAuthCard } from "@/components/PhoneOtpAuthCard";
import { useAuthStore } from "@/store/authStore";
import type { UserSession } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function FamilyOnboarding() {
  const login = useAuthStore((state) => state.login);
  const [guardianSession, setGuardianSession] = useState<UserSession | null>(null);
  const [teenSession, setTeenSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");

  const submit = async () => {
    setLoading(true);
    setStatus(null);

    try {
      if (!guardianSession || !teenSession) {
        throw new Error("Verify both guardian and teen phone numbers first");
      }

      const onboardingRes = await fetch("/api/onboarding/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guardianSession,
          teenSession,
        }),
      });
      const onboardingData = await onboardingRes.json();
      if (!onboardingData.success) {
        throw new Error(onboardingData.error || "Family onboarding failed");
      }

      await login({
        role: "guardian",
        pkpPublicKey: onboardingData.guardianSession?.pkpPublicKey || guardianSession.pkpPublicKey,
        pkpTokenId: onboardingData.guardianSession?.pkpTokenId || guardianSession.pkpTokenId,
        pkpAddress: onboardingData.guardianSession?.pkpAddress || guardianSession.pkpAddress,
        phoneNumber: onboardingData.guardianSession?.phoneNumber || guardianSession.phoneNumber,
        authMethod: onboardingData.guardianSession?.authMethod || guardianSession.authMethod,
        address: onboardingData.guardianSession?.address || guardianSession.address,
      });

      const familyId = onboardingData.family?.familyId || guardianSession.familyId;
      setStatus(
        `Family onboarded successfully${familyId ? `: ${familyId}` : ""}. Guardian session is now active.`,
      );
      setStatusType("success");
    } catch (error: any) {
      setStatus(error?.message || "Family onboarding failed");
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/90 border-border/30 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-4 border-b border-border/30 bg-gradient-to-br from-primary/10 via-card to-card">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-lg bg-primary/20 p-2 border border-primary/30">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <Badge>Family Setup</Badge>
        </div>
        <CardTitle className="text-xl">Create a New Family</CardTitle>
        <CardDescription>
          Verify guardian and teen phone numbers through the canonical phone onboarding flow, then register the family on-chain.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1.5 border",
            guardianSession
              ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
              : "border-border/30 bg-card/50 text-muted-foreground"
          )}>
            {guardianSession ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>}
            Guardian
          </div>
          <div className="w-8 h-px bg-border/50" />
          <div className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1.5 border",
            teenSession
              ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
              : "border-border/30 bg-card/50 text-muted-foreground"
          )}>
            {teenSession ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>}
            Teen
          </div>
          <div className="w-8 h-px bg-border/50" />
          <div className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1.5 border",
            guardianSession && teenSession
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border/30 bg-card/50 text-muted-foreground"
          )}>
            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
            Create
          </div>
        </div>

        {/* Auth Cards */}
        <div className="space-y-4">
          <PhoneOtpAuthCard
            role="guardian"
            title="Guardian Verification"
            subtitle="Verify the guardian phone number first."
            familyId={guardianSession?.familyId || ""}
            submitLabel="Verify Guardian"
            onSession={async (session) => {
              setGuardianSession(session);
              setStatus("Guardian verified. Now verify the teen phone.");
              setStatusType("info");
            }}
          />

          <PhoneOtpAuthCard
            role="teen"
            title="Teen Verification"
            subtitle="Verify the teen phone number."
            familyId={teenSession?.familyId || ""}
            submitLabel="Verify Teen"
            onSession={async (session) => {
              setTeenSession(session);
              setStatus("Teen verified. Ready to create the family.");
              setStatusType("info");
            }}
          />
        </div>

        {/* Create Family Button */}
        <Button
          onClick={submit}
          disabled={loading || !guardianSession || !teenSession}
          className="w-full"
          size="lg"
        >
          {loading ? (
            "Creating family..."
          ) : (
            <>
              <Users className="h-4 w-4 mr-2" />
              Create Family On-Chain
            </>
          )}
        </Button>

        {/* Status Message */}
        {status && (
          <div className={cn(
            "rounded-xl border p-4 text-sm",
            statusType === "success"
              ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
              : statusType === "error"
                ? "border-rose-500/30 bg-rose-950/40 text-rose-400"
                : "border-primary/30 bg-primary/10 text-primary"
          )}>
            {status}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
