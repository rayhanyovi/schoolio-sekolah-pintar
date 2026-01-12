'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClassFormValues, ClassSummary, TeacherOption } from "@/lib/schemas";
import { GRADES } from "@/lib/constants";

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData?: ClassSummary | null;
  teachers: TeacherOption[];
  onSubmit: (data: ClassFormValues) => void;
}

export function ClassFormDialog({
  open,
  onOpenChange,
  classData,
  teachers,
  onSubmit,
}: ClassFormDialogProps) {
  const [formData, setFormData] = useState<ClassFormValues>({
    name: "",
    grade: 10,
    section: "",
    homeroomTeacherId: "",
    academicYear: "2024/2025",
  });

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name,
        grade: classData.grade,
        section: classData.section,
        homeroomTeacherId: classData.homeroomTeacherId,
        academicYear: classData.academicYear,
      });
    } else {
      setFormData({
        name: "",
        grade: 10,
        section: "",
        homeroomTeacherId: "",
        academicYear: "2024/2025",
      });
    }
  }, [classData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{classData ? "Edit Kelas" : "Tambah Kelas Baru"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Tingkat</Label>
              <Select
                value={formData.grade.toString()}
                onValueChange={(value) => {
                  const grade = parseInt(value) as 10 | 11 | 12;
                  setFormData({ ...formData, grade, name: `${grade === 10 ? "X" : grade === 11 ? "XI" : "XII"}-${formData.section}` });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g.toString()}>
                      Kelas {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Bagian</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={(e) => {
                  const section = e.target.value.toUpperCase();
                  const gradeLabel = formData.grade === 10 ? "X" : formData.grade === 11 ? "XI" : "XII";
                  setFormData({ ...formData, section, name: `${gradeLabel}-${section}` });
                }}
                placeholder="A, B, C..."
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama Kelas</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="X-A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">Wali Kelas</Label>
            <Select
              value={formData.homeroomTeacherId}
              onValueChange={(value) => setFormData({ ...formData, homeroomTeacherId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih wali kelas" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="academicYear">Tahun Ajaran</Label>
            <Select
              value={formData.academicYear}
              onValueChange={(value) => setFormData({ ...formData, academicYear: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024/2025">2024/2025</SelectItem>
                <SelectItem value="2023/2024">2023/2024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit">
              {classData ? "Simpan Perubahan" : "Tambah Kelas"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
