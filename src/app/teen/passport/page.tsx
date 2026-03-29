"use client";

import { PassportCard } from "@/components/PassportCard";
import { useAuthStore } from "@/store/authStore";

export default function TeenPassportPage() {
  const { passport } = useAuthStore();

  if (!passport) {
    return <div className="text-sm text-gray-600">No passport loaded yet.</div>;
  }

  return <PassportCard passport={passport} />;
}
