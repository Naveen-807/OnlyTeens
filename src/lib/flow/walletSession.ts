import "server-only";

import fs from "fs";
import path from "path";
import { randomBytes } from "node:crypto";

import { formatEther, parseEther } from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";

import { normalizeVerifiedPhone } from "@/lib/auth/twilio";
import { flowPublicClient, flowWalletClient, getServiceAccount } from "@/lib/flow/clients";
import type { Role } from "@/lib/types";

type StoredFlowWallet = {
  role: Role;
  phoneNumber: string;
  phoneKey: string;
  address: string;
  privateKey: string;
  createdAt: string;
  updatedAt: string;
  fundedAt?: string;
  fundingTxHash?: string;
  fundingAmountFlow?: string;
  fundingTargetFlow?: string;
  fundedBalanceFlow?: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FLOW_WALLETS_FILE = path.join(DATA_DIR, "flow-wallets.json");
const DEFAULT_PHONE_WALLET_TOP_UP_FLOW = "0.1";
const fundingInFlight = new Map<string, Promise<StoredFlowWallet>>();

function normalizeWalletPhone(phoneNumber: string) {
  return normalizeVerifiedPhone(phoneNumber);
}

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
  const raw = JSON.parse(fs.readFileSync(FLOW_WALLETS_FILE, "utf8")) as Record<
    string,
    StoredFlowWallet
  >;
  const normalized: Record<string, StoredFlowWallet> = {};
  let migrated = false;

  for (const [key, wallet] of Object.entries(raw)) {
    const phoneNumber = normalizeWalletPhone(wallet.phoneNumber || key.split(":").pop() || "");
    if (!phoneNumber) continue;

    const canonicalKey = phoneNumber;
    const nextWallet: StoredFlowWallet = {
      ...wallet,
      phoneNumber,
      phoneKey: wallet.phoneKey || canonicalKey,
    };

    if (key !== canonicalKey || key.includes(":")) {
      migrated = true;
    }

    const existing = normalized[canonicalKey];
    if (!existing) {
      normalized[canonicalKey] = nextWallet;
      continue;
    }

    const currentUpdatedAt = new Date(existing.updatedAt || existing.createdAt).getTime();
    const nextUpdatedAt = new Date(nextWallet.updatedAt || nextWallet.createdAt).getTime();
    if (nextUpdatedAt >= currentUpdatedAt) {
      normalized[canonicalKey] = nextWallet;
    }
  }

  if (migrated || Object.keys(raw).length !== Object.keys(normalized).length) {
    saveStore(normalized);
  }

  return normalized;
}

function saveStore(store: Record<string, StoredFlowWallet>) {
  ensureStore();
  fs.writeFileSync(FLOW_WALLETS_FILE, JSON.stringify(store, null, 2));
}

function walletKey(phoneNumber: string) {
  return normalizeWalletPhone(phoneNumber);
}

function makePrivateKey() {
  return `0x${randomBytes(32).toString("hex")}` as `0x${string}`;
}

function getPhoneWalletTopUpFlow() {
  return (process.env.FLOW_PHONE_WALLET_TOP_UP_FLOW || DEFAULT_PHONE_WALLET_TOP_UP_FLOW).trim();
}

function persistWallet(wallet: StoredFlowWallet) {
  const store = loadStore();
  store[wallet.phoneKey] = wallet;
  saveStore(store);
}

async function fundWalletIfNeeded(wallet: StoredFlowWallet): Promise<StoredFlowWallet> {
  const targetBalanceFlow = getPhoneWalletTopUpFlow();
  const targetBalance = parseEther(targetBalanceFlow);

  if (targetBalance <= 0n) {
    throw new Error("FLOW_PHONE_WALLET_TOP_UP_FLOW must be greater than zero");
  }

  const currentBalance = await flowPublicClient.getBalance({
    address: wallet.address as `0x${string}`,
  });

  if (currentBalance >= targetBalance) {
    return wallet;
  }

  const topUpAmount = targetBalance - currentBalance;
  const serviceAccount = getServiceAccount();
  const txHash = await flowWalletClient.sendTransaction({
    account: serviceAccount,
    to: wallet.address as `0x${string}`,
    value: topUpAmount,
  });

  await flowPublicClient.waitForTransactionReceipt({ hash: txHash });

  const fundedBalance = await flowPublicClient.getBalance({
    address: wallet.address as `0x${string}`,
  });
  const fundedAt = new Date().toISOString();
  const fundedWallet: StoredFlowWallet = {
    ...wallet,
    updatedAt: fundedAt,
    fundedAt,
    fundingTxHash: txHash,
    fundingAmountFlow: formatEther(topUpAmount),
    fundingTargetFlow: targetBalanceFlow,
    fundedBalanceFlow: formatEther(fundedBalance),
  };

  persistWallet(fundedWallet);
  return fundedWallet;
}

export async function ensurePhoneWalletFunded(role: Role, phoneNumber: string) {
  const key = walletKey(phoneNumber);
  const existing = fundingInFlight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const wallet = getStoredFlowWallet(role, phoneNumber);
    return await fundWalletIfNeeded(wallet);
  })();

  fundingInFlight.set(key, promise);

  try {
    return await promise;
  } finally {
    fundingInFlight.delete(key);
  }
}

export function getStoredFlowWallet(role: Role, phoneNumber: string) {
  const key = walletKey(phoneNumber);
  const store = loadStore();
  let wallet = store[key];

  if (!wallet || !wallet.privateKey || !wallet.address) {
    const privateKey = makePrivateKey();
    const account = privateKeyToAccount(privateKey);
    wallet = {
      role,
      phoneNumber: normalizeWalletPhone(phoneNumber),
      phoneKey: key,
      address: account.address,
      privateKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store[key] = wallet;
    saveStore(store);
  } else if (wallet.phoneNumber !== normalizeWalletPhone(phoneNumber) || wallet.phoneKey !== key) {
    wallet = {
      ...wallet,
      role: wallet.role || role,
      phoneNumber: normalizeWalletPhone(phoneNumber),
      phoneKey: key,
      updatedAt: new Date().toISOString(),
    };
    store[key] = wallet;
    saveStore(store);
  }

  return wallet;
}

export async function getFlowWalletAccount(
  role: Role,
  phoneNumber: string,
): Promise<PrivateKeyAccount> {
  const wallet = await ensurePhoneWalletFunded(role, phoneNumber);
  return privateKeyToAccount(wallet.privateKey as `0x${string}`);
}

