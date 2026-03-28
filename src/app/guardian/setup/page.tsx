"use client";

import { GuardianPolicySetup } from "@/components/GuardianPolicySetup";
import { useAuthStore } from "@/store/authStore";
import { useFamilyStore } from "@/store/familyStore";

export default function GuardianSetupPage() {
  const { session } = useAuthStore();
  const { familyId } = useFamilyStore();

  return (
    <GuardianPolicySetup
      onSubmit={async (policy) => {
        if (!session || !familyId) {
          throw new Error("Missing session or familyId");
        }
        const res = await fetch("/api/policy/set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            familyId,
            teenAddress: session.address,
            ...policy,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Policy set failed");
      }}
    />
  );
}

