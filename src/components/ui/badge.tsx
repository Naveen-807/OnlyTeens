import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] transition-colors",
  {
    variants: {
      variant: {
        default:
          "border border-primary/35 bg-primary/12 text-primary",
        secondary:
          "border border-border/60 bg-secondary/80 text-secondary-foreground",
        destructive:
          "border border-destructive/30 bg-destructive/20 text-destructive",
        outline:
          "border border-border/60 bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
