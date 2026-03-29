import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "MISSING_CONFIG"
  | "PERMISSION_DENIED"
  | "CHAIN_TX_FAILED"
  | "EVIDENCE_WRITE_FAILED"
  | "POLICY_UNAVAILABLE"
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function fail(
  code: ApiErrorCode,
  message: string,
  status = 500,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      success: false,
      code,
      error: message,
      ...(extra || {}),
    },
    { status },
  );
}

export function mapErrorToCode(error: unknown): ApiErrorCode {
  const message =
    error instanceof Error ? error.message : String(error || "Unknown error");

  if (message.startsWith("MISSING_CONFIG")) return "MISSING_CONFIG";
  if (message.includes("POLICY_UNAVAILABLE")) return "POLICY_UNAVAILABLE";
  if (message.includes("permission") || message.includes("PERMISSION_DENIED")) {
    return "PERMISSION_DENIED";
  }
  if (
    message.includes("Storacha") ||
    message.includes("upload") ||
    message.includes("EVIDENCE_WRITE_FAILED")
  ) {
    return "EVIDENCE_WRITE_FAILED";
  }
  if (message.includes("tx") || message.includes("transaction")) {
    return "CHAIN_TX_FAILED";
  }

  return "INTERNAL_ERROR";
}
