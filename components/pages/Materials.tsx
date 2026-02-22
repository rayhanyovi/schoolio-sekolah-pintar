'use client';

import { useEffect, useMemo, useState } from "react";
import { ROLES } from "@/lib/constants";
import { useRoleContext } from "@/hooks/useRoleContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Download,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  createMaterial,
  deleteMaterial,
  listMaterials,
  updateMaterial,
} from "@/lib/handlers/materials";
import { listSchedules } from "@/lib/handlers/schedules";
import { listSubjects } from "@/lib/handlers/subjects";
import { listParentChildren, listTeachers, listStudents } from "@/lib/handlers/users";
import {
  MaterialSummary,
  ScheduleSummary,
  SubjectSummary,
  UserSummary,
} from "@/lib/schemas";

const fileTypeIcons: Record<string, string> = {
  pdf: "📄",
  pptx: "📊",
  docx: "📝",
  video: "🎥",
  default: "📎",
};

export default function Materials() {
  const { role } = useRoleContext();

  if (role === ROLES.TEACHER || role === ROLES.ADMIN) {
    return <TeacherMaterialsView />;
  }

  if (role === ROLES.PARENT) {
    return (
      <StudentMaterialsView
        title="Materi Pembelajaran Anak"
        description="Lihat materi yang diberikan kepada anak Anda"
        allowStudentSelect
      />
    );
  }

  return (
    <StudentMaterialsView
      title="Materi Pembelajaran"
      description="Akses materi dari semua mata pelajaran"
      allowStudentSelect={false}
    />
  );
}

function TeacherMaterialsView() {
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [teachers, setTeachers] = useState<UserSummary[]>([]);
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialSummary | null>(null);
  const [detailMaterial, setDetailMaterial] = useState<MaterialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const selectedSchedule = schedules.find((schedule) => schedule.id === selectedScheduleId);

  const loadMaterials = async (params?: { classId?: string; subjectId?: string; q?: string }) => {
    setIsLoading(true);
    try {
      const data = await listMaterials(params);
      setMaterials(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadBase = async () => {
      setIsLoading(true);
      try {
        const [scheduleData, subjectData, teacherData] = await Promise.all([
          listSchedules(),
          listSubjects(),
          listTeachers(),
        ]);
        setSchedules(scheduleData);
        setSubjects(subjectData);
        setTeachers(teacherData);
      } finally {
        setIsLoading(false);
      }
    };
    loadBase();
  }, []);

  useEffect(() => {
    const params: { classId?: string; subjectId?: string; q?: string } = {};
    if (selectedSchedule && selectedScheduleId !== "all") {
      params.classId = selectedSchedule.classId;
      params.subjectId = selectedSchedule.subjectId;
    }
    if (searchQuery.trim()) {
      params.q = searchQuery.trim();
    }
    loadMaterials(params);
  }, [selectedScheduleId, searchQuery, selectedSchedule]);

  const handleEdit = (material: MaterialSummary) => {
    setEditingMaterial(material);
    setIsDialogOpen(true);
  };

  const handleDelete = async (materialId: string) => {
    await deleteMaterial(materialId);
    await loadMaterials();
  };

  const handleSaveMaterial = async (payload: {
    id?: string;
    title: string;
    description: string;
    classId?: string | null;
    subjectId: string;
    teacherId: string;
  }) => {
    if (payload.id) {
      await updateMaterial(payload.id, payload);
    } else {
      await createMaterial(payload);
    }
    setIsDialogOpen(false);
    setEditingMaterial(null);
    await loadMaterials();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Materi Pembelajaran</h1>
          <p className="text-muted-foreground">Kelola materi untuk kelas Anda</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingMaterial(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Materi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingMaterial ? "Edit Materi" : "Tambah Materi Baru"}</DialogTitle>
              <DialogDescription>
                {editingMaterial
                  ? "Ubah informasi materi pembelajaran"
                  : "Isi informasi untuk materi baru"}
              </DialogDescription>
            </DialogHeader>
            <MaterialForm
              material={editingMaterial}
              schedules={schedules}
              subjects={subjects}
              teachers={teachers}
              onClose={() => {
                setIsDialogOpen(false);
                setEditingMaterial(null);
              }}
              onSave={handleSaveMaterial}
            />
          </DialogContent>
        </Dialog>
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
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari materi..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            onView={() => setDetailMaterial(material)}
            onEdit={() => handleEdit(material)}
            onDelete={() => handleDelete(material.id)}
            showActions
          />
        ))}
      </div>

      {materials.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Belum ada materi</p>
            <p className="text-sm">Tambahkan materi pertama untuk kelas ini</p>
          </div>
        </Card>
      )}

      <Sheet open={!!detailMaterial} onOpenChange={() => setDetailMaterial(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {detailMaterial && (
            <>
              <SheetHeader>
                <SheetTitle>{detailMaterial.title}</SheetTitle>
                <SheetDescription>
                  {detailMaterial.className} • {detailMaterial.subject}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Deskripsi</h4>
                  <p className="text-sm">{detailMaterial.description}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Tanggal Upload</h4>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(detailMaterial.createdAt, "EEEE, d MMMM yyyy", {
                      locale: id,
                    })}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Lampiran</h4>
                  <div className="space-y-2">
                    {detailMaterial.attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {fileTypeIcons[file.type] || fileTypeIcons.default}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {detailMaterial.attachments.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Belum ada lampiran
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Memuat materi...</p>
      )}
    </div>
  );
}

type StudentMaterialsViewProps = {
  title: string;
  description: string;
  allowStudentSelect: boolean;
};

function StudentMaterialsView({
  title,
  description,
  allowStudentSelect,
}: StudentMaterialsViewProps) {
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [students, setStudents] = useState<UserSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailMaterial, setDetailMaterial] = useState<MaterialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBase = async () => {
      setIsLoading(true);
      try {
        const studentPromise = allowStudentSelect ? listParentChildren() : listStudents();
        const [materialData, subjectData, studentData] = await Promise.all([
          listMaterials(),
          listSubjects(),
          studentPromise,
        ]);
        setMaterials(materialData);
        setSubjects(subjectData);
        setStudents(studentData);
      } finally {
        setIsLoading(false);
      }
    };
    loadBase();
  }, [allowStudentSelect]);

  useEffect(() => {
    if (!students.length) {
      setSelectedStudentId("");
      return;
    }
    if (!selectedStudentId || !students.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  const selectedStudent = students.find((student) => student.id === selectedStudentId);
  const studentClassId = selectedStudent?.studentProfile?.classId ?? null;
  const showNoStudents = allowStudentSelect && !isLoading && students.length === 0;

  const filteredMaterials = useMemo(() => {
    if (allowStudentSelect && !selectedStudentId) return [];
    return materials.filter((material) => {
      const matchSubject =
        selectedSubjectId === "all" ||
        !selectedSubjectId ||
        material.subjectId === selectedSubjectId;
      const matchSearch =
        !searchQuery ||
        material.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass =
        !studentClassId || !material.classId || material.classId === studentClassId;
      return matchSubject && matchSearch && matchClass;
    });
  }, [materials, selectedSubjectId, searchQuery, studentClassId, allowStudentSelect, selectedStudentId]);

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
        <Card className="p-10">
          <div className="text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Belum ada siswa terhubung</p>
            <p className="text-sm">Tambahkan siswa terlebih dahulu untuk melihat materi.</p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Materi</p>
                <p className="text-xl font-bold">{materials.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mata Pelajaran</p>
                <p className="text-xl font-bold">{subjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Download className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lampiran</p>
                <p className="text-xl font-bold">
                  {materials.reduce((sum, material) => sum + material.attachments.length, 0)}
                </p>
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
                <p className="text-xs text-muted-foreground">Materi Baru</p>
                <p className="text-xl font-bold">{filteredMaterials.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Pilih mata pelajaran..." />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
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
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Cari materi..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            onView={() => setDetailMaterial(material)}
          />
        ))}
      </div>

      {!isLoading && !showNoStudents && filteredMaterials.length === 0 && (
        <Card className="p-10">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">
              {searchQuery || selectedSubjectId !== "all"
                ? "Tidak ada materi sesuai filter"
                : "Belum ada materi"}
            </p>
            <p className="text-sm">
              {searchQuery || selectedSubjectId !== "all"
                ? "Coba ubah filter atau kata kunci pencarian."
                : "Materi akan muncul setelah guru menambahkan."}
            </p>
          </div>
        </Card>
      )}

      <Sheet open={!!detailMaterial} onOpenChange={() => setDetailMaterial(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {detailMaterial && (
            <>
              <SheetHeader>
                <SheetTitle>{detailMaterial.title}</SheetTitle>
                <SheetDescription>
                  {detailMaterial.subject} • {detailMaterial.teacher}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Deskripsi</h4>
                  <p className="text-sm">{detailMaterial.description}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Tanggal Upload</h4>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(detailMaterial.createdAt, "EEEE, d MMMM yyyy", {
                      locale: id,
                    })}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Lampiran ({detailMaterial.attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {detailMaterial.attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {fileTypeIcons[file.type] || fileTypeIcons.default}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                          </div>
                        </div>
                        <Button size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Unduh
                        </Button>
                      </div>
                    ))}
                    {detailMaterial.attachments.length === 0 && (
                      <p className="text-sm text-muted-foreground">Belum ada lampiran</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Memuat materi...</p>
      )}
    </div>
  );
}

interface MaterialCardProps {
  material: MaterialSummary;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

function MaterialCard({ material, onView, onEdit, onDelete, showActions }: MaterialCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary" className="text-xs">
            {material.subject}
          </Badge>
          {showActions && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
        <CardTitle className="text-base line-clamp-2">{material.title}</CardTitle>
        <CardDescription className="line-clamp-2">{material.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(material.createdAt, "d MMM yyyy", { locale: id })}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {material.attachments.length} file
          </span>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={onView}>
          <Eye className="h-4 w-4 mr-2" />
          Lihat Detail
        </Button>
      </CardContent>
    </Card>
  );
}

type MaterialFormProps = {
  material?: MaterialSummary | null;
  schedules: ScheduleSummary[];
  subjects: SubjectSummary[];
  teachers: UserSummary[];
  onClose: () => void;
  onSave: (payload: {
    id?: string;
    title: string;
    description: string;
    classId?: string | null;
    subjectId: string;
    teacherId: string;
  }) => void;
};

function MaterialForm({
  material,
  schedules,
  subjects,
  teachers,
  onClose,
  onSave,
}: MaterialFormProps) {
  const initialScheduleId =
    schedules.find(
      (schedule) =>
        schedule.classId === material?.classId &&
        schedule.subjectId === material?.subjectId
    )?.id ?? schedules[0]?.id ?? "";
  const [scheduleId, setScheduleId] = useState(initialScheduleId);
  const [title, setTitle] = useState(material?.title ?? "");
  const [description, setDescription] = useState(material?.description ?? "");

  useEffect(() => {
    setScheduleId(initialScheduleId);
  }, [initialScheduleId]);

  const selectedSchedule = schedules.find((schedule) => schedule.id === scheduleId);
  const fallbackTeacherId = teachers[0]?.id ?? material?.teacherId ?? "";
  const subjectId = selectedSchedule?.subjectId ?? material?.subjectId ?? subjects[0]?.id ?? "";
  const classId = selectedSchedule?.classId ?? material?.classId ?? null;
  const teacherId = selectedSchedule?.teacherId ?? material?.teacherId ?? fallbackTeacherId;

  const handleSubmit = () => {
    if (!subjectId || !teacherId) return;
    onSave({
      id: material?.id,
      title,
      description,
      classId,
      subjectId,
      teacherId,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="schedule">Jadwal</Label>
        <Select value={scheduleId} onValueChange={setScheduleId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih jadwal..." />
          </SelectTrigger>
          <SelectContent>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Judul Materi</Label>
        <Input
          id="title"
          placeholder="Masukkan judul materi..."
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          placeholder="Jelaskan isi materi..."
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={!subjectId || !teacherId}>
          {material ? "Simpan Perubahan" : "Tambah Materi"}
        </Button>
      </DialogFooter>
    </div>
  );
}
