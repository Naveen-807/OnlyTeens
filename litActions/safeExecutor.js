async function main({
  action,
  policyDecision,
  guardianApproved,
  amount,
  familyId,
  pkpId,
  sigName,
  vincentGuardrailsPassed,
}) {
  if (policyDecision === "BLOCKED") {
    return {
      signed: false,
      reason: "BLOCKED by family policy. No execution permitted.",
      action,
      familyId,
      policyDecision,
      layers: ["zama-policy"],
      timestamp: Date.now(),
    };
  }

  if (!vincentGuardrailsPassed) {
    return {
      signed: false,
      reason: "Vincent guardrails rejected this action.",
      action,
      familyId,
      layers: ["vincent-guardrails"],
      timestamp: Date.now(),
    };
  }

  if (policyDecision === "RED" && !guardianApproved) {
    return {
      signed: false,
      reason: "RED action requires guardian approval before execution.",
      action,
      familyId,
      policyDecision,
      requiresApproval: true,
      layers: ["zama-policy", "lit-safe-executor"],
      timestamp: Date.now(),
    };
  }

  if (policyDecision === "YELLOW" && !guardianApproved) {
    return {
      signed: false,
      reason: "YELLOW action needs guardian review.",
      action,
      familyId,
      policyDecision,
      requiresApproval: true,
      layers: ["zama-policy", "lit-safe-executor"],
      timestamp: Date.now(),
    };
  }

  const wallet = new ethers.Wallet(await Lit.Actions.getPrivateKey({ pkpId }));
  const signature = await wallet.signMessage(
    JSON.stringify({
      sigName,
      action,
      familyId,
      policyDecision,
      guardianApproved,
      amount,
    }),
  );

  return {
    signed: true,
    action,
    familyId,
    policyDecision,
    guardianApproved: guardianApproved || policyDecision === "GREEN",
    amount,
    sigName,
    signature,
    layers: ["zama-policy", "vincent-guardrails", "lit-safe-executor"],
    timestamp: Date.now(),
  };
}
