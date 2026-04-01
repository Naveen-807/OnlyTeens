import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full min-w-0 rounded-2xl border border-input bg-[linear-gradient(180deg,oklch(0.11_0.008_85_/_0.92),oklch(0.075_0.005_85_/_0.96))] px-4 text-sm text-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.04),0_12px_40px_oklch(0_0_0_/_0.18)] outline-none transition",
        "placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10",
        className,
      )}
      {...props}
    />
  );
}
