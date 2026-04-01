"use client";

import Link from "next/link";
import { History, Inbox, Shield, Users } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const quickLinks = [
  {
    href: "/guardian/inbox",
    icon: Inbox,
    label: "Approval Inbox",
    description: "Review pending requests before delegated execution continues",
    color: "text-primary",
  },
  {
    href: "/guardian/setup",
    icon: Shield,
    label: "Policy Setup",
    description: "Configure private limits, approvals, and safety rules",
    color: "text-primary",
  },
  {
    href: "/guardian/family",
    icon: Users,
    label: "Family",
    description: "Manage family members, roles, and delegated authority",
    color: "text-primary",
  },
  {
    href: "/guardian/activity",
    icon: History,
    label: "Activity",
    description: "View execution history, approvals, and evidence",
    color: "text-muted-foreground",
  },
];

export function GuardianDashboard() {
  const { family, pendingApprovals } = useAuthStore();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Family Control Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
          Manage private policy, approvals, and delegated execution
          </p>
        </div>
      </div>

      {/* Overview Card */}
      <Card className="overflow-hidden border-primary/20 bg-[linear-gradient(180deg,oklch(0.11_0.008_85_/_0.95),oklch(0.08_0.006_85_/_0.98))]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Family Status
              </p>
              <p className="text-lg font-semibold text-foreground">
                {family ? "Active" : "Setup Required"}
              </p>
            </div>
            {pendingApprovals && pendingApprovals.length > 0 && (
              <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-400">
                {pendingApprovals.length} pending
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-3 sm:grid-cols-2">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full border-border/30 bg-card/80 transition-all hover:border-primary/30 hover:bg-card/95">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "rounded-[1rem] border border-primary/15 bg-primary/10 p-2.5",
                    link.color
                  )}>
                    <link.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{link.label}</p>
                      {link.href === "/guardian/inbox" && pendingApprovals && pendingApprovals.length > 0 && (
                        <Badge className="border-rose-500/30 bg-rose-500/20 text-rose-400 text-xs py-0">
                          {pendingApprovals.length}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {link.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Help Card */}
      <Card className="border-border/30 bg-card/75">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Need help?</span>{" "}
            Your teen&apos;s requests will appear in the Approval Inbox. You can set spending
            limits and approval thresholds in Policy Setup to control what Calma can execute automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
