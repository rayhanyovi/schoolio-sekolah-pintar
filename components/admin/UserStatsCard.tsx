'use client';

import { LucideIcon } from "lucide-react";
import { InfoStatCard } from "@/components/dashboard/InfoStatCard";

interface UserStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  caption?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function UserStatsCard({
  title,
  value,
  icon: Icon,
  iconColor,
  bgColor,
  caption,
  trend,
}: UserStatsCardProps) {
  const trendText = trend
    ? `${trend.isPositive ? "+" : "-"}${trend.value}%`
    : undefined;

  return (
    <InfoStatCard
      title={title}
      value={value}
      caption={caption ?? trendText}
      icon={Icon}
      iconColor={iconColor}
      iconBackground={bgColor}
    />
  );
}
