import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/80 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
