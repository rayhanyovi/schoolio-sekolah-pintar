"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type InfoStatCardProps = {
  title: string;
  value: string | number;
  caption?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBackground?: string;
  className?: string;
};

export function InfoStatCard({
  title,
  value,
  caption,
  icon: Icon,
  iconColor = "text-primary",
  iconBackground = "bg-primary/10",
  className,
}: InfoStatCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80 bg-card shadow-sm shadow-primary/5",
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold leading-none text-foreground">
              {value}
            </p>
            {caption ? (
              <p className="truncate text-sm text-muted-foreground">{caption}</p>
            ) : null}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
              iconBackground,
            )}
          >
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
