'use client';

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClassFormValues, ClassSummary, MajorSummary, TeacherOption } from "@/lib/schemas";
import { GRADES } from "@/lib/constants";

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData?: ClassSummary | null;
  teachers: TeacherOption[];
  majors: MajorSummary[];
  onSubmit: (data: ClassFormValues) => void;
}

export function ClassFormDialog({
  open,
  onOpenChange,
  classData,
  teachers,
  majors,
  onSubmit,
}: ClassFormDialogProps) {
  const formatClassName = (grade: number, major: string, section: string) => {
    const romanMap: Record<number, string> = {
      1: "I",
      2: "II",
      3: "III",
      4: "IV",
      5: "V",
      6: "VI",
      7: "VII",
      8: "VIII",
      9: "IX",
      10: "X",
      11: "XI",
      12: "XII",
    };
    const gradeLabel = romanMap[grade] ?? grade.toString();
    return [gradeLabel, major, section].filter(Boolean).join("-");
  };
  const majorOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [];
    const seen = new Set<string>();
    majors.forEach((major) => {
      const code = major.code.trim().toUpperCase();
      if (!code || seen.has(code)) return;
      const label = major.name?.trim() ? `${code} - ${major.name.trim()}` : code;
      options.push({ value: code, label });
      seen.add(code);
    });
    return options;
  }, [majors]);
  const [formData, setFormData] = useState<ClassFormValues>({
    name: "",
    grade: 10,
    major: "",
    section: "",
    homeroomTeacherId: "",
    academicYear: "2024/2025",
  });

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name,
        grade: classData.grade,
        major: classData.major ?? "",
        section: classData.section,
        homeroomTeacherId: classData.homeroomTeacherId,
        academicYear: classData.academicYear,
      });
    } else {
      setFormData({
        name: "",
        grade: 10,
        major: "",
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
                  const grade = parseInt(value);
                  setFormData((prev) => ({
                    ...prev,
                    grade,
                    name: formatClassName(grade, prev.major, prev.section),
                  }));
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
              <Label htmlFor="section">Kelompok</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={(e) => {
                  const section = e.target.value.toUpperCase();
                  setFormData((prev) => ({
                    ...prev,
                    section,
                    name: formatClassName(prev.grade, prev.major, section),
                  }));
                }}
                placeholder="A, B, C..."
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="major">Jurusan (Opsional)</Label>
            <Select
              value={formData.major || "none"}
              onValueChange={(value) => {
                const majorValue = value === "none" ? "" : value;
                setFormData((prev) => ({
                  ...prev,
                  major: majorValue,
                  name: formatClassName(prev.grade, majorValue, prev.section),
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jurusan..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa Jurusan</SelectItem>
                {majorOptions.map((major) => (
                  <SelectItem key={major.value} value={major.value}>
                    {major.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama Kelas</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="X-RPL-A"
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
                {teachers.length === 0 && (
                  <SelectItem value="none" disabled>
                    Belum ada guru
                  </SelectItem>
                )}
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
