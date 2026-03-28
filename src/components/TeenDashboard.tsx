"use client";

interface DashboardProps {
  teenName: string;
  passportLevel: number;
  passportLevelName: string;
  passportStreak: number;
  progressToNext: { current: number; needed: number; nextLevelName: string };
  spendBalance: string;
  savingsBalance: string;
  subscriptionReserve: string;
  currency: string;
  recentActivity: any[];
  upcomingSubscriptions: any[];
}

export function TeenDashboard(props: DashboardProps) {
  const progressPercent =
    props.progressToNext.needed > 0
      ? (props.progressToNext.current / props.progressToNext.needed) * 100
      : 0;

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Hey, {props.teenName} 👋</h1>
          <p className="text-sm text-gray-500">
            Passport Level {props.passportLevel}: {props.passportLevelName}
          </p>
        </div>
        <div className="text-right">
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
            🔥 {props.passportStreak} week streak
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
        <div className="mb-2 flex justify-between text-sm">
          <span>{props.passportLevelName}</span>
          <span>{props.progressToNext.nextLevelName}</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-white/30">
          <div
            className="h-2.5 rounded-full bg-white transition-all duration-500"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-xs opacity-80">
          {Math.max(props.progressToNext.needed - props.progressToNext.current, 0)} actions
          to {props.progressToNext.nextLevelName}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-green-50 p-3 text-center">
          <p className="text-xs text-gray-500">Spend</p>
          <p className="text-lg font-bold text-green-700">
            {props.currency}
            {props.spendBalance}
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 text-center">
          <p className="text-xs text-gray-500">Saved</p>
          <p className="text-lg font-bold text-blue-700">
            {props.currency}
            {props.savingsBalance}
          </p>
        </div>
        <div className="rounded-lg bg-purple-50 p-3 text-center">
          <p className="text-xs text-gray-500">Subscriptions</p>
          <p className="text-lg font-bold text-purple-700">
            {props.currency}
            {props.subscriptionReserve}
          </p>
        </div>
      </div>

      {props.upcomingSubscriptions.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-600">
            Upcoming Payments
          </h3>
          {props.upcomingSubscriptions.map((sub: any) => (
            <div
              key={sub.id}
              className="flex items-center justify-between border-b py-2"
            >
              <div>
                <p className="text-sm font-medium">{sub.name}</p>
                <p className="text-xs text-gray-400">{sub.nextDate}</p>
              </div>
              <span className="text-sm font-semibold">
                {props.currency}
                {sub.amount}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

