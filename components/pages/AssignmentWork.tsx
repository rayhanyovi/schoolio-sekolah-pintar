'use client';

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ArrowLeft, Calendar, ClipboardList, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { ASSIGNMENT_TYPES, AssignmentType, ROLES } from "@/lib/constants";
import { useRoleContext } from "@/hooks/useRoleContext";
import { createAssignmentSubmission, getAssignment } from "@/lib/handlers/assignments";
import { AssignmentSummary } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const typeConfig: Record<
  AssignmentType,
  { icon: typeof FileText; color: string; bgColor: string }
> = {
  MCQ: { icon: ClipboardList, color: "text-primary", bgColor: "bg-primary/10" },
  FILE: { icon: Upload, color: "text-secondary", bgColor: "bg-secondary/10" },
  ESSAY: { icon: FileText, color: "text-accent", bgColor: "bg-accent/10" },
};

const getDeliveryType = (assignment: AssignmentSummary): AssignmentType => {
  const candidate = assignment.deliveryType ?? assignment.type ?? "FILE";
  if (candidate === "MCQ" || candidate === "FILE" || candidate === "ESSAY") {
    return candidate;
  }
  return "FILE";
};

export default function AssignmentWork() {
  const router = useRouter();
  const params = useParams<{ assignmentId: string }>();
  const searchParams = useSearchParams();
  const { role, userId } = useRoleContext();

  const assignmentParam = params?.assignmentId;
  const assignmentId = Array.isArray(assignmentParam)
    ? assignmentParam[0]
    : assignmentParam ?? "";
  const studentIdFromQuery = searchParams.get("studentId")?.trim() ?? "";

  const studentId = useMemo(() => {
    if (role === ROLES.STUDENT) {
      return studentIdFromQuery || userId || "";
    }
    return studentIdFromQuery || userId || "";
  }, [role, studentIdFromQuery, userId]);

  const [assignment, setAssignment] = useState<AssignmentSummary | null>(null);
  const [answer, setAnswer] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!assignmentId) {
      setIsLoading(false);
      return;
    }

    let isActive = true;
    const loadAssignment = async () => {
      setIsLoading(true);
      try {
        const data = await getAssignment(assignmentId);
        if (isActive) setAssignment(data);
      } catch {
        if (isActive) {
          toast.error("Tugas tidak ditemukan.");
          router.push("/dashboard/assignments");
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadAssignment();
    return () => {
      isActive = false;
    };
  }, [assignmentId, router]);

  const deliveryType = assignment ? getDeliveryType(assignment) : "FILE";
  const config = typeConfig[deliveryType];
  const Icon = config.icon;
  const canSubmit = role === ROLES.STUDENT;

  const handleBack = () => {
    router.push("/dashboard/assignments");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!assignment) return;
    if (!canSubmit) {
      toast.error("Halaman ini hanya untuk siswa.");
      return;
    }
    if (!studentId) {
      toast.error("Siswa belum dipilih.");
      return;
    }
    if (deliveryType !== "FILE" && !answer.trim()) {
      toast.error("Jawaban wajib diisi.");
      return;
    }
    if (deliveryType === "FILE" && !selectedFile) {
      toast.error("Pilih file terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response =
        deliveryType === "FILE"
          ? {
              fileName: selectedFile?.name ?? "",
              size: selectedFile?.size ?? 0,
              type: selectedFile?.type ?? "",
            }
          : { text: answer.trim() };

      await createAssignmentSubmission(assignment.id, {
        studentId,
        status: "SUBMITTED",
        submittedAt: new Date().toISOString(),
        response,
      });
      toast.success("Tugas berhasil dikumpulkan");
      router.push("/dashboard/assignments");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengumpulkan tugas";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat tugas...</p>;
  }

  if (!assignment) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={handleBack} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Tugas
        </Button>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Data tugas tidak tersedia.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={handleBack} className="w-fit">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali ke Tugas
      </Button>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center shrink-0", config.bgColor)}>
              <Icon className={cn("h-6 w-6", config.color)} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{assignment.subjectName}</Badge>
                <Badge variant="secondary">{ASSIGNMENT_TYPES[deliveryType]}</Badge>
              </div>
              <h1 className="text-xl font-semibold">{assignment.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Deadline: {format(assignment.dueDate, "d MMM yyyy", { locale: id })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kerjakan Tugas</CardTitle>
          <CardDescription>Kumpulkan jawaban tugas melalui form ini.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!canSubmit && (
              <p className="text-sm text-destructive">
                Pengumpulan tugas hanya tersedia untuk akun siswa.
              </p>
            )}

            <div className="space-y-2">
              <Label>Mata Pelajaran</Label>
              <div className="text-sm text-muted-foreground">{assignment.subjectName}</div>
            </div>

            {deliveryType === "FILE" ? (
              <div className="space-y-2">
                <Label>Upload File</Label>
                <Input
                  type="file"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">{selectedFile.name}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Jawaban</Label>
                <Textarea
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  rows={6}
                  placeholder="Tulis jawaban di sini..."
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleBack}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || !canSubmit}>
                {isSubmitting ? "Mengirim..." : "Kumpulkan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
