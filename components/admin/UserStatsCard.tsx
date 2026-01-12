'use client';

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface UserStatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
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
  trend,
}: UserStatsCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{value}</p>
              {trend && (
                <span
                  className={`text-xs font-medium ${
                    trend.isPositive ? "text-success" : "text-destructive"
                  }`}
                >
                  {trend.isPositive ? "+" : "-"}{trend.value}%
                </span>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-xl ${bgColor}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
