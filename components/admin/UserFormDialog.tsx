'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Role, ROLES, ROLE_LABELS, GRADES, Grade } from "@/lib/constants";
import { ClassSummary, UserSummary } from "@/lib/schemas";
import { User, GraduationCap, Mail, Phone, Calendar, Building2, Search } from "lucide-react";

export interface UserFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  grade?: Grade;
  classId?: string;
  childIds?: string[];
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => void;
  initialData?: UserFormData;
  allowedRoles?: Role[];
  classes?: ClassSummary[];
  students?: UserSummary[];
  title?: string;
  description?: string;
}

const defaultFormData: UserFormData = {
  name: "",
  email: "",
  phone: "",
  role: "STUDENT",
  childIds: [],
};

export function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  allowedRoles = [ROLES.STUDENT, ROLES.TEACHER, ROLES.PARENT],
  classes = [],
  students = [],
  title = "Tambah Pengguna",
  description = "Isi data pengguna baru di bawah ini.",
}: UserFormDialogProps) {
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (initialData) {
        setFormData({
          ...defaultFormData,
          ...initialData,
          childIds: initialData.childIds ?? [],
        });
      } else {
        setFormData({ ...defaultFormData, role: allowedRoles[0] });
      }
      setStudentSearch("");
    }, 0);
    return () => clearTimeout(timer);
  }, [initialData, open, allowedRoles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData(defaultFormData);
    onOpenChange(false);
  };

  const filteredClasses = formData.grade
    ? classes.filter((c) => c.grade === formData.grade)
    : classes;
  const filteredStudents = students.filter((student) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      student.name.toLowerCase().includes(q) ||
      (student.email ?? "").toLowerCase().includes(q)
    );
  });
  const selectedChildIds = formData.childIds ?? [];

  const toggleChild = (studentId: string) => {
    setFormData((prev) => {
      const current = prev.childIds ?? [];
      const next = current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId];
      return { ...prev, childIds: next };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selection */}
          {allowedRoles.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="role">Peran</Label>
              <Select
                value={formData.role}
                onValueChange={(value: Role) =>
                  setFormData({
                    ...formData,
                    role: value,
                    grade: undefined,
                    classId: undefined,
                    childIds: value === ROLES.PARENT ? formData.childIds ?? [] : [],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  {allowedRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Masukkan nama lengkap"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">No. Telepon</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                placeholder="08xxxxxxxxxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          {/* Student-specific: Grade & Class */}
          {formData.role === "STUDENT" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Tingkat</Label>
                <Select
                  value={formData.grade?.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, grade: parseInt(value) as Grade, classId: undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((grade) => (
                      <SelectItem key={grade} value={grade.toString()}>
                        Kelas {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Kelas</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  disabled={!formData.grade || filteredClasses.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                    {filteredClasses.length === 0 && (
                      <SelectItem value="none" disabled>
                        Belum ada kelas untuk tingkat ini
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Parent-specific: Link Children */}
          {formData.role === "PARENT" && (
            <div className="space-y-2">
              <Label>Hubungkan ke Anak (Opsional)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari siswa..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <ScrollArea className="h-[200px] rounded-md border p-2">
                {filteredStudents.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Tidak ada siswa ditemukan
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleChild(student.id)}
                      >
                        <Checkbox
                          checked={selectedChildIds.includes(student.id)}
                          onCheckedChange={() => toggleChild(student.id)}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{student.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {student.email ?? "-"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {selectedChildIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedChildIds.length} siswa dipilih
                </p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground">
              {initialData?.id ? "Simpan Perubahan" : "Tambah Pengguna"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
