"use client";

import { PassportCard } from "@/components/PassportCard";
import { useFamilyStore } from "@/store/familyStore";

export default function TeenPassportPage() {
  const { passport } = useFamilyStore();

  if (!passport) {
    return <div className="text-sm text-gray-600">No passport loaded yet.</div>;
  }

  return <PassportCard passport={passport} />;
}

