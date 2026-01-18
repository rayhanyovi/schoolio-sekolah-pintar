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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  Package,
  CircleCheck,
  FileText,
  Upload,
  Calendar,
} from "lucide-react";
import { ASSIGNMENT_TYPES } from "@/lib/constants";
import {
  QuestionPackageSummary,
  QuestionSummary,
  SubjectSummary,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface SelectPackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (pkg: QuestionPackageSummary) => void;
  packages?: QuestionPackageSummary[];
  questions?: QuestionSummary[];
  subjects?: SubjectSummary[];
}

export function SelectPackageDialog({
  open,
  onOpenChange,
  onSelect,
  packages = [],
  questions = [],
  subjects,
}: SelectPackageDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [selectedPackage, setSelectedPackage] = useState<QuestionPackageSummary | null>(
    null
  );

  const subjectOptions =
    subjects?.length
      ? subjects.map((subject) => subject.name)
      : Array.from(new Set(packages.map((pkg) => pkg.subject))).filter(Boolean);

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      subjectFilter === "all" || pkg.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const handleConfirm = () => {
    if (selectedPackage) {
      onSelect(selectedPackage);
      onOpenChange(false);
    }
  };

  const typeIcons = {
    MCQ: CircleCheck,
    ESSAY: FileText,
    FILE: Upload,
  };

  const getPackageStats = (pkg: QuestionPackageSummary) => {
    const pkgQuestions = questions.filter((q) =>
      pkg.questionIds.includes(q.id)
    );
    const totalPoints = pkgQuestions.reduce((sum, q) => sum + q.points, 0);
    const types = new Set(pkgQuestions.map((q) => q.type));
    return {
      totalPoints,
      questionCount: pkg.questionIds.length,
      types: Array.from(types),
      pkgQuestions,
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pilih Paket Soal</DialogTitle>
          <DialogDescription>
            Pilih paket soal yang sudah tersedia untuk digunakan sebagai tugas
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 py-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari paket soal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Mata Pelajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {subjectOptions.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <Accordion type="single" collapsible className="space-y-2">
            {filteredPackages.map((pkg) => {
              const stats = getPackageStats(pkg);
              const pkgQuestions = stats.pkgQuestions;
              const isSelected = selectedPackage?.id === pkg.id;

              return (
                <AccordionItem
                  key={pkg.id}
                  value={pkg.id}
                  className={cn(
                    "border rounded-lg overflow-hidden transition-all",
                    isSelected && "ring-2 ring-primary"
                  )}
                >
                  <div
                    className={cn(
                      "p-4 cursor-pointer transition-colors",
                      isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {pkg.name}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {pkg.description}
                            </p>
                          </div>
                          <AccordionTrigger className="p-0 hover:no-underline" />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="outline">{pkg.subject}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {stats.questionCount} soal
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {stats.totalPoints} poin
                          </span>
                          {pkg.lastUsedAt && (
                            <>
                              <span className="text-xs text-muted-foreground">
                                •
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Terakhir:{" "}
                                {format(pkg.lastUsedAt, "d MMM", { locale: id })}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {stats.types.map((type) => {
                            const Icon = typeIcons[type];
                            return (
                              <Badge
                                key={type}
                                variant="secondary"
                                className="text-xs gap-1"
                              >
                                <Icon className="h-3 w-3" />
                                {ASSIGNMENT_TYPES[type]}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground">
                        Soal dalam paket:
                      </p>
                      {pkgQuestions.map((q, idx) => {
                        const Icon = typeIcons[q.type];
                        return (
                          <Card key={q.id} className="p-2 flex items-center gap-2">
                            <span className="text-sm font-medium w-6 text-muted-foreground">
                              {idx + 1}.
                            </span>
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="flex-1 text-sm truncate">
                              {q.text}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {q.points}p
                            </Badge>
                          </Card>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}

            {filteredPackages.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Tidak ada paket soal yang ditemukan
                </p>
              </div>
            )}
          </Accordion>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedPackage}>
            Gunakan Paket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
