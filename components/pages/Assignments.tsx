'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ROLES, ASSIGNMENT_TYPES, AssignmentType } from "@/lib/constants";
import { useRoleContext } from "@/hooks/useRoleContext";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { SelectQuestionSourceDialog } from "@/components/questions/SelectQuestionSourceDialog";
import { SelectPackageDialog } from "@/components/questions/SelectPackageDialog";
import { SelectQuestionsDialog } from "@/components/questions/SelectQuestionsDialog";
import {
  FileText,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  Calendar,
  Upload,
  Eye,
  Pencil,
  Trash2,
  Send,
  User,
  Users,
  ClipboardList,
  Award,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isPast, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import {
  createAssignment,
  deleteAssignment,
  listAssignments,
  setAssignmentQuestions,
  updateAssignment,
  listAssignmentSubmissions,
} from "@/lib/handlers/assignments";
import { listSchedules } from "@/lib/handlers/schedules";
import { listClasses } from "@/lib/handlers/classes";
import { listGrades } from "@/lib/handlers/grades";
import { listQuestions, listQuestionPackages } from "@/lib/handlers/questions";
import { listSubjects } from "@/lib/handlers/subjects";
import { listStudents, listTeachers } from "@/lib/handlers/users";
import {
  AssignmentSubmissionSummary,
  AssignmentSummary,
  ClassSummary,
  GradeSummary,
  QuestionPackageSummary,
  QuestionSummary,
  ScheduleSummary,
  SubjectSummary,
  UserSummary,
} from "@/lib/schemas";

const typeConfig: Record<
  AssignmentType,
  { icon: typeof FileText; color: string; bgColor: string }
> = {
  MCQ: { icon: ClipboardList, color: "text-primary", bgColor: "bg-primary/10" },
  FILE: { icon: Upload, color: "text-secondary", bgColor: "bg-secondary/10" },
  ESSAY: { icon: FileText, color: "text-accent", bgColor: "bg-accent/10" },
};

const ASSIGNMENT_KIND_LABELS: Record<string, string> = {
  HOMEWORK: "PR",
  PROJECT: "Proyek",
  QUIZ: "Kuis",
  EXAM: "Ujian",
};

const getDeliveryType = (assignment: AssignmentSummary): AssignmentType => {
  const candidate = assignment.deliveryType ?? assignment.type ?? "FILE";
  if (candidate === "MCQ" || candidate === "FILE" || candidate === "ESSAY") {
    return candidate;
  }
  return "FILE";
};

export default function Assignments() {
  const { role } = useRoleContext();

  if (role === ROLES.TEACHER || role === ROLES.ADMIN) {
    return <TeacherAssignmentsView />;
  }

  if (role === ROLES.PARENT) {
    return (
      <StudentAssignmentsView
        title="Tugas Anak"
        description="Pantau status tugas anak Anda"
        allowStudentSelect
        allowWork={false}
      />
    );
  }

  return (
    <StudentAssignmentsView
      title="Tugas Saya"
      description="Kerjakan dan kumpulkan tugas Anda"
      allowStudentSelect={false}
      allowWork
    />
  );
}

function TeacherAssignmentsView() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [packages, setPackages] = useState<QuestionPackageSummary[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("all");
  const [detailAssignment, setDetailAssignment] = useState<AssignmentSummary | null>(null);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [questionsDialogOpen, setQuestionsDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  const [gradedCounts, setGradedCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadBaseData = async () => {
    setIsLoading(true);
    try {
      const [
        assignmentData,
        scheduleData,
        classData,
        subjectData,
        questionData,
        packageData,
        gradeData,
      ] = await Promise.all([
        listAssignments(),
        listSchedules(),
        listClasses(),
        listSubjects(),
        listQuestions(),
        listQuestionPackages(),
        listGrades(),
      ]);
      setAssignments(assignmentData);
      setSchedules(scheduleData);
      setClasses(classData);
      setSubjects(subjectData);
      setQuestions(questionData);
      setPackages(packageData);

      const submissionMap: Record<string, number> = {};
      const gradedMap: Record<string, number> = {};
      gradeData.forEach((grade) => {
        submissionMap[grade.assignmentId] =
          (submissionMap[grade.assignmentId] ?? 0) + 1;
        if (grade.status === "GRADED") {
          gradedMap[grade.assignmentId] =
            (gradedMap[grade.assignmentId] ?? 0) + 1;
        }
      });
      setSubmissionCounts(submissionMap);
      setGradedCounts(gradedMap);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  const classMap = useMemo(
    () => new Map(classes.map((item) => [item.id, item])),
    [classes]
  );

  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);

  const filteredAssignments =
    selectedScheduleId !== "all" && selectedSchedule
      ? assignments.filter(
          (assignment) =>
            assignment.classIds.includes(selectedSchedule.classId) &&
            assignment.subjectId === selectedSchedule.subjectId
        )
      : assignments;
  const emptyAssignmentsMessage =
    selectedScheduleId === "all"
      ? "Belum ada tugas untuk ditampilkan"
      : "Tidak ada tugas untuk jadwal ini";

  const totalSubmissions = Object.values(submissionCounts).reduce(
    (sum, value) => sum + value,
    0
  );
  const totalGraded = Object.values(gradedCounts).reduce(
    (sum, value) => sum + value,
    0
  );

  const handleSourceSelect = (source: "package" | "bank" | "new") => {
    if (source === "package") {
      setPackageDialogOpen(true);
    } else if (source === "bank") {
      setQuestionsDialogOpen(true);
    } else {
      router.push("/dashboard/question-bank");
    }
  };

  const handleSaveAssignment = async (payload: {
    id?: string;
    title: string;
    description: string;
    classIds: string[];
    subjectId: string;
    teacherId: string;
    dueDate: string;
    deliveryType: AssignmentType;
    kind: string;
  }) => {
    const assignmentPayload = {
      title: payload.title,
      description: payload.description,
      subjectId: payload.subjectId,
      teacherId: payload.teacherId,
      dueDate: payload.dueDate,
      deliveryType: payload.deliveryType,
      kind: payload.kind,
      classIds: payload.classIds,
    };

    if (payload.id) {
      await updateAssignment(payload.id, assignmentPayload);
    } else {
      const created = await createAssignment(assignmentPayload);
      if (selectedPackageId || selectedQuestionIds.length > 0) {
        await setAssignmentQuestions(created.id, {
          questionPackageId: selectedPackageId,
          questionIds: selectedQuestionIds.length ? selectedQuestionIds : undefined,
        });
      }
    }

    setSelectedPackageId(null);
    setSelectedQuestionIds([]);
    setIsDialogOpen(false);
    await loadBaseData();
  };

  const handleDelete = async (assignmentId: string) => {
    await deleteAssignment(assignmentId);
    await loadBaseData();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tugas</h1>
          <p className="text-muted-foreground">Kelola tugas untuk siswa Anda</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/question-bank")}>
            <Library className="h-4 w-4 mr-2" />
            Bank Soal
          </Button>
          <Button onClick={() => setSourceDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Tugas
          </Button>
        </div>
      </div>

      <SelectQuestionSourceDialog
        open={sourceDialogOpen}
        onOpenChange={setSourceDialogOpen}
        onSelectSource={handleSourceSelect}
      />

      <SelectPackageDialog
        open={packageDialogOpen}
        onOpenChange={setPackageDialogOpen}
        packages={packages}
        questions={questions}
        subjects={subjects}
        onSelect={(pkg) => {
          setSelectedPackageId(pkg.id);
          setSelectedQuestionIds([]);
          toast.success(`Paket \"${pkg.name}\" dipilih. Lanjutkan untuk set jadwal.`);
          setIsDialogOpen(true);
        }}
      />

      <SelectQuestionsDialog
        open={questionsDialogOpen}
        onOpenChange={setQuestionsDialogOpen}
        questions={questions}
        subjects={subjects}
        onSelect={(selected) => {
          setSelectedQuestionIds(selected.map((question) => question.id));
          setSelectedPackageId(null);
          toast.success(`${selected.length} soal dipilih. Lanjutkan untuk set jadwal.`);
          setIsDialogOpen(true);
        }}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Tugas Baru</DialogTitle>
            <DialogDescription>Tentukan jenis tugas dan isi detail tugas</DialogDescription>
          </DialogHeader>
          <AssignmentForm
            schedules={schedules}
            onClose={() => {
              setIsDialogOpen(false);
              setSelectedPackageId(null);
              setSelectedQuestionIds([]);
            }}
            onSave={handleSaveAssignment}
          />
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Tugas</p>
                <p className="text-xl font-bold">{assignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Aktif</p>
                <p className="text-xl font-bold">
                  {assignments.filter((assignment) => assignment.status === "ACTIVE").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sudah Dinilai</p>
                <p className="text-xl font-bold">{totalGraded}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pengumpulan</p>
                <p className="text-xl font-bold">{totalSubmissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Filter berdasarkan jadwal..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jadwal</SelectItem>
                {schedules.map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.id}>
                    {schedule.className} - {schedule.subjectName}
                  </SelectItem>
                ))}
                {schedules.length === 0 && (
                  <SelectItem value="none" disabled>
                    Belum ada jadwal
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari tugas..." className="pl-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredAssignments.map((assignment) => {
          const classNames = assignment.classIds
            .map((classId) => classMap.get(classId)?.name)
            .filter(Boolean)
            .join(", ");
          const totalStudents = assignment.classIds.reduce(
            (sum, classId) => sum + (classMap.get(classId)?.studentCount ?? 0),
            0
          );
          const submissions = submissionCounts[assignment.id] ?? 0;
          return (
            <TeacherAssignmentCard
              key={assignment.id}
              assignment={assignment}
              classNames={classNames || "Semua kelas"}
              submissions={submissions}
              totalStudents={totalStudents}
              onView={() => setDetailAssignment(assignment)}
              onEdit={() => {}}
              onDelete={() => handleDelete(assignment.id)}
            />
          );
        })}
        {!isLoading && filteredAssignments.length === 0 && (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>{emptyAssignmentsMessage}</p>
            </div>
          </Card>
        )}
      </div>

      <Sheet open={!!detailAssignment} onOpenChange={() => setDetailAssignment(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {detailAssignment && (
            <TeacherAssignmentDetail assignment={detailAssignment} classMap={classMap} />
          )}
        </SheetContent>
      </Sheet>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Memuat data tugas...</p>
      )}
    </div>
  );
}

type StudentAssignmentsViewProps = {
  title: string;
  description: string;
  allowStudentSelect: boolean;
  allowWork: boolean;
};

function StudentAssignmentsView({
  title,
  description,
  allowStudentSelect,
  allowWork,
}: StudentAssignmentsViewProps) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [students, setStudents] = useState<UserSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [submissions, setSubmissions] = useState<GradeSummary[]>([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBase = async () => {
      setIsLoading(true);
      try {
        const [assignmentData, studentData] = await Promise.all([
          listAssignments(),
          listStudents(),
        ]);
        setAssignments(assignmentData);
        setStudents(studentData);
      } finally {
        setIsLoading(false);
      }
    };
    loadBase();
  }, []);

  useEffect(() => {
    if (!students.length) {
      setSelectedStudentId("");
      return;
    }
    if (!selectedStudentId || !students.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  useEffect(() => {
    const loadSubmissions = async () => {
      if (!selectedStudentId) {
        setSubmissions([]);
        return;
      }
      setIsLoading(true);
      try {
        const data = await listGrades({ studentId: selectedStudentId });
        setSubmissions(data);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmissions();
  }, [selectedStudentId]);

  const selectedStudent = students.find((student) => student.id === selectedStudentId);
  const studentClassId = selectedStudent?.studentProfile?.classId ?? null;
  const showNoStudents = allowStudentSelect && !isLoading && students.length === 0;

  const submissionMap = useMemo(
    () => new Map(submissions.map((entry) => [entry.assignmentId, entry])),
    [submissions]
  );

  const assignmentsWithStatus = selectedStudentId
    ? assignments
        .filter((assignment) =>
          studentClassId ? assignment.classIds.includes(studentClassId) : true
        )
        .map((assignment) => {
          const submission = submissionMap.get(assignment.id);
          let status: "pending" | "submitted" | "graded" = "pending";
          if (submission) {
            if (submission.status === "GRADED") status = "graded";
            else if (submission.status === "SUBMITTED") status = "submitted";
          }
          return {
            ...assignment,
            status,
            submittedAt: submission?.submittedAt,
            grade: submission?.grade ?? null,
          };
        })
    : [];

  const filterAssignments = (status: string) =>
    assignmentsWithStatus.filter((assignment) => assignment.status === status);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {allowStudentSelect && (
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Pilih siswa..." />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {student.name}
                  </div>
                </SelectItem>
              ))}
              {students.length === 0 && (
                <SelectItem value="none" disabled>
                  Belum ada siswa
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {showNoStudents && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <User className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Belum ada siswa terdaftar</p>
            <p className="text-sm">Tambahkan siswa terlebih dahulu untuk melihat tugas.</p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Belum Dikerjakan</p>
                <p className="text-2xl font-bold">{filterAssignments("pending").length}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sudah Dikumpulkan</p>
                <p className="text-2xl font-bold">{filterAssignments("submitted").length}</p>
              </div>
              <Send className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sudah Dinilai</p>
                <p className="text-2xl font-bold">{filterAssignments("graded").length}</p>
              </div>
              <Award className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="submitted" className="gap-2">
            <Send className="h-4 w-4" />
            Dikumpulkan
          </TabsTrigger>
          <TabsTrigger value="graded" className="gap-2">
            <Award className="h-4 w-4" />
            Dinilai
          </TabsTrigger>
        </TabsList>

        {["pending", "submitted", "graded"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filterAssignments(status).map((assignment) => (
              <StudentAssignmentCard
                key={assignment.id}
                assignment={assignment}
                onWork={() => {
                  if (!allowWork) return;
                  router.push(`/dashboard/assignments/${assignment.id}/work`);
                }}
                allowWork={allowWork}
              />
            ))}
            {filterAssignments(status).length === 0 && (
              <Card className="p-8">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada tugas</p>
                </div>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Memuat tugas...</p>
      )}
    </div>
  );
}

function StatusBadge({ status, dueDate }: { status: string; dueDate: Date }) {
  if (status === "graded") {
    return <Badge className="bg-success text-success-foreground">Dinilai</Badge>;
  }
  if (status === "submitted") {
    return <Badge className="bg-info text-info-foreground">Dikumpulkan</Badge>;
  }
  if (isPast(dueDate)) {
    return <Badge variant="destructive">Terlambat</Badge>;
  }
  const daysLeft = differenceInDays(dueDate, new Date());
  if (daysLeft <= 2) {
    return <Badge className="bg-warning text-warning-foreground">Segera</Badge>;
  }
  return <Badge variant="outline">Pending</Badge>;
}

interface StudentAssignmentCardProps {
  assignment: AssignmentSummary & {
    status: "pending" | "submitted" | "graded";
    submittedAt?: Date;
    grade?: number | null;
  };
  onWork: () => void;
  allowWork: boolean;
}

function StudentAssignmentCard({
  assignment,
  onWork,
  allowWork,
}: StudentAssignmentCardProps) {
  const deliveryType = getDeliveryType(assignment);
  const config = typeConfig[deliveryType];
  const Icon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center shrink-0", config.bgColor)}>
            <Icon className={cn("h-6 w-6", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{assignment.subjectName}</Badge>
              <Badge variant="secondary">{ASSIGNMENT_TYPES[deliveryType]}</Badge>
              <StatusBadge status={assignment.status} dueDate={assignment.dueDate} />
            </div>
            <h3 className="font-semibold">{assignment.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{assignment.description}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Deadline: {format(assignment.dueDate, "d MMM yyyy", { locale: id })}
              </span>
              {assignment.submittedAt && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Dikumpulkan: {format(assignment.submittedAt, "d MMM yyyy", { locale: id })}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {assignment.status === "graded" && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Nilai</p>
                <p className="text-2xl font-bold text-success">{assignment.grade}</p>
              </div>
            )}
            {assignment.status === "pending" && allowWork && (
              <Button onClick={onWork}>Kerjakan</Button>
            )}
            {assignment.status === "submitted" && (
              <Button variant="outline" disabled>
                Menunggu Nilai
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TeacherAssignmentCardProps {
  assignment: AssignmentSummary;
  classNames: string;
  submissions: number;
  totalStudents: number;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TeacherAssignmentCard({
  assignment,
  classNames,
  submissions,
  totalStudents,
  onView,
  onEdit,
  onDelete,
}: TeacherAssignmentCardProps) {
  const deliveryType = getDeliveryType(assignment);
  const config = typeConfig[deliveryType];
  const Icon = config.icon;
  const progress = totalStudents > 0 ? (submissions / totalStudents) * 100 : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center shrink-0", config.bgColor)}>
            <Icon className={cn("h-6 w-6", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{classNames}</Badge>
              <Badge variant="secondary">{ASSIGNMENT_TYPES[deliveryType]}</Badge>
            </div>
            <h3 className="font-semibold truncate">{assignment.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{assignment.description}</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Pengumpulan</span>
                  <span className="font-medium">
                    {submissions}/{totalStudents || 0}
                  </span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
              <div className="text-right text-xs">
                <p className="text-muted-foreground">Deadline</p>
                <p className={cn("font-medium", isPast(assignment.dueDate) && "text-destructive")}>
                  {format(assignment.dueDate, "d MMM yyyy", { locale: id })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeacherAssignmentDetail({
  assignment,
  classMap,
}: {
  assignment: AssignmentSummary;
  classMap: Map<string, ClassSummary>;
}) {
  const [submissions, setSubmissions] = useState<AssignmentSubmissionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSubmissions = async () => {
      setIsLoading(true);
      try {
        const data = await listAssignmentSubmissions(assignment.id);
        setSubmissions(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadSubmissions();
  }, [assignment.id]);

  const deliveryType = getDeliveryType(assignment);
  const kindLabel = assignment.kind ? ASSIGNMENT_KIND_LABELS[assignment.kind] ?? assignment.kind : "-";
  const classNames = assignment.classIds
    .map((classId) => classMap.get(classId)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <SheetHeader>
        <SheetTitle>{assignment.title}</SheetTitle>
        <SheetDescription>
          {classNames || "Semua kelas"} • {assignment.subjectName}
        </SheetDescription>
      </SheetHeader>
      <div className="mt-6 space-y-6">
        <div className="flex items-center gap-4">
          <Badge variant="secondary">{ASSIGNMENT_TYPES[deliveryType]}</Badge>
          <Badge variant="outline">{kindLabel}</Badge>
          <span className="text-sm text-muted-foreground">
            Deadline: {format(assignment.dueDate, "d MMMM yyyy", { locale: id })}
          </span>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Deskripsi</h4>
          <p className="text-sm">{assignment.description}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Pengumpulan ({submissions.length})
          </h4>
          <div className="space-y-2">
            {submissions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{sub.studentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {sub.submittedAt
                        ? `Dikumpulkan ${format(sub.submittedAt, "d MMM yyyy", { locale: id })}`
                        : "Belum mengumpulkan"}
                    </p>
                  </div>
                </div>
                {sub.status === "GRADED" ? (
                  <Badge className="bg-success text-success-foreground">
                    {sub.grade ?? "-"}
                  </Badge>
                ) : sub.status === "SUBMITTED" ? (
                  <Badge variant="secondary">Menunggu</Badge>
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
              </div>
            ))}
            {submissions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada pengumpulan
              </p>
            )}
          </div>
        </div>
      </div>
      {isLoading && (
        <p className="text-sm text-muted-foreground mt-4">Memuat pengumpulan...</p>
      )}
    </>
  );
}

type AssignmentFormProps = {
  schedules: ScheduleSummary[];
  onClose: () => void;
  onSave: (payload: {
    id?: string;
    title: string;
    description: string;
    classIds: string[];
    subjectId: string;
    teacherId: string;
    dueDate: string;
    deliveryType: AssignmentType;
    kind: string;
  }) => void;
};

function AssignmentForm({ schedules, onClose, onSave }: AssignmentFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return format(date, "yyyy-MM-dd");
  });
  const [deliveryType, setDeliveryType] = useState<AssignmentType>("FILE");
  const [kind, setKind] = useState("HOMEWORK");
  const [teachers, setTeachers] = useState<UserSummary[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

  const selectedSchedule = schedules.find((s) => s.id === scheduleId);

  useEffect(() => {
    let isActive = true;
    const timer = setTimeout(() => {
      if (!isActive) return;
      setIsLoadingTeachers(true);
      listTeachers()
        .then((data) => {
          if (isActive) setTeachers(data);
        })
        .finally(() => {
          if (isActive) setIsLoadingTeachers(false);
        });
    }, 0);
    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (selectedSchedule?.teacherId) {
      const timer = setTimeout(() => {
        setTeacherId(selectedSchedule.teacherId);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedSchedule?.teacherId]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSchedule) {
      toast.error("Pilih jadwal terlebih dahulu.");
      return;
    }
    if (!title.trim()) {
      toast.error("Judul tugas wajib diisi.");
      return;
    }
    if (!teacherId) {
      toast.error("Guru pengampu wajib dipilih.");
      return;
    }
    if (!dueDate) {
      toast.error("Deadline wajib diisi.");
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      classIds: [selectedSchedule.classId],
      subjectId: selectedSchedule.subjectId,
      teacherId,
      dueDate,
      deliveryType,
      kind,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Jadwal</Label>
        <Select value={scheduleId} onValueChange={setScheduleId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih jadwal pelajaran..." />
          </SelectTrigger>
          <SelectContent>
            {schedules.map((schedule) => (
              <SelectItem key={schedule.id} value={schedule.id}>
                {schedule.className} • {schedule.subjectName}
              </SelectItem>
            ))}
            {schedules.length === 0 && (
              <SelectItem value="none" disabled>
                Belum ada jadwal
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {selectedSchedule && (
          <p className="text-xs text-muted-foreground">
            {selectedSchedule.dayOfWeek} • {selectedSchedule.startTime} - {selectedSchedule.endTime}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assignment-title">Judul</Label>
          <Input
            id="assignment-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Masukkan judul tugas"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assignment-deadline">Deadline</Label>
          <Input
            id="assignment-deadline"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignment-description">Deskripsi</Label>
        <Textarea
          id="assignment-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="Tambahkan detail tugas"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Jenis Tugas</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis tugas..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ASSIGNMENT_KIND_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Metode Pengumpulan</Label>
          <Select
            value={deliveryType}
            onValueChange={(value) => setDeliveryType(value as AssignmentType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih metode..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ASSIGNMENT_TYPES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Guru Pengampu</Label>
        <Select
          value={teacherId}
          onValueChange={setTeacherId}
          disabled={isLoadingTeachers}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={isLoadingTeachers ? "Memuat guru..." : "Pilih guru"}
            />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </SelectItem>
            ))}
            {teachers.length === 0 && (
              <SelectItem value="none" disabled>
                Belum ada guru
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit">Simpan Tugas</Button>
      </DialogFooter>
    </form>
  );
}
