'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROLES, ASSIGNMENT_TYPES, AssignmentType } from "@/lib/constants";
import { useRoleContext } from "@/hooks/useRoleContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertCircle,
  Calendar,
  Upload,
  File,
  X,
  Eye,
  Pencil,
  Trash2,
  Send,
  User,
  Users,
  ClipboardList,
  Award,
  Library
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isPast, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

// Demo data
const demoSchedules = [
  { id: "1", className: "X-A", subject: "Matematika" },
  { id: "2", className: "X-B", subject: "Matematika" },
  { id: "3", className: "XI-A", subject: "Fisika" },
];

const demoAssignments = [
  {
    id: "1",
    title: "Quiz Aljabar Linear",
    description: "Kerjakan soal-soal pilihan ganda tentang materi aljabar linear yang sudah dipelajari.",
    type: "MCQ" as AssignmentType,
    subject: "Matematika",
    className: "X-A",
    teacher: "Pak Budi",
    dueDate: new Date(2025, 0, 15),
    createdAt: new Date(2025, 0, 5),
    questions: [
      { id: "q1", text: "Apa hasil dari 2x + 3 = 7?", options: ["x = 1", "x = 2", "x = 3", "x = 4"], correctAnswer: 1 },
      { id: "q2", text: "Jika y = 2x - 5, maka nilai y ketika x = 4 adalah?", options: ["3", "4", "5", "6"], correctAnswer: 0 },
    ],
    submissions: 25,
    totalStudents: 30,
  },
  {
    id: "2",
    title: "Laporan Praktikum Hukum Newton",
    description: "Upload laporan praktikum dalam format PDF. Maksimal 10 halaman.",
    type: "FILE" as AssignmentType,
    subject: "Fisika",
    className: "XI-A",
    teacher: "Bu Sari",
    dueDate: new Date(2025, 0, 20),
    createdAt: new Date(2025, 0, 8),
    submissions: 18,
    totalStudents: 28,
  },
  {
    id: "3",
    title: "Esai: Penerapan Trigonometri",
    description: "Tuliskan esai minimal 500 kata tentang penerapan trigonometri dalam kehidupan sehari-hari.",
    type: "ESSAY" as AssignmentType,
    subject: "Matematika",
    className: "X-A",
    teacher: "Pak Budi",
    dueDate: new Date(2025, 0, 10),
    createdAt: new Date(2025, 0, 3),
    submissions: 28,
    totalStudents: 30,
  },
];

const demoStudentAssignments = [
  { ...demoAssignments[0], status: "pending" as const, grade: null },
  { ...demoAssignments[1], status: "submitted" as const, submittedAt: new Date(2025, 0, 12), grade: null },
  { ...demoAssignments[2], status: "graded" as const, submittedAt: new Date(2025, 0, 9), grade: 85 },
];

const demoChildren = [
  { id: "1", name: "Anak 1 - Ahmad", class: "X-A" },
  { id: "2", name: "Anak 2 - Budi", class: "XI-B" },
];

const typeConfig: Record<AssignmentType, { icon: typeof FileText; color: string; bgColor: string }> = {
  MCQ: { icon: ClipboardList, color: "text-primary", bgColor: "bg-primary/10" },
  FILE: { icon: Upload, color: "text-secondary", bgColor: "bg-secondary/10" },
  ESSAY: { icon: FileText, color: "text-accent", bgColor: "bg-accent/10" },
};

export default function Assignments() {
  const { role } = useRoleContext();
  
  if (role === ROLES.TEACHER || role === ROLES.ADMIN) {
    return <TeacherAssignmentsView />;
  }
  
  if (role === ROLES.PARENT) {
    return <ParentAssignmentsView />;
  }
  
  return <StudentAssignmentsView />;
}

function TeacherAssignmentsView() {
  const router = useRouter();
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailAssignment, setDetailAssignment] = useState<typeof demoAssignments[0] | null>(null);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [questionsDialogOpen, setQuestionsDialogOpen] = useState(false);

  const filteredAssignments = selectedSchedule && selectedSchedule !== "all"
    ? demoAssignments.filter(a => {
        const schedule = demoSchedules.find(s => s.id === selectedSchedule);
        return schedule && a.className === schedule.className && a.subject === schedule.subject;
      })
    : demoAssignments;

  const handleSourceSelect = (source: "package" | "bank" | "new") => {
    if (source === "package") {
      setPackageDialogOpen(true);
    } else if (source === "bank") {
      setQuestionsDialogOpen(true);
    } else {
      router.push("/dashboard/question-bank");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
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

      {/* Source Selection Dialog */}
      <SelectQuestionSourceDialog
        open={sourceDialogOpen}
        onOpenChange={setSourceDialogOpen}
        onSelectSource={handleSourceSelect}
      />

      {/* Package Selection Dialog */}
      <SelectPackageDialog
        open={packageDialogOpen}
        onOpenChange={setPackageDialogOpen}
        onSelect={(pkg) => {
          toast.success(`Paket "${pkg.name}" dipilih. Lanjutkan untuk set jadwal.`);
          setIsDialogOpen(true);
        }}
      />

      {/* Questions Selection Dialog */}
      <SelectQuestionsDialog
        open={questionsDialogOpen}
        onOpenChange={setQuestionsDialogOpen}
        onSelect={(questions) => {
          toast.success(`${questions.length} soal dipilih. Lanjutkan untuk set jadwal.`);
          setIsDialogOpen(true);
        }}
      />

      {/* Assignment Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Tugas Baru</DialogTitle>
            <DialogDescription>Tentukan jenis tugas dan isi detail tugas</DialogDescription>
          </DialogHeader>
          <AssignmentForm onClose={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Tugas</p>
                <p className="text-xl font-bold">{demoAssignments.length}</p>
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
                <p className="text-xl font-bold">2</p>
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
                <p className="text-xs text-muted-foreground">Selesai Dinilai</p>
                <p className="text-xl font-bold">1</p>
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
                <p className="text-xl font-bold">71/88</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Filter berdasarkan jadwal..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jadwal</SelectItem>
                {demoSchedules.map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.id}>
                    {schedule.className} - {schedule.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari tugas..." className="pl-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.map((assignment) => (
          <TeacherAssignmentCard
            key={assignment.id}
            assignment={assignment}
            onView={() => setDetailAssignment(assignment)}
          />
        ))}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!detailAssignment} onOpenChange={() => setDetailAssignment(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {detailAssignment && (
            <TeacherAssignmentDetail assignment={detailAssignment} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StudentAssignmentsView() {
  const [activeTab, setActiveTab] = useState("pending");
  const [workingAssignment, setWorkingAssignment] = useState<typeof demoStudentAssignments[0] | null>(null);

  const filterAssignments = (status: string) => 
    demoStudentAssignments.filter(a => a.status === status);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tugas Saya</h1>
        <p className="text-muted-foreground">Kerjakan dan kumpulkan tugas Anda</p>
      </div>

      {/* Stats */}
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

      {/* Tabs */}
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
                onWork={() => setWorkingAssignment(assignment)}
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

      {/* Work Dialog */}
      <Dialog open={!!workingAssignment} onOpenChange={() => setWorkingAssignment(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {workingAssignment && (
            <SubmissionForm 
              assignment={workingAssignment} 
              onClose={() => setWorkingAssignment(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ParentAssignmentsView() {
  const [selectedChild, setSelectedChild] = useState<string>(demoChildren[0]?.id || "");

  const childAssignments = demoStudentAssignments;
  const pendingCount = childAssignments.filter(a => a.status === "pending").length;
  const overdueCount = childAssignments.filter(a => a.status === "pending" && isPast(a.dueDate)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tugas Anak</h1>
          <p className="text-muted-foreground">Pantau status tugas anak Anda</p>
        </div>
        <Select value={selectedChild} onValueChange={setSelectedChild}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Pilih anak..." />
          </SelectTrigger>
          <SelectContent>
            {demoChildren.map((child) => (
              <SelectItem key={child.id} value={child.id}>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {child.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Tugas</p>
            <p className="text-2xl font-bold">{childAssignments.length}</p>
          </CardContent>
        </Card>
        <Card className={cn(pendingCount > 0 && "border-warning")}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Belum Dikerjakan</p>
            <p className="text-2xl font-bold text-warning">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className={cn(overdueCount > 0 && "border-destructive")}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Terlambat</p>
            <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Sudah Dinilai</p>
            <p className="text-2xl font-bold text-success">
              {childAssignments.filter(a => a.status === "graded").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {childAssignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{assignment.subject}</Badge>
                    <Badge variant="secondary">{ASSIGNMENT_TYPES[assignment.type]}</Badge>
                    <StatusBadge status={assignment.status} dueDate={assignment.dueDate} />
                  </div>
                  <h3 className="font-semibold">{assignment.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Deadline: {format(assignment.dueDate, "d MMMM yyyy", { locale: id })}
                  </p>
                </div>
                {assignment.status === "graded" && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Nilai</p>
                    <p className="text-2xl font-bold text-success">{assignment.grade}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Shared Components
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

interface TeacherAssignmentCardProps {
  assignment: typeof demoAssignments[0];
  onView: () => void;
}

function TeacherAssignmentCard({ assignment, onView }: TeacherAssignmentCardProps) {
  const config = typeConfig[assignment.type];
  const Icon = config.icon;
  const progress = (assignment.submissions / assignment.totalStudents) * 100;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center shrink-0", config.bgColor)}>
            <Icon className={cn("h-6 w-6", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{assignment.className}</Badge>
              <Badge variant="secondary">{ASSIGNMENT_TYPES[assignment.type]}</Badge>
            </div>
            <h3 className="font-semibold truncate">{assignment.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{assignment.description}</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Pengumpulan</span>
                  <span className="font-medium">{assignment.submissions}/{assignment.totalStudents}</span>
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
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StudentAssignmentCardProps {
  assignment: typeof demoStudentAssignments[0];
  onWork: () => void;
}

function StudentAssignmentCard({ assignment, onWork }: StudentAssignmentCardProps) {
  const config = typeConfig[assignment.type];
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
              <Badge variant="outline">{assignment.subject}</Badge>
              <Badge variant="secondary">{ASSIGNMENT_TYPES[assignment.type]}</Badge>
              <StatusBadge status={assignment.status} dueDate={assignment.dueDate} />
            </div>
            <h3 className="font-semibold">{assignment.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{assignment.description}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Deadline: {format(assignment.dueDate, "d MMM yyyy", { locale: id })}
              </span>
              {"submittedAt" in assignment && assignment.submittedAt && (
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
            {assignment.status === "pending" && (
              <Button onClick={onWork}>Kerjakan</Button>
            )}
            {assignment.status === "submitted" && (
              <Button variant="outline" disabled>Menunggu Nilai</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeacherAssignmentDetail({ assignment }: { assignment: typeof demoAssignments[0] }) {
  const demoSubmissions = [
    { id: "1", studentName: "Ahmad Rizki", submittedAt: new Date(2025, 0, 10), grade: 85, status: "graded" },
    { id: "2", studentName: "Budi Santoso", submittedAt: new Date(2025, 0, 11), grade: null, status: "submitted" },
    { id: "3", studentName: "Citra Dewi", submittedAt: null, grade: null, status: "pending" },
  ];

  return (
    <>
      <SheetHeader>
        <SheetTitle>{assignment.title}</SheetTitle>
        <SheetDescription>
          {assignment.className} • {assignment.subject}
        </SheetDescription>
      </SheetHeader>
      <div className="mt-6 space-y-6">
        <div className="flex items-center gap-4">
          <Badge variant="secondary">{ASSIGNMENT_TYPES[assignment.type]}</Badge>
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
            Pengumpulan ({assignment.submissions}/{assignment.totalStudents})
          </h4>
          <div className="space-y-2">
            {demoSubmissions.map((sub) => (
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
                        : "Belum mengumpulkan"
                      }
                    </p>
                  </div>
                </div>
                {sub.status === "graded" ? (
                  <Badge className="bg-success text-success-foreground">{sub.grade}</Badge>
                ) : sub.status === "submitted" ? (
                  <Button size="sm">Nilai</Button>
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function AssignmentForm({ onClose }: { onClose: () => void }) {
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("MCQ");
  const [questions, setQuestions] = useState([
    { text: "", options: ["", "", "", ""], correctAnswer: 0 }
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { text: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Jadwal</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jadwal..." />
            </SelectTrigger>
            <SelectContent>
              {demoSchedules.map((schedule) => (
                <SelectItem key={schedule.id} value={schedule.id}>
                  {schedule.className} - {schedule.subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Jenis Tugas</Label>
          <Select value={assignmentType} onValueChange={(v) => setAssignmentType(v as AssignmentType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ASSIGNMENT_TYPES).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Judul Tugas</Label>
        <Input placeholder="Masukkan judul tugas..." />
      </div>

      <div className="space-y-2">
        <Label>Deskripsi</Label>
        <Textarea placeholder="Jelaskan instruksi tugas..." rows={3} />
      </div>

      <div className="space-y-2">
        <Label>Deadline</Label>
        <Input type="datetime-local" />
      </div>

      {/* MCQ Questions */}
      {assignmentType === "MCQ" && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label>Soal Pilihan Ganda</Label>
            <Button variant="outline" size="sm" onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-1" />
              Tambah Soal
            </Button>
          </div>
          {questions.map((q, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Soal {i + 1}</Label>
                  {questions.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Input placeholder="Tulis pertanyaan..." />
                <RadioGroup className="space-y-2">
                  {q.options.map((_, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <RadioGroupItem value={String(optIdx)} id={`q${i}-opt${optIdx}`} />
                      <Input placeholder={`Opsi ${String.fromCharCode(65 + optIdx)}`} className="flex-1" />
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </Card>
          ))}
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={onClose}>Buat Tugas</Button>
      </DialogFooter>
    </div>
  );
}

interface SubmissionFormProps {
  assignment: typeof demoStudentAssignments[0];
  onClose: () => void;
}

function SubmissionForm({ assignment, onClose }: SubmissionFormProps) {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{assignment.title}</DialogTitle>
        <DialogDescription>
          {assignment.subject} • Deadline: {format(assignment.dueDate, "d MMMM yyyy", { locale: id })}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <p className="text-sm">{assignment.description}</p>

        {/* MCQ Form */}
        {assignment.type === "MCQ" && assignment.questions && (
          <div className="space-y-4">
            {assignment.questions.map((q, i) => (
              <Card key={q.id} className="p-4">
                <p className="font-medium mb-3">{i + 1}. {q.text}</p>
                <RadioGroup>
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center space-x-2">
                      <RadioGroupItem value={String(optIdx)} id={`${q.id}-${optIdx}`} />
                      <Label htmlFor={`${q.id}-${optIdx}`}>{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </Card>
            ))}
          </div>
        )}

        {/* File Upload Form */}
        {assignment.type === "FILE" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Drag & drop file atau klik untuk upload
              </p>
              <Input
                type="file"
                className="hidden"
                id="submission-file"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
              <Button variant="outline" asChild>
                <label htmlFor="submission-file" className="cursor-pointer">
                  Pilih File
                </label>
              </Button>
            </div>
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Essay Form */}
        {assignment.type === "ESSAY" && (
          <div className="space-y-2">
            <Label>Jawaban Esai</Label>
            <Textarea 
              placeholder="Tuliskan jawaban Anda di sini..." 
              rows={10}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">Min. 500 kata</p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={onClose}>
          <Send className="h-4 w-4 mr-2" />
          Kumpulkan
        </Button>
      </DialogFooter>
    </>
  );
}
