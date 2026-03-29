import "server-only";

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const IDEMPOTENCY_FILE = path.join(DATA_DIR, "idempotency.json");

type Cache = Record<string, unknown>;

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(IDEMPOTENCY_FILE)) fs.writeFileSync(IDEMPOTENCY_FILE, "{}");
}

function loadAll(): Cache {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(IDEMPOTENCY_FILE, "utf-8")) as Cache;
  } catch {
    return {};
  }
}

function saveAll(data: Cache): void {
  ensureFile();
  fs.writeFileSync(IDEMPOTENCY_FILE, JSON.stringify(data, null, 2));
}

export function getCachedIdempotentResult<T = unknown>(key?: string | null): T | null {
  if (!key) return null;
  const all = loadAll();
  return (all[key] as T) ?? null;
}

export function setCachedIdempotentResult(key: string, value: unknown): void {
  if (!key) return;
  const all = loadAll();
  all[key] = value;
  saveAll(all);
}

