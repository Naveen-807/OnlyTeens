"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowUpRight, Coins, ShieldCheck, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export function MomentumMetricsBlock({
  metrics,
}: {
  metrics: { label: string; value: string; delta: string; description: string }[];
}) {
  return (
    <section className="relative overflow-hidden px-0 py-2">
      <div className="mx-auto space-y-5">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="max-w-3xl">
          <Badge className="mb-4 gap-2 rounded-full border-primary/20 bg-primary/10 text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            guided autonomy
          </Badge>
          <h2 className="max-w-3xl text-[clamp(2rem,4vw,3.7rem)] font-semibold leading-[0.95] tracking-tight text-foreground" style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", serif' }}>
            Household finance, staged like a private club instead of a compliance wall.
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.08 }}
          className="grid gap-4 md:grid-cols-2"
        >
          {metrics.map((metric) => (
            <motion.div key={metric.label} variants={fadeUp}>
              <Card className="group relative overflow-hidden rounded-[2rem] border-border/70 bg-card/80 p-7 backdrop-blur">
                <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(64,179,155,0.12),transparent_45%)]" />
                <div className="relative z-10 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
                      {metric.label}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                  <div className="flex items-end gap-3">
                    <span className="text-5xl font-semibold tracking-tight text-foreground">{metric.value}</span>
                    <span className="rounded-full border border-border/50 bg-white/70 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      {metric.delta}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{metric.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="grid gap-4 rounded-[2rem] border border-border/70 bg-card/75 p-5 backdrop-blur md:grid-cols-[1.2fr_0.8fr_0.8fr]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">treasury rhythm</p>
              <p className="text-base text-foreground">Allowance, savings, and approvals all stage through one household treasury.</p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-border/60 bg-white/65 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">policy</p>
            <p className="mt-2 text-lg font-semibold text-foreground">Confidential thresholds</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/60 bg-white/65 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">evidence</p>
            <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Coins className="h-4 w-4 text-primary" />
              Filecoin-ready trail
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
