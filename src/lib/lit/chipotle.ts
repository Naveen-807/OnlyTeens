import "server-only";

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { SAFE_EXECUTOR_CID } from "@/lib/constants";
import { assertLiveDependency, assertLiveMode, isLiveMode } from "@/lib/runtime/liveMode";
import type { FamilyRecord } from "@/lib/types/onboarding";

const CHIPOTLE_BASE_URL =
  process.env.CHIPOTLE_BASE_URL || "https://api.dev.litprotocol.com";

type ChipotleResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface ChipotleWalletRecord {
  id: string;
  publicKey: string;
  tokenId: string;
  walletAddress: string;
  mode: "live" | "local";
}

export interface ChipotleProvisionResult {
  accountId: string;
  accountApiKey?: string;
  guardianWallet: ChipotleWalletRecord;
  teenWallet: ChipotleWalletRecord;
  calmaWallet: ChipotleWalletRecord;
  clawrenceWallet: ChipotleWalletRecord;
  groupId: string;
  usageKeyId: string;
  usageApiKey?: string;
  actionCid: string;
  mode: "live" | "local";
  fallbackActive: boolean;
}

function walletFromFamily(params: {
  address?: string;
  publicKey?: string;
  tokenId?: string;
  walletId?: string;
  seed: string;
}): ChipotleWalletRecord {
  return {
    id: params.walletId || makeId("wallet", params.seed),
    publicKey: (params.publicKey || makePublicKey(params.seed)) as `0x${string}`,
    tokenId: params.tokenId || makeTokenId(params.seed),
    walletAddress: (params.address || makeHexAddress(params.seed)) as `0x${string}`,
    mode: params.walletId ? "live" : "local",
  };
}

function digest(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function makeHexAddress(seed: string): `0x${string}` {
  return `0x${digest(seed).slice(0, 40)}` as `0x${string}`;
}

function makePublicKey(seed: string): `0x${string}` {
  return `0x${digest(`${seed}:pk`)}${digest(`${seed}:pk:2`)}` as `0x${string}`;
}

function makeTokenId(seed: string): string {
  return `0x${digest(`${seed}:token`)}`;
}

function makeId(prefix: string, seed: string): string {
  return `${prefix}_${digest(seed).slice(0, 16)}`;
}

function createLocalWallet(seed: string): ChipotleWalletRecord {
  return {
    id: makeId("wallet", seed),
    publicKey: makePublicKey(seed),
    tokenId: makeTokenId(seed),
    walletAddress: makeHexAddress(seed),
    mode: "local",
  };
}

function getLiveChipotleKey(): string | null {
  return process.env.CHIPOTLE_ACCOUNT_API_KEY || null;
}

export function isChipotleConfigured(): boolean {
  return Boolean(process.env.CHIPOTLE_ENABLE_LIVE === "1" || getLiveChipotleKey());
}

async function chipotleFetch<T>(
  endpoint: string,
  init: RequestInit = {},
  apiKey?: string,
): Promise<ChipotleResponse<T>> {
  const token = apiKey || getLiveChipotleKey();

  try {
    const res = await fetch(`${CHIPOTLE_BASE_URL}${endpoint}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Api-Key": token, Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data?.error || `HTTP ${res.status}` };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error?.message || "Chipotle network error" };
  }
}

async function createLiveAccount(name: string, description: string) {
  const response = await chipotleFetch<{
    account_id?: string;
    wallet_address?: string;
    api_key?: string;
  }>("/core/v1/new_account", {
    method: "POST",
    body: JSON.stringify({
      account_name: name,
      account_description: description,
    }),
  });

  if (!response.success || !response.data?.api_key) {
    return null;
  }

  return {
    accountId:
      response.data.account_id ||
      response.data.wallet_address ||
      makeId("account", `${name}:${description}`),
    accountApiKey: response.data.api_key,
  };
}

async function createLiveWallet(apiKey: string, seed: string): Promise<ChipotleWalletRecord | null> {
  const response = await chipotleFetch<{
    wallet_id?: string;
    wallet_address?: string;
    public_key?: string;
    token_id?: string;
  }>("/core/v1/create_wallet", {}, apiKey);

  if (!response.success || !response.data?.wallet_address) {
    return null;
  }

  return {
    id: response.data.wallet_id || makeId("wallet", seed),
    publicKey: (response.data.public_key || makePublicKey(seed)) as `0x${string}`,
    tokenId: response.data.token_id || makeTokenId(seed),
    walletAddress: response.data.wallet_address as `0x${string}`,
    mode: "live",
  };
}

async function createLiveGroup(apiKey: string, name: string, description: string): Promise<string | null> {
  const response = await chipotleFetch<{ group_id?: string }>(
    "/core/v1/add_group",
    {
      method: "POST",
      body: JSON.stringify({
        group_name: name,
        group_description: description,
        pkp_ids_permitted: [],
        cid_hashes_permitted: [],
      }),
    },
    apiKey,
  );

  if (!response.success) return null;
  return response.data?.group_id || null;
}

async function addActionToLiveGroup(apiKey: string, groupId: string, actionCid: string): Promise<boolean> {
  const response = await chipotleFetch(
    "/core/v1/add_action_to_group",
    {
      method: "POST",
      body: JSON.stringify({
        group_id: Number(groupId),
        action_ipfs_cid: actionCid,
      }),
    },
    apiKey,
  );

  return response.success;
}

async function addWalletToLiveGroup(apiKey: string, groupId: string, walletId: string): Promise<boolean> {
  const response = await chipotleFetch(
    "/core/v1/add_pkp_to_group",
    {
      method: "POST",
      body: JSON.stringify({
        group_id: Number(groupId),
        pkp_id: walletId,
      }),
    },
    apiKey,
  );

  return response.success;
}

async function createLiveUsageKey(apiKey: string, groupId: string): Promise<{ usageKeyId: string; usageApiKey: string } | null> {
  const response = await chipotleFetch<{
    usage_api_key?: string;
    api_key_id?: string;
  }>(
    "/core/v1/add_usage_api_key",
    {
      method: "POST",
      body: JSON.stringify({
        name: "Proof18 Calma Execute Key",
        description: "Execute-only key for Calma safe executor",
        can_create_groups: false,
        can_delete_groups: false,
        can_create_pkps: false,
        manage_ipfs_ids_in_groups: [],
        add_pkp_to_groups: [],
        remove_pkp_from_groups: [],
        execute_in_groups: [Number(groupId)],
      }),
    },
    apiKey,
  );

  if (!response.success || !response.data?.usage_api_key) return null;

  return {
    usageKeyId: response.data.api_key_id || makeId("usage", `${groupId}:execute`),
    usageApiKey: response.data.usage_api_key,
  };
}

function localProvision(params: {
  familyId: string;
  guardianAddress: string;
  teenAddress: string;
  safeExecutorCid: string;
}): ChipotleProvisionResult {
  const accountSeed = `${params.guardianAddress}:${params.familyId}:family`;
  const groupSeed = `${params.familyId}:${params.teenAddress}:group`;
  const calmaWallet = createLocalWallet(`${accountSeed}:calma:${params.teenAddress}`);
  return {
    accountId: makeId("account", accountSeed),
    accountApiKey: undefined,
    guardianWallet: createLocalWallet(`${accountSeed}:guardian`),
    teenWallet: createLocalWallet(`${accountSeed}:teen:${params.teenAddress}`),
    calmaWallet,
    clawrenceWallet: calmaWallet,
    groupId: makeId("group", groupSeed),
    usageKeyId: makeId("usage", `${groupSeed}:execute`),
    usageApiKey: undefined,
    actionCid: params.safeExecutorCid,
    mode: "local",
    fallbackActive: true,
  };
}

export async function ensureFamilyChipotleProvision(params: {
  familyId: string;
  guardianAddress: string;
  teenAddress: string;
  family?: FamilyRecord | null;
  safeExecutorCid?: string;
}): Promise<ChipotleProvisionResult> {
  const safeExecutorCid = params.safeExecutorCid || SAFE_EXECUTOR_CID || "local-safe-executor";
  const existingTeen =
    params.family?.teenAddress === params.teenAddress
      ? params.family
      : params.family?.linkedTeens?.find((teen) => teen.active && teen.teenAddress === params.teenAddress);

  if (!isChipotleConfigured()) {
    assertLiveDependency(
      false,
      "LIVE_SIGNER_UNAVAILABLE",
      "Live Chipotle provisioning is required in live mode",
    );
    const local = localProvision({
      familyId: params.familyId,
      guardianAddress: params.guardianAddress,
      teenAddress: params.teenAddress,
      safeExecutorCid,
    });

    if (!params.family) {
      return local;
    }

    return {
      ...local,
      guardianWallet: walletFromFamily({
        address: params.family.guardianAddress,
        publicKey: params.family.guardianPkpPublicKey,
        tokenId: params.family.guardianPkpTokenId,
        walletId: params.family.chipotleGuardianWalletId,
        seed: `${params.familyId}:guardian`,
      }),
      teenWallet: walletFromFamily({
        address: existingTeen?.teenAddress,
        publicKey: existingTeen?.teenPkpPublicKey,
        tokenId: existingTeen?.teenPkpTokenId,
        walletId:
          existingTeen && "teenChipotleWalletId" in existingTeen
            ? existingTeen.teenChipotleWalletId
            : params.family.chipotleTeenWalletId,
        seed: `${params.familyId}:teen:${params.teenAddress}`,
      }),
      calmaWallet: walletFromFamily({
        address: existingTeen?.calmaAddress || existingTeen?.clawrenceAddress,
        publicKey: existingTeen?.calmaPkpPublicKey || existingTeen?.clawrencePkpPublicKey,
        tokenId: existingTeen?.calmaPkpTokenId || existingTeen?.clawrencePkpTokenId,
        walletId:
          existingTeen && "calmaChipotleWalletId" in existingTeen && existingTeen.calmaChipotleWalletId
            ? existingTeen.calmaChipotleWalletId
            : existingTeen && "clawrenceChipotleWalletId" in existingTeen
              ? existingTeen.clawrenceChipotleWalletId
              : params.family.chipotleCalmaWalletId || params.family.chipotleClawrenceWalletId,
        seed: `${params.familyId}:calma:${params.teenAddress}`,
      }),
      groupId:
        existingTeen && "chipotleGroupId" in existingTeen && existingTeen.chipotleGroupId
          ? existingTeen.chipotleGroupId
          : params.family.chipotleGroupId || local.groupId,
      usageKeyId:
        existingTeen && "chipotleUsageKeyId" in existingTeen && existingTeen.chipotleUsageKeyId
          ? existingTeen.chipotleUsageKeyId
          : params.family.chipotleUsageKeyId || local.usageKeyId,
      usageApiKey:
        existingTeen && "chipotleUsageApiKey" in existingTeen && existingTeen.chipotleUsageApiKey
          ? existingTeen.chipotleUsageApiKey
          : params.family.chipotleUsageApiKey,
      fallbackActive: true,
      clawrenceWallet: walletFromFamily({
        address: existingTeen?.calmaAddress || existingTeen?.clawrenceAddress,
        publicKey: existingTeen?.calmaPkpPublicKey || existingTeen?.clawrencePkpPublicKey,
        tokenId: existingTeen?.calmaPkpTokenId || existingTeen?.clawrencePkpTokenId,
        walletId:
          existingTeen && "calmaChipotleWalletId" in existingTeen && existingTeen.calmaChipotleWalletId
            ? existingTeen.calmaChipotleWalletId
            : existingTeen && "clawrenceChipotleWalletId" in existingTeen
              ? existingTeen.clawrenceChipotleWalletId
              : params.family.chipotleCalmaWalletId || params.family.chipotleClawrenceWalletId,
        seed: `${params.familyId}:calma:${params.teenAddress}`,
      }),
    };
  }

  const existingAccountApiKey = params.family?.chipotleAccountApiKey || getLiveChipotleKey();
  const familyAccountId =
    params.family?.chipotleAccountId || makeId("account", `${params.guardianAddress}:${params.familyId}`);

  const account =
    existingAccountApiKey
      ? {
          accountId: familyAccountId,
          accountApiKey: existingAccountApiKey,
        }
      : await createLiveAccount(
          `Proof18 Family ${params.familyId.slice(0, 8)}`,
          `Guardian ${params.guardianAddress} household account`,
        );

  if (!account?.accountApiKey) {
    assertLiveDependency(
      false,
      "LIVE_SIGNER_UNAVAILABLE",
      "Failed to create a live Chipotle account",
    );
    return localProvision({
      familyId: params.familyId,
      guardianAddress: params.guardianAddress,
      teenAddress: params.teenAddress,
      safeExecutorCid,
    });
  }

  const liveGuardianWallet = params.family
    ? null
    : await createLiveWallet(account.accountApiKey, `${params.familyId}:guardian`);
  assertLiveDependency(
    params.family ? true : Boolean(liveGuardianWallet),
    "LIVE_SIGNER_UNAVAILABLE",
    "Failed to create guardian Chipotle wallet",
  );
  const guardianWallet = params.family
    ? walletFromFamily({
        address: params.family.guardianAddress,
        publicKey: params.family.guardianPkpPublicKey,
        tokenId: params.family.guardianPkpTokenId,
        walletId: params.family.chipotleGuardianWalletId,
        seed: `${params.familyId}:guardian`,
      })
    : liveGuardianWallet ||
      createLocalWallet(`${params.familyId}:guardian`);
  const liveTeenWallet = existingTeen
    ? null
    : await createLiveWallet(account.accountApiKey, `${params.familyId}:teen:${params.teenAddress}`);
  assertLiveDependency(
    existingTeen ? true : Boolean(liveTeenWallet),
    "LIVE_SIGNER_UNAVAILABLE",
    "Failed to create teen Chipotle wallet",
  );
  const teenWallet =
    existingTeen
      ? walletFromFamily({
          address: existingTeen.teenAddress,
          publicKey: existingTeen.teenPkpPublicKey,
          tokenId: existingTeen.teenPkpTokenId,
          walletId:
            "teenChipotleWalletId" in existingTeen
              ? existingTeen.teenChipotleWalletId
              : params.family?.chipotleTeenWalletId,
          seed: `${params.familyId}:teen:${params.teenAddress}`,
        })
      :
    liveTeenWallet ||
    createLocalWallet(`${params.familyId}:teen:${params.teenAddress}`);
  const liveCalmaWallet = existingTeen
    ? null
    : await createLiveWallet(account.accountApiKey, `${params.familyId}:calma:${params.teenAddress}`);
  assertLiveDependency(
    existingTeen ? true : Boolean(liveCalmaWallet),
    "LIVE_SIGNER_UNAVAILABLE",
    "Failed to create Calma Chipotle wallet",
  );
  const calmaWallet =
    existingTeen
      ? walletFromFamily({
          address: existingTeen.calmaAddress || existingTeen.clawrenceAddress,
          publicKey: existingTeen.calmaPkpPublicKey || existingTeen.clawrencePkpPublicKey,
          tokenId: existingTeen.calmaPkpTokenId || existingTeen.clawrencePkpTokenId,
          walletId:
            "calmaChipotleWalletId" in existingTeen && existingTeen.calmaChipotleWalletId
              ? existingTeen.calmaChipotleWalletId
              : "clawrenceChipotleWalletId" in existingTeen
                ? existingTeen.clawrenceChipotleWalletId
                : params.family?.chipotleCalmaWalletId || params.family?.chipotleClawrenceWalletId,
          seed: `${params.familyId}:calma:${params.teenAddress}`,
        })
      :
    liveCalmaWallet ||
    createLocalWallet(`${params.familyId}:calma:${params.teenAddress}`);

  const createdGroupId =
    existingTeen && "chipotleGroupId" in existingTeen
      ? existingTeen.chipotleGroupId
      : params.family?.teenAddress === params.teenAddress
        ? params.family?.chipotleGroupId
        : await createLiveGroup(
            account.accountApiKey,
            `Proof18 ${params.familyId.slice(0, 8)} Teen Group`,
            `Scoped execution group for teen ${params.teenAddress}`,
          );
  assertLiveDependency(
    Boolean(createdGroupId),
    "LIVE_SIGNER_UNAVAILABLE",
    "Failed to create Chipotle execution group",
  );
  const groupId =
    (existingTeen && "chipotleGroupId" in existingTeen ? existingTeen.chipotleGroupId : undefined) ||
    (params.family?.teenAddress === params.teenAddress ? params.family?.chipotleGroupId : undefined) ||
    createdGroupId ||
    makeId("group", `${params.familyId}:${params.teenAddress}`);

  await addActionToLiveGroup(account.accountApiKey, groupId, safeExecutorCid);
  await addWalletToLiveGroup(account.accountApiKey, groupId, calmaWallet.id);

  const usageKey =
    (((existingTeen && "chipotleUsageApiKey" in existingTeen ? existingTeen.chipotleUsageApiKey : undefined) &&
      (existingTeen && "chipotleUsageKeyId" in existingTeen ? existingTeen.chipotleUsageKeyId : undefined))
      ? {
          usageKeyId: existingTeen!.chipotleUsageKeyId!,
          usageApiKey: existingTeen!.chipotleUsageApiKey!,
        }
      : params.family?.chipotleUsageApiKey &&
          params.family?.chipotleUsageKeyId &&
          params.family?.teenAddress === params.teenAddress
      ? {
          usageKeyId: params.family.chipotleUsageKeyId,
          usageApiKey: params.family.chipotleUsageApiKey,
        }
      : await createLiveUsageKey(account.accountApiKey, groupId)) ||
    {
      usageKeyId: makeId("usage", `${groupId}:execute`),
      usageApiKey: undefined,
    };

  assertLiveDependency(
    Boolean(usageKey.usageApiKey),
    "LIVE_SIGNER_UNAVAILABLE",
    "Failed to create execute-only Chipotle usage key",
  );

  return {
    accountId: account.accountId,
    accountApiKey: account.accountApiKey,
    guardianWallet,
    teenWallet,
    calmaWallet,
    clawrenceWallet: calmaWallet,
    groupId,
    usageKeyId: usageKey.usageKeyId,
    usageApiKey: usageKey.usageApiKey,
    actionCid: safeExecutorCid,
    mode: usageKey.usageApiKey ? "live" : "local",
    fallbackActive: !usageKey.usageApiKey && !isLiveMode(),
  };
}

function readSafeExecutorCode(): string {
  const filePath = path.join(process.cwd(), "litActions", "safeExecutor.js");
  return fs.readFileSync(filePath, "utf8");
}

export async function executeChipotleAction(params: {
  family: FamilyRecord;
  jsParams: Record<string, unknown>;
}): Promise<ChipotleResponse<{ response: any; logs?: string[] }>> {
  const apiKey = params.family.chipotleUsageApiKey;
  if (!isChipotleConfigured() || !apiKey) {
    return {
      success: false,
      error: "Chipotle usage key unavailable",
    };
  }

  return chipotleFetch<{ response: any; logs?: string[] }>(
    "/core/v1/lit_action",
    {
      method: "POST",
      body: JSON.stringify({
        code: readSafeExecutorCode(),
        js_params: params.jsParams,
      }),
    },
    apiKey,
  );
}

export function getChipotleBaseUrl(): string {
  return CHIPOTLE_BASE_URL;
}
