import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "panel-shadow rounded-[1.75rem] border border-border/70 bg-card/90",
        className,
      )}
      {...props}
    />
  );
}
