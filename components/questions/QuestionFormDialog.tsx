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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  CircleCheck,
  FileText,
  Upload,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import {
  ASSIGNMENT_TYPES,
  AssignmentType,
  DIFFICULTY_LEVELS,
  DifficultyLevel,
  SUBJECTS,
} from "@/lib/constants";
import { Question } from "@/lib/questionTypes";
import { cn } from "@/lib/utils";

interface QuestionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: Question | null;
  onSave: (question: Partial<Question>) => void;
}

const defaultQuestion: Partial<Question> = {
  type: "MCQ",
  subject: "Matematika",
  topic: "",
  difficulty: "MEDIUM",
  text: "",
  options: ["", "", "", ""],
  correctAnswers: [],
  points: 10,
  rubric: "",
  allowedFormats: ["pdf", "docx"],
};

export function QuestionFormDialog({
  open,
  onOpenChange,
  question,
  onSave,
}: QuestionFormDialogProps) {
  const [formData, setFormData] = useState<Partial<Question>>(defaultQuestion);
  const isEditing = !!question;

  useEffect(() => {
    if (question) {
      setFormData({
        ...question,
        options: question.options || ["", "", "", ""],
        correctAnswers: question.correctAnswers || [],
        allowedFormats: question.allowedFormats || ["pdf", "docx"],
      });
    } else {
      setFormData(defaultQuestion);
    }
  }, [question, open]);

  const handleTypeChange = (type: AssignmentType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      options: type === "MCQ" ? ["", "", "", ""] : undefined,
      correctAnswers: type === "MCQ" ? [] : undefined,
      rubric: type === "ESSAY" ? "" : undefined,
      allowedFormats: type === "FILE" ? ["pdf", "docx"] : undefined,
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = value;
    setFormData((prev) => ({ ...prev, options: newOptions }));
  };

  const handleCorrectAnswerToggle = (index: number) => {
    const current = formData.correctAnswers || [];
    const newAnswers = current.includes(index)
      ? current.filter((i) => i !== index)
      : [...current, index];
    setFormData((prev) => ({ ...prev, correctAnswers: newAnswers }));
  };

  const addOption = () => {
    if ((formData.options?.length || 0) < 6) {
      setFormData((prev) => ({
        ...prev,
        options: [...(prev.options || []), ""],
      }));
    }
  };

  const removeOption = (index: number) => {
    if ((formData.options?.length || 0) > 2) {
      const newOptions = formData.options?.filter((_, i) => i !== index);
      const newCorrectAnswers = (formData.correctAnswers || [])
        .filter((i) => i !== index)
        .map((i) => (i > index ? i - 1 : i));
      setFormData((prev) => ({
        ...prev,
        options: newOptions,
        correctAnswers: newCorrectAnswers,
      }));
    }
  };

  const handleFormatToggle = (format: string) => {
    const current = formData.allowedFormats || [];
    const newFormats = current.includes(format)
      ? current.filter((f) => f !== format)
      : [...current, format];
    setFormData((prev) => ({ ...prev, allowedFormats: newFormats }));
  };

  const handleSubmit = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const availableFormats = ["pdf", "docx", "doc", "jpg", "jpeg", "png", "xlsx", "pptx"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Soal" : "Buat Soal Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ubah detail soal yang sudah ada"
              : "Tambahkan soal baru ke bank soal"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Question Type Selection */}
          <div className="space-y-3">
            <Label>Tipe Soal</Label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(ASSIGNMENT_TYPES) as AssignmentType[]).map((type) => {
                const icons = {
                  MCQ: CircleCheck,
                  ESSAY: FileText,
                  FILE: Upload,
                };
                const Icon = icons[type];
                return (
                  <Card
                    key={type}
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:border-primary",
                      formData.type === type && "border-primary bg-primary/5"
                    )}
                    onClick={() => handleTypeChange(type)}
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Icon
                        className={cn(
                          "h-6 w-6",
                          formData.type === type
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      />
                      <span className="text-sm font-medium">
                        {ASSIGNMENT_TYPES[type]}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
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
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topik / Bab</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, topic: e.target.value }))
                }
                placeholder="Contoh: Aljabar, Mekanika"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Tingkat Kesulitan</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value: DifficultyLevel) =>
                  setFormData((prev) => ({ ...prev, difficulty: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tingkat kesulitan" />
                </SelectTrigger>
                <SelectContent>
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

            <div className="space-y-2">
              <Label htmlFor="points">Poin</Label>
              <Input
                id="points"
                type="number"
                min={1}
                value={formData.points}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    points: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="text">Pertanyaan</Label>
            <Textarea
              id="text"
              value={formData.text}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, text: e.target.value }))
              }
              placeholder="Tulis pertanyaan di sini..."
              rows={3}
            />
          </div>

          {/* MCQ Options */}
          {formData.type === "MCQ" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Opsi Jawaban</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={(formData.options?.length || 0) >= 6}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Opsi
                </Button>
              </div>
              <div className="space-y-2">
                {formData.options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.correctAnswers?.includes(index)}
                        onCheckedChange={() => handleCorrectAnswerToggle(index)}
                      />
                      <span className="text-sm font-medium w-6">
                        {String.fromCharCode(65 + index)}.
                      </span>
                    </div>
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Opsi ${String.fromCharCode(65 + index)}`}
                      className="flex-1"
                    />
                    {(formData.options?.length || 0) > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Centang opsi yang merupakan jawaban benar (bisa lebih dari satu)
              </p>
            </div>
          )}

          {/* Essay Rubric */}
          {formData.type === "ESSAY" && (
            <div className="space-y-2">
              <Label htmlFor="rubric">Rubrik Penilaian (Opsional)</Label>
              <Textarea
                id="rubric"
                value={formData.rubric}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, rubric: e.target.value }))
                }
                placeholder="Contoh:&#10;Skor 30: Jawaban lengkap dan benar&#10;Skor 20: Jawaban sebagian benar&#10;Skor 10: Jawaban kurang tepat"
                rows={4}
              />
            </div>
          )}

          {/* File Upload Formats */}
          {formData.type === "FILE" && (
            <div className="space-y-3">
              <Label>Format File yang Diizinkan</Label>
              <div className="flex flex-wrap gap-2">
                {availableFormats.map((format) => (
                  <Badge
                    key={format}
                    variant={
                      formData.allowedFormats?.includes(format)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => handleFormatToggle(format)}
                  >
                    .{format}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? "Simpan Perubahan" : "Buat Soal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
