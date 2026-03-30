import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const surfaceLinks = [
  {
    href: "/auth",
    title: "Start onboarding",
    description:
      "Phone OTP demo flow, session bootstrap, and role selection in one path.",
    icon: Sparkles,
  },
  {
    href: "/teen",
    title: "Teen dashboard",
    description: "Save, subscribe, chat, and track passport progress.",
    icon: UserRound,
  },
  {
    href: "/guardian",
    title: "Guardian control room",
    description: "Encrypted policy setup, inbox approvals, and permissions proof.",
    icon: ShieldCheck,
  },
];

export default function Page() {
  return (
    <main className="grain mx-auto min-h-screen max-w-7xl px-4 py-8 lg:px-8">
      <div className="rounded-[2rem] border border-border/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.82),rgba(241,236,224,0.92))] p-6 shadow-[0_24px_70px_rgba(38,70,63,0.12)] md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-primary/20 bg-primary/10 text-primary">
            Proof18
          </Badge>
          <Badge>Flow + Lit + Zama + Storacha</Badge>
        </div>
        <div className="mt-5 max-w-3xl">
          <h1 className="text-[clamp(2.6rem,7vw,5rem)] font-semibold leading-[0.92] tracking-tight text-foreground">
            Teen finance with policy, proof, and a clear onboarding path.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            The app now starts with a phone OTP demo flow, preserves the Google
            fallback routes, and surfaces execution proof across Zama, Lit,
            Flow, and Storacha.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {surfaceLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.href}
                className="group p-5 transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(38,70,63,0.12)]"
              >
                <Link href={item.href} className="block h-full">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Open
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
