'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { ClassCard } from "@/components/classes/ClassCard";
import { ClassFormDialog } from "@/components/classes/ClassFormDialog";
import { ClassDetailSheet } from "@/components/classes/ClassDetailSheet";
import {
  createClass,
  deleteClass,
  listClasses,
  updateClass,
} from "@/lib/handlers/classes";
import { listMajors } from "@/lib/handlers/majors";
import { listTeachers } from "@/lib/handlers/users";
import { ClassFormValues, ClassSummary, MajorSummary, TeacherOption } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { useRoleContext } from "@/hooks/useRoleContext";

export default function Classes() {
  const { role } = useRoleContext();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [majors, setMajors] = useState<MajorSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassSummary | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [classData, teacherData, majorData] = await Promise.all([
          listClasses(),
          listTeachers(),
          listMajors(),
        ]);
        if (!isActive) return;
        setClasses(classData);
        setTeachers(
          teacherData.map((teacher) => ({ id: teacher.id, name: teacher.name }))
        );
        setMajors(majorData);
      } catch (error) {
        if (!isActive) return;
        toast({
          title: "Gagal memuat data",
          description: error instanceof Error ? error.message : "Terjadi kesalahan",
        });
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isActive = false;
    };
  }, [toast]);

  const filteredClasses = classes.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.homeroomTeacher.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = selectedGrade === "all" || c.grade.toString() === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const availableGrades = Array.from(new Set(classes.map((c) => c.grade))).sort(
    (a, b) => a - b
  );

  useEffect(() => {
    if (selectedGrade !== "all" && !availableGrades.includes(Number(selectedGrade))) {
      setSelectedGrade("all");
    }
  }, [availableGrades, selectedGrade]);

  const totalStudents = classes.reduce((acc, c) => acc + c.studentCount, 0);
  const avgStudentsPerClass = classes.length
    ? Math.round(totalStudents / classes.length)
    : 0;

  const handleSubmit = async (data: ClassFormValues) => {
    const payload = {
      name: data.name,
      grade: data.grade,
      major: data.major || null,
      section: data.section,
      homeroomTeacherId: data.homeroomTeacherId || null,
      academicYear: data.academicYear || null,
    };

    try {
      if (selectedClass) {
        const updated = await updateClass(selectedClass.id, payload);
        setClasses((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        toast({ title: "Berhasil", description: "Kelas berhasil diperbarui" });
      } else {
        const created = await createClass(payload);
        setClasses((prev) => [...prev, created]);
        toast({
          title: "Berhasil",
          description: "Kelas baru berhasil ditambahkan",
        });
      }
      setSelectedClass(null);
    } catch (error) {
      toast({
        title: "Gagal menyimpan kelas",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteClass(id);
      setClasses((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Berhasil", description: "Kelas berhasil dihapus" });
    } catch (error) {
      toast({
        title: "Gagal menghapus kelas",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    }
  };

  const handleEdit = (classData: ClassSummary) => {
    setSelectedClass(classData);
    setFormDialogOpen(true);
  };

  const handleViewDetails = (classData: ClassSummary) => {
    setSelectedClass(classData);
    setDetailSheetOpen(true);
  };

  const isAdmin = role === "ADMIN";

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="dashboard-shell overflow-hidden rounded-[2rem] border border-primary/15 bg-[radial-gradient(circle_at_top_left,_rgba(14,107,83,0.16),_transparent_42%),linear-gradient(135deg,rgba(248,243,230,0.98),rgba(255,255,255,0.95))] px-6 py-7 shadow-[0_28px_80px_-48px_rgba(34,64,52,0.45)] sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex w-fit rounded-full bg-primary/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              Manajemen Kelas
            </span>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Struktur kelas yang lebih jelas untuk admin dan wali kelas.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Rapikan pengelompokan siswa, kapasitas kelas, dan wali kelas dalam
                layout yang lebih mudah dipindai setiap hari.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-primary/10 bg-white/88 shadow-none">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Total Kelas</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{classes.length}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/10 bg-white/88 shadow-none">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Total Siswa</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{totalStudents}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/10 bg-white/88 shadow-none">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Rata-rata</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{avgStudentsPerClass}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {isAdmin && (
          <Button onClick={() => { setSelectedClass(null); setFormDialogOpen(true); }} className="sm:ml-auto">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kelas
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="dashboard-panel relative flex-1 p-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Cari kelas atau wali kelas"
            placeholder="Cari kelas atau wali kelas…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs by Grade */}
      <Tabs defaultValue="all" onValueChange={setSelectedGrade}>
        <TabsList className="flex-wrap rounded-2xl border border-border/80 bg-card/70 p-1">
          <TabsTrigger value="all">Semua</TabsTrigger>
          {availableGrades.map((grade) => (
            <TabsTrigger key={grade} value={grade.toString()}>
              Kelas {grade}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedGrade} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground" aria-live="polite">
              Memuat data kelas…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClasses.map((classData) => (
                  <ClassCard
                    key={classData.id}
                    classData={classData}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
              {filteredClasses.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Tidak ada kelas ditemukan
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ClassFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        classData={selectedClass}
        teachers={teachers}
        majors={majors}
        onSubmit={handleSubmit}
      />
      <ClassDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        classData={selectedClass}
      />
    </div>
  );
}
