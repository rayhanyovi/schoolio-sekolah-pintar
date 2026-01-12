'use client';

import { GraduationCap } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-3xl",
};

export function Logo({ size = "md", showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${sizeClasses[size]} rounded-xl gradient-primary flex items-center justify-center shadow-lg`}>
        <GraduationCap className="text-primary-foreground" style={{ width: '60%', height: '60%' }} />
      </div>
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold text-foreground`}>
          {APP_NAME}
        </span>
      )}
    </div>
  );
}
