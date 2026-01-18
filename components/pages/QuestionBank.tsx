'use client';

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Package,
  Library,
  CircleCheck,
  FileText,
  Upload,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Calendar,
  BarChart3,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  ASSIGNMENT_TYPES,
  AssignmentType,
  DIFFICULTY_LEVELS,
  DifficultyLevel,
} from "@/lib/constants";
import {
  createQuestion,
  createQuestionPackage,
  deleteQuestion,
  deleteQuestionPackage,
  listQuestionPackages,
  listQuestions,
  updateQuestion,
  updateQuestionPackage,
} from "@/lib/handlers/questions";
import { listSubjects } from "@/lib/handlers/subjects";
import {
  QuestionPackageSummary,
  QuestionSummary,
  SubjectSummary,
} from "@/lib/schemas";
import { QuestionCard } from "@/components/questions/QuestionCard";
import { QuestionFormDialog } from "@/components/questions/QuestionFormDialog";
import { PackageFormDialog } from "@/components/questions/PackageFormDialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

export default function QuestionBank() {
  const [activeTab, setActiveTab] = useState<"questions" | "packages">("questions");
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [packages, setPackages] = useState<QuestionPackageSummary[]>([]);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Dialogs
  const [questionFormOpen, setQuestionFormOpen] = useState(false);
  const [packageFormOpen, setPackageFormOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Selected items
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionSummary | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<QuestionPackageSummary | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: "question" | "package"; id: string } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [questionData, packageData, subjectData] = await Promise.all([
        listQuestions(),
        listQuestionPackages(),
        listSubjects(),
      ]);
      setQuestions(questionData);
      setPackages(packageData);
      setSubjects(subjectData);
    } catch (error) {
      toast.error("Gagal memuat bank soal");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const subjectOptions = useMemo(() => {
    if (subjects.length) return subjects.map((subject) => subject.name);
    const fromQuestions = questions.map((q) => q.subject).filter(Boolean);
    const fromPackages = packages.map((pkg) => pkg.subject).filter(Boolean);
    return Array.from(new Set([...fromQuestions, ...fromPackages]));
  }, [subjects, questions, packages]);

  const getPackageQuestions = (pkg: QuestionPackageSummary) =>
    questions.filter((q) => pkg.questionIds.includes(q.id));

  // Filtered data
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === "all" || q.subject === subjectFilter;
    const matchesType = typeFilter === "all" || q.type === typeFilter;
    const matchesDifficulty = difficultyFilter === "all" || q.difficulty === difficultyFilter;
    return matchesSearch && matchesSubject && matchesType && matchesDifficulty;
  });

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === "all" || pkg.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  // Stats
  const stats = {
    totalQuestions: questions.length,
    mcqCount: questions.filter((q) => q.type === "MCQ").length,
    essayCount: questions.filter((q) => q.type === "ESSAY").length,
    fileCount: questions.filter((q) => q.type === "FILE").length,
    totalPackages: packages.length,
  };

  // Handlers
  const handleSaveQuestion = async (questionData: Partial<QuestionSummary>) => {
    try {
      const subjectId = questionData.subject
        ? subjects.find((subject) => subject.name === questionData.subject)?.id
        : undefined;
      const payload = {
        type: questionData.type,
        subjectId,
        subject: subjectId ? undefined : questionData.subject,
        topic: questionData.topic,
        difficulty: questionData.difficulty,
        text: questionData.text,
        options: questionData.options ?? [],
        correctAnswers: questionData.correctAnswers ?? [],
        rubric: questionData.rubric ?? undefined,
        allowedFormats: questionData.allowedFormats ?? [],
        points: questionData.points ?? 0,
      };
      if (selectedQuestion) {
        await updateQuestion(selectedQuestion.id, payload);
        toast.success("Soal berhasil diperbarui");
      } else {
        await createQuestion(payload);
        toast.success("Soal baru berhasil ditambahkan");
      }
      setSelectedQuestion(null);
      await loadData();
    } catch (error) {
      toast.error("Gagal menyimpan soal");
    }
  };

  const handleSavePackage = async (
    packageData: Partial<QuestionPackageSummary>
  ) => {
    try {
      const subjectId = packageData.subject
        ? subjects.find((subject) => subject.name === packageData.subject)?.id
        : undefined;
      const payload = {
        name: packageData.name,
        description: packageData.description,
        subjectId,
        subject: subjectId ? undefined : packageData.subject,
        questionIds: packageData.questionIds ?? [],
      };
      if (selectedPackage) {
        await updateQuestionPackage(selectedPackage.id, payload);
        toast.success("Paket soal berhasil diperbarui");
      } else {
        await createQuestionPackage(payload);
        toast.success("Paket soal baru berhasil dibuat");
      }
      setSelectedPackage(null);
      await loadData();
    } catch (error) {
      toast.error("Gagal menyimpan paket soal");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === "question") {
        await deleteQuestion(itemToDelete.id);
        toast.success("Soal berhasil dihapus");
      } else {
        await deleteQuestionPackage(itemToDelete.id);
        toast.success("Paket soal berhasil dihapus");
      }
      await loadData();
    } catch (error) {
      toast.error("Gagal menghapus data");
    } finally {
      setItemToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleDuplicateQuestion = async (question: QuestionSummary) => {
    try {
      const subjectId = subjects.find((subject) => subject.name === question.subject)?.id;
      await createQuestion({
        type: question.type,
        subjectId,
        subject: subjectId ? undefined : question.subject,
        topic: question.topic,
        difficulty: question.difficulty,
        text: `${question.text} (Salinan)`,
        options: question.options ?? [],
        correctAnswers: question.correctAnswers ?? [],
        rubric: question.rubric ?? undefined,
        allowedFormats: question.allowedFormats ?? [],
        points: question.points ?? 0,
      });
      await loadData();
      toast.success("Soal berhasil diduplikasi");
    } catch (error) {
      toast.error("Gagal menduplikasi soal");
    }
  };

  const typeIcons = {
    MCQ: CircleCheck,
    ESSAY: FileText,
    FILE: Upload,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bank Soal</h1>
          <p className="text-muted-foreground">
            Kelola koleksi soal dan paket soal Anda
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedPackage(null);
              setPackageFormOpen(true);
            }}
          >
            <Package className="h-4 w-4 mr-2" />
            Buat Paket
          </Button>
          <Button
            onClick={() => {
              setSelectedQuestion(null);
              setQuestionFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Buat Soal
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Library className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalQuestions}</p>
              <p className="text-xs text-muted-foreground">Total Soal</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CircleCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.mcqCount}</p>
              <p className="text-xs text-muted-foreground">Pilihan Ganda</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.essayCount}</p>
              <p className="text-xs text-muted-foreground">Esai</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Upload className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.fileCount}</p>
              <p className="text-xs text-muted-foreground">Upload File</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalPackages}</p>
              <p className="text-xs text-muted-foreground">Paket Soal</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "questions" | "packages")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="questions" className="gap-2">
              <Library className="h-4 w-4" />
              Semua Soal
            </TabsTrigger>
            <TabsTrigger value="packages" className="gap-2">
              <Package className="h-4 w-4" />
              Paket Soal
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari..."
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
                {subjectOptions.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeTab === "questions" && (
              <>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[130px]">
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
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {(Object.keys(DIFFICULTY_LEVELS) as DifficultyLevel[]).map((level) => (
                      <SelectItem key={level} value={level}>
                        {DIFFICULTY_LEVELS[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-r-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-l-none"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Questions Tab */}
        <TabsContent value="questions" className="mt-4">
          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground">
              Memuat soal...
            </div>
          ) : (
            <div className={cn(
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" 
                : "space-y-3"
            )}>
              {filteredQuestions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onEdit={(q) => {
                    setSelectedQuestion(q);
                    setQuestionFormOpen(true);
                  }}
                  onDuplicate={handleDuplicateQuestion}
                  onDelete={(q) => {
                    setItemToDelete({ type: "question", id: q.id });
                    setDeleteDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          {!isLoading && filteredQuestions.length === 0 && (
            <div className="text-center py-16">
              <Library className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tidak ada soal ditemukan</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Coba ubah kata kunci pencarian atau filter"
                  : "Mulai dengan membuat soal pertama Anda"}
              </p>
              <Button
                onClick={() => {
                  setSelectedQuestion(null);
                  setQuestionFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Buat Soal Baru
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages" className="mt-4">
          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground">
              Memuat paket soal...
            </div>
          ) : (
            <div className={cn(
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" 
                : "space-y-3"
            )}>
              {filteredPackages.map((pkg) => {
                const pkgQuestions = getPackageQuestions(pkg);
                const totalPoints = pkgQuestions.reduce((sum, q) => sum + q.points, 0);
                const types = new Set(pkgQuestions.map((q) => q.type));

                return (
                  <Card key={pkg.id} className="p-4 hover:shadow-md transition-all group">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-foreground">{pkg.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {pkg.description}
                            </p>
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
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPackage(pkg);
                                  setPackageFormOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    const subjectId = subjects.find(
                                      (subject) => subject.name === pkg.subject
                                    )?.id;
                                    await createQuestionPackage({
                                      name: `${pkg.name} (Salinan)`,
                                      description: pkg.description,
                                      subjectId,
                                      subject: subjectId ? undefined : pkg.subject,
                                      questionIds: pkg.questionIds,
                                    });
                                    await loadData();
                                    toast.success("Paket soal berhasil diduplikasi");
                                  } catch (error) {
                                    toast.error("Gagal menduplikasi paket");
                                  }
                                }}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Duplikat
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setItemToDelete({ type: "package", id: pkg.id });
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <Badge variant="outline">{pkg.subject}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {pkgQuestions.length} soal
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {totalPoints} poin
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          {Array.from(types).map((type) => {
                            const Icon = typeIcons[type];
                            return (
                              <Badge key={type} variant="secondary" className="text-xs gap-1">
                                <Icon className="h-3 w-3" />
                                {ASSIGNMENT_TYPES[type]}
                              </Badge>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(pkg.createdAt, "d MMM yyyy", { locale: id })}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            Digunakan {pkg.usageCount}x
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {!isLoading && filteredPackages.length === 0 && (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tidak ada paket soal</h3>
              <p className="text-muted-foreground mb-4">
                Buat paket soal untuk mengelompokkan soal-soal Anda
              </p>
              <Button
                onClick={() => {
                  setSelectedPackage(null);
                  setPackageFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Buat Paket Baru
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <QuestionFormDialog
        open={questionFormOpen}
        onOpenChange={setQuestionFormOpen}
        question={selectedQuestion}
        onSave={handleSaveQuestion}
        subjects={subjects}
      />

      <PackageFormDialog
        open={packageFormOpen}
        onOpenChange={setPackageFormOpen}
        package_={selectedPackage}
        onSave={handleSavePackage}
        availableQuestions={questions}
        subjects={subjects}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus{" "}
              {itemToDelete?.type === "question" ? "soal" : "paket soal"} ini?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
