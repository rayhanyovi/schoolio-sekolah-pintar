'use client';

import { cn } from "@/lib/utils";
import { Clock, MapPin, User } from "lucide-react";

interface ScheduleCardProps {
  subject: string;
  teacher: string;
  time: string;
  room?: string;
  isActive?: boolean;
  isNext?: boolean;
}

export function ScheduleCard({
  subject,
  teacher,
  time,
  room,
  isActive,
  isNext,
}: ScheduleCardProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all duration-300",
        isActive && "border-primary bg-primary/5 shadow-md",
        isNext && "border-info/50 bg-info/5",
        !isActive && !isNext && "bg-card hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-foreground">{subject}</h4>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <User className="h-3.5 w-3.5" />
            <span>{teacher}</span>
          </div>
        </div>
        {isActive && (
          <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
            Berlangsung
          </span>
        )}
        {isNext && !isActive && (
          <span className="px-2 py-1 text-xs font-medium bg-info/20 text-info rounded-full">
            Berikutnya
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>{time}</span>
        </div>
        {room && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{room}</span>
          </div>
        )}
      </div>
    </div>
  );
}
