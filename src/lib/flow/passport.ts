import "server-only";

import { CONTRACTS, PASSPORT_ABI } from "@/lib/constants";
import { flowPublicClient, flowWalletClient } from "@/lib/flow/clients";
import { PASSPORT_LEVELS, type PassportState } from "@/lib/types";

export async function createPassport(
  account: any,
  familyId: `0x${string}`,
  teenAddress: `0x${string}`,
): Promise<string> {
  return await flowWalletClient.writeContract({
    account,
    address: CONTRACTS.passport,
    abi: PASSPORT_ABI,
    functionName: "createPassport",
    args: [familyId, teenAddress],
  });
}

export async function recordAction(
  executorAccount: any,
  familyId: `0x${string}`,
  teenAddress: `0x${string}`,
  actionType: string,
  approved: boolean,
): Promise<{ txHash: string; leveledUp: boolean; newLevel: number }> {
  const before = await getPassport(familyId, teenAddress);

  const hash = await flowWalletClient.writeContract({
    account: executorAccount,
    address: CONTRACTS.passport,
    abi: PASSPORT_ABI,
    functionName: "recordAction",
    args: [familyId, teenAddress, actionType, approved],
  });

  const after = await getPassport(familyId, teenAddress);

  return {
    txHash: hash,
    leveledUp: after.level > before.level,
    newLevel: after.level,
  };
}

export async function getPassport(
  familyId: `0x${string}`,
  teenAddress: `0x${string}`,
): Promise<PassportState> {
  const [level, levelName, streak, total, savings, subs, rejected] =
    (await flowPublicClient.readContract({
      address: CONTRACTS.passport,
      abi: PASSPORT_ABI,
      functionName: "getPassport",
      args: [familyId, teenAddress],
    })) as [number, string, number, number, number, number, number];

  const currentLevel = Number(level);
  const nextLevel = Math.min(currentLevel + 1, PASSPORT_LEVELS.length - 1);
  const nextThreshold = PASSPORT_LEVELS[nextLevel].threshold;
  const totalNum = Number(total);
  const remaining = Math.max(nextThreshold - totalNum, 0);

  return {
    level: currentLevel,
    levelName,
    weeklyStreak: Number(streak),
    totalActions: totalNum,
    savingsCount: Number(savings),
    approvedSubs: Number(subs),
    rejectedActions: Number(rejected),
    progressToNext: {
      current: totalNum,
      needed: nextThreshold,
      remaining,
      nextLevelName: PASSPORT_LEVELS[nextLevel].name,
      percentComplete:
        nextThreshold > 0 ? Math.round((totalNum / nextThreshold) * 100) : 100,
    },
  };
}

