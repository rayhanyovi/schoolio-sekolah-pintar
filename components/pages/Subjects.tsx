'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, BookOpen, Users } from "lucide-react";
import { SubjectCard } from "@/components/subjects/SubjectCard";
import { SubjectFormDialog } from "@/components/subjects/SubjectFormDialog";
import { AssignTeacherDialog } from "@/components/subjects/AssignTeacherDialog";
import {
  createSubject,
  deleteSubject,
  listSubjects,
  setSubjectTeachers,
  updateSubject,
} from "@/lib/handlers/subjects";
import { listMajors } from "@/lib/handlers/majors";
import { listTeachers } from "@/lib/handlers/users";
import {
  MajorSummary,
  SubjectFormValues,
  SubjectSummary,
  TeacherOption,
} from "@/lib/schemas";
import { ROLES, SUBJECT_CATEGORIES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useRoleContext } from "@/hooks/useRoleContext";

export default function Subjects() {
  const { role } = useRoleContext();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [majors, setMajors] = useState<MajorSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectSummary | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const majorPromise =
          role === ROLES.ADMIN || role === ROLES.TEACHER
            ? listMajors()
            : Promise.resolve([]);
        const [subjectData, teacherData, majorData] = await Promise.all([
          listSubjects(),
          listTeachers(),
          majorPromise,
        ]);
        if (!isActive) return;
        setSubjects(subjectData);
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
  }, [role, toast]);

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalTeachers = new Set(subjects.flatMap(s => s.teachers.map(t => t.id))).size;

  const handleSubmit = async (data: SubjectFormValues) => {
    const payload = {
      name: data.name,
      code: data.code,
      category: data.category,
      description: data.description,
      color: data.color,
      hoursPerWeek: data.hoursPerWeek,
      appliesToAllMajors: data.appliesToAllMajors,
      majorIds: data.appliesToAllMajors ? [] : data.majorIds,
    };

    try {
      if (selectedSubject) {
        const updated = await updateSubject(selectedSubject.id, payload);
        setSubjects((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
        toast({ title: "Berhasil", description: "Mata pelajaran berhasil diperbarui" });
      } else {
        const created = await createSubject(payload);
        setSubjects((prev) => [...prev, created]);
        toast({ title: "Berhasil", description: "Mata pelajaran baru berhasil ditambahkan" });
      }
      setSelectedSubject(null);
    } catch (error) {
      toast({
        title: "Gagal menyimpan mata pelajaran",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSubject(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Berhasil", description: "Mata pelajaran berhasil dihapus" });
    } catch (error) {
      toast({
        title: "Gagal menghapus mata pelajaran",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    }
  };

  const handleEdit = (subject: SubjectSummary) => {
    setSelectedSubject(subject);
    setFormDialogOpen(true);
  };

  const handleAssignTeachers = async (teacherIds: string[]) => {
    if (selectedSubject) {
      try {
        await setSubjectTeachers(selectedSubject.id, teacherIds);
        const assignedTeachers = teachers.filter((teacher) =>
          teacherIds.includes(teacher.id)
        );
        setSubjects((prev) =>
          prev.map((s) =>
            s.id === selectedSubject.id ? { ...s, teachers: assignedTeachers } : s
          )
        );
        toast({ title: "Berhasil", description: "Guru berhasil di-assign" });
      } catch (error) {
        toast({
          title: "Gagal assign guru",
          description: error instanceof Error ? error.message : "Terjadi kesalahan",
        });
      }
    }
    setSelectedSubject(null);
  };

  const isAdmin = role === "ADMIN";

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="dashboard-panel overflow-hidden rounded-[1.75rem] border border-border/80">
        <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge
              variant="outline"
              className="rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-primary"
            >
              Subject Library
            </Badge>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Manajemen Mata Pelajaran</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Kelola katalog mata pelajaran, kategori, dan guru pengampu dengan struktur yang lebih rapi.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              {subjects.length} mata pelajaran
            </div>
            <div className="rounded-full border border-accent/35 bg-accent/15 px-4 py-2 text-sm font-medium text-foreground">
              {totalTeachers} guru terhubung
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Gunakan pencarian dan kategori untuk mempersempit daftar mata pelajaran.
        </div>
        {isAdmin && (
          <Button onClick={() => { setSelectedSubject(null); setFormDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Mata Pelajaran
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Mata Pelajaran</p>
              <p className="text-2xl font-bold">{subjects.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Guru Pengampu</p>
              <p className="text-2xl font-bold">{totalTeachers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          aria-label="Cari mata pelajaran"
          autoComplete="off"
          name="subjects-search"
          placeholder="Cari mata pelajaran…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs by Category */}
      <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap rounded-2xl border border-border/80 bg-card/70 p-1">
          <TabsTrigger value="all">Semua</TabsTrigger>
          {Object.entries(SUBJECT_CATEGORIES).map(([key, label]) => (
            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {isLoading ? (
            <div aria-live="polite" className="text-center py-12 text-muted-foreground">
              Memuat data mata pelajaran…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects.map((subject) => (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
              {filteredSubjects.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Tidak ada mata pelajaran ditemukan
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SubjectFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        subject={selectedSubject}
        majors={majors}
        onSubmit={handleSubmit}
      />
      <AssignTeacherDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        currentTeacherIds={selectedSubject?.teachers.map(t => t.id) || []}
        teachers={teachers}
        onSubmit={handleAssignTeachers}
      />
    </div>
  );
}
