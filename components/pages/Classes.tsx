"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, School, Users, Sigma } from "lucide-react";
import { ClassCard } from "@/components/classes/ClassCard";
import { ClassFormDialog } from "@/components/classes/ClassFormDialog";
import { ClassDetailSheet } from "@/components/classes/ClassDetailSheet";
import { InfoStatCard } from "@/components/dashboard/InfoStatCard";
import {
  createClass,
  deleteClass,
  listClasses,
  updateClass,
} from "@/lib/handlers/classes";
import { listMajors } from "@/lib/handlers/majors";
import { listTeachers } from "@/lib/handlers/users";
import {
  ClassFormValues,
  ClassSummary,
  MajorSummary,
  TeacherOption,
} from "@/lib/schemas";
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
          teacherData.map((teacher) => ({
            id: teacher.id,
            name: teacher.name,
          })),
        );
        setMajors(majorData);
      } catch (error) {
        if (!isActive) return;
        toast({
          title: "Gagal memuat data",
          description:
            error instanceof Error ? error.message : "Terjadi kesalahan",
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
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.homeroomTeacher.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade =
      selectedGrade === "all" || c.grade.toString() === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const availableGrades = Array.from(new Set(classes.map((c) => c.grade))).sort(
    (a, b) => a - b,
  );

  useEffect(() => {
    if (
      selectedGrade !== "all" &&
      !availableGrades.includes(Number(selectedGrade))
    ) {
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
          prev.map((c) => (c.id === updated.id ? updated : c)),
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
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan",
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
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan",
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
      <section>
        <div className="flex justify-end">
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoStatCard
              title="Total Kelas"
              value={classes.length}
              caption="Unit kelas aktif"
              icon={School}
            />
            <InfoStatCard
              title="Total Siswa"
              value={totalStudents}
              caption="Populasi siswa"
              icon={Users}
              iconColor="text-success"
              iconBackground="bg-success/10"
            />
            <InfoStatCard
              title="Rata-rata Siswa"
              value={avgStudentsPerClass}
              caption="Per kelas"
              icon={Sigma}
              iconColor="text-warning"
              iconBackground="bg-warning/10"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {isAdmin && (
          <Button
            onClick={() => {
              setSelectedClass(null);
              setFormDialogOpen(true);
            }}
            className="sm:ml-auto"
          >
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
            <div
              className="text-center py-12 text-muted-foreground"
              aria-live="polite"
            >
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
