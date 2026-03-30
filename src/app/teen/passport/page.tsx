"use client";

import { Award, Loader2 } from "lucide-react";

import { AuthEntry } from "@/components/AuthEntry";
import { PassportCard } from "@/components/PassportCard";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent } from "@/components/ui/card";

export default function TeenPassportPage() {
  const { passport, session } = useAuthStore();

  if (!passport) {
    if (!session) {
      return (
        <div className="mx-auto max-w-md p-4">
          <AuthEntry role="teen" />
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-md p-4">
        <Card className="bg-card/90 border-border/30 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <div className="rounded-full bg-primary/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <p className="font-medium text-muted-foreground">Loading Passport</p>
            <p className="text-xs text-muted-foreground mt-1">
              Refresh after the family session bootstraps
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <PassportCard passport={passport} />
    </div>
  );
}
