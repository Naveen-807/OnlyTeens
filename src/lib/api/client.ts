"use client";

export interface ApiResultLike {
  success?: boolean;
  error?: string;
  message?: string;
}

export function extractApiError(
  payload: unknown,
  fallbackMessage = "Request failed",
): string {
  if (!payload || typeof payload !== "object") {
    return fallbackMessage;
  }

  const candidate = payload as {
    error?: unknown;
    message?: unknown;
  };

  if (typeof candidate.error === "string" && candidate.error.trim()) {
    return candidate.error;
  }

  if (typeof candidate.message === "string" && candidate.message.trim()) {
    return candidate.message;
  }

  return fallbackMessage;
}

export async function readJsonResponse<T>(
  response: Response,
  fallbackMessage = "Request failed",
): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(fallbackMessage);
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackMessage = "Request failed",
): Promise<T> {
  const response = await fetch(input, init);
  const data = await readJsonResponse<T>(response, fallbackMessage);

  if (!response.ok) {
    throw new Error(extractApiError(data, fallbackMessage));
  }

  return data;
}

export async function fetchApi<T extends ApiResultLike>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackMessage = "Request failed",
): Promise<T> {
  const data = await fetchJson<T>(input, init, fallbackMessage);

  if (data.success === false) {
    throw new Error(extractApiError(data, fallbackMessage));
  }

  return data;
}

export function hasRenderableLink(
  value?: string | null,
  href?: string | null,
): boolean {
  return Boolean(value && href);
}
