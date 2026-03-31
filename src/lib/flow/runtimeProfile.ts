import "server-only";

import { isGaslessEnabled } from "@/lib/flow/gasless";
import { getFlowSchedulingRuntime } from "@/lib/flow/scheduler";
import type { GasMode, SchedulerBackend, WalletMode } from "@/lib/types";

export function getFlowRuntimeProfile(): {
  gasMode: GasMode;
  walletMode: WalletMode;
  schedulerBackend: SchedulerBackend;
  nativeSchedulingConfigured: boolean;
  flowNativeFeaturesUsed: string[];
} {
  const scheduling = getFlowSchedulingRuntime();
  const gasMode = isGaslessEnabled() ? "sponsored" : "user-funded";
  const walletMode = "app-managed";

  return {
    gasMode,
    walletMode,
    schedulerBackend: scheduling.preferredSchedulerBackend,
    nativeSchedulingConfigured: scheduling.nativeSchedulingConfigured,
    flowNativeFeaturesUsed: [
      "walletless-onboarding",
      ...(gasMode === "sponsored" ? ["sponsored-gas"] : []),
      ...(scheduling.nativeSchedulingConfigured ? ["scheduled-transactions"] : []),
    ],
  };
}
