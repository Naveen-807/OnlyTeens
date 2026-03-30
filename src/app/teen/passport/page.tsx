"use client";

import { AuthEntry } from "@/components/AuthEntry";
import { PassportCard } from "@/components/PassportCard";
import { useAuthStore } from "@/store/authStore";

export default function TeenPassportPage() {
  const { passport, session } = useAuthStore();

  if (!passport) {
    if (!session) {
      return (
        <div className="mx-auto max-w-md p-4">
          <AuthEntry role="teen" />
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-md rounded-lg border border-dashed p-4 text-sm text-gray-600">
        No passport loaded yet. Refresh after the family session bootstraps.
      </div>
    );
  }

  return <PassportCard passport={passport} />;
}
