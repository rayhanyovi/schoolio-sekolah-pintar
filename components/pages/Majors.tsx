'use client';

import { useEffect, useMemo, useState } from "react";
import { useRoleContext } from "@/hooks/useRoleContext";
import { ROLES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { listClasses } from "@/lib/handlers/classes";
import { listStudents, listTeachers } from "@/lib/handlers/users";
import {
  createMajor,
  listMajorTeachers,
  listMajors,
  setMajorTeachers,
} from "@/lib/handlers/majors";
import { listSchedules } from "@/lib/handlers/schedules";
import {
  ClassSummary,
  MajorSummary,
  ScheduleSummary,
  UserSummary,
} from "@/lib/schemas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserCard } from "@/components/admin/UserCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserCircle,
  Layers,
  Plus,
  GraduationCap,
  BookOpen,
} from "lucide-react";

const normalizeMajor = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toUpperCase() : "UMUM";
};

const getMajorLabel = (major: string, labelMap: Map<string, string>) => {
  if (major === "UMUM") return "Tanpa Jurusan";
  const label = labelMap.get(major);
  if (label && label !== major) {
    return `${major} - ${label}`;
  }
  return major;
};

export default function Majors() {
  const { role } = useRoleContext();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [majors, setMajors] = useState<MajorSummary[]>([]);
  const [students, setStudents] = useState<UserSummary[]>([]);
  const [teachers, setTeachers] = useState<UserSummary[]>([]);
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
  const [selectedMajor, setSelectedMajor] = useState("all");
  const [activeTab, setActiveTab] = useState<
    "classes" | "students" | "teachers"
  >("classes");
  const [isLoading, setIsLoading] = useState(true);
  const [majorDialogOpen, setMajorDialogOpen] = useState(false);
  const [isSavingMajor, setIsSavingMajor] = useState(false);
  const [isSavingTeachers, setIsSavingTeachers] = useState(false);
  const [majorTeachersMap, setMajorTeachersMap] = useState<
    Record<string, UserSummary[]>
  >({});
  const [assignTeachersOpen, setAssignTeachersOpen] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [majorForm, setMajorForm] = useState({
    code: "",
    name: "",
    description: "",
  });

  useEffect(() => {
    let isActive = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [
          classData,
          studentData,
          teacherData,
          scheduleData,
          majorData,
        ] = await Promise.all([
          listClasses(),
          listStudents(),
          listTeachers(),
          listSchedules(),
          listMajors(),
        ]);
        if (!isActive) return;
        setClasses(classData);
        setStudents(studentData);
        setTeachers(teacherData);
        setSchedules(scheduleData);
        setMajors(majorData);
      } catch (error) {
        if (!isActive) return;
        toast({
          title: "Gagal memuat jurusan",
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

  useEffect(() => {
    if (!majors.length) {
      setMajorTeachersMap({});
      return;
    }
    let isActive = true;
    const loadMajorTeachers = async () => {
      const entries = await Promise.all(
        majors.map(async (major) => {
          try {
            const data = await listMajorTeachers(major.id);
            return [major.id, data] as const;
          } catch {
            return [major.id, []] as const;
          }
        })
      );
      if (!isActive) return;
      const next: Record<string, UserSummary[]> = {};
      entries.forEach(([id, data]) => {
        next[id] = data;
      });
      setMajorTeachersMap(next);
    };
    loadMajorTeachers();
    return () => {
      isActive = false;
    };
  }, [majors]);

  const majorLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    majors.forEach((major) => {
      const code = normalizeMajor(major.code);
      const label = major.name?.trim() ? major.name.trim() : code;
      map.set(code, label);
    });
    return map;
  }, [majors]);

  const majorOptions = useMemo(() => {
    const majorSet = new Set<string>();
    classes.forEach((item) => majorSet.add(normalizeMajor(item.major)));
    majors.forEach((major) => majorSet.add(normalizeMajor(major.code)));
    majorSet.add("UMUM");
    return Array.from(majorSet).sort((a, b) => {
      if (a === "UMUM") return -1;
      if (b === "UMUM") return 1;
      return a.localeCompare(b);
    });
  }, [classes, majors]);

  const selectedMajorRecord = useMemo(() => {
    if (selectedMajor === "all" || selectedMajor === "UMUM") return null;
    return majors.find(
      (major) => normalizeMajor(major.code) === selectedMajor
    );
  }, [majors, selectedMajor]);

  useEffect(() => {
    if (!assignTeachersOpen || !selectedMajorRecord) return;
    const current = majorTeachersMap[selectedMajorRecord.id] ?? [];
    setSelectedTeacherIds(current.map((teacher) => teacher.id));
  }, [assignTeachersOpen, selectedMajorRecord, majorTeachersMap]);

  const filteredClasses = useMemo(() => {
    if (selectedMajor === "all") return classes;
    return classes.filter(
      (item) => normalizeMajor(item.major) === selectedMajor
    );
  }, [classes, selectedMajor]);

  const classMap = useMemo(
    () => new Map(classes.map((item) => [item.id, item])),
    [classes]
  );

  const getClassName = (classId: string | null | undefined) => {
    if (!classId) return null;
    return classMap.get(classId)?.name ?? null;
  };

  const classIds = useMemo(
    () => new Set(filteredClasses.map((item) => item.id)),
    [filteredClasses]
  );

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const classId = student.studentProfile?.classId ?? "";
      return classId && classIds.has(classId);
    });
  }, [students, classIds]);

  const teacherIds = useMemo(() => {
    if (selectedMajorRecord) {
      const assigned = majorTeachersMap[selectedMajorRecord.id] ?? [];
      return new Set(assigned.map((teacher) => teacher.id));
    }
    if (selectedMajor === "UMUM") return new Set<string>();
    const ids = new Set<string>();
    filteredClasses.forEach((item) => {
      if (item.homeroomTeacherId) ids.add(item.homeroomTeacherId);
    });
    schedules.forEach((schedule) => {
      if (classIds.has(schedule.classId) && schedule.teacherId) {
        ids.add(schedule.teacherId);
      }
    });
    return ids;
  }, [
    filteredClasses,
    schedules,
    classIds,
    selectedMajorRecord,
    majorTeachersMap,
    selectedMajor,
  ]);

  const filteredTeachers = useMemo(() => {
    if (selectedMajorRecord) {
      return majorTeachersMap[selectedMajorRecord.id] ?? [];
    }
    if (selectedMajor === "UMUM") return [];
    return teachers.filter((teacher) => teacherIds.has(teacher.id));
  }, [teachers, teacherIds, selectedMajorRecord, majorTeachersMap, selectedMajor]);

  const handleCreateMajor = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = majorForm.code.trim().toUpperCase();
    if (!code) {
      toast({
        title: "Kode jurusan wajib diisi",
        description: "Isi kode jurusan terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }
    const name = majorForm.name.trim();
    const description = majorForm.description.trim();

    try {
      setIsSavingMajor(true);
      const created = await createMajor({
        code,
        name: name || code,
        description: description || null,
      });
      setMajors((prev) => {
        const exists = prev.some((item) => item.id === created.id);
        return exists ? prev : [...prev, created];
      });
      setMajorForm({ code: "", name: "", description: "" });
      setMajorDialogOpen(false);
      toast({ title: "Berhasil", description: "Jurusan baru ditambahkan" });
    } catch (error) {
      toast({
        title: "Gagal menambahkan jurusan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setIsSavingMajor(false);
    }
  };

  const handleToggleTeacher = (teacherId: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const handleSaveMajorTeachers = async () => {
    if (!selectedMajorRecord) return;
    try {
      setIsSavingTeachers(true);
      await setMajorTeachers(selectedMajorRecord.id, selectedTeacherIds);
      const assignedTeachers = teachers.filter((teacher) =>
        selectedTeacherIds.includes(teacher.id)
      );
      setMajorTeachersMap((prev) => ({
        ...prev,
        [selectedMajorRecord.id]: assignedTeachers,
      }));
      toast({ title: "Berhasil", description: "Guru jurusan diperbarui" });
      setAssignTeachersOpen(false);
    } catch (error) {
      toast({
        title: "Gagal menyimpan guru jurusan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setIsSavingTeachers(false);
    }
  };

  if (role !== ROLES.ADMIN) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Akses Terbatas
          </h2>
          <p className="text-sm text-muted-foreground">
            Hanya Administrator yang dapat mengakses halaman ini
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jurusan</h1>
          <p className="text-muted-foreground">
            Pantau kelas, siswa, guru, dan forum berdasarkan jurusan
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Button onClick={() => setMajorDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Jurusan
          </Button>
          {selectedMajorRecord && activeTab === "teachers" && (
            <Button variant="outline" onClick={() => setAssignTeachersOpen(true)}>
              <UserCircle className="h-4 w-4 mr-2" />
              Atur Guru Jurusan
            </Button>
          )}
          <Select value={selectedMajor} onValueChange={setSelectedMajor}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Pilih jurusan..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jurusan</SelectItem>
              {majorOptions.map((major) => (
                <SelectItem key={major} value={major}>
                  {getMajorLabel(major, majorLabelMap)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kelas</p>
              <p className="text-2xl font-bold">{filteredClasses.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Siswa</p>
              <p className="text-2xl font-bold">{filteredStudents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
              <UserCircle className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Guru</p>
              <p className="text-2xl font-bold">{filteredTeachers.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        defaultValue="classes"
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as typeof activeTab)
        }
      >
        <TabsList className="flex-wrap">
          <TabsTrigger value="classes">Kelas</TabsTrigger>
          <TabsTrigger value="students">Siswa</TabsTrigger>
          <TabsTrigger value="teachers">Guru</TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="mt-6">
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">
              Memuat data kelas...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClasses.map((item) => {
                const majorCode = normalizeMajor(item.major);
                const majorLabel =
                  majorCode && majorCode !== "UMUM"
                    ? majorLabelMap.get(majorCode) ?? majorCode
                    : "";
                return (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription>
                      Kelas {item.grade}
                      {majorLabel ? ` • ${majorLabel}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Wali kelas: {item.homeroomTeacher || "-"}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Siswa {item.studentCount}</Badge>
                      <Badge variant="outline">
                        L/P {item.maleCount}/{item.femaleCount}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );})}
              {filteredClasses.length === 0 && (
                <div className="text-center py-10 text-muted-foreground col-span-full">
                  Tidak ada kelas untuk jurusan ini
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              Memuat data siswa...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Tidak ada siswa ditemukan</p>
              <p className="text-sm">Belum ada siswa untuk jurusan ini</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredStudents.map((student) => {
                const className = getClassName(student.studentProfile?.classId);
                return (
                  <UserCard
                    key={student.id}
                    id={student.id}
                    name={student.name}
                    email={student.email ?? ""}
                    role={ROLES.STUDENT}
                    linkedTo={className ? `Kelas: ${className}` : undefined}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="teachers" className="mt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              Memuat data guru...
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Tidak ada guru ditemukan</p>
              <p className="text-sm">
                Belum ada guru untuk jurusan ini
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTeachers.map((teacher) => (
                <UserCard
                  key={teacher.id}
                  id={teacher.id}
                  name={teacher.name}
                  email={teacher.email ?? ""}
                  role={ROLES.TEACHER}
                />
              ))}
            </div>
          )}
        </TabsContent>

      </Tabs>

      <Dialog open={majorDialogOpen} onOpenChange={setMajorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Jurusan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateMajor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="major-code">Kode Jurusan</Label>
              <Input
                id="major-code"
                value={majorForm.code}
                onChange={(event) =>
                  setMajorForm((prev) => ({
                    ...prev,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="RPL"
                maxLength={10}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="major-name">Nama Jurusan</Label>
              <Input
                id="major-name"
                value={majorForm.name}
                onChange={(event) =>
                  setMajorForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Rekayasa Perangkat Lunak"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="major-description">Deskripsi (Opsional)</Label>
              <Input
                id="major-description"
                value={majorForm.description}
                onChange={(event) =>
                  setMajorForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Deskripsi singkat jurusan"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMajorDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSavingMajor}>
                {isSavingMajor ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={assignTeachersOpen} onOpenChange={setAssignTeachersOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atur Guru Jurusan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pilih guru yang termasuk dalam jurusan ini. Satu guru bisa masuk ke
              banyak jurusan.
            </p>
            <ScrollArea className="h-[300px] rounded-md border p-4">
              {teachers.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Belum ada guru tersedia
                </div>
              ) : (
                <div className="space-y-3">
                  {teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleToggleTeacher(teacher.id)}
                    >
                      <Checkbox
                        checked={selectedTeacherIds.includes(teacher.id)}
                        onCheckedChange={() => handleToggleTeacher(teacher.id)}
                      />
                      <span className="text-sm">{teacher.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignTeachersOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveMajorTeachers} disabled={isSavingTeachers}>
                {isSavingTeachers
                  ? "Menyimpan..."
                  : `Simpan (${selectedTeacherIds.length} guru)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
