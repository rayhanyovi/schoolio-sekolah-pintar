'use client';

import { useEffect, useMemo, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ScheduleCard } from "@/components/dashboard/ScheduleCard";
import { AssignmentCard } from "@/components/dashboard/AssignmentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAYS_OF_WEEK } from "@/lib/constants";
import {
  Users,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Calendar,
  FileText,
} from "lucide-react";
import { getAnalyticsOverview } from "@/lib/handlers/analytics";
import { listSubjects } from "@/lib/handlers/subjects";
import { listAssignments } from "@/lib/handlers/assignments";
import { listSchedules } from "@/lib/handlers/schedules";
import { listAttendanceRecords } from "@/lib/handlers/attendance";
import {
  AssignmentSummary,
  AnalyticsOverview,
  AttendanceRecordSummary,
  ScheduleSummary,
  SubjectSummary,
} from "@/lib/schemas";
import { format, startOfWeek, addDays } from "date-fns";
import { id } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const parseTimeToMinutes = (value?: string | null) => {
  if (!value) return null;
  const [h, m] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

const getTodayKey = (date: Date) => format(date, "yyyy-MM-dd");

const getTodayDayOfWeek = (date: Date) => {
  const jsDay = date.getDay();
  const mapping = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
  return mapping[jsDay] ?? "MON";
};

export default function Dashboard() {
  const { toast } = useToast();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const dayName =
    today.getDay() === 0
      ? "Minggu"
      : Object.values(DAYS_OF_WEEK)[today.getDay() - 1];
  const todayKey = getTodayKey(today);
  const todayDayOfWeek = getTodayDayOfWeek(today);

  useEffect(() => {
    let isActive = true;
    const loadData = async () => {
      setIsLoading(true);
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 5);
      const [overviewResult, subjectResult, assignmentResult, scheduleResult, attendanceResult] =
        await Promise.allSettled([
          getAnalyticsOverview(),
          listSubjects(),
          listAssignments({ status: "ACTIVE" }),
          listSchedules({ dayOfWeek: todayDayOfWeek }),
          listAttendanceRecords({
            dateFrom: format(weekStart, "yyyy-MM-dd"),
            dateTo: format(weekEnd, "yyyy-MM-dd"),
          }),
        ]);

      if (!isActive) return;

      if (overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value);
      } else {
        toast({
          title: "Gagal memuat ringkasan",
          description: "Ringkasan statistik tidak dapat dimuat.",
        });
      }

      if (subjectResult.status === "fulfilled") {
        setSubjects(subjectResult.value);
      }

      if (assignmentResult.status === "fulfilled") {
        setAssignments(assignmentResult.value);
      }

      if (scheduleResult.status === "fulfilled") {
        setSchedules(scheduleResult.value);
      }

      if (attendanceResult.status === "fulfilled") {
        setAttendanceRecords(attendanceResult.value);
      }

      setIsLoading(false);
    };

    loadData();
    return () => {
      isActive = false;
    };
  }, [toast, todayDayOfWeek]);

  const totalSubjects = subjects.length;
  const activeAssignments = assignments.length;
  const totalStudents = overview?.totalStudents ?? 0;

  const todayAttendance = attendanceRecords.filter(
    (record) => getTodayKey(record.date) === todayKey
  );
  const todayPresent = todayAttendance.filter((record) => record.status === "PRESENT").length;
  const todayAttendanceRate = todayAttendance.length
    ? Math.round((todayPresent / todayAttendance.length) * 100)
    : null;

  const stats = [
    {
      title: "Total Siswa",
      value: isLoading ? "..." : totalStudents,
      icon: Users,
      variant: "primary" as const,
    },
    {
      title: "Mata Pelajaran",
      value: isLoading ? "..." : totalSubjects,
      icon: BookOpen,
      variant: "info" as const,
    },
    {
      title: "Kehadiran Hari Ini",
      value: isLoading
        ? "..."
        : todayAttendanceRate === null
        ? "-"
        : `${todayAttendanceRate}%`,
      icon: ClipboardCheck,
      variant: "success" as const,
    },
    {
      title: "Tugas Aktif",
      value: isLoading ? "..." : activeAssignments,
      icon: FileText,
      variant: "warning" as const,
    },
  ];

  const scheduleCards = useMemo(() => {
    if (!schedules.length) return [];
    const nowMinutes = today.getHours() * 60 + today.getMinutes();
    const sorted = [...schedules].sort((a, b) => a.startTime.localeCompare(b.startTime));
    let activeId: string | null = null;
    sorted.forEach((item, index) => {
      const start = parseTimeToMinutes(item.startTime);
      const end = parseTimeToMinutes(item.endTime);
      if (start !== null && end !== null && nowMinutes >= start && nowMinutes <= end) {
        activeId = item.id;
      }
    });
    let nextId: string | null = null;
    if (activeId) {
      const activeIndex = sorted.findIndex((item) => item.id === activeId);
      for (let i = activeIndex + 1; i < sorted.length; i += 1) {
        const start = parseTimeToMinutes(sorted[i].startTime);
        if (start !== null && start > nowMinutes) {
          nextId = sorted[i].id;
          break;
        }
      }
    } else {
      const nextIndex = sorted.findIndex((item) => {
        const start = parseTimeToMinutes(item.startTime);
        return start !== null && start > nowMinutes;
      });
      nextId = nextIndex >= 0 ? sorted[nextIndex].id : null;
    }

    return sorted.slice(0, 4).map((schedule) => ({
      subject: schedule.subjectName,
      teacher: schedule.teacherName || "Belum ditentukan",
      time: schedule.startTime && schedule.endTime
        ? `${schedule.startTime} - ${schedule.endTime}`
        : "Waktu belum diisi",
      room: schedule.room || undefined,
      isActive: schedule.id === activeId,
      isNext: schedule.id === nextId && schedule.id !== activeId,
    }));
  }, [schedules, today]);

  const recentAssignments = useMemo(() => {
    if (!assignments.length) return [];
    const now = new Date();
    const sorted = [...assignments].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
    );
    return sorted.slice(0, 3).map((assignment) => {
      const due = assignment.dueDate;
      const isLate = due.getTime() < now.getTime();
      const deliveryType = assignment.deliveryType ?? assignment.type ?? "FILE";
      const type =
        deliveryType === "MCQ" || deliveryType === "ESSAY" || deliveryType === "FILE"
          ? deliveryType
          : "FILE";
      return {
        title: assignment.title,
        subject: assignment.subjectName,
        dueDate: format(due, "d MMM yyyy", { locale: id }),
        type,
        status: isLate ? "late" : "pending",
      } as const;
    });
  }, [assignments]);

  const attendanceSummary = useMemo(() => {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const days = Array.from({ length: 6 }).map((_, idx) => addDays(weekStart, idx));
    return days.map((day) => {
      const key = getTodayKey(day);
      const records = attendanceRecords.filter((record) => getTodayKey(record.date) === key);
      if (!records.length) {
        return {
          label: format(day, "EEE", { locale: id }),
          value: null as number | null,
        };
      }
      const present = records.filter((record) => record.status === "PRESENT").length;
      const percent = Math.round((present / records.length) * 100);
      return {
        label: format(day, "EEE", { locale: id }),
        value: percent,
      };
    });
  }, [attendanceRecords, today]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Selamat Datang, Pengguna! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {dayName}, {today.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card variant="elevated" className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Jadwal Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Memuat jadwal...</div>
            ) : scheduleCards.length > 0 ? (
              scheduleCards.map((schedule, index) => (
                <ScheduleCard key={index} {...schedule} />
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                Tidak ada jadwal untuk hari ini
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Assignments */}
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Tugas Terbaru
            </CardTitle>
            <a href="/dashboard/assignments" className="text-sm text-primary hover:underline">
              Lihat Semua
            </a>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Memuat tugas...</div>
            ) : recentAssignments.length > 0 ? (
              recentAssignments.map((assignment, index) => (
                <AssignmentCard key={index} {...assignment} />
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                Belum ada tugas yang aktif
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Summary */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ringkasan Kehadiran Minggu Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {attendanceSummary.map((item, index) => {
              const attendance = item.value;
              return (
                <div
                  key={`${item.label}-${index}`}
                  className="text-center p-4 rounded-xl bg-muted/50"
                >
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {item.label}
                  </p>
                  {attendance !== null ? (
                    <p className={`text-2xl font-bold ${attendance >= 90 ? "text-success" : "text-warning"}`}>
                      {attendance}%
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-muted-foreground">-</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
