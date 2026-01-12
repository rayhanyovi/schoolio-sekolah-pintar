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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role, ROLES, ROLE_LABELS, GRADES, Grade } from "@/lib/constants";
import { User, GraduationCap, Mail, Phone, Calendar, Building2 } from "lucide-react";

interface UserFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  grade?: Grade;
  classId?: string;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => void;
  initialData?: UserFormData;
  allowedRoles?: Role[];
  title?: string;
  description?: string;
}

const defaultFormData: UserFormData = {
  name: "",
  email: "",
  phone: "",
  role: "STUDENT",
};

// Mock classes data
const mockClasses = [
  { id: "1", name: "X IPA 1", grade: 10 },
  { id: "2", name: "X IPA 2", grade: 10 },
  { id: "3", name: "XI IPA 1", grade: 11 },
  { id: "4", name: "XI IPA 2", grade: 11 },
  { id: "5", name: "XII IPA 1", grade: 12 },
  { id: "6", name: "XII IPA 2", grade: 12 },
];

export function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  allowedRoles = [ROLES.STUDENT, ROLES.TEACHER, ROLES.PARENT],
  title = "Tambah Pengguna",
  description = "Isi data pengguna baru di bawah ini.",
}: UserFormDialogProps) {
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ ...defaultFormData, role: allowedRoles[0] });
    }
  }, [initialData, open, allowedRoles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData(defaultFormData);
    onOpenChange(false);
  };

  const filteredClasses = formData.grade
    ? mockClasses.filter((c) => c.grade === formData.grade)
    : mockClasses;

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
                  setFormData({ ...formData, role: value, grade: undefined, classId: undefined })
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
                  disabled={!formData.grade}
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
                  </SelectContent>
                </Select>
              </div>
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
