import "server-only";

import { parseAbiItem } from "viem";

import { ACCESS_ABI, CONTRACTS, PASSPORT_ABI } from "@/lib/constants";
import { flowPublicClient, flowWalletClient, getServiceAccount } from "@/lib/flow/clients";

type FlowOnchainWriteResult = {
  txHash: string;
  explorerUrl: string;
  status: "submitted" | "already_exists";
};

function normalizeAddress(value: string): string {
  return value.toLowerCase();
}

async function getFamilyState(familyId: `0x${string}`) {
  const [guardian, teen, executor, active] = (await flowPublicClient.readContract({
    address: CONTRACTS.access,
    abi: ACCESS_ABI,
    functionName: "getFamily",
    args: [familyId],
  })) as [`0x${string}`, `0x${string}`, `0x${string}`, boolean];

  return {
    guardian,
    teen,
    executor,
    active,
  };
}

function isAlreadyExistsError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /Family exists|Already exists|Teen exists/i.test(message);
}

export async function findFamilyIdOnChain(params: {
  guardianAddress: `0x${string}`;
  teenAddress: `0x${string}`;
}): Promise<`0x${string}` | null> {
  const event = parseAbiItem(
    "event FamilyRegistered(bytes32 indexed familyId, address guardian, address teen, address executor)",
  );
  const latestBlock = await flowPublicClient.getBlockNumber();
  const chunkSize = 9_999n;

  let endBlock = latestBlock;
  while (endBlock >= 0n) {
    const startBlock = endBlock > chunkSize ? endBlock - chunkSize : 0n;

    const logs = await flowPublicClient.getLogs({
      address: CONTRACTS.access,
      event,
      fromBlock: startBlock,
      toBlock: endBlock,
    });

    const matchingLog = logs.find((log) => {
      const guardian = log.args.guardian as string | undefined;
      const teen = log.args.teen as string | undefined;
      return (
        guardian &&
        teen &&
        normalizeAddress(guardian) === normalizeAddress(params.guardianAddress) &&
        normalizeAddress(teen) === normalizeAddress(params.teenAddress)
      );
    });

    if (matchingLog) {
      return matchingLog.args.familyId as `0x${string}`;
    }

    if (startBlock === 0n) {
      break;
    }

    endBlock = startBlock - 1n;
  }

  return null;
}

async function waitForTransaction(hash: `0x${string}`) {
  const receipt = await flowPublicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === "reverted") {
    throw new Error(`Transaction reverted: ${hash}`);
  }
  return receipt;
}

function ensureConfiguredContracts() {
  if (
    CONTRACTS.access === "0x0000000000000000000000000000000000000000" ||
    CONTRACTS.passport === "0x0000000000000000000000000000000000000000"
  ) {
    throw new Error("Access/Passport contracts are not configured");
  }
}

export async function registerFamilyOnChain(params: {
  familyId: `0x${string}`;
  guardianAddress: `0x${string}`;
  teenAddress: `0x${string}`;
}): Promise<FlowOnchainWriteResult> {
  ensureConfiguredContracts();
  const account = getServiceAccount();

  try {
    const existingFamily = await getFamilyState(params.familyId);
    if (
      existingFamily.active &&
      normalizeAddress(existingFamily.guardian) === normalizeAddress(params.guardianAddress) &&
      normalizeAddress(existingFamily.teen) === normalizeAddress(params.teenAddress)
    ) {
      return { txHash: "", explorerUrl: "", status: "already_exists" };
    }
  } catch {
    // If the read fails, we still attempt the write and let the contract decide.
  }

  try {
    const txHash = await flowWalletClient.writeContract({
      account,
      address: CONTRACTS.access,
      abi: ACCESS_ABI,
      functionName: "registerFamily",
      args: [params.familyId, params.guardianAddress, params.teenAddress, account.address],
    });

    await waitForTransaction(txHash);

    return {
      txHash,
      explorerUrl: `https://evm-testnet.flowscan.io/tx/${txHash}`,
      status: "submitted",
    };
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      const existingFamily = await getFamilyState(params.familyId);
      if (
        existingFamily.active &&
        normalizeAddress(existingFamily.guardian) === normalizeAddress(params.guardianAddress) &&
        normalizeAddress(existingFamily.teen) === normalizeAddress(params.teenAddress)
      ) {
        return { txHash: "", explorerUrl: "", status: "already_exists" };
      }
    }

    throw error;
  }
}

export async function addTeenOnChain(params: {
  familyId: `0x${string}`;
  teenAddress: `0x${string}`;
  guardianAccount: any;
}): Promise<FlowOnchainWriteResult> {
  ensureConfiguredContracts();

  try {
    const alreadyMember = (await flowPublicClient.readContract({
      address: CONTRACTS.access,
      abi: ACCESS_ABI,
      functionName: "isTeen",
      args: [params.familyId, params.teenAddress],
    })) as boolean;

    if (alreadyMember) {
      return { txHash: "", explorerUrl: "", status: "already_exists" };
    }
  } catch {
    // Fall through and let the write attempt surface the real contract state.
  }

  try {
    const txHash = await flowWalletClient.writeContract({
      account: params.guardianAccount,
      address: CONTRACTS.access,
      abi: ACCESS_ABI,
      functionName: "addTeen",
      args: [params.familyId, params.teenAddress],
    });

    await waitForTransaction(txHash);

    return {
      txHash,
      explorerUrl: `https://evm-testnet.flowscan.io/tx/${txHash}`,
      status: "submitted",
    };
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      return { txHash: "", explorerUrl: "", status: "already_exists" };
    }

    throw error;
  }
}

export async function updateExecutorOnChain(params: {
  guardianAccount: any;
  familyId: `0x${string}`;
  executorAddress: `0x${string}`;
}): Promise<FlowOnchainWriteResult> {
  ensureConfiguredContracts();

  const txHash = await flowWalletClient.writeContract({
    account: params.guardianAccount,
    address: CONTRACTS.access,
    abi: ACCESS_ABI,
    functionName: "updateExecutor",
    args: [params.familyId, params.executorAddress],
  });

  await waitForTransaction(txHash);

  return {
    txHash,
    explorerUrl: `https://evm-testnet.flowscan.io/tx/${txHash}`,
    status: "submitted",
  };
}

export async function createPassportOnChain(params: {
  familyId: `0x${string}`;
  teenAddress: `0x${string}`;
}): Promise<FlowOnchainWriteResult> {
  ensureConfiguredContracts();
  const account = getServiceAccount();

  try {
    const txHash = await flowWalletClient.writeContract({
      account,
      address: CONTRACTS.passport,
      abi: PASSPORT_ABI,
      functionName: "createPassport",
      args: [params.familyId, params.teenAddress],
    });

    await waitForTransaction(txHash);

    return {
      txHash,
      explorerUrl: `https://evm-testnet.flowscan.io/tx/${txHash}`,
      status: "submitted",
    };
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      return { txHash: "", explorerUrl: "", status: "already_exists" };
    }

    throw error;
  }
}
