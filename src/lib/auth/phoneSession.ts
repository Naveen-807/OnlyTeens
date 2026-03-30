import "server-only";

import fs from "fs";
import path from "path";

import { privateKeyToAccount } from "viem/accounts";
import { keccak256, stringToBytes } from "viem";

import { getStoredFlowWallet } from "@/lib/flow/walletSession";
import { getLitClient } from "@/lib/lit/client";
import { normalizeVerifiedPhone } from "@/lib/auth/twilio";
import type { Role, UserSession } from "@/lib/types";

type StoredPhoneSession = {
  phoneNumber: string;
  role: Role;
  phoneKey: string;
  flowAddress: string;
  pkpPublicKey: string;
  pkpTokenId: string;
  pkpAddress: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const PHONE_SESSIONS_FILE = path.join(DATA_DIR, "phone-sessions.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PHONE_SESSIONS_FILE)) {
    fs.writeFileSync(PHONE_SESSIONS_FILE, "{}");
  }
}

function loadStore(): Record<string, StoredPhoneSession> {
  ensureStore();
  return JSON.parse(fs.readFileSync(PHONE_SESSIONS_FILE, "utf8"));
}

function saveStore(store: Record<string, StoredPhoneSession>) {
  ensureStore();
  fs.writeFileSync(PHONE_SESSIONS_FILE, JSON.stringify(store, null, 2));
}

function sessionKey(role: Role, phoneNumber: string) {
  return `${role}:${normalizeVerifiedPhone(phoneNumber)}`;
}

function getMintingAccount() {
  const key = process.env.LIT_MINTING_KEY;
  if (!key) {
    throw new Error("Missing LIT_MINTING_KEY (required for PKP minting)");
  }
  return privateKeyToAccount(key as `0x${string}`);
}

function toHexSessionKey(role: Role, phoneNumber: string) {
  return keccak256(stringToBytes(sessionKey(role, phoneNumber)));
}

export async function getOrCreatePhoneSession(params: {
  role: Role;
  phoneNumber: string;
  verificationSid: string;
}): Promise<UserSession> {
  const phoneNumber = normalizeVerifiedPhone(params.phoneNumber);
  const key = sessionKey(params.role, phoneNumber);
  const store = loadStore();
  const existing = store[key];
  const flowWallet = getStoredFlowWallet(params.role, phoneNumber);

  if (existing) {
    const normalizedExisting = ensureSessionShape(existing, flowWallet.address);
    store[key] = normalizedExisting;
    saveStore(store);
    return buildSessionFromStored(normalizedExisting, params.verificationSid);
  }

  const client = await getLitClient();
  const mintingAccount = getMintingAccount();

  const mintResult: any = await (client as any).mintWithEoa({
    account: mintingAccount,
  });

  const pkp = mintResult?.pkp || mintResult?.pkpData?.data || mintResult?.data;
  const pkpPublicKey = pkp?.publicKey || pkp?.pubkey;
  const pkpTokenId = pkp?.tokenId || mintResult?.tokenId || "";
  const pkpAddress = pkp?.ethAddress || mintResult?.ethAddress || "";

  if (!pkpPublicKey || !pkpTokenId || !pkpAddress) {
    throw new Error("Failed to mint phone PKP");
  }

  const stored: StoredPhoneSession = {
    phoneNumber,
    role: params.role,
    phoneKey: toHexSessionKey(params.role, phoneNumber),
    flowAddress: flowWallet.address,
    pkpPublicKey,
    pkpTokenId,
    pkpAddress,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store[key] = stored;
  saveStore(store);

  return buildSessionFromStored(stored, params.verificationSid);
}

function ensureSessionShape(
  stored: StoredPhoneSession,
  flowAddress: string,
): StoredPhoneSession {
  const pkpAddress =
    stored.pkpAddress || stored.address || stored.flowAddress || "";
  return {
    ...stored,
    flowAddress: stored.flowAddress || flowAddress,
    pkpAddress,
  };
}

function buildSessionFromStored(
  stored: StoredPhoneSession,
  verificationSid: string,
): UserSession {
  return {
    role: stored.role,
    address: stored.flowAddress,
    pkpPublicKey: stored.pkpPublicKey,
    pkpTokenId: stored.pkpTokenId,
    pkpAddress: stored.pkpAddress,
    familyId: "",
    phoneNumber: stored.phoneNumber,
    verificationSid,
    authProvider: "twilio-verify",
    authMethod: {
      provider: "twilio-verify",
      role: stored.role,
      phoneNumber: stored.phoneNumber,
      verificationSid,
      authMethodType: 11,
      authMethodId: stored.phoneKey,
      accessToken: stored.phoneNumber,
      metadata: {
        verifiedAt: new Date().toISOString(),
        sessionKey: stored.phoneKey,
        flowAddress: stored.flowAddress,
        pkpAddress: stored.pkpAddress,
      },
    },
    sessionSigs: null,
  };
}
