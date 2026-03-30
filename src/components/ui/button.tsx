import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-[0.01em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,oklch(0.67_0.08_76),oklch(0.8_0.06_90),oklch(0.74_0.095_82))] text-primary-foreground shadow-[0_16px_40px_oklch(0.76_0.105_82_/_0.22)] hover:-translate-y-0.5 hover:shadow-[0_22px_50px_oklch(0.76_0.105_82_/_0.28)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-border/80 bg-card/60 text-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.04)] hover:border-primary/50 hover:bg-card/85 hover:text-primary",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.04)] hover:bg-secondary/90",
        ghost:
          "text-foreground hover:bg-primary/10 hover:text-primary",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-[52px] px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
