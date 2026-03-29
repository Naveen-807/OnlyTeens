"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { GuardianPolicySetup } from "@/components/GuardianPolicySetup";
import { LoginButton } from "@/components/LoginButton";
import type { UserSession } from "@/lib/types";
import type { OnboardingState } from "@/lib/types/onboarding";
import { useAuthStore } from "@/store/authStore";

const STEPS: Array<{ key: OnboardingState["step"]; label: string }> = [
  { key: "guardian-auth", label: "Guardian Auth" },
  { key: "invite-teen", label: "Invite Teen" },
  { key: "teen-auth", label: "Teen Auth" },
  { key: "create-family", label: "Create Family" },
  { key: "set-policy", label: "Set Policy" },
  { key: "complete", label: "Complete" },
];

export default function GuardianOnboardingPage() {
  const router = useRouter();
  const authStore = useAuthStore();
  const [state, setState] = useState<OnboardingState>({ step: "guardian-auth" });
  const [guardianSession, setGuardianSession] = useState<UserSession | null>(
    authStore.session?.role === "guardian" ? authStore.session : null,
  );
  const [teenSession, setTeenSession] = useState<UserSession | null>(null);
  const [submittingFamily, setSubmittingFamily] = useState(false);
  const [onchainDetails, setOnchainDetails] = useState<Record<string, any> | null>(null);

  const inviteLink = useMemo(() => {
    if (!guardianSession || typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.pathname = "/";
    url.searchParams.set("role", "teen");
    return url.toString();
  }, [guardianSession]);

  const stepIndex = STEPS.findIndex((step) => step.key === state.step);

  const handleGuardianSuccess = (data: any) => {
    setGuardianSession(data.session);
    setState((current) => ({
      ...current,
      step: "invite-teen",
      guardianAddress: data.session.address,
      guardianPkpPublicKey: data.session.pkpPublicKey,
      guardianPkpTokenId: data.session.pkpTokenId,
      error: undefined,
    }));
  };

  const handleTeenSuccess = (data: any) => {
    setTeenSession(data.session);
    setState((current) => ({
      ...current,
      step: "create-family",
      teenAddress: data.session.address,
      teenPkpPublicKey: data.session.pkpPublicKey,
      teenPkpTokenId: data.session.pkpTokenId,
      error: undefined,
    }));
  };

  const handleCreateFamily = async () => {
    if (!guardianSession || !teenSession) return;
    setSubmittingFamily(true);
    try {
      const response = await fetch("/api/onboarding/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianSession, teenSession }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create family");
      }

      useAuthStore.getState().setFamilyContext(data.family);
      await useAuthStore.getState().refreshState();
      setOnchainDetails(data.onchain || null);
      setState((current) => ({
        ...current,
        step: "set-policy",
        familyId: data.family.familyId,
        teenAddress: data.family.teenAddress,
        clawrenceAddress: data.family.clawrenceAddress,
        clawrencePkpPublicKey: data.family.clawrencePkpPublicKey,
        clawrencePkpTokenId: data.family.clawrencePkpTokenId,
        passportCreated: Boolean(data.onchain?.passportCreation),
      }));
    } catch (error: any) {
      setState((current) => ({ ...current, error: error?.message || "Family creation failed" }));
    } finally {
      setSubmittingFamily(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Guardian Onboarding</h1>
        <p className="text-sm text-slate-600">
          Authenticate both family members, encrypt the family policy, mint the dedicated
          Clawrence executor, and register the family across Flow and Sepolia.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-6">
        {STEPS.map((step, index) => (
          <div
            key={step.key}
            className={`rounded-2xl border px-3 py-3 text-center text-xs font-medium ${
              index <= stepIndex
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-400"
            }`}
          >
            {step.label}
          </div>
        ))}
      </div>

      {state.step === "guardian-auth" ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <LoginButton role="guardian" onSuccess={handleGuardianSuccess} label="Guardian Google Sign-In" />
        </section>
      ) : null}

      {state.step === "set-policy" ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <GuardianPolicySetup
            onSubmit={async (policy) => {
              if (!guardianSession || !state.familyId || !state.teenAddress) {
                throw new Error("Family must be created before setting policy");
              }
              const res = await fetch("/api/policy/set", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  familyId: state.familyId,
                  teenAddress: state.teenAddress,
                  ...policy,
                }),
              });
              const data = await res.json();
              if (!data.success) throw new Error(data.error || "Policy set failed");
              setState((current) => ({ ...current, step: "complete", policySet: true }));
            }}
          />
        </section>
      ) : null}

      {state.step === "invite-teen" ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Invite your teen</h2>
          <p className="mt-2 text-sm text-slate-600">
            Share this link or have them continue on this device. Their login creates the teen PKP
            session used in the final family registration step.
          </p>
          <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
            <div className="font-medium text-slate-900">Invite link</div>
            <div className="mt-2 break-all font-mono text-xs">
              {inviteLink || "Open the home page and choose Teen."}
            </div>
          </div>
          <button
            onClick={() => setState((current) => ({ ...current, step: "teen-auth" }))}
            className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Continue to teen authentication
          </button>
        </section>
      ) : null}

      {state.step === "teen-auth" ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <LoginButton role="teen" onSuccess={handleTeenSuccess} label="Teen Google Sign-In" />
        </section>
      ) : null}

      {state.step === "create-family" ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Create the family</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Guardian session
              </div>
              <div className="mt-2 break-all font-mono text-xs text-slate-700">
                {guardianSession?.address}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Teen session
              </div>
              <div className="mt-2 break-all font-mono text-xs text-slate-700">
                {teenSession?.address}
              </div>
            </div>
          </div>
          <button
            onClick={handleCreateFamily}
            disabled={submittingFamily}
            className="mt-6 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submittingFamily ? "Registering family..." : "Register family on-chain"}
          </button>
          {state.error ? <div className="mt-3 text-sm text-red-600">{state.error}</div> : null}
        </section>
      ) : null}

      {state.step === "complete" ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-emerald-900">Family created</h2>
          <div className="mt-3 space-y-2 text-sm text-emerald-900">
            <div><strong>Family ID:</strong> {state.familyId}</div>
            <div><strong>Clawrence PKP:</strong> {state.clawrenceAddress}</div>
            {onchainDetails?.familyRegistration?.txHash ? (
              <div><strong>Flow registration:</strong> {onchainDetails.familyRegistration.txHash}</div>
            ) : null}
            {onchainDetails?.policyAccessRegistration?.txHash ? (
              <div>
                <strong>Sepolia access registration:</strong> {onchainDetails.policyAccessRegistration.txHash}
              </div>
            ) : null}
          </div>
          <button
            onClick={() => router.push("/guardian")}
            className="mt-6 rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
          >
            Open guardian dashboard
          </button>
        </section>
      ) : null}
    </div>
  );
}
