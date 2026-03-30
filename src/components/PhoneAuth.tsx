"use client";

import { useState } from "react";
import type { Role } from "@/lib/types";

interface PhoneAuthProps {
  role: Role;
  onSuccess: (result: {
    session: any;
    bootstrap: any;
    family?: any;
  }) => void;
  onError?: (error: string) => void;
  familyId?: string;
}

type Step = "phone" | "otp" | "minting" | "done";

export function PhoneAuth({
  role,
  onSuccess,
  onError,
  familyId,
}: PhoneAuthProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [challengeId, setChallengeId] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);

  const handleError = (message: string) => {
    setError(message);
    onError?.(message);
  };

  const sendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phone,
          role,
          familyId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        handleError(data.error || "Failed to send OTP");
        return;
      }

      setChallengeId(data.challengeId);
      if (data.demoCode) {
        setDemoCode(data.demoCode);
      }
      setStep("otp");
    } catch (e: any) {
      handleError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    setError("");
    setStep("minting");

    try {
      const res = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          code: otp,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStep("otp");
        handleError(data.error || "Failed to verify OTP");
        return;
      }

      setStep("done");
      onSuccess({
        session: data.session,
        bootstrap: data.bootstrap,
        family: data.family,
      });
    } catch (e: any) {
      setStep("otp");
      handleError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneInput = (value: string) => {
    // Keep the + prefix, only allow digits after
    if (!value.startsWith("+")) {
      value = "+" + value.replace(/\D/g, "");
    } else {
      value = "+" + value.slice(1).replace(/\D/g, "");
    }
    return value;
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl mb-2">
          {role === "guardian" ? "Parent" : "Teen"}
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {role === "guardian" ? "Guardian Login" : "Teen Login"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          No wallet needed. Just your phone number.
        </p>
      </div>

      {/* Step 1: Phone Number */}
      {step === "phone" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              placeholder="+919876543210"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">
              Include country code (+91 for India)
            </p>
          </div>
          <button
            onClick={sendOTP}
            disabled={loading || phone.length < 10}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </div>
      )}

      {/* Step 2: OTP Entry */}
      {step === "otp" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Enter the 6-digit code sent to{" "}
            <strong>{phone.slice(0, 4)}****{phone.slice(-4)}</strong>
          </p>

          {demoCode && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
              <p className="text-xs text-amber-600 font-medium">DEMO MODE</p>
              <p className="text-lg font-mono font-bold text-amber-700">
                {demoCode}
              </p>
            </div>
          )}

          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="------"
            maxLength={6}
            className="w-full border border-gray-300 rounded-lg px-4 py-4 text-2xl text-center font-mono tracking-[0.5em] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            autoFocus
          />

          <button
            onClick={verifyOTP}
            disabled={loading || otp.length !== 6}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
          >
            {loading ? "Verifying..." : "Verify & Create Wallet"}
          </button>

          <button
            onClick={() => {
              setStep("phone");
              setOtp("");
              setChallengeId("");
              setDemoCode(null);
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Change number
          </button>
        </div>
      )}

      {/* Step 3: Minting PKP */}
      {step === "minting" && (
        <div className="text-center space-y-4 py-8">
          <div className="animate-spin text-4xl mx-auto w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
          <div>
            <p className="font-medium text-gray-900">
              Creating your secure wallet...
            </p>
            <p className="text-xs text-gray-500 mt-2">
              This uses Lit Protocol to create a non-custodial wallet linked to
              your phone number. No seed phrases needed.
            </p>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === "done" && (
        <div className="text-center space-y-4 py-8">
          <div className="text-5xl">Done</div>
          <div>
            <p className="font-medium text-gray-900">Wallet Created!</p>
            <p className="text-sm text-gray-500 mt-2">
              {role === "guardian"
                ? "Set up your family rules next."
                : "Start saving!"}
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Privacy Note */}
      <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
        Your phone number is used only for authentication.
        <br />
        No wallet seed phrases. No browser extensions.
      </div>
    </div>
  );
}
