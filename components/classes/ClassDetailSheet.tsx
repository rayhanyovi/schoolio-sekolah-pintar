'use client';

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Users, UserCircle, GraduationCap, Calendar } from "lucide-react";
import { listClassStudents } from "@/lib/handlers/classes";
import { ClassSummary, StudentSummary } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";

interface ClassDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: ClassSummary | null;
}

export function ClassDetailSheet({ open, onOpenChange, classData }: ClassDetailSheetProps) {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const classId = classData?.id;

  useEffect(() => {
    if (!open || !classId) return;
    let isActive = true;
    const timer = setTimeout(() => {
      if (!isActive) return;
      setIsLoading(true);
      setStudents([]);
      listClassStudents(classId)
        .then((data) => {
          if (isActive) setStudents(data);
        })
        .catch((error) => {
          if (!isActive) return;
          setStudents([]);
          toast({
            title: "Gagal memuat siswa",
            description: error instanceof Error ? error.message : "Terjadi kesalahan",
          });
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
    }, 0);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [classId, open, toast]);

  if (!classData) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Detail Kelas {classData.name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Class Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                Kelas {classData.grade}
              </Badge>
              {classData.major && (
                <Badge variant="outline" className="text-sm">
                  Jurusan {classData.major}
                </Badge>
              )}
              <Badge variant="outline" className="text-sm">
                {classData.academicYear}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Wali Kelas:</span>
              </div>
              <span className="text-sm font-medium">{classData.homeroomTeacher}</span>

              <div className="flex items-center gap-2 text-sm">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Jurusan:</span>
              </div>
              <span className="text-sm font-medium">{classData.major || "-"}</span>

              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Total Siswa:</span>
              </div>
              <span className="text-sm font-medium">{classData.studentCount}</span>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Rasio L/P:</span>
              </div>
              <span className="text-sm font-medium">{classData.maleCount} / {classData.femaleCount}</span>
            </div>
          </div>

          <Separator />

          {/* Student List */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Daftar Siswa ({students.length})
            </h4>
            <ScrollArea className="h-[300px] rounded-md border p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Memuat data siswa...
                </div>
              ) : students.length > 0 ? (
                <div className="space-y-2">
                  {students.map((student, index) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                        <span className="text-sm font-medium">{student.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {student.gender === "L"
                          ? "Laki-laki"
                          : student.gender === "P"
                          ? "Perempuan"
                          : "Tidak diketahui"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Belum ada siswa terdaftar
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
