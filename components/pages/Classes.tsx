'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Users, GraduationCap, TrendingUp } from "lucide-react";
import { ClassCard } from "@/components/classes/ClassCard";
import { ClassFormDialog } from "@/components/classes/ClassFormDialog";
import { ClassDetailSheet } from "@/components/classes/ClassDetailSheet";
import {
  createClass,
  deleteClass,
  listClasses,
  updateClass,
} from "@/lib/handlers/classes";
import { listTeachers } from "@/lib/handlers/users";
import { ClassFormValues, ClassSummary, TeacherOption } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { useRoleContext } from "@/hooks/useRoleContext";

export default function Classes() {
  const { role } = useRoleContext();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
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
        const [classData, teacherData] = await Promise.all([
          listClasses(),
          listTeachers(),
        ]);
        if (!isActive) return;
        setClasses(classData);
        setTeachers(
          teacherData.map((teacher) => ({ id: teacher.id, name: teacher.name }))
        );
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

  const totalStudents = classes.reduce((acc, c) => acc + c.studentCount, 0);
  const avgStudentsPerClass = classes.length
    ? Math.round(totalStudents / classes.length)
    : 0;

  const handleSubmit = async (data: ClassFormValues) => {
    const payload = {
      name: data.name,
      grade: data.grade,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Kelas</h1>
          <p className="text-muted-foreground">Kelola kelas dan pengelompokan siswa</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setSelectedClass(null); setFormDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kelas
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Kelas</p>
              <p className="text-2xl font-bold">{classes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Siswa</p>
              <p className="text-2xl font-bold">{totalStudents}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rata-rata Siswa/Kelas</p>
              <p className="text-2xl font-bold">{avgStudentsPerClass}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kelas atau wali kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs by Grade */}
      <Tabs defaultValue="all" onValueChange={setSelectedGrade}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="10">Kelas 10</TabsTrigger>
          <TabsTrigger value="11">Kelas 11</TabsTrigger>
          <TabsTrigger value="12">Kelas 12</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedGrade} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Memuat data kelas...
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
