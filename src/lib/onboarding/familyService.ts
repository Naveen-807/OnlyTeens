import "server-only";

import { keccak256, stringToBytes, toHex } from "viem";
import type { FamilyRecord } from "@/lib/types/onboarding";
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FAMILIES_FILE = path.join(DATA_DIR, "families.json");
let writeLock: Promise<void> = Promise.resolve();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FAMILIES_FILE)) fs.writeFileSync(FAMILIES_FILE, "{}");
}

export function loadFamilies(): Record<string, FamilyRecord> {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(FAMILIES_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function withWriteLock<T>(task: () => T | Promise<T>): Promise<T> {
  const next = writeLock.then(task, task);
  writeLock = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export function saveFamily(family: FamilyRecord): Promise<void> {
  return withWriteLock(async () => {
    ensureDataDir();
    const families = loadFamilies();
    families[family.familyId] = family;
    fs.writeFileSync(FAMILIES_FILE, JSON.stringify(families, null, 2));
  });
}

export function getFamilyByGuardian(guardianAddress: string): FamilyRecord | null {
  const families = loadFamilies();
  return (
    Object.values(families).find(
      (family) =>
        family.guardianAddress.toLowerCase() === guardianAddress.toLowerCase() &&
        family.active,
    ) || null
  );
}

export function getFamilyByTeen(teenAddress: string): FamilyRecord | null {
  const families = loadFamilies();
  return (
    Object.values(families).find(
      (family) =>
        family.teenAddress.toLowerCase() === teenAddress.toLowerCase() && family.active,
    ) || null
  );
}

export function getFamilyById(familyId: string): FamilyRecord | null {
  const families = loadFamilies();
  return families[familyId] || null;
}

export function generateFamilyId(
  guardianAddress: string,
  teenAddress: string,
  nonce = 0,
): string {
  return keccak256(
    toHex(stringToBytes(`${guardianAddress}-${teenAddress}-${nonce}`)),
  );
}
