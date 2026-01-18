'use client';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CircleCheck } from "lucide-react";
import { QuestionSummary } from "@/lib/schemas";
import { ASSIGNMENT_TYPES, DIFFICULTY_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface QuestionPreviewProps {
  question: QuestionSummary;
  showAnswer?: boolean;
  number?: number;
}

export function QuestionPreview({
  question,
  showAnswer = false,
  number,
}: QuestionPreviewProps) {
  const typeIcons = {
    MCQ: CircleCheck,
    ESSAY: FileText,
    FILE: Upload,
  };
  const TypeIcon = typeIcons[question.type];

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {number && (
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                {number}
              </span>
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
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{ASSIGNMENT_TYPES[question.type]}</Badge>
            <Badge variant="secondary">{question.points} poin</Badge>
          </div>
        </div>

        {/* Question Text */}
        <div className="pl-11">
          <p className="text-base font-medium text-foreground">{question.text}</p>
        </div>

        {/* Answer Section */}
        <div className="pl-11">
          {question.type === "MCQ" && question.options && (
            <RadioGroup className="space-y-3">
              {question.options.map((option, index) => {
                const isCorrect = question.correctAnswers?.includes(index);
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                      showAnswer && isCorrect && "bg-success/10 border-success"
                    )}
                  >
                    <RadioGroupItem
                      value={String(index)}
                      id={`preview-opt-${index}`}
                      disabled
                    />
                    <Label
                      htmlFor={`preview-opt-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      <span className="font-medium mr-2">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option}
                    </Label>
                    {showAnswer && isCorrect && (
                      <Badge
                        variant="outline"
                        className="bg-success/10 text-success border-success/20"
                      >
                        Benar
                      </Badge>
                    )}
                  </div>
                );
              })}
            </RadioGroup>
          )}

          {question.type === "ESSAY" && (
            <div className="space-y-3">
              <Textarea
                placeholder="Siswa akan menulis jawaban di sini..."
                rows={6}
                disabled
                className="resize-none"
              />
              {showAnswer && question.rubric && (
                <Card className="p-4 bg-muted/50">
                  <p className="text-sm font-medium mb-2">Rubrik Penilaian:</p>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                    {question.rubric}
                  </pre>
                </Card>
              )}
            </div>
          )}

          {question.type === "FILE" && (
            <div className="space-y-3">
              <Card className="p-8 border-2 border-dashed flex flex-col items-center justify-center">
                <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground text-center">
                  Siswa akan upload file di sini
                </p>
                {question.allowedFormats && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {question.allowedFormats.map((format) => (
                      <Badge key={format} variant="secondary" className="text-xs">
                        .{format}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="pl-11 pt-4 border-t flex items-center gap-4 text-xs text-muted-foreground">
          <span>Mata Pelajaran: {question.subject}</span>
          <span>•</span>
          <span>Topik: {question.topic}</span>
          <span>•</span>
          <span>Kesulitan: {DIFFICULTY_LEVELS[question.difficulty]}</span>
        </div>
      </div>
    </Card>
  );
}
