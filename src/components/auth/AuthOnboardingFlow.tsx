"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Lock,
  MailCheck,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";

import { PermissionsProof } from "@/components/PermissionsProof";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import type { Role } from "@/lib/types";

const roleMeta: Record<
  Role,
  { title: string; subtitle: string; kicker: string; target: string }
> = {
  guardian: {
    title: "Guardian",
    subtitle: "Set household rules, review approvals, and keep the executor bounded.",
    kicker: "Authority surface",
    target: "/guardian",
  },
  teen: {
    title: "Teen",
    subtitle: "Save, subscribe, and build a passport inside a controlled financial lane.",
    kicker: "Autonomy surface",
    target: "/teen",
  },
  executor: {
    title: "Executor",
    subtitle: "Internal-only path for the Calma execution layer and signing flow.",
    kicker: "Internal surface",
    target: "/guardian",
  },
};

const stepMeta = [
  { id: "select", label: "Role selection" },
  { id: "otp", label: "OTP request" },
  { id: "verified", label: "Session bootstrap" },
] as const;

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
  const [status, setStatus] = useState(
    "Choose a role, request a demo OTP, then verify to bootstrap a real session.",
  );
  const [proof, setProof] = useState<any>(null);
  const [vincentMode, setVincentMode] = useState<"live" | "blocked" | "unknown">("unknown");

  const roleInfo = useMemo(() => roleMeta[role], [role]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/runtime/capabilities")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        const mode = data?.capabilities?.vincent?.mode;
        setVincentMode(mode === "live" ? "live" : mode === "blocked" ? "blocked" : "unknown");
      })
      .catch(() => {
        if (!mounted) return;
        setVincentMode("unknown");
      });

    return () => {
      mounted = false;
    };
  }, []);

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
          : `OTP sent to ${data.maskedPhone}.`,
      );
    } catch (error: any) {
      setStatus(error?.message || "Failed to request OTP");
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
        guardrailDecision: vincentMode === "live" ? "ALLOW" : "REVIEW",
        guardrailReason:
          vincentMode === "live"
            ? "Vincent live mode is available for execution checks."
            : "Vincent live mode is not ready yet, so execution remains blocked.",
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
          : "Session ready. Family context loaded.",
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
      "Use the canonical phone OTP endpoints. Legacy guardian/teen auth routes are no longer part of the active onboarding path.",
    );
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
      <Card className="rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Phone OTP demo</Badge>
          <Badge variant="secondary">{roleInfo.kicker}</Badge>
          <Badge variant="outline">{roleInfo.title}</Badge>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-primary/75">
              Auth funnel
            </p>
            <h1 className="font-display mt-4 max-w-3xl text-[clamp(2.9rem,6vw,4.9rem)] leading-[0.9] tracking-[-0.05em] text-foreground">
              {roleInfo.title} onboarding without the cheap-looking handoff.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Request a demo OTP, verify it locally, bootstrap the delegated
              execution surface, and drop the user into the live family context
              with policy and proof views ready.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {(["guardian", "teen", "executor"] as Role[]).map((candidate) => {
                const isActive = role === candidate;

                return (
                  <button
                    key={candidate}
                    type="button"
                    onClick={() => setRole(candidate)}
                    className={[
                      "rounded-[1.5rem] border px-4 py-4 text-left transition",
                      isActive
                        ? "border-primary/40 bg-primary/10 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.05)]"
                        : "border-border/60 bg-background/30 hover:border-primary/20 hover:bg-background/55",
                    ].join(" ")}
                  >
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      {roleMeta[candidate].kicker}
                    </p>
                    <p className="mt-3 font-display text-2xl leading-none tracking-[-0.04em] text-foreground capitalize">
                      {candidate}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {roleMeta[candidate].subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-primary/20 bg-[linear-gradient(180deg,oklch(0.12_0.01_85),oklch(0.08_0.006_85))] p-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary/75">
              Current route
            </p>
            <p className="font-display mt-4 text-4xl leading-none tracking-[-0.05em] text-gold-gradient">
              {roleInfo.title}
            </p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {roleInfo.subtitle}
            </p>

            <div className="mt-6 space-y-3">
              {stepMeta.map((item, index) => {
                const isCurrent = step === item.id;
                const isComplete =
                  (item.id === "select" && step !== "select") ||
                  (item.id === "otp" && step === "verified");

                return (
                  <div
                    key={item.id}
                    className={[
                      "flex items-center justify-between rounded-[1.2rem] border px-4 py-3",
                      isCurrent
                        ? "border-primary/35 bg-primary/10"
                        : isComplete
                          ? "border-emerald-500/25 bg-emerald-950/30"
                          : "border-border/55 bg-background/35",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-current/20 text-xs font-semibold text-primary">
                        0{index + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {isCurrent ? "current" : isComplete ? "ready" : "pending"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <div className="rounded-[1.7rem] border border-border/60 bg-background/28 p-5">
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Phone number
                </span>
                <input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  className="h-[52px] rounded-[1.1rem] border border-border/70 bg-card/70 px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/45 focus:ring-2 focus:ring-primary/15"
                  placeholder="+1 555 010 2000"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Family ID for bootstrap
                </span>
                <input
                  value={familyId}
                  onChange={(event) => setFamilyId(event.target.value)}
                  className="h-[52px] rounded-[1.1rem] border border-border/70 bg-card/70 px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/45 focus:ring-2 focus:ring-primary/15"
                  placeholder="Optional for guardian or teen sessions"
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
          </div>

          <div className="rounded-[1.7rem] border border-border/60 bg-background/18 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Verification console
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Status, demo code, and session verification all stay inside one
                  premium control surface.
                </p>
              </div>
              <Lock className="h-4 w-4 text-primary" />
            </div>

            <div className="mt-5 rounded-[1.3rem] border border-border/60 bg-card/70 p-4">
              <p className="text-sm leading-6 text-foreground/90">{status}</p>
              {maskedPhone ? (
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Code sent to {maskedPhone}
                </p>
              ) : null}
              {demoCode ? (
                <div className="mt-4 rounded-[1rem] border border-primary/25 bg-primary/8 px-4 py-3">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary/75">
                    Demo code
                  </p>
                  <p className="mt-2 font-mono text-xl tracking-[0.28em] text-gold-gradient">
                    {demoCode}
                  </p>
                </div>
              ) : null}
            </div>

            {step !== "select" ? (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="h-[52px] min-w-0 flex-1 rounded-[1.1rem] border border-border/70 bg-card/70 px-4 font-mono text-sm tracking-[0.24em] text-foreground outline-none transition placeholder:tracking-normal placeholder:text-muted-foreground focus:border-primary/45 focus:ring-2 focus:ring-primary/15"
                placeholder="Enter 6-digit code"
                inputMode="numeric"
                maxLength={6}
              />
                <Button onClick={verifyOtp} disabled={loading || otp.length !== 6}>
                  {loading && step === "otp" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Verify
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        <PermissionsProof
          guardianPkpAddress={proof?.guardianPkpAddress || "guardian-pkp-placeholder"}
          teenPkpAddress={proof?.teenPkpAddress || "teen-pkp-placeholder"}
          clawrencePkpAddress={proof?.clawrencePkpAddress || "clawrence-pkp-placeholder"}
          safeExecutorCid={proof?.litActionCid || "safe-executor-cid-placeholder"}
          permittedScopes={["PersonalSign", "LitAction"]}
          vincentMode={vincentMode}
          proof={proof || undefined}
          className="rounded-[2rem]"
        />
      </div>
    </div>
  );
}
