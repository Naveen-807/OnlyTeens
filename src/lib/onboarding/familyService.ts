import { keccak256, toUtf8Bytes } from "ethers";
import type { FamilyRecord, LinkedTeenAccount } from "@/lib/types/onboarding";

// ─── Durable storage (file-based for hackathon) ───
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FAMILIES_FILE = path.join(DATA_DIR, "families.json");

function normalizeLinkedTeen(teen: LinkedTeenAccount) {
  return {
    ...teen,
    calmaAddress: teen.calmaAddress || teen.clawrenceAddress,
    calmaPkpPublicKey: teen.calmaPkpPublicKey || teen.clawrencePkpPublicKey,
    calmaPkpTokenId: teen.calmaPkpTokenId || teen.clawrencePkpTokenId,
    calmaChipotleWalletId: teen.calmaChipotleWalletId || teen.clawrenceChipotleWalletId,
    clawrenceAddress: teen.clawrenceAddress || teen.calmaAddress || "",
    clawrencePkpPublicKey: teen.clawrencePkpPublicKey || teen.calmaPkpPublicKey || "",
    clawrencePkpTokenId: teen.clawrencePkpTokenId || teen.calmaPkpTokenId || "",
    clawrenceChipotleWalletId:
      teen.clawrenceChipotleWalletId || teen.calmaChipotleWalletId,
  };
}

function normalizeFamilyRecord(family: FamilyRecord): FamilyRecord {
  return {
    ...family,
    calmaAddress: family.calmaAddress || family.clawrenceAddress,
    calmaPkpPublicKey: family.calmaPkpPublicKey || family.clawrencePkpPublicKey,
    calmaPkpTokenId: family.calmaPkpTokenId || family.clawrencePkpTokenId,
    chipotleCalmaWalletId:
      family.chipotleCalmaWalletId || family.chipotleClawrenceWalletId,
    clawrenceAddress: family.clawrenceAddress || family.calmaAddress || "",
    clawrencePkpPublicKey:
      family.clawrencePkpPublicKey || family.calmaPkpPublicKey || "",
    clawrencePkpTokenId: family.clawrencePkpTokenId || family.calmaPkpTokenId || "",
    chipotleClawrenceWalletId:
      family.chipotleClawrenceWalletId || family.chipotleCalmaWalletId,
    linkedTeens: family.linkedTeens?.map(normalizeLinkedTeen) || [],
  };
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FAMILIES_FILE)) fs.writeFileSync(FAMILIES_FILE, "{}");
}

export function loadFamilies(): Record<string, FamilyRecord> {
  ensureDataDir();
  try {
    const raw = JSON.parse(fs.readFileSync(FAMILIES_FILE, "utf-8")) as Record<
      string,
      FamilyRecord
    >;
    return Object.fromEntries(
      Object.entries(raw).map(([familyId, family]) => [familyId, normalizeFamilyRecord(family)]),
    );
  } catch {
    return {};
  }
}

export function saveFamily(family: FamilyRecord): void {
  ensureDataDir();
  const families = loadFamilies();
  families[family.familyId] = normalizeFamilyRecord(family);
  fs.writeFileSync(FAMILIES_FILE, JSON.stringify(families, null, 2));
}

export function getFamilyByGuardian(guardianAddress: string): FamilyRecord | null {
  const families = loadFamilies();
  return (
    Object.values(families).find(
      (f) =>
        f.guardianAddress.toLowerCase() === guardianAddress.toLowerCase() &&
        f.active
    ) || null
  );
}

export function getFamilyByTeen(teenAddress: string): FamilyRecord | null {
  const families = loadFamilies();
  return (
    Object.values(families).find(
      (f) =>
        (f.teenAddress.toLowerCase() === teenAddress.toLowerCase() ||
          f.linkedTeens?.some(
            (teen) => teen.active && teen.teenAddress.toLowerCase() === teenAddress.toLowerCase(),
          )) &&
        f.active
    ) || null
  );
}

export function getFamilyById(familyId: string): FamilyRecord | null {
  const families = loadFamilies();
  return families[familyId] || null;
}

// ─── Generate deterministic family ID ───
export function generateFamilyId(
  guardianAddress: string,
  teenAddress: string,
  nonce: number = 0
): string {
  return keccak256(
    toUtf8Bytes(`${guardianAddress}-${teenAddress}-${nonce}`)
  );
}
