export function isLiveMode(): boolean {
  return process.env.PROOF18_LIVE_MODE === "true";
}

export function isDegradedModeAllowed(): boolean {
  return process.env.PROOF18_ALLOW_DEGRADED_MODE === "true";
}

export function assertLiveMode(condition: boolean, message: string): void {
  if (isLiveMode() && !condition) {
    throw new Error(message);
  }
}

export function assertNoSilentFallback(message: string): void {
  assertLiveMode(isDegradedModeAllowed(), message);
}
