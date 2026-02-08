'use client';

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  CircleCheck,
  FileText,
  Upload,
  GripVertical,
  X,
} from "lucide-react";
import {
  QuestionPackageSummary,
  QuestionSummary,
  SubjectSummary,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package_?: QuestionPackageSummary | null;
  onSave: (pkg: Partial<QuestionPackageSummary>) => void;
  availableQuestions?: QuestionSummary[];
  subjects: SubjectSummary[];
}

const defaultPackage: Partial<QuestionPackageSummary> = {
  name: "",
  description: "",
  subject: "",
  questionIds: [],
};

export function PackageFormDialog({
  open,
  onOpenChange,
  package_,
  onSave,
  availableQuestions = [],
  subjects,
}: PackageFormDialogProps) {
  const [formData, setFormData] = useState<Partial<QuestionPackageSummary>>(defaultPackage);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const isEditing = !!package_;

  useEffect(() => {
    if (package_) {
      setFormData(package_);
    } else {
      setFormData({
        ...defaultPackage,
        subject: subjects[0]?.name ?? "",
      });
    }
    setSearchQuery("");
    setSubjectFilter("all");
  }, [package_, open, subjects]);

  const selectedQuestions = availableQuestions.filter((q) =>
    formData.questionIds?.includes(q.id)
  );

  const filteredQuestions = availableQuestions.filter((q) => {
    const matchesSearch =
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === "all" || q.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const toggleQuestion = (questionId: string) => {
    const current = formData.questionIds || [];
    const newIds = current.includes(questionId)
      ? current.filter((id) => id !== questionId)
      : [...current, questionId];
    setFormData((prev) => ({ ...prev, questionIds: newIds }));
  };

  const removeQuestion = (questionId: string) => {
    setFormData((prev) => ({
      ...prev,
      questionIds: (prev.questionIds || []).filter((id) => id !== questionId),
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const typeIcons = {
    MCQ: CircleCheck,
    ESSAY: FileText,
    FILE: Upload,
  };

  const totalPoints = selectedQuestions.reduce((sum, q) => sum + q.points, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Paket Soal" : "Buat Paket Soal Baru"}
          </DialogTitle>
          <DialogDescription>
            Kelompokkan soal-soal menjadi satu paket untuk kemudahan penggunaan
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4">
          {/* Left - Package Info & Selected Questions */}
          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Paket</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Contoh: UTS Matematika Kelas 10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Deskripsi singkat tentang paket soal ini"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Mata Pelajaran</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, subject: value }))
                  }
                >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                  {subjects.length === 0 && (
                    <SelectItem value="none" disabled>
                      Belum ada mata pelajaran
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            </div>

            {/* Selected Questions */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Label>Soal Terpilih ({selectedQuestions.length})</Label>
                <span className="text-sm text-muted-foreground">
                  Total: {totalPoints} poin
                </span>
              </div>
              <ScrollArea className="flex-1 border rounded-lg p-2">
                {selectedQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Belum ada soal terpilih.
                    <br />
                    Pilih soal dari daftar di sebelah kanan.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedQuestions.map((q, index) => {
                      const Icon = typeIcons[q.type];
                      return (
                        <Card key={q.id} className="p-2 flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <span className="text-sm font-medium w-6">
                            {index + 1}.
                          </span>
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="flex-1 text-sm truncate">
                            {q.text}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {q.points}p
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeQuestion(q.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* Right - Available Questions */}
          <div className="flex flex-col overflow-hidden border rounded-lg">
            <div className="p-3 border-b space-y-2">
              <Label className="text-xs font-medium">Bank Soal</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari soal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                  {subjects.length === 0 && (
                    <SelectItem value="none" disabled>
                      Belum ada mata pelajaran
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              </div>
            </div>
            <ScrollArea className="flex-1 p-2">
              {filteredQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-10 text-muted-foreground">
                  <p className="text-sm">Belum ada soal tersedia</p>
                  <p className="text-xs">Coba ubah filter atau buat soal baru.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredQuestions.map((q) => {
                    const Icon = typeIcons[q.type];
                    const isSelected = formData.questionIds?.includes(q.id);
                    return (
                      <Card
                        key={q.id}
                        className={cn(
                          "p-3 cursor-pointer transition-all hover:border-primary",
                          isSelected && "border-primary bg-primary/5"
                        )}
                        onClick={() => toggleQuestion(q.id)}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={isSelected}
                            className="mt-0.5"
                            onClick={(e) => e.stopPropagation()}
                            onCheckedChange={() => toggleQuestion(q.id)}
                          />
                          <div
                            className={cn(
                              "shrink-0 w-7 h-7 rounded flex items-center justify-center",
                              q.type === "MCQ" && "bg-primary/10 text-primary",
                              q.type === "ESSAY" && "bg-secondary/10 text-secondary",
                              q.type === "FILE" && "bg-accent/10 text-accent"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-2">{q.text}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {q.subject}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {q.points}p
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name}>
            {isEditing ? "Simpan Perubahan" : "Buat Paket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
