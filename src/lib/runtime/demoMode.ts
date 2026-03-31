import { isLiveMode } from "@/lib/runtime/liveMode";

export function isDemoStrictMode(): boolean {
  return process.env.DEMO_STRICT_MODE === "true";
}

export function isStrictRuntimeMode(): boolean {
  return isDemoStrictMode() || isLiveMode();
}

export function ensureDemoStrict(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}
