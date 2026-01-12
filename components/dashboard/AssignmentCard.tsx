'use client';

import { cn } from "@/lib/utils";
import { Calendar, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ASSIGNMENT_TYPES, AssignmentType } from "@/lib/constants";

interface AssignmentCardProps {
  title: string;
  subject: string;
  dueDate: string;
  type: AssignmentType;
  status: "pending" | "submitted" | "graded" | "late";
  score?: number;
}

const statusConfig = {
  pending: {
    label: "Belum Dikerjakan",
    icon: Clock,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  submitted: {
    label: "Sudah Dikumpul",
    icon: CheckCircle2,
    className: "bg-info/10 text-info border-info/20",
  },
  graded: {
    label: "Dinilai",
    icon: CheckCircle2,
    className: "bg-success/10 text-success border-success/20",
  },
  late: {
    label: "Terlambat",
    icon: AlertCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export function AssignmentCard({
  title,
  subject,
  dueDate,
  type,
  status,
  score,
}: AssignmentCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="p-4 rounded-xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {subject}
            </span>
            <span className="text-xs text-muted-foreground">
              {ASSIGNMENT_TYPES[type]}
            </span>
          </div>
          <h4 className="font-semibold text-foreground">{title}</h4>
        </div>
        {score !== undefined && (
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{score}</p>
            <p className="text-xs text-muted-foreground">Nilai</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{dueDate}</span>
          </div>
          <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border", config.className)}>
            <StatusIcon className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{config.label}</span>
          </div>
        </div>
        
        {status === "pending" && (
          <Button size="sm" variant="default">
            Kerjakan
          </Button>
        )}
      </div>
    </div>
  );
}
