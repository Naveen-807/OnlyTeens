import "server-only";

import fs from "fs";
import path from "path";
import { randomBytes } from "node:crypto";

import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";

import { normalizeVerifiedPhone } from "@/lib/auth/twilio";
import type { Role } from "@/lib/types";

type StoredFlowWallet = {
  role: Role;
  phoneNumber: string;
  phoneKey: string;
  address: string;
  privateKey: string;
  createdAt: string;
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FLOW_WALLETS_FILE = path.join(DATA_DIR, "flow-wallets.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FLOW_WALLETS_FILE)) {
    fs.writeFileSync(FLOW_WALLETS_FILE, "{}");
  }
}

function loadStore(): Record<string, StoredFlowWallet> {
  ensureStore();
  return JSON.parse(fs.readFileSync(FLOW_WALLETS_FILE, "utf8"));
}

function saveStore(store: Record<string, StoredFlowWallet>) {
  ensureStore();
  fs.writeFileSync(FLOW_WALLETS_FILE, JSON.stringify(store, null, 2));
}

function walletKey(role: Role, phoneNumber: string) {
  return `${role}:${normalizeVerifiedPhone(phoneNumber)}`;
}

function makePrivateKey() {
  return `0x${randomBytes(32).toString("hex")}` as `0x${string}`;
}

export function getStoredFlowWallet(role: Role, phoneNumber: string) {
  const key = walletKey(role, phoneNumber);
  const store = loadStore();
  let wallet = store[key];

  if (!wallet || !wallet.privateKey || !wallet.address) {
    const privateKey = makePrivateKey();
    const account = privateKeyToAccount(privateKey);
    wallet = {
      role,
      phoneNumber: normalizeVerifiedPhone(phoneNumber),
      phoneKey: key,
      address: account.address,
      privateKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store[key] = wallet;
    saveStore(store);
  }

  return wallet;
}

export function getFlowWalletAccount(
  role: Role,
  phoneNumber: string,
): PrivateKeyAccount {
  const wallet = getStoredFlowWallet(role, phoneNumber);
  return privateKeyToAccount(wallet.privateKey as `0x${string}`);
}

