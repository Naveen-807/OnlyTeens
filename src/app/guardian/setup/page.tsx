"use client";

import { GuardianPolicySetup } from "@/components/GuardianPolicySetup";
import { useAuthStore } from "@/store/authStore";

export default function GuardianSetupPage() {
  const { session, family } = useAuthStore();
  const familyId = family?.familyId;
  const teenAddress = family?.teenAddress;

  return (
    <GuardianPolicySetup
      onSubmit={async (policy) => {
        if (!session || !familyId || !teenAddress) {
          throw new Error("Missing session/family context");
        }
        const res = await fetch("/api/policy/set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            familyId,
            teenAddress,
            ...policy,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Policy set failed");
      }}
    />
  );
}
