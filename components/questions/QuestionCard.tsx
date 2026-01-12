'use client';

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CircleCheck,
  FileText,
  Upload,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Package,
  BarChart3,
} from "lucide-react";
import { Question } from "@/lib/questionTypes";
import {
  ASSIGNMENT_TYPES,
  DIFFICULTY_LEVELS,
  DifficultyLevel,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: Question;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onEdit?: (question: Question) => void;
  onDuplicate?: (question: Question) => void;
  onDelete?: (question: Question) => void;
  onAddToPackage?: (question: Question) => void;
  selectable?: boolean;
}

const typeIcons = {
  MCQ: CircleCheck,
  ESSAY: FileText,
  FILE: Upload,
};

const difficultyColors: Record<DifficultyLevel, string> = {
  EASY: "bg-success/10 text-success border-success/20",
  MEDIUM: "bg-warning/10 text-warning border-warning/20",
  HARD: "bg-destructive/10 text-destructive border-destructive/20",
};

export function QuestionCard({
  question,
  selected = false,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onAddToPackage,
  selectable = false,
}: QuestionCardProps) {
  const TypeIcon = typeIcons[question.type];

  return (
    <Card
      className={cn(
        "p-4 transition-all duration-200 hover:shadow-md group",
        selected && "ring-2 ring-primary bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        {selectable && (
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) =>
              onSelect?.(question.id, checked as boolean)
            }
            className="mt-1"
          />
        )}

        <div
          className={cn(
            "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
            question.type === "MCQ" && "bg-primary/10 text-primary",
            question.type === "ESSAY" && "bg-secondary/10 text-secondary",
            question.type === "FILE" && "bg-accent/10 text-accent"
          )}
        >
          <TypeIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {question.text}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {question.subject}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {question.topic}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-xs", difficultyColors[question.difficulty])}
                >
                  {DIFFICULTY_LEVELS[question.difficulty]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {question.points} poin
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(question)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.(question)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplikat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddToPackage?.(question)}>
                  <Package className="h-4 w-4 mr-2" />
                  Tambah ke Paket
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(question)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TypeIcon className="h-3 w-3" />
              {ASSIGNMENT_TYPES[question.type]}
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Digunakan {question.usageCount}x
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
