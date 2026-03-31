import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const surfaceLinks = [
  {
    href: "/auth",
    eyebrow: "Launch path",
    title: "Start the onboarding funnel",
    description:
      "Phone OTP, role routing, session bootstrap, and proof capture in one controlled flow.",
    icon: Sparkles,
  },
  {
    href: "/teen",
    eyebrow: "Teen view",
    title: "Enter the teen workspace",
    description:
      "Savings, subscriptions, chat, and passport progress inside a calmer day-to-day shell.",
    icon: UserRound,
  },
  {
    href: "/guardian",
    eyebrow: "Guardian view",
    title: "Open the control room",
    description:
      "Rules, approvals, auditability, and layered execution safety without losing clarity.",
    icon: ShieldCheck,
  },
];

const pillars = [
  "Walletless onboarding and sponsored gas keep the product consumer-first.",
  "Guardian authority stays explicit while teens build autonomy on Flow.",
  "Recurring actions are automation-first, with proof instead of guesswork.",
];

export default function Page() {
  return (
    <main className="grain hero-vignette min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <section className="premium-panel gold-border-glow overflow-hidden rounded-[2rem] px-6 py-8 sm:px-8 lg:px-12 lg:py-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:items-end">
            <div className="max-w-4xl">
              <div className="flex flex-wrap gap-2">
                <Badge>Proof18</Badge>
                <Badge>Calma</Badge>
                <Badge variant="secondary">Direct + Agent Flow lanes</Badge>
                <Badge variant="outline">Flow EVM • Zama • Chipotle • Vincent</Badge>
              </div>

              <div className="mt-8 max-w-4xl">
                <Image
                  src="/proof18-wordmark.svg"
                  alt="Calma"
                  width={220}
                  height={52}
                  className="h-auto w-[180px] sm:w-[220px]"
                  priority
                />
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-primary/75">
                  Calma on Flow
                </p>
                <h1 className="font-display mt-4 max-w-5xl text-[clamp(3.4rem,9vw,7.2rem)] leading-[0.88] tracking-[-0.05em] text-gold-gradient">
                  Family finance on Flow, with direct actions, private policy, and bounded autopilot.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Calma gives guardians and teens Flow-linked app wallets, direct FLOW actions,
                  an agent-assisted lane for natural language requests, and a narrow guardian-only
                  autopilot. Flow moves value, Zama protects policy, and Vincent plus Lit bound execution.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/auth"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,oklch(0.67_0.08_76),oklch(0.8_0.06_90),oklch(0.74_0.095_82))] px-6 text-sm font-semibold text-primary-foreground shadow-[0_18px_44px_oklch(0.76_0.105_82_/_0.24)] transition hover:-translate-y-0.5"
                >
                  Enter onboarding
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/guardian"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-border/80 bg-card/60 px-6 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"
                >
                  Guardian room
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <Card className="rounded-[1.7rem] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[0.7rem] uppercase tracking-[0.24em] text-muted-foreground">
                    System posture
                  </p>
                  <LockKeyhole className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-5 space-y-3">
                  {pillars.map((pillar) => (
                    <div
                      key={pillar}
                      className="flex items-start gap-3 rounded-[1.2rem] border border-border/60 bg-background/40 px-4 py-3"
                    >
                      <BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />
                      <p className="text-sm leading-6 text-foreground/88">{pillar}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-6 text-muted-foreground">
                  The user experience is consumer finance first. Flow handles execution,
                  recurring actions, and gasless-ready settlement while the policy and
                  authorization layers stay visible but out of the way.
                </p>
              </Card>

              <Card className="rounded-[1.7rem] p-5">
                <p className="text-[0.7rem] uppercase tracking-[0.24em] text-muted-foreground">
                  Design anchor
                </p>
                <div className="mt-4 rounded-[1.4rem] border border-primary/20 bg-[linear-gradient(180deg,oklch(0.14_0.012_85),oklch(0.09_0.006_85))] p-5">
                  <p className="font-display text-3xl leading-none tracking-[-0.04em] text-foreground">
                    Guardian control without killing the teen experience.
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    The product should read as a Flow-native consumer app first, with
                    privacy, authorization, and proof layered in as trust machinery.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {surfaceLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href} className="group block">
                <Card className="h-full rounded-[1.7rem] p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_80px_oklch(0_0_0_/_0.42)]">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/25 bg-primary/12 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      {item.eyebrow}
                    </span>
                  </div>

                  <div className="mt-10">
                    <h2 className="font-display text-3xl leading-[0.95] tracking-[-0.04em] text-foreground">
                      {item.title}
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Open surface
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
