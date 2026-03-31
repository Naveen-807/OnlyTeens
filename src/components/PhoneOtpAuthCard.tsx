"use client";

import { useState } from "react";
import { CheckCircle2, Phone, Send } from "lucide-react";

import type { Role, UserSession } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [verifiedSession, setVerifiedSession] = useState<UserSession | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");

  const sendCode = async () => {
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          role,
          familyId: familyId?.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to send OTP");
      }
      setChallengeId(data.challengeId || null);
      setMaskedPhone(data.maskedPhone || phoneNumber.trim());
      setDemoCode(data.demoCode || null);
      setStatus(`OTP sent to ${data.maskedPhone || phoneNumber.trim()}.`);
      setStatusType("info");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send OTP";
      setStatus(errorMessage);
      setStatusType("error");
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          code: code.trim(),
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
      setStatusType("success");
      setCode("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `Failed to connect as ${role}`;
      setStatus(errorMessage);
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  };

  const canVerify = challengeId && phoneNumber.trim() && code.trim().length === 6;

  return (
    <Card className="w-full max-w-md bg-card/90 border-border/30 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-lg bg-primary/20 p-2">
            <Phone className="h-5 w-5 text-primary" />
          </div>
          <Badge className="capitalize">{role}</Badge>
        </div>
        <CardTitle className="text-xl">
          {title || `Connect as ${role}`}
        </CardTitle>
        <CardDescription>
          {subtitle ||
            "Verify a phone number with a real OTP, then bootstrap the Calma session and Flow-linked app wallet."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Phone Number Input */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Phone number
          </label>
          <div className="flex gap-2">
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-1 bg-background/50"
              placeholder="+14155552671"
            />
            <Button
              type="button"
              variant="outline"
              onClick={sendCode}
              disabled={sending || !phoneNumber.trim()}
            >
              {sending ? "Sending..." : <><Send className="h-4 w-4 mr-1" /> Send</>}
            </Button>
          </div>
        </div>

        {/* OTP Code Input */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            OTP code
          </label>
          <Input
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="bg-background/50 text-center text-lg tracking-[0.3em]"
            placeholder="123456"
            maxLength={6}
            inputMode="numeric"
          />
          <p className="text-xs text-muted-foreground">
            {challengeId
              ? `Verification active${maskedPhone ? ` for ${maskedPhone}` : ""}${familyId ? ` in family ${familyId.slice(0, 10)}...` : ""}.`
              : "Send a code first, then enter the SMS OTP here."}
          </p>
          {demoCode ? (
            <p className="text-xs text-primary">
              Demo OTP: <span className="font-mono">{demoCode}</span>
            </p>
          ) : null}
        </div>

        {/* Verify Button */}
        <Button
          type="button"
          onClick={verifyCode}
          disabled={loading || !canVerify}
          className="w-full"
        >
          {loading
            ? "Verifying..."
            : submitLabel || actionLabel || `Verify ${role} login`}
        </Button>

        {/* Status Message */}
        {status && (
          <div className={cn(
            "rounded-lg p-3 text-sm",
            statusType === "success"
              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/30"
              : statusType === "info"
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-rose-950/40 text-rose-400 border border-rose-500/30"
          )}>
            {status}
          </div>
        )}

        {/* Verified Session Info */}
        {verifiedSession && (
          <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Session Mapping
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-mono text-foreground">{verifiedSession.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flow Wallet</span>
                <span className="font-mono text-foreground truncate max-w-[180px]">
                  {verifiedSession.address}
                </span>
              </div>
              {verifiedSession.pkpAddress && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Executor Wallet</span>
                  <span className="font-mono text-foreground truncate max-w-[180px]">
                    {verifiedSession.pkpAddress}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
