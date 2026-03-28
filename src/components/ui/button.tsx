import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-45",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        {
          "bg-primary text-primary-foreground shadow-[0_10px_30px_oklch(0.66_0.14_171_/_0.28)] hover:-translate-y-0.5":
            variant === "primary",
          "bg-secondary text-secondary-foreground hover:bg-secondary/80":
            variant === "secondary",
          "bg-transparent text-foreground hover:bg-foreground/5":
            variant === "ghost",
          "bg-destructive text-destructive-foreground hover:bg-destructive/90":
            variant === "danger",
          "border border-border bg-card/70 text-card-foreground hover:bg-card":
            variant === "outline",
          "h-8 px-3 text-sm": size === "sm",
          "h-11 px-5 text-sm": size === "md",
          "h-12 px-6 text-base": size === "lg",
          "h-10 w-10": size === "icon",
        },
        className,
      )}
      {...props}
    />
  );
}
