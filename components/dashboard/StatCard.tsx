'use client';

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "info";
}

const variants = {
  default: {
    card: "bg-card border-border/80",
    icon: "bg-muted/80 text-primary",
  },
  primary: {
    card: "bg-primary/5 border-primary/20",
    icon: "bg-primary text-primary-foreground shadow-sm",
  },
  success: {
    card: "bg-success/5 border-success/20",
    icon: "bg-success/15 text-success",
  },
  warning: {
    card: "bg-warning/10 border-warning/25",
    icon: "bg-warning/20 text-foreground",
  },
  info: {
    card: "bg-info/5 border-info/20",
    icon: "bg-info/15 text-info",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  const styles = variants[variant];

  return (
    <div
      className={cn(
        "dashboard-panel p-6 rounded-[1.4rem] border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        styles.card
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%{" "}
              <span className="text-muted-foreground font-normal">
                dari bulan lalu
              </span>
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", styles.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
