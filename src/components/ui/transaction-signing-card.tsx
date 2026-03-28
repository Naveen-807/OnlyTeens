"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Lock, Shield, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PolicyState } from "@/types/proof18";

interface TransactionSigningCardProps {
  amount?: number;
  title?: string;
  policy?: PolicyState;
  className?: string;
  onApprove?: () => void;
  disabled?: boolean;
}

export function TransactionSigningCard({
  amount = 14.99,
  title = "Recurring request: StudyStack Premium",
  policy = "red",
  className,
  onApprove,
  disabled,
}: TransactionSigningCardProps) {
  const tone = {
    green: "border-emerald-300/80 bg-emerald-50/70 text-emerald-900",
    yellow: "border-amber-300/80 bg-amber-50/70 text-amber-900",
    red: "border-rose-300/80 bg-rose-50/80 text-rose-900",
    blocked: "border-stone-300/80 bg-stone-100/80 text-stone-700",
  }[policy];

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className={cn("w-full max-w-[420px]", className)}>
      <Card className="overflow-hidden border-border/60 bg-card/85 backdrop-blur">
        <div className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">signing request</p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{title}</h3>
            </div>
            <div className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]", tone)}>
              {policy}
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-white/70 p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">treasury movement</p>
                <p className="mt-1 text-4xl font-semibold text-foreground">${amount.toFixed(2)}</p>
              </div>
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/60 bg-card/70 p-3">
                <Shield className="mb-2 h-4 w-4 text-primary" />
                Confidential policy checked
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/70 p-3">
                <Lock className="mb-2 h-4 w-4 text-primary" />
                Guardian authority bound
              </div>
            </div>
          </div>
          <Button className="w-full" disabled={disabled} onClick={onApprove}>
            <CheckCircle2 className="h-4 w-4" />
            Confirm and sign
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
