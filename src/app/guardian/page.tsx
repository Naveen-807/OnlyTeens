"use client";

import Link from "next/link";

import { GuardianDashboard } from "@/components/GuardianDashboard";
import { useAuthStore } from "@/store/authStore";

export default function GuardianHomePage() {
  const { session, family, onboardingMessage } = useAuthStore();

  if (!session) {
    return null;
  }

  if (!family) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-xl font-semibold text-amber-950">Guardian onboarding required</h1>
          <p className="mt-2 text-sm text-amber-900">
            {onboardingMessage || "No family exists for this guardian yet."}
          </p>
          <Link
            href="/guardian/onboarding"
            className="mt-4 inline-flex rounded-full bg-amber-900 px-4 py-2 text-sm font-medium text-white"
          >
            Start onboarding
          </Link>
        </div>
      </div>
    );
  }

  return <GuardianDashboard />;
}
