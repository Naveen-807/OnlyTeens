"use client";

import Image from "next/image";
import { Bell, BookHeart, Bot, BriefcaseBusiness, CircleDollarSign, Landmark, ScrollText, ShieldEllipsis, Sparkles, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { SpecialText } from "@/components/ui/special-text";
import { cn } from "@/lib/utils";
import { Actor, ParentScreen, Screen, SharedScreen, TeenScreen } from "@/types/proof18";

const teenNav: { id: TeenScreen; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Home", icon: Sparkles },
  { id: "wallet", label: "Wallet / Balance", icon: WalletCards },
  { id: "goals", label: "Savings Goals", icon: CircleDollarSign },
  { id: "request", label: "Request Action", icon: ShieldEllipsis },
  { id: "subscriptions", label: "Subscriptions", icon: BriefcaseBusiness },
  { id: "passport", label: "Passport", icon: BookHeart },
  { id: "history", label: "History", icon: ScrollText },
  { id: "chat", label: "Clawrence Chat", icon: Bot },
];

const parentNav: { id: ParentScreen; label: string; icon: React.ElementType }[] = [
  { id: "family-setup", label: "Family Setup", icon: Landmark },
  { id: "teen-wallet-setup", label: "Teen Wallet Setup", icon: WalletCards },
  { id: "treasury", label: "Treasury", icon: CircleDollarSign },
  { id: "rules", label: "Rules & Limits", icon: ShieldEllipsis },
  { id: "approvals", label: "Approvals Queue", icon: ScrollText },
  { id: "teen-progress", label: "Teen Progress", icon: BookHeart },
  { id: "history-audit", label: "History / Audit", icon: Bell },
];

const sharedNav: { id: SharedScreen; label: string; icon: React.ElementType }[] = [
  { id: "action-details", label: "Action Details", icon: Sparkles },
  { id: "execution-result", label: "Execution Result", icon: ShieldEllipsis },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "profile-settings", label: "Profile / Settings", icon: BookHeart },
];

export function Proof18Shell({
  actor,
  screen,
  setActor,
  setScreen,
  children,
}: {
  actor: Actor;
  screen: Screen;
  setActor: (actor: Actor) => void;
  setScreen: (screen: Screen) => void;
  children: React.ReactNode;
}) {
  const activeNav = actor === "teen" ? teenNav : parentNav;

  return (
    <div className="grain min-h-screen px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-4 xl:grid-cols-[290px_minmax(0,1fr)]">
        <Card className="h-fit overflow-hidden p-4">
          <div className="space-y-4">
            <div className="rounded-[1.75rem] bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(238,235,225,0.88))] p-4">
              <Badge className="border-primary/30 bg-primary/10 text-primary">Proof18</Badge>
              <div className="mt-4">
                <Image
                  src="/proof18-wordmark.svg"
                  alt="Proof18"
                  width={180}
                  height={40}
                  className="h-auto w-[160px]"
                />
              </div>
              <h1 className="mt-4 text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[0.88] tracking-tight text-foreground" style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", serif' }}>
                Guided money, private rules, revocable autonomy.
              </h1>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Flow executes. Zama protects policy on Sepolia. Vincent and Lit keep Clawrence inside a bounded mandate.
              </p>
              <div className="mt-4">
                <HoverBorderGradient as="div" containerClassName="rounded-full">
                  <span className="relative z-10 text-xs font-semibold uppercase tracking-[0.18em]">MVP demo stack live</span>
                </HoverBorderGradient>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-[1.5rem] bg-secondary p-1">
              <Button variant={actor === "teen" ? "default" : "ghost"} className="rounded-[1.2rem]" onClick={() => setActor("teen")}>
                Teen
              </Button>
              <Button variant={actor === "parent" ? "default" : "ghost"} className="rounded-[1.2rem]" onClick={() => setActor("parent")}>
                Parent
              </Button>
            </div>

            <nav className="space-y-1">
              {activeNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[1.4rem] px-4 py-3 text-left transition",
                      screen === item.id ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-foreground/4 hover:text-foreground",
                    )}
                    onClick={() => setScreen(item.id)}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="rounded-[1.5rem] border border-border/70 bg-white/65 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">shared surfaces</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sharedNav.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setScreen(item.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]",
                      screen === item.id ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {actor === "teen" ? "teen operator view" : "guardian control view"}
                </p>
                <div className="mt-2 text-[clamp(1.8rem,3vw,3rem)] font-semibold leading-none tracking-tight text-foreground" style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", serif' }}>
                  <SpecialText>{actor === "teen" ? "Clawrence keeps it understandable." : "Authority stays with the guardian."}</SpecialText>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="border-primary/25 bg-primary/8 text-primary">Flow Testnet • Zama Sepolia • Vincent / Lit</Badge>
                <Badge>Guardian-delegated execution</Badge>
              </div>
            </div>
          </Card>
          {children}
        </div>

        <div className="xl:hidden">
          <Card className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-3xl rounded-[1.6rem] p-2">
            <div className="grid grid-cols-4 gap-1">
              {activeNav.slice(0, 4).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-[1.2rem] px-2 py-2 text-[11px] font-semibold",
                      screen === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground",
                    )}
                    onClick={() => setScreen(item.id)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
