import "server-only";

import type {
  ApprovalMode,
  ExecutionLane,
  FlowMedium,
  PolicyMode,
  Role,
  SchedulerBackend,
  TransactionActor,
  UserSession,
} from "@/lib/types";

export function roleToTransactionActor(role?: Role): TransactionActor {
  if (role === "guardian") return "guardian";
  if (role === "teen") return "teen";
  return "calma";
}

export function derivePolicyMode(source?: "encrypted" | "heuristic"): PolicyMode {
  return source === "encrypted" ? "encrypted-live" : "degraded";
}

export function buildLaneMetadata(params: {
  session?: UserSession;
  executionLane: ExecutionLane;
  approvalMode?: ApprovalMode;
  transactionActor?: TransactionActor;
  policyMode?: PolicyMode;
  guardianAutopilotEnabled?: boolean;
}): {
  executionLane: ExecutionLane;
  transactionActor: TransactionActor;
  approvalMode: ApprovalMode;
  policyMode: PolicyMode;
  flowMedium: FlowMedium;
  guardianAutopilotEnabled: boolean;
} {
  return {
    executionLane: params.executionLane,
    transactionActor:
      params.transactionActor || roleToTransactionActor(params.session?.role),
    approvalMode:
      params.approvalMode ||
      (params.executionLane === "guardian-autopilot-flow" ? "guardian-autopilot" : "none"),
    policyMode:
      params.policyMode ||
      (params.executionLane === "direct-flow" ? "degraded" : "encrypted-live"),
    flowMedium: "FLOW",
    guardianAutopilotEnabled: Boolean(params.guardianAutopilotEnabled),
  };
}

export function isAutopilotBackendHonest(schedulerBackend: SchedulerBackend) {
  return schedulerBackend === "flow-native-scheduled"
    ? "flow-native-scheduled"
    : "evm-manual";
}
