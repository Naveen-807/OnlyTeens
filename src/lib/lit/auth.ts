import "server-only";

import { randomBytes } from "node:crypto";

import { privateKeyToAccount } from "viem/accounts";

import {
  generateAuthSigWithViem,
  createSiweMessage,
} from "@lit-protocol/auth-helpers";

import { normalizePrivateKeyEnv } from "@/lib/runtime/privateKey";
import type { Role, UserSession } from "@/lib/types";

let mintingAccount: ReturnType<typeof privateKeyToAccount> | null = null;

function getMintingAccount() {
  const key = normalizePrivateKeyEnv("LIT_MINTING_KEY", process.env.LIT_MINTING_KEY);
  if (!mintingAccount) {
    mintingAccount = privateKeyToAccount(key);
  }
  return mintingAccount;
}

export async function buildPhoneAuthContext(session: UserSession) {
  const account = getMintingAccount();
  const sessionKeyPair = {
    publicKey: `0x${randomBytes(32).toString("hex")}`,
    secretKey: `0x${randomBytes(32).toString("hex")}`,
  };
  const phoneNumber = session.phoneNumber || "";
  const role = session.role;
  const authMethodId =
    session.authMethod?.authMethodId ||
    `${role}:${phoneNumber || session.address.toLowerCase()}`;

  const authData = {
    authMethodType: 11,
    authMethodId,
    accessToken: phoneNumber || session.address,
    metadata: {
      provider: session.authProvider || "twilio-verify",
      phoneNumber,
      role,
      verificationSid: session.verificationSid || "",
      familyId: session.familyId || "",
    },
  };

  const authContext = {
    account,
    authenticator: account,
    authData,
    sessionKeyPair,
    authConfig: {
      resources: [
        ["pkp-signing", "*"],
        ["lit-action-execution", "*"],
      ],
      expiration: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      statement: `Proof18 ${role} phone session`,
      domain: "localhost",
    },
    authNeededCallback: async () => {
      const toSign = await createSiweMessage({
        walletAddress: account.address,
        statement: `Proof18 ${role} phone session`,
        uri: "https://proof18.local/login",
        domain: "proof18.local",
        nonce: `${session.phoneNumber || session.address}-${Date.now()}`,
      });
      return generateAuthSigWithViem({
        account,
        address: account.address,
        toSign,
      });
    },
  };

  return {
    authContext,
    authData,
  };
}
