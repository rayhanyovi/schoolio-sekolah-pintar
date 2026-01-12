'use client';

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  CircleCheck,
  FileText,
  Upload,
  Library,
  Filter,
} from "lucide-react";
import {
  SUBJECTS,
  ASSIGNMENT_TYPES,
  AssignmentType,
  DIFFICULTY_LEVELS,
  DifficultyLevel,
} from "@/lib/constants";
import { Question, mockQuestions } from "@/lib/questionTypes";
import { cn } from "@/lib/utils";

interface SelectQuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (questions: Question[]) => void;
  questions?: Question[];
  initialSelected?: string[];
}

export function SelectQuestionsDialog({
  open,
  onOpenChange,
  onSelect,
  questions = mockQuestions,
  initialSelected = [],
}: SelectQuestionsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === "all" || q.subject === subjectFilter;
    const matchesType = typeFilter === "all" || q.type === typeFilter;
    const matchesDifficulty =
      difficultyFilter === "all" || q.difficulty === difficultyFilter;
    return matchesSearch && matchesSubject && matchesType && matchesDifficulty;
  });

  const selectedQuestions = questions.filter((q) => selectedIds.includes(q.id));
  const totalPoints = selectedQuestions.reduce((sum, q) => sum + q.points, 0);

  const toggleQuestion = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const filteredIds = filteredQuestions.map((q) => q.id);
    setSelectedIds((prev) => [...new Set([...prev, ...filteredIds])]);
  };

  const deselectAll = () => {
    const filteredIds = filteredQuestions.map((q) => q.id);
    setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
  };

  const handleConfirm = () => {
    onSelect(selectedQuestions);
    onOpenChange(false);
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pilih Soal dari Bank Soal</DialogTitle>
          <DialogDescription>
            Pilih satu atau lebih soal untuk dimasukkan ke dalam tugas
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 py-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari soal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Mapel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Mapel</SelectItem>
              {SUBJECTS.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              {(Object.keys(ASSIGNMENT_TYPES) as AssignmentType[]).map((type) => (
                <SelectItem key={type} value={type}>
                  {ASSIGNMENT_TYPES[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Kesulitan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Level</SelectItem>
              {(Object.keys(DIFFICULTY_LEVELS) as DifficultyLevel[]).map(
                (level) => (
                  <SelectItem key={level} value={level}>
                    {DIFFICULTY_LEVELS[level]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between py-2 border-y">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Pilih Semua
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll}>
              Batal Pilih
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredQuestions.length} soal ditemukan
          </div>
        </div>

        {/* Questions List */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-2">
            {filteredQuestions.map((q) => {
              const Icon = typeIcons[q.type];
              const isSelected = selectedIds.includes(q.id);

              return (
                <Card
                  key={q.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:border-primary",
                    isSelected && "ring-2 ring-primary bg-primary/5"
                  )}
                  onClick={() => toggleQuestion(q.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      className="mt-1"
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={() => toggleQuestion(q.id)}
                    />
                    <div
                      className={cn(
                        "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
                        q.type === "MCQ" && "bg-primary/10 text-primary",
                        q.type === "ESSAY" && "bg-secondary/10 text-secondary",
                        q.type === "FILE" && "bg-accent/10 text-accent"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {q.text}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {q.subject}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {q.topic}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", difficultyColors[q.difficulty])}
                        >
                          {DIFFICULTY_LEVELS[q.difficulty]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {q.points} poin
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {filteredQuestions.length === 0 && (
              <div className="text-center py-12">
                <Library className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Tidak ada soal yang ditemukan
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Selected Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="font-medium">{selectedIds.length} soal terpilih</span>
              <span className="text-muted-foreground ml-2">
                (Total: {totalPoints} poin)
              </span>
            </div>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-1">
                {Array.from(
                  new Set(selectedQuestions.map((q) => q.type))
                ).map((type) => {
                  const Icon = typeIcons[type];
                  const count = selectedQuestions.filter(
                    (q) => q.type === type
                  ).length;
                  return (
                    <Badge key={type} variant="secondary" className="gap-1">
                      <Icon className="h-3 w-3" />
                      {count}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleConfirm} disabled={selectedIds.length === 0}>
            Gunakan {selectedIds.length} Soal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
