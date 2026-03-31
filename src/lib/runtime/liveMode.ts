export function isLiveMode(): boolean {
  return process.env.PROOF18_LIVE_MODE === "true";
}

export function isEmergencyFallbackEnabled(): boolean {
  return process.env.PROOF18_ENABLE_EMERGENCY_FALLBACK === "true";
}

export function assertLiveMode(condition: boolean, message: string): void {
  if (isLiveMode() && !condition) {
    throw new Error(message);
  }
}

export function assertNoSilentFallback(message: string): void {
  assertLiveMode(!isEmergencyFallbackEnabled(), message);
}

export function assertLiveDependency(condition: boolean, code: string, message: string): void {
  assertLiveMode(condition, `${code}:${message}`);
}
