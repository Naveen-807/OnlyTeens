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
    color: "text-amber-400",
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
    color: "text-violet-400",
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
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Family Control Center</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage private policy, approvals, and delegated execution
        </p>
      </div>

      {/* Overview Card */}
      <Card className="bg-gradient-to-br from-primary/15 via-card to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Family Status
              </p>
              <p className="text-lg font-semibold text-foreground">
                {family ? "Active" : "Setup Required"}
              </p>
            </div>
            {pendingApprovals && pendingApprovals.length > 0 && (
              <Badge className="border-amber-500/30 bg-amber-500/20 text-amber-400">
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
            <Card className="h-full transition-all hover:border-border/50 hover:bg-card/90">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "rounded-lg bg-secondary/50 p-2.5",
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
      <Card className="bg-card/60">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Need help?</span>{" "}
            Your teen&apos;s requests will appear in the Approval Inbox. You can set spending
            limits and approval thresholds in Policy Setup to control what Clawrence can execute automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
