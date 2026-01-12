"use client";

import { useState } from "react";
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

// Mock data
const mockStudents = [
  {
    id: "s1",
    name: "Ahmad Rizki",
    email: "ahmad.rizki@student.sch.id",
    role: ROLES.STUDENT as Role,
    grade: 10,
    classId: "1",
    parentId: "p1",
  },
  {
    id: "s2",
    name: "Siti Nurhaliza",
    email: "siti.nurhaliza@student.sch.id",
    role: ROLES.STUDENT as Role,
    grade: 10,
    classId: "1",
    parentId: "p2",
  },
  {
    id: "s3",
    name: "Budi Santoso",
    email: "budi.santoso@student.sch.id",
    role: ROLES.STUDENT as Role,
    grade: 11,
    classId: "3",
    parentId: null,
  },
  {
    id: "s4",
    name: "Dewi Lestari",
    email: "dewi.lestari@student.sch.id",
    role: ROLES.STUDENT as Role,
    grade: 11,
    classId: "3",
    parentId: "p3",
  },
  {
    id: "s5",
    name: "Eko Prasetyo",
    email: "eko.prasetyo@student.sch.id",
    role: ROLES.STUDENT as Role,
    grade: 12,
    classId: "5",
    parentId: null,
  },
  {
    id: "s6",
    name: "Fitri Handayaxxni",
    email: "fitri.handayani@student.sch.id",
    role: ROLES.STUDENT as Role,
    grade: 12,
    classId: "5",
    parentId: "p1",
  },
];

const mockTeachers = [
  {
    id: "t1",
    name: "Dr. Susilo Bambang",
    email: "susilo.bambang@teacher.sch.id",
    role: ROLES.TEACHER as Role,
    subject: "Matematika",
  },
  {
    id: "t2",
    name: "Ir. Maya Sari",
    email: "maya.sari@teacher.sch.id",
    role: ROLES.TEACHER as Role,
    subject: "Fisika",
  },
  {
    id: "t3",
    name: "Dra. Ani Wijaya",
    email: "ani.wijaya@teacher.sch.id",
    role: ROLES.TEACHER as Role,
    subject: "Bahasa Indonesia",
  },
  {
    id: "t4",
    name: "M.Pd. Rudi Hartono",
    email: "rudi.hartono@teacher.sch.id",
    role: ROLES.TEACHER as Role,
    subject: "Bahasa Inggris",
  },
];

const mockParents = [
  {
    id: "p1",
    name: "Hj. Kartini",
    email: "kartini@parent.sch.id",
    role: ROLES.PARENT as Role,
    childrenIds: ["s1", "s6"],
  },
  {
    id: "p2",
    name: "Bp. Supriyadi",
    email: "supriyadi@parent.sch.id",
    role: ROLES.PARENT as Role,
    childrenIds: ["s2"],
  },
  {
    id: "p3",
    name: "Ibu Ratna",
    email: "ratna@parent.sch.id",
    role: ROLES.PARENT as Role,
    childrenIds: ["s4"],
  },
];

const mockClasses = [
  { id: "1", name: "X IPA 1", grade: 10 },
  { id: "2", name: "X IPA 2", grade: 10 },
  { id: "3", name: "XI IPA 1", grade: 11 },
  { id: "4", name: "XI IPA 2", grade: 11 },
  { id: "5", name: "XII IPA 1", grade: 12 },
  { id: "6", name: "XII IPA 2", grade: 12 },
];

export default function Users() {
  const [activeTab, setActiveTab] = useState<
    "students" | "teachers" | "parents"
  >("students");
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

  // Get stats
  const stats = {
    totalStudents: mockStudents.length,
    totalTeachers: mockTeachers.length,
    totalParents: mockParents.length,
    linkedStudents: mockStudents.filter((s) => s.parentId).length,
  };

  // Filter logic
  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade =
      gradeFilter === "all" || student.grade.toString() === gradeFilter;
    const matchesClass =
      classFilter === "all" || student.classId === classFilter;
    return matchesSearch && matchesGrade && matchesClass;
  });

  const filteredTeachers = mockTeachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredParents = mockParents.filter(
    (parent) =>
      parent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parent.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getClassName = (classId: string | null) => {
    if (!classId) return null;
    const cls = mockClasses.find((c) => c.id === classId);
    return cls?.name || null;
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return undefined;
    const parent = mockParents.find((p) => p.id === parentId);
    return parent?.name;
  };

  const getChildrenNames = (childrenIds: string[]) => {
    const names = childrenIds
      .map((id) => mockStudents.find((s) => s.id === id)?.name)
      .filter(Boolean);
    return names.join(", ");
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormDialogOpen(true);
  };

  const handleEditUser = (id: string) => {
    const user = [...mockStudents, ...mockTeachers, ...mockParents].find(
      (u) => u.id === id
    );
    if (user) {
      setEditingUser(user);
      setFormDialogOpen(true);
    }
  };

  const handleDeleteUser = (id: string) => {
    setDeletingUserId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    toast.success("Pengguna berhasil dihapus");
    setDeleteDialogOpen(false);
    setDeletingUserId(null);
  };

  const handleLinkUser = (id: string) => {
    const user = [...mockStudents, ...mockParents].find((u) => u.id === id);
    if (user) {
      setLinkingUser(user);
      setLinkDialogOpen(true);
    }
  };

  const handleFormSubmit = (data: any) => {
    if (editingUser) {
      toast.success("Data pengguna berhasil diperbarui");
    } else {
      toast.success("Pengguna baru berhasil ditambahkan");
    }
  };

  const handleLinkSubmit = (sourceUserId: string, targetUserIds: string[]) => {
    toast.success("Hubungan berhasil disimpan");
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
                {mockStudents.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="teachers" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Guru</span>
              <Badge variant="secondary" className="ml-1">
                {mockTeachers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="parents" className="gap-2">
              <UsersIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Orang Tua</span>
              <Badge variant="secondary" className="ml-1">
                {mockParents.length}
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
                    {mockClasses
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
          {filteredStudents.length === 0 ? (
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
                  email={student.email}
                  role={student.role}
                  linkedTo={
                    getParentName(student.parentId)
                      ? `Ortu: ${getParentName(student.parentId)}`
                      : getClassName(student.classId)
                      ? `Kelas: ${getClassName(student.classId)}`
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
          {filteredTeachers.length === 0 ? (
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
                  email={teacher.email}
                  role={teacher.role}
                  linkedTo={`Mapel: ${teacher.subject}`}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Parents Tab */}
        <TabsContent value="parents" className="mt-6">
          {filteredParents.length === 0 ? (
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
                  email={parent.email}
                  role={parent.role}
                  linkedTo={
                    parent.childrenIds.length > 0
                      ? `Anak: ${getChildrenNames(parent.childrenIds)}`
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
      />

      <LinkUserDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        sourceUser={linkingUser}
        availableUsers={
          linkingUser?.role === ROLES.PARENT
            ? mockStudents.map((s) => ({
                id: s.id,
                name: s.name,
                email: s.email,
              }))
            : mockParents.map((p) => ({
                id: p.id,
                name: p.name,
                email: p.email,
              }))
        }
        linkedUserIds={
          linkingUser?.role === ROLES.PARENT
            ? linkingUser?.childrenIds || []
            : linkingUser?.parentId
            ? [linkingUser.parentId]
            : []
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
