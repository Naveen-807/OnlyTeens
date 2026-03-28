"use client";

import type React from "react";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ShieldCheck, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface TrustOrbitCardProps {
  label?: string;
  coordinates?: string;
  className?: string;
}

export function TrustOrbitCard({
  label = "Confidential Policy Orbit",
  coordinates = "guardian scope · teen safe zone · evidence pinned",
  className,
}: TrustOrbitCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-50, 50], [8, -8]);
  const rotateY = useTransform(mouseX, [-50, 50], [-8, 8]);
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - (rect.left + rect.width / 2));
    mouseY.set(e.clientY - (rect.top + rect.height / 2));
  };

  return (
    <motion.div
      ref={containerRef}
      className={cn("relative cursor-pointer select-none", className)}
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
        setIsHovered(false);
      }}
      onClick={() => setIsExpanded((current) => !current)}
    >
      <motion.div
        className="relative overflow-hidden rounded-[1.7rem] border border-border bg-card"
        style={{ rotateX: springRotateX, rotateY: springRotateY, transformStyle: "preserve-3d" }}
        animate={{ width: isExpanded ? 360 : 270, height: isExpanded ? 280 : 150 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(64,179,155,0.17),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(245,241,231,0.96))]" />
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="dashed-orbit absolute inset-0" />
              {[18, 36, 50, 66, 82].map((top, index) => (
                <motion.div
                  key={top}
                  className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary/50"
                  style={{ top: `${top}%` }}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 + index * 0.08 }}
                />
              ))}
              <motion.div
                className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 p-3"
                initial={{ scale: 0.2 }}
                animate={{ scale: 1 }}
              >
                <ShieldCheck className="h-full w-full text-primary" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="relative z-10 flex h-full flex-col justify-between p-5">
          <div className="flex items-start justify-between">
            <Sparkles className="h-5 w-5 text-primary" />
            <div className="rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              live
            </div>
          </div>
          <div className="space-y-2">
            <motion.h3
              className="text-sm font-semibold tracking-tight text-foreground"
              animate={{ x: isHovered ? 4 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {label}
            </motion.h3>
            <AnimatePresence>
              {isExpanded && (
                <motion.p
                  className="text-xs text-muted-foreground"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                >
                  {coordinates}
                </motion.p>
              )}
            </AnimatePresence>
            <motion.div
              className="h-px bg-gradient-to-r from-primary/60 via-primary/20 to-transparent"
              animate={{ scaleX: isHovered || isExpanded ? 1 : 0.35 }}
              transition={{ duration: 0.4 }}
              style={{ originX: 0 }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
