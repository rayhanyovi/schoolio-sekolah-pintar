"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ROLES, ATTENDANCE_STATUS, AttendanceStatus } from "@/lib/constants";
import { useRoleContext } from "@/hooks/useRoleContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Thermometer,
  FileText,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isSameDay,
  startOfMonth,
} from "date-fns";
import { id } from "date-fns/locale";
import {
  createAttendanceSession,
  createTeacherAttendance,
  listAttendanceRecords,
  listAttendanceSessions,
  listTeacherAttendance,
  updateAttendanceSession,
  upsertAttendanceRecords,
} from "@/lib/handlers/attendance";
import { listSchedules } from "@/lib/handlers/schedules";
import { listClassStudents } from "@/lib/handlers/classes";
import { listParentChildren, listStudents, listTeachers } from "@/lib/handlers/users";
import {
  AttendanceRecordSummary,
  AttendanceSessionSummary,
  TeacherAttendanceSummary,
  UserSummary,
} from "@/lib/schemas";
import { Input } from "../ui/input";
import { Role } from "@prisma/client";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const statusConfig: Record<
  AttendanceStatus,
  { icon: typeof CheckCircle2; color: string; bgColor: string }
> = {
  PRESENT: {
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  ABSENT: {
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  SICK: { icon: Thermometer, color: "text-warning", bgColor: "bg-warning/10" },
  PERMIT: { icon: FileText, color: "text-info", bgColor: "bg-info/10" },
};

export default function Attendance() {
  const { role, userId } = useRoleContext();
  if (role === ROLES.TEACHER) {
    return <TeacherAttendanceView />;
  }

  if (role === ROLES.ADMIN) {
    return <AdminAttendanceView />;
  }

  if (role === ROLES.PARENT) {
    return (
      <StudentAttendanceView
        title="Kehadiran Anak"
        description="Pantau kehadiran anak Anda di sekolah"
        allowStudentSelect
        role={role}
        userId={userId}
      />
    );
  }

  return (
    <StudentAttendanceView
      title="Kehadiran Saya"
      description="Lihat ringkasan dan riwayat kehadiran Anda"
      allowStudentSelect={false}
      role={role}
      userId={userId}
    />
  );
}

function TeacherAttendanceView() {
  const { userId } = useRoleContext();
  const [sessions, setSessions] = useState<AttendanceSessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [students, setStudents] = useState<
    Array<{ id: string; name: string; status: AttendanceStatus | "" }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const seedingRef = useRef(false);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showMissingAlert, setShowMissingAlert] = useState(false);
  const missingAlertTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [teacherAttendance, setTeacherAttendance] = useState<
    TeacherAttendanceSummary[]
  >([]);
  const [absentOpen, setAbsentOpen] = useState(false);
  const [absentType, setAbsentType] = useState<AttendanceStatus>("SICK");
  const [absentNote, setAbsentNote] = useState("");
  const [absentAllDay, setAbsentAllDay] = useState(false);
  const [isAssigningSubstitute, setIsAssigningSubstitute] = useState(false);

  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const selectedDayKey = useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00`);
    const keys = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
    return keys[date.getDay()];
  }, [selectedDate]);

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);
      try {
        const data = await listAttendanceSessions({
          date: selectedDate,
          teacherId: userId ?? undefined,
        });
        if (data.length === 0 && userId && !seedingRef.current) {
          seedingRef.current = true;
          try {
            const schedules = await listSchedules({
              teacherId: userId,
              dayOfWeek: selectedDayKey,
            });
            if (schedules.length) {
              await Promise.all(
                schedules.map((schedule) =>
                  createAttendanceSession({
                    date: selectedDate,
                    classId: schedule.classId,
                    subjectId: schedule.subjectId,
                    teacherId: schedule.teacherId ?? userId,
                    scheduleId: schedule.id,
                    startTime: schedule.startTime ?? undefined,
                    endTime: schedule.endTime ?? undefined,
                  }),
                ),
              );
            }
            const refreshed = await listAttendanceSessions({
              date: selectedDate,
              teacherId: userId,
            });
            setSessions(refreshed);
            if (refreshed.length > 0) {
              const nextId =
                selectedSessionId &&
                refreshed.some((s) => s.id === selectedSessionId)
                  ? selectedSessionId
                  : refreshed[0].id;
              setSelectedSessionId(nextId);
            } else {
              setSelectedSessionId("");
            }
          } finally {
            seedingRef.current = false;
          }
          return;
        }
        setSessions(data);
        if (data.length > 0) {
          const nextId =
            selectedSessionId && data.some((s) => s.id === selectedSessionId)
              ? selectedSessionId
              : data[0].id;
          setSelectedSessionId(nextId);
        } else {
          setSelectedSessionId("");
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadSessions();
  }, [selectedDate, userId, selectedDayKey, selectedSessionId]);

  useEffect(() => {
    const loadTeacherAttendance = async () => {
      if (!userId) {
        setTeacherAttendance([]);
        setSessionStarted(false);
        return;
      }
      const data = await listTeacherAttendance({
        teacherId: userId,
        dateFrom: selectedDate,
        dateTo: selectedDate,
      });
      setTeacherAttendance(data);
      if (!selectedSessionId) {
        setSessionStarted(false);
        return;
      }
      const hasAllDayAbsent = data.some(
        (item) =>
          item.isAllDay &&
          (item.status === "SICK" || item.status === "PERMIT")
      );
      const started = data.some(
        (item) => item.sessionId === selectedSessionId
      );
      const session = sessions.find((item) => item.id === selectedSessionId);
      const takenByOther =
        session?.takenByTeacherId && session.takenByTeacherId !== userId;
      setSessionStarted(started && !hasAllDayAbsent && !takenByOther);
    };
    loadTeacherAttendance();
  }, [userId, selectedDate, selectedSessionId, sessions]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      if (missingAlertTimerRef.current) {
        clearTimeout(missingAlertTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedSessionId) {
        setStudents([]);
        return;
      }
      const session = sessions.find((item) => item.id === selectedSessionId);
      if (!session) return;

      setIsLoading(true);
      try {
        const [classStudents, records] = await Promise.all([
          listClassStudents(session.classId),
          listAttendanceRecords({
            dateFrom: selectedDate,
            dateTo: selectedDate,
            subjectId: session.subjectId,
          }),
        ]);
        const recordMap = new Map(
          records
            .filter((record) => record.sessionId === session.id)
            .map((record) => [
              record.studentId,
              record.status as AttendanceStatus,
            ]),
        );
        const rows = classStudents.map((student) => ({
          id: student.id,
          name: student.name,
          status: recordMap.get(student.id) ?? "",
        }));
        setStudents(rows);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, [selectedSessionId, sessions, selectedDate]);

  const handleStatusChange = (
    studentId: string,
    newStatus: AttendanceStatus,
  ) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, status: newStatus } : student,
      ),
    );
    setHighlightIds((prev) => {
      if (!prev.has(studentId)) return prev;
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
    setShowMissingAlert(false);
  };

  const handleBulkAction = (status: AttendanceStatus) => {
    setStudents((prev) => prev.map((student) => ({ ...student, status })));
    setHighlightIds(new Set());
    setShowMissingAlert(false);
  };

  const handleSaveAttendance = async () => {
    if (!selectedSessionId) return;
    if (!sessionStarted) return;
    const missing = students
      .filter((student) => !student.status)
      .map((student) => student.id);
    if (missing.length > 0) {
      const next = new Set(missing);
      setHighlightIds(next);
      setShowMissingAlert(true);
      if (missingAlertTimerRef.current) {
        clearTimeout(missingAlertTimerRef.current);
      }
      missingAlertTimerRef.current = setTimeout(() => {
        setShowMissingAlert(false);
      }, 4000);
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      highlightTimerRef.current = setTimeout(() => {
        setHighlightIds(new Set());
      }, 4000);
      return;
    }
    setShowMissingAlert(false);
    await upsertAttendanceRecords(
      selectedSessionId,
      students.map((student) => ({
        studentId: student.id,
        status: student.status,
      })),
    );
  };

  const handleStartSession = async () => {
    if (!userId || !selectedSessionId) return;
    const session = sessions.find((item) => item.id === selectedSessionId);
    if (!session) return;
    const isOriginalTeacher = session.teacherId === userId;
    const alreadyTakenByOther =
      session.takenByTeacherId && session.takenByTeacherId !== userId;
    if (alreadyTakenByOther) return;

    if (!isOriginalTeacher && !session.takenByTeacherId) {
      const confirmed = window.confirm(
        "Anda bukan guru asli untuk sesi ini. Ambil sesi ini sebagai pengganti?"
      );
      if (!confirmed) return;
    }

    try {
      setIsAssigningSubstitute(true);
      if (!session.takenByTeacherId || session.takenByTeacherId !== userId) {
        await updateAttendanceSession(session.id, {
          takenByTeacherId: userId,
        });
      }
      await createTeacherAttendance({
        teacherId: userId,
        sessionId: selectedSessionId,
        date: selectedDate,
        status: "PRESENT",
        isAllDay: false,
      });
      setSessionStarted(true);
    } finally {
      setIsAssigningSubstitute(false);
    }
  };

  const handleSubmitAbsent = async () => {
    if (!userId) return;
    await createTeacherAttendance({
      teacherId: userId,
      sessionId: absentAllDay ? undefined : selectedSessionId,
      date: selectedDate,
      status: absentType,
      note: absentNote.trim() || undefined,
      isAllDay: absentAllDay,
    });
    setSessionStarted(false);
    setAbsentOpen(false);
    setAbsentNote("");
    setAbsentType("SICK");
    setAbsentAllDay(false);
  };

  const counts = useMemo(() => {
    return {
      PRESENT: students.filter((s) => s.status === "PRESENT").length,
      ABSENT: students.filter((s) => s.status === "ABSENT").length,
      SICK: students.filter((s) => s.status === "SICK").length,
      PERMIT: students.filter((s) => s.status === "PERMIT").length,
    };
  }, [students]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Absensi Kelas</h1>
        <p className="text-muted-foreground">
          Rekam kehadiran siswa untuk setiap sesi pelajaran
        </p>
      </div>

      {/* Session Picker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Pilih Sesi</CardTitle>
          <CardDescription>
            Pilih kelas dan mata pelajaran untuk tanggal tertentu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="w-full md:w-[200px]">
              <Label htmlFor="attendance-date">Tanggal</Label>
              <Input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="attendance-session">Sesi</Label>
              <Select
                value={selectedSessionId}
                onValueChange={setSelectedSessionId}
              >
                <SelectTrigger id="attendance-session" className="w-full mt-2">
                  <SelectValue
                    placeholder={
                      isLoading ? "Memuat sesi..." : "Pilih sesi pelajaran..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{session.className}</span>
                        <span className="text-muted-foreground">•</span>
                        <span>{session.subjectName}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {session.startTime && session.endTime
                            ? `${session.startTime} - ${session.endTime}`
                            : "Waktu belum diisi"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  {sessions.length === 0 && (
                    <SelectItem value="none" disabled>
                      Tidak ada sesi untuk tanggal ini
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedSessionId && (
            <div className="mt-4 flex flex-wrap gap-2">
              {sessions
                .filter((item) => item.id === selectedSessionId)
                .map((session) => {
                  const isTakenByOther =
                    session.takenByTeacherId &&
                    session.takenByTeacherId !== userId;
                  return (
                    <div key={session.id} className="flex flex-wrap gap-2">
                      {session.takenByTeacherId && (
                        <Badge variant="secondary">
                          Diambil oleh{" "}
                          {session.takenByTeacherName || "Guru lain"}
                        </Badge>
                      )}
                      <Button
                        onClick={handleStartSession}
                        disabled={
                          sessionStarted || isTakenByOther || isAssigningSubstitute
                        }
                        variant={sessionStarted ? "secondary" : "default"}
                      >
                        {sessionStarted
                          ? "Jam Pelajaran Dimulai"
                          : isAssigningSubstitute
                            ? "Memulai..."
                            : "Mulai Jam Pelajaran"}
                      </Button>
                    </div>
                  );
                })}
              <Button
                variant="outline"
                onClick={() => setAbsentOpen((prev) => !prev)}
              >
                Saya tidak hadir
              </Button>
            </div>
          )}
          {absentOpen && (
            <div className="mt-4 rounded-lg border p-4 space-y-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={absentType}
                  onValueChange={(value) =>
                    setAbsentType(value as AttendanceStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SICK">Sakit</SelectItem>
                    <SelectItem value="PERMIT">Izin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alasan</Label>
                <Textarea
                  value={absentNote}
                  onChange={(event) => setAbsentNote(event.target.value)}
                  rows={3}
                  placeholder="Tulis alasan ketidakhadiran..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={absentAllDay}
                  onCheckedChange={(checked) =>
                    setAbsentAllDay(Boolean(checked))
                  }
                  id="absent-all-day"
                />
                <Label htmlFor="absent-all-day">
                  Berlaku untuk sepanjang hari
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAbsentOpen(false)}
                >
                  Batal
                </Button>
                <Button onClick={handleSubmitAbsent}>Simpan</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSessionId && sessionStarted && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.entries(counts) as [AttendanceStatus, number][]).map(
              ([status, count]) => {
                const config = statusConfig[status];
                const Icon = config.icon;
                return (
                  <Card
                    key={status}
                    className={cn("border-l-4", config.bgColor)}
                    style={{
                      borderLeftColor: `hsl(var(--${
                        status === "PRESENT"
                          ? "success"
                          : status === "ABSENT"
                            ? "destructive"
                            : status === "SICK"
                              ? "warning"
                              : "info"
                      }))`,
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {ATTENDANCE_STATUS[status]}
                          </p>
                          <p className="text-2xl font-bold">{count}</p>
                        </div>
                        <Icon className={cn("h-8 w-8", config.color)} />
                      </div>
                    </CardContent>
                  </Card>
                );
              },
            )}
          </div>

          {/* Bulk Actions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Daftar Siswa</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("PRESENT")}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Semua Hadir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("ABSENT")}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Semua Tidak Hadir
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {students.map((student, index) => (
                  <div
                    key={student.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors",
                      highlightIds.has(student.id) &&
                        "ring-2 ring-destructive/70 bg-destructive/10",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <span className="font-medium">{student.name}</span>
                    </div>
                    <div className="flex gap-1">
                      {(Object.keys(statusConfig) as AttendanceStatus[]).map(
                        (status) => {
                          const config = statusConfig[status];
                          const Icon = config.icon;
                          const isActive = student.status === status;
                          return (
                            <Button
                              key={status}
                              variant={isActive ? "default" : "ghost"}
                              size="sm"
                              className={cn(
                                "h-8 w-8 p-0",
                                isActive && config.bgColor,
                                isActive && config.color,
                              )}
                              onClick={() =>
                                handleStatusChange(student.id, status)
                              }
                              title={ATTENDANCE_STATUS[status]}
                            >
                              <Icon className="h-4 w-4" />
                            </Button>
                          );
                        },
                      )}
                    </div>
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Belum ada siswa untuk kelas ini
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t flex justify-end">
                <div className="relative">
                  {showMissingAlert && (
                    <div className="absolute -top-12 right-0 z-10">
                      <div className="bg-destructive text-destructive-foreground text-xs px-3 py-2 rounded-md shadow-md">
                        Masih ada absensi yang belum diisi
                      </div>
                      <div className="absolute right-4 -bottom-2 h-3 w-3 rotate-45 bg-destructive" />
                    </div>
                  )}
                  <Button onClick={handleSaveAttendance}>
                    <Check className="h-4 w-4 mr-2" />
                    Simpan Absensi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

type StudentAttendanceViewProps = {
  title: string;
  description: string;
  allowStudentSelect: boolean;
  role: Role;
  userId?: string;
};

function StudentAttendanceView({
  title,
  description,
  allowStudentSelect,
  role,
  userId,
}: StudentAttendanceViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [students, setStudents] = useState<UserSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [records, setRecords] = useState<AttendanceRecordSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const showNoStudents =
    allowStudentSelect && !isLoading && students.length === 0;

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const days = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd],
  );

  useEffect(() => {
    let isActive = true;
    const loadStudents = async () => {
      setIsLoading(true);
      try {
        if (role === ROLES.PARENT) {
          const data = await listParentChildren();
          if (isActive) setStudents(data);
          return;
        }
        if (role === ROLES.STUDENT && !userId) {
          if (isActive) setStudents([]);
          return;
        }
        const data = await listStudents();
        if (isActive) setStudents(data);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    loadStudents();
    return () => {
      isActive = false;
    };
  }, [role, userId]);

  useEffect(() => {
    if (!students.length) {
      setSelectedStudentId("");
      return;
    }
    if (
      !selectedStudentId ||
      !students.some((s) => s.id === selectedStudentId)
    ) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  useEffect(() => {
    const loadRecords = async () => {
      if (!selectedStudentId) {
        setRecords([]);
        return;
      }
      setIsLoading(true);
      try {
        const data = await listAttendanceRecords({
          studentId: selectedStudentId,
          dateFrom: format(monthStart, "yyyy-MM-dd"),
          dateTo: format(monthEnd, "yyyy-MM-dd"),
        });
        setRecords(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadRecords();
  }, [selectedStudentId, monthStart, monthEnd]);

  const stats = useMemo(() => {
    return {
      total: records.length,
      present: records.filter((r) => r.status === "PRESENT").length,
      absent: records.filter((r) => r.status === "ABSENT").length,
      sick: records.filter((r) => r.status === "SICK").length,
      permit: records.filter((r) => r.status === "PERMIT").length,
    };
  }, [records]);

  const attendanceRate = stats.total
    ? Math.round((stats.present / stats.total) * 100)
    : 0;

  const getStatusForDate = (date: Date): AttendanceStatus | null => {
    const record = records.find((item) => isSameDay(item.date, date));
    return (record?.status as AttendanceStatus) ?? null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {allowStudentSelect && (
        <Card>
          <CardContent className="p-4">
            <Select
              value={selectedStudentId}
              onValueChange={setSelectedStudentId}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Pilih siswa..." />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
                {students.length === 0 && (
                  <SelectItem value="none" disabled>
                    Belum ada siswa
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {showNoStudents && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Belum ada siswa terdaftar</p>
            <p className="text-sm">
              Tambahkan siswa terlebih dahulu untuk melihat absensi.
            </p>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="col-span-2 md:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Tingkat Kehadiran
                </p>
                <p className="text-2xl font-bold text-primary">
                  {attendanceRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(
          Object.entries({
            PRESENT: stats.present,
            ABSENT: stats.absent,
            SICK: stats.sick,
            PERMIT: stats.permit,
          }) as [AttendanceStatus, number][]
        ).map(([status, count]) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      config.bgColor,
                    )}
                  >
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {ATTENDANCE_STATUS[status]}
                    </p>
                    <p className="text-xl font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Kalender Kehadiran</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setCurrentMonth(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() - 1),
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[120px] text-center">
                  {format(currentMonth, "MMMM yyyy", { locale: id })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setCurrentMonth(
                      (prev) =>
                        new Date(prev.getFullYear(), prev.getMonth() + 1),
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 mb-2">
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {days.map((day) => {
                const status = getStatusForDate(day);
                const config = status ? statusConfig[status] : null;

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center text-sm relative",
                      isToday(day) && "ring-2 ring-primary",
                      config?.bgColor,
                      !status && "hover:bg-muted/50",
                    )}
                  >
                    <span
                      className={cn(
                        "font-medium",
                        config?.color,
                        !isSameMonth(day, currentMonth) &&
                          "text-muted-foreground/50",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {status && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                        {config && (
                          <config.icon
                            className={cn("h-3 w-3", config.color)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              {(
                Object.entries(statusConfig) as [
                  AttendanceStatus,
                  (typeof statusConfig)[AttendanceStatus],
                ][]
              ).map(([status, config]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={cn("h-4 w-4 rounded", config.bgColor)}>
                    <config.icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {ATTENDANCE_STATUS[status]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Absences */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ketidakhadiran Terakhir</CardTitle>
            <CardDescription>Riwayat tidak hadir bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {records
                .filter((record) => record.status !== "PRESENT")
                .map((record) => {
                  const config =
                    statusConfig[record.status as AttendanceStatus];
                  return (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          config.bgColor,
                        )}
                      >
                        <config.icon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {record.subjectName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(record.date, "EEEE, d MMMM", { locale: id })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {ATTENDANCE_STATUS[record.status as AttendanceStatus]}
                      </Badge>
                    </div>
                  );
                })}

              {records.filter((record) => record.status !== "PRESENT")
                .length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada ketidakhadiran bulan ini 🎉
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {isLoading && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Memuat data absensi...
        </p>
      )}
    </div>
  );
}

function AdminAttendanceView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewType, setViewType] = useState<"students" | "teachers">("students");
  const [students, setStudents] = useState<UserSummary[]>([]);
  const [teachers, setTeachers] = useState<UserSummary[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>("");
  const [records, setRecords] = useState<AttendanceRecordSummary[]>([]);
  const [teacherRecords, setTeacherRecords] = useState<
    TeacherAttendanceSummary[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const days = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd],
  );

  useEffect(() => {
    let isActive = true;
    const loadPeople = async () => {
      setIsLoading(true);
      try {
        const [studentData, teacherData] = await Promise.all([
          listStudents(),
          listTeachers(),
        ]);
        if (isActive) {
          setStudents(studentData);
          setTeachers(teacherData);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    loadPeople();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const source = viewType === "students" ? students : teachers;
    if (!source.length) {
      setSelectedPersonId("");
      return;
    }
    if (!selectedPersonId || !source.some((s) => s.id === selectedPersonId)) {
      setSelectedPersonId(source[0].id);
    }
  }, [students, teachers, selectedPersonId, viewType]);

  useEffect(() => {
    const loadRecords = async () => {
      if (!selectedPersonId) {
        setRecords([]);
        setTeacherRecords([]);
        return;
      }
      setIsLoading(true);
      try {
        if (viewType === "students") {
          const data = await listAttendanceRecords({
            studentId: selectedPersonId,
            dateFrom: format(monthStart, "yyyy-MM-dd"),
            dateTo: format(monthEnd, "yyyy-MM-dd"),
          });
          setRecords(data);
          setTeacherRecords([]);
        } else {
          const data = await listTeacherAttendance({
            teacherId: selectedPersonId,
            dateFrom: format(monthStart, "yyyy-MM-dd"),
            dateTo: format(monthEnd, "yyyy-MM-dd"),
          });
          setTeacherRecords(data);
          setRecords([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadRecords();
  }, [selectedPersonId, monthStart, monthEnd, viewType]);

  const getStudentStatusSummary = (date: Date) => {
    const dayRecords = records.filter((item) => isSameDay(item.date, date));
    if (!dayRecords.length) return null;
    const total = dayRecords.length;
    const counts = {
      PRESENT: dayRecords.filter((r) => r.status === "PRESENT").length,
      SICK: dayRecords.filter((r) => r.status === "SICK").length,
      PERMIT: dayRecords.filter((r) => r.status === "PERMIT").length,
      ABSENT: dayRecords.filter((r) => r.status === "ABSENT").length,
    };
    const nonZero = Object.entries(counts).filter(([, value]) => value > 0);
    if (nonZero.length === 1) {
      const [status] = nonZero[0];
      if (total >= 6) {
        return {
          type: "single",
          status: status as AttendanceStatus,
          label: ATTENDANCE_STATUS[status as AttendanceStatus],
        };
      }
      return {
        type: "mixed",
        parts: [
          `${ATTENDANCE_STATUS[status as AttendanceStatus]}: ${total}/6`,
        ],
      };
    }
    return {
      type: "mixed",
      parts: ([
        ["PRESENT", "Hadir"],
        ["SICK", "Sakit"],
        ["PERMIT", "Izin"],
        ["ABSENT", "Tidak hadir"],
      ] as const)
        .map(([key, label]) =>
          counts[key] > 0 ? `${label}: ${counts[key]}/6` : null,
        )
        .filter(Boolean) as string[],
    };
  };

  const getTeacherStatusSummary = (date: Date) => {
    const dayRecords = teacherRecords.filter((item) =>
      isSameDay(item.date, date)
    );
    if (!dayRecords.length) return null;
    const allDay = dayRecords.find((item) => item.isAllDay);
    if (allDay) {
      return {
        type: "single",
        status: allDay.status as AttendanceStatus,
        label: ATTENDANCE_STATUS[allDay.status as AttendanceStatus],
      };
    }
    const total = dayRecords.length;
    const counts = {
      PRESENT: dayRecords.filter((r) => r.status === "PRESENT").length,
      SICK: dayRecords.filter((r) => r.status === "SICK").length,
      PERMIT: dayRecords.filter((r) => r.status === "PERMIT").length,
      ABSENT: dayRecords.filter((r) => r.status === "ABSENT").length,
    };
    const nonZero = Object.entries(counts).filter(([, value]) => value > 0);
    if (nonZero.length === 1) {
      const [status] = nonZero[0];
      return {
        type: "single",
        status: status as AttendanceStatus,
        label: ATTENDANCE_STATUS[status as AttendanceStatus],
      };
    }
    return {
      type: "mixed",
      parts: ([
        ["PRESENT", "Hadir"],
        ["SICK", "Sakit"],
        ["PERMIT", "Izin"],
        ["ABSENT", "Tidak hadir"],
      ] as const)
        .map(([key, label]) =>
          counts[key] > 0 ? `${label}: ${counts[key]}/${total}` : null,
        )
        .filter(Boolean) as string[],
    };
  };


  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Absensi</h1>
        <p className="text-muted-foreground">
          Pantau kehadiran siswa dan guru dalam tampilan kalender
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <Select
              value={viewType}
              onValueChange={(value) =>
                setViewType(value as "students" | "teachers")
              }
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="students">Siswa</SelectItem>
                <SelectItem value="teachers">Guru</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedPersonId}
              onValueChange={setSelectedPersonId}
            >
              <SelectTrigger className="w-full md:w-[320px]">
                <SelectValue
                  placeholder={viewType === "students" ? "Pilih siswa..." : "Pilih guru..."}
                />
              </SelectTrigger>
              <SelectContent>
                {(viewType === "students" ? students : teachers).map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
                {(viewType === "students" ? students : teachers).length === 0 && (
                  <SelectItem value="none" disabled>
                    Belum ada data
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Kalender Kehadiran</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCurrentMonth(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1),
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentMonth, "MMMM yyyy", { locale: id })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCurrentMonth(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1),
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 mb-2">
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {days.map((day) => {
              const summary =
                viewType === "students"
                  ? getStudentStatusSummary(day)
                  : getTeacherStatusSummary(day);
              const status =
                summary && summary.type === "single" ? summary.status : null;
              const config = status ? statusConfig[status] : null;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[78px] rounded-lg border p-2 text-xs relative",
                    isToday(day) && "ring-2 ring-primary",
                    !isSameMonth(day, currentMonth) &&
                      "opacity-60 bg-muted/10",
                    config?.bgColor,
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "font-medium",
                        config?.color,
                        !isSameMonth(day, currentMonth) &&
                          "text-muted-foreground/50",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {status && (
                      <config.icon className={cn("h-3 w-3", config.color)} />
                    )}
                  </div>

                  {summary && summary.type === "single" && (
                    <div className={cn("mt-1 text-[11px]", config?.color)}>
                      {summary.label}
                    </div>
                  )}
                  {summary && summary.type === "mixed" && (
                    <div className="mt-1 space-y-1 text-[11px] text-muted-foreground">
                      {summary.parts.map((part) => (
                        <div key={part}>{part}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Memuat data absensi...
        </p>
      )}
    </div>
  );
}
