import { expect } from "chai";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readText(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

describe("Repo health and safety wiring", function () {
  it("keeps repo verification scripts and TypeScript config aligned", function () {
    const packageJson = readJson<{
      scripts?: Record<string, string>;
    }>("package.json");
    const tsconfig = readJson<{
      include?: string[];
      exclude?: string[];
    }>("tsconfig.json");
    const tsconfigCheck = readJson<{
      include?: string[];
      exclude?: string[];
    }>("tsconfig.check.json");

    expect(packageJson.scripts?.verify).to.equal("node scripts/verify.mjs");
    expect(packageJson.scripts?.["verify:strict"]).to.equal(
      "node scripts/verify.mjs && node --import tsx scripts/preflight.ts",
    );
    expect(packageJson.scripts?.preflight).to.equal("node --import tsx scripts/preflight.ts");

    expect(tsconfig.include).to.include("src/**/*.ts");
    // Next.js 15 auto-generates .next/types includes for type checking - this is expected
    expect(tsconfig.exclude).to.include(".next");
    expect(tsconfigCheck.include).to.include("src/**/*.ts");
    expect(tsconfigCheck.exclude).to.include(".next");
  });

  it("keeps the executor authority split and onboarding bootstrap wired", function () {
    const savingsFlow = readText("src/lib/orchestration/savingsFlow.ts");
    const subscriptionFlow = readText("src/lib/orchestration/subscriptionFlow.ts");
    const onboarding = readText("src/app/api/onboarding/family/route.ts");
    const phoneVerify = readText("src/app/api/auth/phone/verify/route.ts");

    expect(savingsFlow).to.include("getClawrenceAccount(");
    expect(savingsFlow).to.include("params.familyId");
    expect(savingsFlow).to.include("recordAction(");
    expect(savingsFlow).to.include("clawrenceAccount");
    expect(savingsFlow).to.include("isRecurring: params.isRecurring");

    expect(subscriptionFlow).to.include("getClawrenceAccount(");
    expect(subscriptionFlow).to.include('decision === "GREEN"');
    expect(subscriptionFlow).to.include("createSubscriptionSchedule");
    expect(subscriptionFlow).to.include("recordAction(");
    expect(subscriptionFlow).to.include("guardianApproved: true");

    expect(onboarding).to.include("mintClawrencePKP");
    expect(onboarding).to.include("guardianPkpPublicKey");
    expect(onboarding).to.include("teenPkpPublicKey");
    expect(onboarding).to.include("clawrencePkpPublicKey");

    expect(phoneVerify).to.include("getOrCreatePhoneSession");
    expect(phoneVerify).to.include('authChannel: "phone-otp"');
    expect(phoneVerify).to.include("storedSession.address");
    expect(phoneVerify).to.include("storedSession.pkpAddress");
  });

  it("keeps the policy contract encrypted evaluation path in place", function () {
    const policy = readText("contracts/Proof18Policy.sol");

    expect(policy).to.include("latestDecisionHandles");
    expect(policy).to.include("getGuardianLatestDecisionView");
    expect(policy).to.include("getServerLatestDecisionView");
    expect(policy).to.include("FHE.select");
    expect(policy).to.include("FHE.allow(decisionEnc");
    expect(policy).to.include("PolicyEvaluated");
  });
});
