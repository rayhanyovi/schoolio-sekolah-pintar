"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { UserCard } from "@/components/admin/UserCard";
import { UserFormDialog } from "@/components/admin/UserFormDialog";
import { LinkUserDialog } from "@/components/admin/LinkUserDialog";
import { UserStatsCard } from "@/components/admin/UserStatsCard";
import { Role, ROLES, GRADES } from "@/lib/constants";
import {
  createUser,
  deleteUser,
  linkParentStudent,
  listParents,
  listStudents,
  listTeachers,
  unlinkParentStudent,
  updateUser,
  updateUserProfile,
} from "@/lib/handlers/users";
import { listClasses } from "@/lib/handlers/classes";
import { ClassSummary, UserSummary } from "@/lib/schemas";
import {
  Search,
  Plus,
  Users as UsersIcon,
  GraduationCap,
  BookOpen,
  UserCheck,
  Download,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

type UserRow = UserSummary & {
  studentProfile?: { classId?: string | null };
  parentLinks?: { studentId: string }[];
};

export default function Users() {
  const [activeTab, setActiveTab] = useState<
    "students" | "teachers" | "parents"
  >("students");
  const [students, setStudents] = useState<UserRow[]>([]);
  const [teachers, setTeachers] = useState<UserSummary[]>([]);
  const [parents, setParents] = useState<UserRow[]>([]);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [linkingUser, setLinkingUser] = useState<any>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const classById = useMemo(
    () => new Map(classes.map((cls) => [cls.id, cls])),
    [classes]
  );

  const studentById = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students]
  );

  const parentByStudentId = useMemo(() => {
    const map = new Map<string, UserSummary>();
    parents.forEach((parent) => {
      parent.parentLinks?.forEach((link) => {
        if (!map.has(link.studentId)) {
          map.set(link.studentId, parent);
        }
      });
    });
    return map;
  }, [parents]);

  const reloadData = async () => {
    try {
      setIsLoading(true);
      const [studentsData, teachersData, parentsData, classData] =
        await Promise.all([
          listStudents(),
          listTeachers(),
          listParents(),
          listClasses(),
        ]);
      setStudents(studentsData as UserRow[]);
      setTeachers(teachersData);
      setParents(parentsData as UserRow[]);
      setClasses(classData);
    } catch (error) {
      toast.error("Gagal memuat data pengguna");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Get stats
  const stats = {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalParents: parents.length,
    linkedStudents: students.filter((s) => parentByStudentId.has(s.id)).length,
  };

  // Filter logic
  const filteredStudents = students.filter((student) => {
    const email = student.email ?? "";
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());
    const classId = student.studentProfile?.classId ?? "";
    const grade = classById.get(classId)?.grade;
    const matchesGrade =
      gradeFilter === "all" || (grade?.toString() ?? "") === gradeFilter;
    const matchesClass = classFilter === "all" || classId === classFilter;
    return matchesSearch && matchesGrade && matchesClass;
  });

  const filteredTeachers = teachers.filter((teacher) => {
    const email = teacher.email ?? "";
    return (
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredParents = parents.filter((parent) => {
    const email = parent.email ?? "";
    return (
      parent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getClassName = (classId: string | null | undefined) => {
    if (!classId) return null;
    return classById.get(classId)?.name ?? null;
  };

  const getParentName = (studentId: string | null | undefined) => {
    if (!studentId) return undefined;
    return parentByStudentId.get(studentId)?.name;
  };

  const getChildrenNames = (childrenIds: string[]) => {
    const names = childrenIds
      .map((id) => studentById.get(id)?.name)
      .filter(Boolean);
    return names.join(", ");
  };

  const buildFormData = (user: UserRow | UserSummary) => {
    const classId =
      "studentProfile" in user ? user.studentProfile?.classId ?? undefined : undefined;
    const grade = classId ? classById.get(classId)?.grade : undefined;
    return {
      id: user.id,
      name: user.name,
      email: user.email ?? "",
      phone: "",
      role: user.role as Role,
      grade,
      classId,
    };
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormDialogOpen(true);
  };

  const handleEditUser = (id: string) => {
    const user = [...students, ...teachers, ...parents].find((u) => u.id === id);
    if (user) {
      setEditingUser(buildFormData(user as UserRow));
      setFormDialogOpen(true);
    }
  };

  const handleDeleteUser = (id: string) => {
    setDeletingUserId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUserId) return;
    try {
      await deleteUser(deletingUserId);
      toast.success("Pengguna berhasil dihapus");
      await reloadData();
    } catch (error) {
      toast.error("Gagal menghapus pengguna");
    } finally {
      setDeleteDialogOpen(false);
      setDeletingUserId(null);
    }
  };

  const handleLinkUser = (id: string) => {
    const user = [...students, ...parents].find((u) => u.id === id);
    if (user) {
      setLinkingUser(user);
      setLinkDialogOpen(true);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingUser?.id) {
        await updateUser(editingUser.id, {
          name: data.name,
          email: data.email,
          role: data.role,
          phone: data.phone,
        });
        if (data.role === ROLES.STUDENT) {
          await updateUserProfile(editingUser.id, {
            studentProfile: { classId: data.classId ?? null },
          });
        }
        toast.success("Data pengguna berhasil diperbarui");
      } else {
        await createUser({
          name: data.name,
          email: data.email,
          role: data.role,
          phone: data.phone,
          classId: data.classId ?? null,
        });
        toast.success("Pengguna baru berhasil ditambahkan");
      }
      await reloadData();
    } catch (error) {
      toast.error("Gagal menyimpan pengguna");
    }
  };

  const handleLinkSubmit = async (
    sourceUserId: string,
    targetUserIds: string[]
  ) => {
    if (!linkingUser) return;
    try {
      if (linkingUser.role === ROLES.PARENT) {
        const currentIds =
          linkingUser.parentLinks?.map((link: { studentId: string }) => link.studentId) ??
          [];
        const toAdd = targetUserIds.filter((id) => !currentIds.includes(id));
        const toRemove = currentIds.filter((id) => !targetUserIds.includes(id));
        await Promise.all([
          ...toAdd.map((studentId) => linkParentStudent(sourceUserId, studentId)),
          ...toRemove.map((studentId) =>
            unlinkParentStudent(sourceUserId, studentId)
          ),
        ]);
      } else {
        const currentParentIds = parents
          .filter((parent) =>
            parent.parentLinks?.some((link) => link.studentId === sourceUserId)
          )
          .map((parent) => parent.id);
        const toAdd = targetUserIds.filter((id) => !currentParentIds.includes(id));
        const toRemove = currentParentIds.filter(
          (id) => !targetUserIds.includes(id)
        );
        await Promise.all([
          ...toAdd.map((parentId) => linkParentStudent(parentId, sourceUserId)),
          ...toRemove.map((parentId) =>
            unlinkParentStudent(parentId, sourceUserId)
          ),
        ]);
      }
      toast.success("Hubungan berhasil disimpan");
      await reloadData();
    } catch (error) {
      toast.error("Gagal menyimpan hubungan");
    }
  };

  const getAllowedRoles = (): Role[] => {
    switch (activeTab) {
      case "students":
        return [ROLES.STUDENT];
      case "teachers":
        return [ROLES.TEACHER];
      case "parents":
        return [ROLES.PARENT];
      default:
        return [ROLES.STUDENT, ROLES.TEACHER, ROLES.PARENT];
    }
  };

  const getFormTitle = () => {
    if (editingUser) return "Edit Pengguna";
    switch (activeTab) {
      case "students":
        return "Tambah Siswa Baru";
      case "teachers":
        return "Tambah Guru Baru";
      case "parents":
        return "Tambah Orang Tua Baru";
      default:
        return "Tambah Pengguna";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Manajemen Pengguna
          </h1>
          <p className="text-muted-foreground">
            Kelola data siswa, guru, dan orang tua
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={handleAddUser}
            className="gradient-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pengguna
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <UserStatsCard
          title="Total Siswa"
          value={stats.totalStudents}
          icon={GraduationCap}
          iconColor="text-success"
          bgColor="bg-success/10"
        />
        <UserStatsCard
          title="Total Guru"
          value={stats.totalTeachers}
          icon={BookOpen}
          iconColor="text-primary"
          bgColor="bg-primary/10"
        />
        <UserStatsCard
          title="Total Orang Tua"
          value={stats.totalParents}
          icon={UsersIcon}
          iconColor="text-warning"
          bgColor="bg-warning/10"
        />
        <UserStatsCard
          title="Siswa Terhubung"
          value={stats.linkedStudents}
          icon={UserCheck}
          iconColor="text-info"
          bgColor="bg-info/10"
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="students" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Siswa</span>
              <Badge variant="secondary" className="ml-1">
                {students.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="teachers" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Guru</span>
              <Badge variant="secondary" className="ml-1">
                {teachers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="parents" className="gap-2">
              <UsersIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Orang Tua</span>
              <Badge variant="secondary" className="ml-1">
                {parents.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Search & Filters */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari pengguna..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {activeTab === "students" && (
              <>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tingkat</SelectItem>
                    {GRADES.map((grade) => (
                      <SelectItem key={grade} value={grade.toString()}>
                        Kelas {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {classes
                      .filter(
                        (c) =>
                          gradeFilter === "all" ||
                          c.grade.toString() === gradeFilter
                      )
                      .map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* Students Tab */}
        <TabsContent value="students" className="mt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              Memuat data siswa...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Tidak ada siswa ditemukan</p>
              <p className="text-sm">Coba ubah filter atau tambah siswa baru</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <UserCard
                  key={student.id}
                  id={student.id}
                  name={student.name}
                  email={student.email ?? ""}
                  role={student.role as Role}
                  linkedTo={
                    getParentName(student.id)
                      ? `Ortu: ${getParentName(student.id)}`
                      : getClassName(student.studentProfile?.classId)
                      ? `Kelas: ${getClassName(student.studentProfile?.classId)}`
                      : undefined
                  }
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  onLink={handleLinkUser}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Teachers Tab */}
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
                Coba ubah pencarian atau tambah guru baru
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
                  role={teacher.role as Role}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Parents Tab */}
        <TabsContent value="parents" className="mt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              Memuat data orang tua...
            </div>
          ) : filteredParents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <UsersIcon className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">
                Tidak ada orang tua ditemukan
              </p>
              <p className="text-sm">
                Coba ubah pencarian atau tambah orang tua baru
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredParents.map((parent) => (
                <UserCard
                  key={parent.id}
                  id={parent.id}
                  name={parent.name}
                  email={parent.email ?? ""}
                  role={parent.role as Role}
                  linkedTo={
                    parent.parentLinks && parent.parentLinks.length > 0
                      ? `Anak: ${getChildrenNames(
                          parent.parentLinks.map((link) => link.studentId)
                        )}`
                      : undefined
                  }
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  onLink={handleLinkUser}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <UserFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSubmit={handleFormSubmit}
        initialData={editingUser}
        allowedRoles={getAllowedRoles()}
        title={getFormTitle()}
        classes={classes}
      />

      <LinkUserDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        sourceUser={linkingUser}
        availableUsers={
          linkingUser?.role === ROLES.PARENT
            ? students.map((student) => ({
                id: student.id,
                name: student.name,
                email: student.email ?? "",
              }))
            : parents.map((parent) => ({
                id: parent.id,
                name: parent.name,
                email: parent.email ?? "",
              }))
        }
        linkedUserIds={
          linkingUser?.role === ROLES.PARENT
            ? linkingUser?.parentLinks?.map(
                (link: { studentId: string }) => link.studentId
              ) || []
            : parents
                .filter((parent) =>
                  parent.parentLinks?.some(
                    (link) => link.studentId === linkingUser?.id
                  )
                )
                .map((parent) => parent.id)
        }
        onLink={handleLinkSubmit}
        mode={
          linkingUser?.role === ROLES.PARENT
            ? "parent-to-student"
            : "student-to-parent"
        }
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengguna?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data pengguna akan dihapus
              secara permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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
