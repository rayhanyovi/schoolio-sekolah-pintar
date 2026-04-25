'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MajorSummary, SubjectFormValues, SubjectSummary } from "@/lib/schemas";
import { SUBJECT_CATEGORIES, SubjectCategory } from "@/lib/constants";

interface SubjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: SubjectSummary | null;
  majors: MajorSummary[];
  onSubmit: (data: SubjectFormValues) => void;
}

const COLOR_OPTIONS = [
  { value: "bg-primary", label: "Default" },
  { value: "bg-secondary", label: "Sekunder" },
  { value: "bg-success", label: "Sukses" },
  { value: "bg-warning", label: "Peringatan" },
  { value: "bg-info", label: "Info" },
  { value: "bg-destructive", label: "Bahaya" },
];

export function SubjectFormDialog({
  open,
  onOpenChange,
  subject,
  majors,
  onSubmit,
}: SubjectFormDialogProps) {
  const [formData, setFormData] = useState<SubjectFormValues>({
    name: "",
    code: "",
    category: "SCIENCE" as SubjectCategory,
    description: "",
    color: "bg-primary",
    hoursPerWeek: 0,
    majorIds: [],
    appliesToAllMajors: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (subject) {
        setFormData({
          name: subject.name,
          code: subject.code,
          category: subject.category,
          description: subject.description,
          color: subject.color || "bg-primary",
          hoursPerWeek: subject.hoursPerWeek ?? 0,
          majorIds: subject.majorIds ?? [],
          appliesToAllMajors: subject.appliesToAllMajors ?? true,
        });
      } else {
        setFormData({
          name: "",
          code: "",
          category: "SCIENCE",
          description: "",
          color: "bg-primary",
          hoursPerWeek: 0,
          majorIds: [],
          appliesToAllMajors: true,
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [subject, open]);

  const toggleMajor = (majorId: string) => {
    setFormData((prev) => {
      const exists = prev.majorIds.includes(majorId);
      return {
        ...prev,
        majorIds: exists
          ? prev.majorIds.filter((id) => id !== majorId)
          : [...prev.majorIds, majorId],
      };
    });
  };

  const isMajorSelectionInvalid =
    !formData.appliesToAllMajors && formData.majorIds.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMajorSelectionInvalid) {
      return;
    }
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{subject ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Mata Pelajaran</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Matematika"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Kode</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="MTK"
                maxLength={10}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as SubjectCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUBJECT_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Warna Mapel</Label>
              <Select
                value={formData.color}
                onValueChange={(value) =>
                  setFormData({ ...formData, color: value })
                }
              >
                <SelectTrigger id="color">
                  <SelectValue placeholder="Pilih warna..." />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className={`${option.value} h-3 w-3 rounded-full`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi mata pelajaran..."
              rows={3}
            />
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="appliesToAllMajors"
                checked={formData.appliesToAllMajors}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    appliesToAllMajors: Boolean(checked),
                    majorIds: Boolean(checked) ? [] : prev.majorIds,
                  }))
                }
              />
              <div>
                <Label htmlFor="appliesToAllMajors">Berlaku untuk semua jurusan</Label>
                <p className="text-xs text-muted-foreground">
                  Matematika biasanya berlaku untuk semua jurusan.
                </p>
              </div>
            </div>

            {!formData.appliesToAllMajors && (
              <div className="space-y-2">
                <Label>Pilih Jurusan</Label>
                {majors.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Belum ada jurusan. Tambahkan jurusan dulu di menu Jurusan.
                  </p>
                ) : (
                  <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border p-2">
                    {majors.map((major) => (
                      <label
                        key={major.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={formData.majorIds.includes(major.id)}
                          onCheckedChange={() => toggleMajor(major.id)}
                        />
                        <span>{major.code}</span>
                        {major.name && major.name !== major.code && (
                          <span className="text-muted-foreground">- {major.name}</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
                {isMajorSelectionInvalid && (
                  <p className="text-xs text-destructive">
                    Pilih minimal satu jurusan atau aktifkan semua jurusan.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isMajorSelectionInvalid}>
              {subject ? "Simpan Perubahan" : "Tambah Mata Pelajaran"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
