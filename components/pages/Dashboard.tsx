'use client';

import { useEffect, useMemo, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ScheduleCard } from "@/components/dashboard/ScheduleCard";
import { AssignmentCard } from "@/components/dashboard/AssignmentCard";
import {
  AssignmentCardsSkeleton,
  AttendanceWeekSkeleton,
  ScheduleCardsSkeleton,
  StatCardsSkeleton,
} from "@/components/dashboard/PageSkeletons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { useRoleContext } from "@/hooks/useRoleContext";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  Sparkles,
  TrendingUp,
  Users,
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
import { addDays, format, startOfWeek } from "date-fns";
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
  const { userName } = useRoleContext();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
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
  }, [today, todayDayOfWeek, toast]);

  const totalSubjects = subjects.length;
  const activeAssignments = assignments.length;
  const totalStudents = overview?.totalStudents ?? 0;
  const totalTeachers = overview?.totalTeachers ?? 0;
  const totalClasses = overview?.totalClasses ?? 0;

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
      subtitle: isLoading ? "Memuat data…" : `${totalClasses} kelas aktif`,
      icon: Users,
      variant: "primary" as const,
    },
    {
      title: "Mata Pelajaran",
      value: isLoading ? "..." : totalSubjects,
      subtitle: isLoading ? "Memuat data…" : `${totalTeachers} pengajar terdaftar`,
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
      subtitle:
        isLoading || todayAttendanceRate === null
          ? "Belum ada rekap"
          : `${todayPresent} dari ${todayAttendance.length} hadir`,
      icon: ClipboardCheck,
      variant: "success" as const,
    },
    {
      title: "Tugas Aktif",
      value: isLoading ? "..." : activeAssignments,
      subtitle: isLoading ? "Memuat data…" : "Perlu dipantau minggu ini",
      icon: FileText,
      variant: "warning" as const,
    },
  ];

  const scheduleCards = useMemo(() => {
    if (!schedules.length) return [];
    const nowMinutes = today.getHours() * 60 + today.getMinutes();
    const sorted = [...schedules].sort((a, b) => a.startTime.localeCompare(b.startTime));
    let activeId: string | null = null;
    sorted.forEach((item) => {
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
      time:
        schedule.startTime && schedule.endTime
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

  const weeklyHighlights = [
    {
      label: "Jadwal hari ini",
      value: isLoading ? "..." : `${scheduleCards.length} sesi`,
    },
    {
      label: "Guru terdaftar",
      value: isLoading ? "..." : `${totalTeachers} orang`,
    },
    {
      label: "Mata pelajaran aktif",
      value: isLoading ? "..." : `${totalSubjects} mapel`,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <section>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-primary"
            >
              Schoolio Command Desk
            </Badge>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-bold leading-tight text-foreground md:text-4xl">
                Selamat datang, {userName?.trim() || "Pengguna"}.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                {dayName}, {today.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                . Pantau ritme akademik, tugas aktif, dan rekap kehadiran dari satu ruang kerja
                yang terasa sejalan dengan identitas Schoolio.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                {isLoading ? "Memuat ringkasan…" : `${activeAssignments} tugas aktif minggu ini`}
              </div>
              <div className="rounded-full border border-accent/35 bg-accent/15 px-4 py-2 text-sm font-medium text-foreground">
                {todayAttendanceRate === null || isLoading
                  ? "Absensi hari ini belum tersedia"
                  : `Kehadiran hari ini ${todayAttendanceRate}%`}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
            <Card className="border-accent/25 bg-accent/10 shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-primary p-2 text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Fokus Hari Ini
                </p>
                <p className="text-sm font-semibold">
                  {isLoading
                    ? "Menyiapkan dashboard…"
                    : scheduleCards[0]?.subject || "Belum ada sesi terjadwal"}
                </p>
              </div>
              </CardContent>
            </Card>
            {weeklyHighlights.map((item) => (
              <Card
                key={item.label}
                className="border-border/70 bg-card/80 shadow-none"
              >
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-foreground">
                    {item.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <StatCardsSkeleton className="sm:col-span-2 xl:col-span-4" />
        ) : (
          stats.map((stat, index) => (
            <div
              key={stat.title}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <StatCard {...stat} />
            </div>
          ))
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1.3fr]">
        <Card variant="elevated">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  Agenda Hari Ini
                </CardTitle>
                <CardDescription>
                  Sesi yang sedang berjalan dan urutan kelas berikutnya.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="rounded-full border-border/80 bg-background/60 px-3 py-1 text-xs text-muted-foreground"
              >
                {isLoading ? "..." : `${scheduleCards.length} sesi`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <ScheduleCardsSkeleton count={4} />
            ) : scheduleCards.length > 0 ? (
              scheduleCards.map((schedule, index) => (
                <ScheduleCard key={`${schedule.subject}-${index}`} {...schedule} />
              ))
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                Tidak ada jadwal untuk hari ini.
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Tugas yang Perlu Dipantau
                </CardTitle>
                <CardDescription>
                  Deadline terdekat dan item yang paling butuh perhatian.
                </CardDescription>
              </div>
              <a
                href="/dashboard/assignments"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Lihat Semua
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <AssignmentCardsSkeleton count={3} />
            ) : recentAssignments.length > 0 ? (
              recentAssignments.map((assignment, index) => (
                <AssignmentCard key={`${assignment.title}-${index}`} {...assignment} />
              ))
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                Belum ada tugas yang aktif.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card variant="elevated">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Ritme Kehadiran Minggu Ini
              </CardTitle>
              <CardDescription>
                Rekap cepat untuk melihat konsistensi kehadiran sepanjang pekan.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="rounded-full border-accent/35 bg-accent/10 px-3 py-1 text-xs text-foreground"
            >
              {todayAttendanceRate === null || isLoading
                ? "Belum ada data"
                : `${todayAttendanceRate}% hari ini`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <AttendanceWeekSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {attendanceSummary.map((item, index) => {
                const attendance = item.value;
                const stateClass =
                  attendance === null
                    ? "border-border/70 bg-muted/45"
                    : attendance >= 90
                      ? "border-success/20 bg-success/8"
                      : "border-warning/30 bg-warning/12";

                return (
                  <div
                    key={`${item.label}-${index}`}
                    className={`rounded-[1.25rem] border p-4 text-center ${stateClass}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {item.label}
                    </p>
                    {attendance !== null ? (
                      <p className="mt-3 text-2xl font-bold text-foreground">{attendance}%</p>
                    ) : (
                      <p className="mt-3 text-2xl font-bold text-muted-foreground">-</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
