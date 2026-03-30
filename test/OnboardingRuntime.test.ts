import { expect } from "chai";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readText(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function isHexPrivateKey(value: string): boolean {
  return /^(0x)?[0-9a-fA-F]{64}$/.test(value);
}

describe("Onboarding runtime guards", function () {
  it("keeps the private key validator strict and deterministic", function () {
    const privateKeyRuntime = readText("src/lib/runtime/privateKey.ts");

    expect(privateKeyRuntime).to.include("/^(0x)?[0-9a-fA-F]{64}$/");
    expect(privateKeyRuntime).to.include(
      'must be a 32-byte secp256k1 private key in hex format (0x-prefixed or 64 hex chars)',
    );

    expect(isHexPrivateKey("not-a-hex-key")).to.equal(false);
    expect(
      isHexPrivateKey("349a81a8c0d3d55dde0f615179f37021b9a296fc29d23199059959aace266dec"),
    ).to.equal(true);
    expect(
      isHexPrivateKey("0x349a81a8c0d3d55dde0f615179f37021b9a296fc29d23199059959aace266dec"),
    ).to.equal(true);
  });

  it("keeps family onboarding on the canonical phone auth endpoints", function () {
    const otpCard = readText("src/components/PhoneOtpAuthCard.tsx");

    expect(otpCard).to.include('/api/auth/phone/send');
    expect(otpCard).to.include('/api/auth/phone/verify');
    expect(otpCard).to.not.include('/api/auth/send-otp');
    expect(otpCard).to.not.include('/api/auth/guardian');
    expect(otpCard).to.not.include('/api/auth/teen');
  });
});
