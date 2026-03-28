"use client";

import { TeenDashboard } from "@/components/TeenDashboard";
import { useAuthStore } from "@/store/authStore";
import { useFamilyStore } from "@/store/familyStore";

export default function TeenHomePage() {
  const { session } = useAuthStore();
  const { balances, passport } = useFamilyStore();

  const teenName = "Teen";

  return (
    <TeenDashboard
      teenName={teenName}
      passportLevel={passport?.level ?? 0}
      passportLevelName={passport?.levelName ?? "Starter"}
      passportStreak={passport?.weeklyStreak ?? 0}
      progressToNext={{
        current: passport?.progressToNext.current ?? 0,
        needed: passport?.progressToNext.needed ?? 5,
        nextLevelName: passport?.progressToNext.nextLevelName ?? "Explorer",
      }}
      spendBalance={balances?.spendable ?? "0"}
      savingsBalance={balances?.savings ?? "0"}
      subscriptionReserve={balances?.subscriptionReserve ?? "0"}
      currency="₹"
      recentActivity={[]}
      upcomingSubscriptions={[]}
    />
  );
}

