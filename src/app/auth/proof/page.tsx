import { PermissionsProof } from "@/components/PermissionsProof";

export default function AuthProofPage() {
  return (
    <main className="grain mx-auto min-h-screen max-w-5xl px-4 py-8">
      <PermissionsProof
        guardianPkpAddress="guardian-pkp-placeholder"
        teenPkpAddress="teen-pkp-placeholder"
        clawrencePkpAddress="clawrence-pkp-placeholder"
        safeExecutorCid={process.env.NEXT_PUBLIC_SAFE_EXECUTOR_CID || "safe-executor-cid-placeholder"}
        permittedScopes={["PersonalSign", "LitAction"]}
        proof={{
          zamaDecision: "YELLOW",
          guardrailDecision: "REVIEW",
          guardrailReason: "This page is a static proof preview while the flow boots.",
          litAuthorized: false,
          litActionCid: process.env.NEXT_PUBLIC_SAFE_EXECUTOR_CID || "safe-executor-cid-placeholder",
        }}
      />
    </main>
  );
}
