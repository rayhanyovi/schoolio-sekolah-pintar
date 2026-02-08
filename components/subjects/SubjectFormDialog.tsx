'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubjectFormValues, SubjectSummary } from "@/lib/schemas";
import { SUBJECT_CATEGORIES, SubjectCategory } from "@/lib/constants";

interface SubjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: SubjectSummary | null;
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

export function SubjectFormDialog({ open, onOpenChange, subject, onSubmit }: SubjectFormDialogProps) {
  const [formData, setFormData] = useState<SubjectFormValues>({
    name: "",
    code: "",
    category: "SCIENCE" as SubjectCategory,
    description: "",
    color: "bg-primary",
    hoursPerWeek: 0,
  });

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name,
        code: subject.code,
        category: subject.category,
        description: subject.description,
        color: subject.color || "bg-primary",
        hoursPerWeek: subject.hoursPerWeek ?? 0,
      });
    } else {
      setFormData({
        name: "",
        code: "",
        category: "SCIENCE",
        description: "",
        color: "bg-primary",
        hoursPerWeek: 0,
      });
    }
  }, [subject, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit">
              {subject ? "Simpan Perubahan" : "Tambah Mata Pelajaran"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
