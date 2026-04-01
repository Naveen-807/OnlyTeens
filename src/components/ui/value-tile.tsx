"use client";

import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function shortenValue(value: string) {
  if (value.length <= 24) return value;
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

type ValueTileProps = {
  label: string;
  value?: string | null;
  className?: string;
  tone?: "neutral" | "gold";
  href?: string | null;
  copyable?: boolean;
  helperText?: string;
};

export function ValueTile({
  label,
  value,
  className,
  tone = "neutral",
  href,
  copyable = false,
  helperText,
}: ValueTileProps) {
  const [copied, setCopied] = useState(false);
  const safeValue = value?.trim() || "";
  const displayValue = safeValue ? shortenValue(safeValue) : "n/a";

  const handleCopy = async () => {
    if (!safeValue) return;
    try {
      await navigator.clipboard.writeText(safeValue);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-[1.35rem] border p-4 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.04)]",
        tone === "gold"
          ? "border-primary/25 bg-[linear-gradient(180deg,oklch(0.13_0.01_85_/_0.98),oklch(0.085_0.006_85_/_0.96))]"
          : "border-border/60 bg-[linear-gradient(180deg,oklch(0.1_0.007_85_/_0.95),oklch(0.075_0.005_85_/_0.98))]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {label}
          </p>
          <p
            className="mt-2 min-w-0 truncate font-mono text-xs leading-5 text-foreground"
            title={safeValue || undefined}
          >
            {displayValue}
          </p>
          {helperText ? (
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{helperText}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {href && safeValue ? (
            <Button
              asChild
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
            >
              <Link href={href} target="_blank" rel="noreferrer" aria-label={`Open ${label}`}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : null}
          {copyable && safeValue ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              aria-label={`Copy ${label}`}
              className={cn(
                "h-8 w-8 text-muted-foreground hover:text-primary",
                copied && "text-primary",
              )}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}