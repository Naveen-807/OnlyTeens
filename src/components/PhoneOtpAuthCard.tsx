"use client";

import { useState } from "react";

import type { Role, UserSession } from "@/lib/types";

type Props = {
  role: Role;
  familyId?: string;
  title?: string;
  subtitle?: string;
  onSession?: (session: UserSession) => Promise<void> | void;
  submitLabel?: string;
  actionLabel?: string;
};

export function PhoneOtpAuthCard({
  role,
  familyId,
  title,
  subtitle,
  onSession,
  submitLabel,
  actionLabel,
}: Props) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [verificationSid, setVerificationSid] = useState<string | null>(null);
  const [verifiedSession, setVerifiedSession] = useState<UserSession | null>(null);

  const sendCode = async () => {
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to send OTP");
      }
      setVerificationSid(data.verification?.sid || null);
      setStatus(`OTP sent to ${data.verification?.to || phoneNumber.trim()}.`);
    } catch (error: any) {
      setStatus(error?.message || "Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/auth/${role}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          code: code.trim(),
          familyId: familyId?.trim() || "",
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || `Failed to verify ${role} login`);
      }

      await onSession?.(data.session as UserSession);
      setVerifiedSession(data.session as UserSession);

      setStatus(
        data.session?.familyId
          ? `Connected as ${role}. Session bootstrapped for family ${data.session.familyId}.`
          : `Connected as ${role}. Phone verified successfully.`,
      );
      setCode("");
    } catch (error: any) {
      setStatus(error?.message || `Failed to connect as ${role}`);
    } finally {
      setLoading(false);
    }
  };

  const canVerify = phoneNumber.trim() && code.trim();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Real session
        </p>
        <h3 className="mt-1 text-base font-semibold text-gray-900">
          {title || `Connect as ${role}`}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {subtitle ||
            "Verify a phone number with a real OTP, then bootstrap the Lit-backed session."}
        </p>
      </div>

      <div className="space-y-3">
        <label className="block space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Phone number
          </span>
          <div className="flex gap-2">
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              placeholder="+14155552671"
            />
            <button
              type="button"
              onClick={sendCode}
              disabled={sending || !phoneNumber.trim()}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send code"}
            </button>
          </div>
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            OTP code
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            placeholder="123456"
          />
          <p className="text-xs text-gray-500">
            {verificationSid
              ? `Verification active${familyId ? ` for family ${familyId}` : ""}.`
              : "Send a code first, then enter the SMS OTP here."}
          </p>
        </label>

        <button
          type="button"
          onClick={verifyCode}
          disabled={loading || !canVerify}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Verifying..."
            : submitLabel || actionLabel || `Verify ${role} login`}
        </button>

        {status ? (
          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            {status}
          </div>
        ) : null}

        {verifiedSession ? (
          <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950">
            <div className="font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Wallet mapping
            </div>
            <div>
              Verified phone: <span className="font-mono">{verifiedSession.phoneNumber}</span>
            </div>
            <div>
              Flow wallet: <span className="font-mono">{verifiedSession.address}</span>
            </div>
            {verifiedSession.pkpAddress ? (
              <div>
                Hidden PKP executor:{" "}
                <span className="font-mono">{verifiedSession.pkpAddress}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
