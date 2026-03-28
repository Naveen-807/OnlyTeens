import { PolicyBadge } from "./PolicyBadge";

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
    (props.progressToNext.current / props.progressToNext.needed) * 100;

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Hey, {props.teenName} 👋</h1>
          <p className="text-sm text-gray-500">
            Passport Level {props.passportLevel}: {props.passportLevelName}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            🔥 {props.passportStreak} week streak
          </span>
        </div>
      </div>

      {/* Passport Progress */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
        <div className="flex justify-between text-sm mb-2">
          <span>{props.passportLevelName}</span>
          <span>{props.progressToNext.nextLevelName}</span>
        </div>
        <div className="w-full bg-white/30 rounded-full h-2.5">
          <div
            className="bg-white rounded-full h-2.5 transition-all duration-500"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs mt-1 opacity-80">
          {props.progressToNext.needed - props.progressToNext.current} actions
          to {props.progressToNext.nextLevelName}
        </p>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Spend</p>
          <p className="text-lg font-bold text-green-700">
            {props.currency}{props.spendBalance}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Saved</p>
          <p className="text-lg font-bold text-blue-700">
            {props.currency}{props.savingsBalance}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Subscriptions</p>
          <p className="text-lg font-bold text-purple-700">
            {props.currency}{props.subscriptionReserve}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: "💰", label: "Save", action: "save" },
          { icon: "📱", label: "Subscribe", action: "subscribe" },
          { icon: "💸", label: "Pay", action: "pay" },
          { icon: "🤖", label: "Ask CL", action: "chat" },
        ].map((item) => (
          <button
            key={item.action}
            className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Upcoming Subscriptions */}
      {props.upcomingSubscriptions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            Upcoming Payments
          </h3>
          {props.upcomingSubscriptions.map((sub: any) => (
            <div
              key={sub.id}
              className="flex justify-between items-center py-2 border-b"
            >
              <div>
                <p className="text-sm font-medium">{sub.name}</p>
                <p className="text-xs text-gray-400">{sub.nextDate}</p>
              </div>
              <span className="text-sm font-semibold">
                {props.currency}{sub.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
