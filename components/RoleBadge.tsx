'use client';

import { cn } from "@/lib/utils";
import { Role, ROLE_LABELS } from "@/lib/constants";
import { Shield, GraduationCap, Users, Heart } from "lucide-react";

interface RoleBadgeProps {
  role: Role;
  size?: "sm" | "md" | "lg";
}

const roleIcons = {
  ADMIN: Shield,
  TEACHER: GraduationCap,
  STUDENT: Users,
  PARENT: Heart,
};

const roleStyles = {
  ADMIN: "bg-role-admin/10 text-role-admin border-role-admin/20",
  TEACHER: "bg-primary/10 text-primary border-primary/20",
  STUDENT: "bg-success/10 text-success border-success/20",
  PARENT: "bg-warning/10 text-warning border-warning/20",
};

const sizeStyles = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-3 py-1 gap-1.5",
  lg: "text-base px-4 py-1.5 gap-2",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function RoleBadge({ role, size = "md" }: RoleBadgeProps) {
  const Icon = roleIcons[role];

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        roleStyles[role],
        sizeStyles[size]
      )}
    >
      <Icon className={iconSizes[size]} />
      {ROLE_LABELS[role]}
    </span>
  );
}
