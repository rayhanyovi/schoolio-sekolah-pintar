'use client';

import { LucideIcon } from "lucide-react";
import { InfoStatCard } from "@/components/dashboard/InfoStatCard";

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
    icon: "text-primary",
    background: "bg-primary/10",
  },
  primary: {
    icon: "text-primary",
    background: "bg-primary/10",
  },
  success: {
    icon: "text-success",
    background: "bg-success/10",
  },
  warning: {
    icon: "text-warning",
    background: "bg-warning/10",
  },
  info: {
    icon: "text-info",
    background: "bg-info/10",
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
  const trendText = trend
    ? `${trend.isPositive ? "+" : "-"}${Math.abs(trend.value)}% dari bulan lalu`
    : undefined;

  return (
    <InfoStatCard
      title={title}
      value={value}
      caption={subtitle ?? trendText}
      icon={Icon}
      iconColor={styles.icon}
      iconBackground={styles.background}
      className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    />
  );
}
