const go = async () => {
  const {
    action,
    policyDecision,
    guardianApproved,
    amount,
    familyId,
    txData,
    publicKey,
    sigName,
  } = jsParams;

  if (policyDecision === "BLOCKED") {
    Lit.Actions.setResponse({
      response: JSON.stringify({
        signed: false,
        reason: "BLOCKED by family policy. No execution permitted.",
        action,
        familyId,
        policyDecision,
        timestamp: Date.now(),
      }),
    });
    return;
  }

  if (policyDecision === "RED" && !guardianApproved) {
    Lit.Actions.setResponse({
      response: JSON.stringify({
        signed: false,
        reason: "RED action requires guardian approval before execution.",
        action,
        familyId,
        policyDecision,
        requiresApproval: true,
        timestamp: Date.now(),
      }),
    });
    return;
  }

  if (policyDecision === "YELLOW" && !guardianApproved) {
    Lit.Actions.setResponse({
      response: JSON.stringify({
        signed: false,
        reason: "YELLOW action needs guardian review.",
        action,
        familyId,
        policyDecision,
        requiresApproval: true,
        timestamp: Date.now(),
      }),
    });
    return;
  }

  if (!Lit.Auth || Lit.Auth.authMethodContexts.length === 0) {
    Lit.Actions.setResponse({
      response: JSON.stringify({
        signed: false,
        reason: "No valid authentication context. Signing denied.",
        timestamp: Date.now(),
      }),
    });
    return;
  }

  try {
    await Lit.Actions.signEcdsa({
      toSign: txData,
      publicKey: publicKey,
      sigName: sigName,
    });

    Lit.Actions.setResponse({
      response: JSON.stringify({
        signed: true,
        action,
        familyId,
        policyDecision,
        guardianApproved: guardianApproved || policyDecision === "GREEN",
        amount,
        sigName,
        timestamp: Date.now(),
      }),
    });
  } catch (e) {
    Lit.Actions.setResponse({
      response: JSON.stringify({
        signed: false,
        reason: "Signing failed: " + e.message,
        action,
        familyId,
        timestamp: Date.now(),
      }),
    });
  }
};

go();
