import "server-only";

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import type { Role } from "@/lib/types";

type PhoneChallenge = {
  challengeId: string;
  phoneNumber: string;
  role: Role;
  familyId?: string;
  deliveryMode: "demo" | "twilio";
  codeHash?: string;
  maskedPhone: string;
  createdAt: string;
  expiresAt: string;
  attempts: number;
  verifiedAt?: string;
};

type PhoneChallengeStore = Record<string, PhoneChallenge>;

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "phone-auth.json");
const TTL_MS = 10 * 60 * 1000;

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, "{}");
  }
}

function readStore(): PhoneChallengeStore {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, "utf8")) as PhoneChallengeStore;
  } catch {
    return {};
  }
}

function writeStore(store: PhoneChallengeStore) {
  ensureStore();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

function normalizePhone(phoneNumber: string) {
  return phoneNumber.replace(/\s+/g, "").trim();
}

function maskPhoneNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  const tail = digits.slice(-4).padStart(4, "0");
  return `+${digits.length > 4 ? `${digits.slice(0, 2)}•••••` : "•••"}${tail}`;
}

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateOtp() {
  const value = crypto.randomInt(0, 1_000_000);
  return String(value).padStart(6, "0");
}

export function createPhoneChallenge(params: {
  phoneNumber: string;
  role: Role;
  familyId?: string;
  deliveryMode: "demo" | "twilio";
  code?: string;
}) {
  const store = readStore();
  const phoneNumber = normalizePhone(params.phoneNumber);
  const challengeId = crypto.randomUUID();
  const demoCode = params.code ?? generateOtp();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

  store[challengeId] = {
    challengeId,
    phoneNumber,
    role: params.role,
    familyId: params.familyId,
    deliveryMode: params.deliveryMode,
    codeHash: params.deliveryMode === "demo" ? hashCode(demoCode) : undefined,
    maskedPhone: maskPhoneNumber(phoneNumber),
    createdAt,
    expiresAt,
    attempts: 0,
  };

  writeStore(store);

  return {
    challengeId,
    maskedPhone: store[challengeId].maskedPhone,
    demoCode,
    expiresAt,
  };
}

export function verifyPhoneChallenge(params: {
  challengeId: string;
  code: string;
}) {
  const store = readStore();
  const challenge = store[params.challengeId];

  if (!challenge) {
    throw new Error("OTP_NOT_FOUND");
  }

  if (Date.parse(challenge.expiresAt) < Date.now()) {
    delete store[params.challengeId];
    writeStore(store);
    throw new Error("OTP_EXPIRED");
  }

  challenge.attempts += 1;

  if (challenge.attempts > 5) {
    delete store[params.challengeId];
    writeStore(store);
    throw new Error("OTP_LOCKED");
  }

  if (challenge.deliveryMode === "demo" && challenge.codeHash !== hashCode(params.code)) {
    writeStore(store);
    throw new Error("OTP_INVALID");
  }

  challenge.verifiedAt = new Date().toISOString();
  writeStore(store);
  return challenge;
}

export function markPhoneChallengeVerified(challengeId: string) {
  const store = readStore();
  const challenge = store[challengeId];
  if (!challenge) {
    throw new Error("OTP_NOT_FOUND");
  }
  challenge.verifiedAt = new Date().toISOString();
  writeStore(store);
  return challenge;
}

export function getPhoneChallenge(challengeId: string) {
  return readStore()[challengeId] || null;
}
