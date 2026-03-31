export function withCalmaAliases<T extends Record<string, any>>(value: T): T & Record<string, any> {
  if (!value || typeof value !== "object") return value;

  const output: Record<string, any> = { ...value };

  if (output.clawrence && !output.calma) {
    output.calma = output.clawrence;
  }
  if (output.clawrenceExplanation && !output.calmaExplanation) {
    output.calmaExplanation = output.clawrenceExplanation;
  }
  if (output.clawrencePreExplanation && !output.calmaPreExplanation) {
    output.calmaPreExplanation = output.clawrencePreExplanation;
  }
  if (output.clawrenceGuardianExplanation && !output.calmaGuardianExplanation) {
    output.calmaGuardianExplanation = output.clawrenceGuardianExplanation;
  }

  if (output.approvalRequest && typeof output.approvalRequest === "object") {
    output.approvalRequest = withCalmaAliases(output.approvalRequest);
  }

  return output as T & Record<string, any>;
}
