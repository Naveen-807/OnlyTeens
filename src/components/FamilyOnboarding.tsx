"use client";

import { useState } from "react";

import { PhoneOtpAuthCard } from "@/components/PhoneOtpAuthCard";
import { useAuthStore } from "@/store/authStore";
import type { UserSession } from "@/lib/types";

export function FamilyOnboarding() {
  const login = useAuthStore((state) => state.login);
  const [guardianSession, setGuardianSession] = useState<UserSession | null>(null);
  const [teenSession, setTeenSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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
        pkpPublicKey: guardianSession.pkpPublicKey,
        pkpTokenId: guardianSession.pkpTokenId,
        pkpAddress: guardianSession.pkpAddress,
        phoneNumber: guardianSession.phoneNumber,
        authMethod: guardianSession.authMethod,
        address: guardianSession.address,
      });

      const familyId = onboardingData.family?.familyId || guardianSession.familyId;
      setStatus(
        `Family onboarded successfully${familyId ? `: ${familyId}` : ""}. Guardian session is now active.`,
      );
    } catch (error: any) {
      setStatus(error?.message || "Family onboarding failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Real onboarding
        </p>
        <h3 className="mt-1 text-base font-semibold text-gray-900">
          Create a real family
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Verify guardian and teen phone numbers with SMS OTP, then register
          the family on-chain and in durable storage.
        </p>
      </div>

      <div className="space-y-4">
        <PhoneOtpAuthCard
          role="guardian"
          title="Guardian login"
          subtitle="Verify the guardian phone number first."
          familyId={guardianSession?.familyId || ""}
          submitLabel="Store guardian session"
          onSession={async (session) => {
            setGuardianSession(session);
            setStatus("Guardian verified. Now verify the teen phone.");
          }}
        />

        <PhoneOtpAuthCard
          role="teen"
          title="Teen login"
          subtitle="Verify the teen phone number."
          familyId={teenSession?.familyId || ""}
          submitLabel="Store teen session"
          onSession={async (session) => {
            setTeenSession(session);
            setStatus("Teen verified. Ready to create the family.");
          }}
        />

        <button
          onClick={submit}
          disabled={loading || !guardianSession || !teenSession}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating family..." : "Create family on-chain"}
        </button>

        {status ? (
          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            {status}
          </div>
        ) : null}
      </div>
    </div>
  );
}
