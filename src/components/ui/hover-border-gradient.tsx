"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

const movingMap: Record<Direction, string> = {
  TOP: "radial-gradient(20.7% 50% at 50% 0%, hsl(165, 70%, 96%) 0%, rgba(255, 255, 255, 0) 100%)",
  LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, hsl(165, 70%, 96%) 0%, rgba(255, 255, 255, 0) 100%)",
  BOTTOM: "radial-gradient(20.7% 50% at 50% 100%, hsl(165, 70%, 96%) 0%, rgba(255, 255, 255, 0) 100%)",
  RIGHT: "radial-gradient(16.2% 41.2% at 100% 50%, hsl(165, 70%, 96%) 0%, rgba(255, 255, 255, 0) 100%)",
};

const highlight =
  "radial-gradient(75% 181.15942028985506% at 50% 50%, rgba(64, 179, 155, 0.9) 0%, rgba(255, 255, 255, 0) 100%)";

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Element = "button",
  duration = 1,
  clockwise = true,
  ...props
}: React.PropsWithChildren<{
  as?: React.ElementType;
  containerClassName?: string;
  className?: string;
  duration?: number;
  clockwise?: boolean;
} & React.HTMLAttributes<HTMLElement>>) {
  const [hovered, setHovered] = useState(false);
  const [direction, setDirection] = useState<Direction>("BOTTOM");

  useEffect(() => {
    if (!hovered) {
      const directions: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];
      const interval = setInterval(() => {
        setDirection((current) => {
          const index = directions.indexOf(current);
          const nextIndex = clockwise
            ? (index - 1 + directions.length) % directions.length
            : (index + 1) % directions.length;
          return directions[nextIndex]!;
        });
      }, duration * 1000);
      return () => clearInterval(interval);
    }
  }, [hovered, clockwise, duration]);

  return (
    <Element
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex h-min w-fit items-center justify-center overflow-visible rounded-full border border-white/30 bg-white/40 p-px backdrop-blur-sm transition hover:bg-white/60",
        containerClassName,
      )}
      {...props}
    >
      <div className={cn("z-10 rounded-[inherit] bg-[oklch(0.24_0.03_165)] px-4 py-2 text-[oklch(0.98_0.008_90)]", className)}>
        {children}
      </div>
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-[inherit]"
        style={{ filter: "blur(2px)" }}
        initial={{ background: movingMap[direction] }}
        animate={{ background: hovered ? [movingMap[direction], highlight] : movingMap[direction] }}
        transition={{ ease: "linear", duration }}
      />
      <div className="absolute inset-0.5 rounded-full bg-[oklch(0.24_0.03_165)]" />
    </Element>
  );
}
