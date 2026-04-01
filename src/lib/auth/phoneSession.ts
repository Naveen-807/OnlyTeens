import "server-only";

import fs from "fs";
import path from "path";

import { keccak256, stringToBytes } from "viem";

import { getFlowRuntimeProfile } from "@/lib/flow/runtimeProfile";
import { getStoredFlowWallet } from "@/lib/flow/walletSession";
import { isChipotleConfigured } from "@/lib/lit/chipotle";
import { normalizeVerifiedPhone } from "@/lib/auth/twilio";
import type { Role, UserSession } from "@/lib/types";

type StoredPhoneSession = {
  phoneNumber: string;
  role: Role;
  phoneKey: string;
  flowAddress: string;
  familyId?: string;
  pkpPublicKey: string;
  pkpTokenId: string;
  pkpAddress: string;
  chipotleWalletId?: string;
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
  const digest = keccak256(stringToBytes(`proof18-phone-pkp:${key}`));
  const pkpPublicKey = `${digest}${digest.slice(2)}` as `0x${string}`;
  const pkpTokenId = digest;
  const pkpAddress = `0x${digest.slice(2, 42)}` as `0x${string}`;

  const stored: StoredPhoneSession = {
    phoneNumber,
    role: params.role,
    phoneKey: toHexSessionKey(params.role, phoneNumber),
    flowAddress: flowWallet.address,
    pkpPublicKey,
    pkpTokenId,
    pkpAddress,
    chipotleWalletId: `wallet_${digest.slice(2, 18)}`,
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
  const canonicalFlowAddress = flowAddress || stored.flowAddress || stored.address || "";
  const pkpAddress = stored.pkpAddress || stored.address || canonicalFlowAddress || "";
  return {
    ...stored,
    flowAddress: canonicalFlowAddress,
    pkpAddress,
  };
}

function buildSessionFromStored(
  stored: StoredPhoneSession,
  verificationSid: string,
): UserSession {
  const flowRuntime = getFlowRuntimeProfile();
  return {
    role: stored.role,
    address: stored.flowAddress,
    pkpPublicKey: stored.pkpPublicKey,
    pkpTokenId: stored.pkpTokenId,
    pkpAddress: stored.pkpAddress,
    familyId: stored.familyId || "",
    phoneNumber: stored.phoneNumber,
    verificationSid,
    authProvider: "twilio-verify",
    walletMode: flowRuntime.walletMode,
    gasMode: flowRuntime.gasMode,
    flowNativeFeaturesUsed: flowRuntime.flowNativeFeaturesUsed,
    authMethod: {
      provider: isChipotleConfigured() ? "chipotle-phone-otp" : "twilio-verify",
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
        chipotleWalletId: stored.chipotleWalletId,
      },
    },
    chipotle: {
      mode: isChipotleConfigured() ? "live" : "local",
      walletId: stored.chipotleWalletId,
    },
    sessionSigs: null,
  };
}

export function bindPhoneSessionToWallet(params: {
  role: Role;
  phoneNumber: string;
  familyId: string;
  walletAddress: string;
  pkpPublicKey: string;
  pkpTokenId: string;
  pkpAddress: string;
  chipotleWalletId?: string;
}) {
  const phoneNumber = normalizeVerifiedPhone(params.phoneNumber);
  const key = sessionKey(params.role, phoneNumber);
  const store = loadStore();
  const existing = store[key];
  const now = new Date().toISOString();
  const flowWallet = getStoredFlowWallet(params.role, phoneNumber);

  store[key] = {
    ...existing,
    phoneNumber,
    role: params.role,
    phoneKey: existing?.phoneKey || toHexSessionKey(params.role, phoneNumber),
    flowAddress: flowWallet.address || params.walletAddress,
    familyId: params.familyId,
    pkpPublicKey: params.pkpPublicKey,
    pkpTokenId: params.pkpTokenId,
    pkpAddress: params.pkpAddress,
    chipotleWalletId: params.chipotleWalletId ?? existing?.chipotleWalletId,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  saveStore(store);
}
