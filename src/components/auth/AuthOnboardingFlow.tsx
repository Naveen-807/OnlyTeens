"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, MailCheck, PhoneCall, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PermissionsProof } from "@/components/PermissionsProof";
import { useAuthStore } from "@/store/authStore";
import type { Role } from "@/lib/types";

const roleMeta: Record<Role, { title: string; subtitle: string; target: string }> = {
  guardian: {
    title: "Guardian",
    subtitle: "Set rules, review approvals, and keep the executor bounded.",
    target: "/guardian",
  },
  teen: {
    title: "Teen",
    subtitle: "Save, subscribe, and build your passport with guardrails.",
    target: "/teen",
  },
  executor: {
    title: "Executor",
    subtitle: "Internal only. Clawrence runs through the locked signing path.",
    target: "/guardian",
  },
};

export function AuthOnboardingFlow() {
  const router = useRouter();
  const { hydrateBootstrap } = useAuthStore();
  const [role, setRole] = useState<Role>("guardian");
  const [phoneNumber, setPhoneNumber] = useState("+1 555 010 2000");
  const [familyId, setFamilyId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [demoCode, setDemoCode] = useState<string | undefined>();
  const [step, setStep] = useState<"select" | "otp" | "verified">("select");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>(
    "Choose a role, request a demo OTP, then verify to bootstrap a real session."
  );
  const [proof, setProof] = useState<any>(null);

  const roleInfo = useMemo(() => roleMeta[role], [role]);

  const requestOtp = async () => {
    setLoading(true);
    setStatus("Requesting demo OTP...");
    try {
      const res = await fetch("/api/auth/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          role,
          familyId: familyId || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to send OTP");
      setChallengeId(data.challengeId);
      setMaskedPhone(data.maskedPhone);
      setDemoCode(data.demoCode);
      setStep("otp");
      setStatus(
        data.demoCode
          ? `Demo OTP for ${data.maskedPhone}: ${data.demoCode}`
          : `OTP sent to ${data.maskedPhone}.`
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!challengeId) return;
    setLoading(true);
    setStatus("Verifying code and minting the session...");
    try {
      const res = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          code: otp,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "OTP verification failed");

      hydrateBootstrap({
        session: data.session,
        family: data.bootstrap?.family ?? null,
        balances: data.bootstrap?.balances ?? null,
        passport: data.bootstrap?.passport ?? null,
        pendingApprovals: data.bootstrap?.pendingApprovals ?? [],
      });
      setProof({
        zamaDecision: data.bootstrap?.passport ? "GREEN" : "YELLOW",
        guardrailDecision: "REVIEW",
        guardrailReason:
          "Guardrail API not yet wired; using placeholder from the auth surface.",
        litAuthorized: true,
        litActionCid: data.session?.authMethod?.authMethodId || "",
        flowTxHash: undefined,
        flowExplorerUrl: undefined,
        storachaCid: data.bootstrap?.pendingApprovals?.[0]?.storachaCid,
        storachaUrl: undefined,
      });
      setStatus(
        data.bootstrap?.needsOnboarding
          ? data.bootstrap.onboardingMessage || "Session ready. Continue onboarding."
          : "Session ready. Family context loaded."
      );
      setStep("verified");
      router.push(roleInfo.target);
    } catch (error: any) {
      setStatus(error?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const useGoogleFallback = () => {
    setStatus(
      "Google fallback remains available through the existing /api/auth/guardian and /api/auth/teen routes."
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="overflow-hidden p-6">
        <div className="flex items-center gap-2">
          <Badge className="border-primary/20 bg-primary/10 text-primary">
            Phone OTP demo
          </Badge>
          <Badge>{roleInfo.title}</Badge>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          {roleInfo.title} onboarding without the external auth dependency.
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Request a demo OTP, verify it locally, mint a Lit-backed PKP, and
          bootstrap the session into the existing app.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {(["guardian", "teen", "executor"] as Role[]).map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => setRole(candidate)}
              className={`rounded-[1.2rem] border p-4 text-left transition ${
                role === candidate
                  ? "border-primary/40 bg-primary/10"
                  : "border-border/70 bg-white/70 hover:bg-white"
              }`}
            >
              <p className="text-sm font-semibold capitalize">{candidate}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {roleMeta[candidate].subtitle}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 rounded-[1.5rem] border border-border/70 bg-secondary/30 p-4">
          <label className="grid gap-2 text-sm font-medium">
            Phone number
            <input
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
              placeholder="+1 555 010 2000"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Family ID for bootstrap
            <input
              value={familyId}
              onChange={(event) => setFamilyId(event.target.value)}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
              placeholder="Optional for guardian/teen sessions"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={requestOtp} disabled={loading}>
            {loading && step === "select" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PhoneCall className="h-4 w-4" />
            )}
            Request OTP
          </Button>
          <Button variant="outline" onClick={useGoogleFallback}>
            <MailCheck className="h-4 w-4" />
            Google fallback
          </Button>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-white/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Verification
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{status}</p>
          {maskedPhone ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Code was sent to {maskedPhone}
            </p>
          ) : null}

          {step !== "select" ? (
            <div className="mt-4 flex gap-3">
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm outline-none"
                placeholder="Enter 6-digit code"
              />
              <Button onClick={verifyOtp} disabled={loading || otp.length < 4}>
                {loading && step === "otp" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Verify
              </Button>
            </div>
          ) : null}

          {demoCode ? (
            <div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 p-3 text-xs text-amber-900">
              Demo code: <span className="font-mono font-semibold">{demoCode}</span>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Onboarding funnel
          </p>
          <div className="mt-4 space-y-3">
            {[
              {
                title: "Role selection",
                icon: <Lock className="h-4 w-4" />,
                active: step === "select",
              },
              {
                title: "OTP request",
                icon: <PhoneCall className="h-4 w-4" />,
                active: step === "otp",
              },
              {
                title: "Session bootstrap",
                icon: <MailCheck className="h-4 w-4" />,
                active: step === "verified",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`flex items-center justify-between rounded-[1.1rem] border px-4 py-3 ${
                  item.active
                    ? "border-primary/30 bg-primary/10"
                    : "border-border/70 bg-white/70"
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {item.active ? "current" : "pending"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <PermissionsProof
          guardianPkpAddress={proof?.guardianPkpAddress || "guardian-pkp-placeholder"}
          teenPkpAddress={proof?.teenPkpAddress || "teen-pkp-placeholder"}
          clawrencePkpAddress={proof?.clawrencePkpAddress || "clawrence-pkp-placeholder"}
          safeExecutorCid={proof?.litActionCid || "safe-executor-cid-placeholder"}
          permittedScopes={["PersonalSign", "LitAction"]}
          proof={proof || undefined}
        />
      </div>
    </div>
  );
}
