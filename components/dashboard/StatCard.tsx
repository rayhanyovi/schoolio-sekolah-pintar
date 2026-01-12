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
    card: "bg-card",
    icon: "bg-muted text-muted-foreground",
  },
  primary: {
    card: "bg-primary/5 border-primary/20",
    icon: "bg-primary/10 text-primary",
  },
  success: {
    card: "bg-success/5 border-success/20",
    icon: "bg-success/10 text-success",
  },
  warning: {
    card: "bg-warning/5 border-warning/20",
    icon: "bg-warning/10 text-warning",
  },
  info: {
    card: "bg-info/5 border-info/20",
    icon: "bg-info/10 text-info",
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
        "p-6 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
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
