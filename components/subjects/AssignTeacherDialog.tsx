'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TeacherOption } from "@/lib/schemas";

interface AssignTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTeacherIds: string[];
  teachers: TeacherOption[];
  onSubmit: (teacherIds: string[]) => void;
}

export function AssignTeacherDialog({
  open,
  onOpenChange,
  currentTeacherIds,
  teachers,
  onSubmit,
}: AssignTeacherDialogProps) {
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  useEffect(() => {
    setSelectedTeachers(currentTeacherIds);
  }, [currentTeacherIds, open]);

  const handleToggle = (teacherId: string) => {
    setSelectedTeachers(prev =>
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const handleSubmit = () => {
    onSubmit(selectedTeachers);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Guru Pengampu</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Pilih guru yang akan mengampu mata pelajaran ini
          </p>
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-3">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleToggle(teacher.id)}
                >
                  <Checkbox
                    checked={selectedTeachers.includes(teacher.id)}
                    onCheckedChange={() => handleToggle(teacher.id)}
                  />
                  <span className="text-sm">{teacher.name}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              Simpan ({selectedTeachers.length} guru)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
