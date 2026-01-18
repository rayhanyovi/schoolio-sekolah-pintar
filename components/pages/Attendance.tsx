'use client';

import { useEffect, useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
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
  listAttendanceRecords,
  listAttendanceSessions,
  upsertAttendanceRecords,
} from "@/lib/handlers/attendance";
import { listClassStudents } from "@/lib/handlers/classes";
import { listStudents } from "@/lib/handlers/users";
import {
  AttendanceRecordSummary,
  AttendanceSessionSummary,
  StudentSummary,
  UserSummary,
} from "@/lib/schemas";

const statusConfig: Record<
  AttendanceStatus,
  { icon: typeof CheckCircle2; color: string; bgColor: string }
> = {
  PRESENT: { icon: CheckCircle2, color: "text-success", bgColor: "bg-success/10" },
  ABSENT: { icon: XCircle, color: "text-destructive", bgColor: "bg-destructive/10" },
  SICK: { icon: Thermometer, color: "text-warning", bgColor: "bg-warning/10" },
  PERMIT: { icon: FileText, color: "text-info", bgColor: "bg-info/10" },
};

export default function Attendance() {
  const { role } = useRoleContext();
  if (role === ROLES.TEACHER || role === ROLES.ADMIN) {
    return <TeacherAttendanceView />;
  }

  if (role === ROLES.PARENT) {
    return (
      <StudentAttendanceView
        title="Kehadiran Anak"
        description="Pantau kehadiran anak Anda di sekolah"
        allowStudentSelect
      />
    );
  }

  return (
    <StudentAttendanceView
      title="Kehadiran Saya"
      description="Lihat ringkasan dan riwayat kehadiran Anda"
      allowStudentSelect={false}
    />
  );
}

function TeacherAttendanceView() {
  const [sessions, setSessions] = useState<AttendanceSessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [students, setStudents] = useState<
    Array<{ id: string; name: string; status: AttendanceStatus }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);
      try {
        const data = await listAttendanceSessions({ date: today });
        setSessions(data);
        if (!selectedSessionId && data.length > 0) {
          setSelectedSessionId(data[0].id);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadSessions();
  }, [today, selectedSessionId]);

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
            dateFrom: today,
            dateTo: today,
            subjectId: session.subjectId,
          }),
        ]);
        const recordMap = new Map(
          records
            .filter((record) => record.sessionId === session.id)
            .map((record) => [record.studentId, record.status as AttendanceStatus])
        );
        const rows = classStudents.map((student) => ({
          id: student.id,
          name: student.name,
          status: recordMap.get(student.id) ?? "PRESENT",
        }));
        setStudents(rows);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, [selectedSessionId, sessions, today]);

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, status: newStatus } : student
      )
    );
  };

  const handleBulkAction = (status: AttendanceStatus) => {
    setStudents((prev) => prev.map((student) => ({ ...student, status })));
  };

  const handleSaveAttendance = async () => {
    if (!selectedSessionId) return;
    await upsertAttendanceRecords(
      selectedSessionId,
      students.map((student) => ({
        studentId: student.id,
        status: student.status,
      }))
    );
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
          <CardDescription>Pilih kelas dan mata pelajaran untuk hari ini</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue
                placeholder={isLoading ? "Memuat sesi..." : "Pilih sesi pelajaran..."}
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
                  Tidak ada sesi hari ini
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedSessionId && (
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
              }
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
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
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
                                isActive && config.color
                              )}
                              onClick={() =>
                                handleStatusChange(student.id, status)
                              }
                              title={ATTENDANCE_STATUS[status]}
                            >
                              <Icon className="h-4 w-4" />
                            </Button>
                          );
                        }
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
                <Button onClick={handleSaveAttendance}>
                  <Check className="h-4 w-4 mr-2" />
                  Simpan Absensi
                </Button>
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
};

function StudentAttendanceView({
  title,
  description,
  allowStudentSelect,
}: StudentAttendanceViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [students, setStudents] = useState<UserSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [records, setRecords] = useState<AttendanceRecordSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    const loadStudents = async () => {
      setIsLoading(true);
      try {
        const data = await listStudents();
        setStudents(data);
        if (!selectedStudentId && data.length > 0) {
          setSelectedStudentId(data[0].id);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadStudents();
  }, [selectedStudentId]);

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
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Pilih siswa..." />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
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
                <p className="text-sm text-muted-foreground">Tingkat Kehadiran</p>
                <p className="text-2xl font-bold text-primary">{attendanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(Object.entries({
          PRESENT: stats.present,
          ABSENT: stats.absent,
          SICK: stats.sick,
          PERMIT: stats.permit,
        }) as [AttendanceStatus, number][]).map(([status, count]) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      config.bgColor
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
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1)
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
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1)
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
                      !status && "hover:bg-muted/50"
                    )}
                  >
                    <span
                      className={cn(
                        "font-medium",
                        config?.color,
                        !isSameMonth(day, currentMonth) &&
                          "text-muted-foreground/50"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {status && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                        {config && (
                          <config.icon className={cn("h-3 w-3", config.color)} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              {(Object.entries(statusConfig) as [
                AttendanceStatus,
                typeof statusConfig[AttendanceStatus]
              ][]).map(([status, config]) => (
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
                  const config = statusConfig[record.status as AttendanceStatus];
                  return (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          config.bgColor
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

              {records.filter((record) => record.status !== "PRESENT").length === 0 && (
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
