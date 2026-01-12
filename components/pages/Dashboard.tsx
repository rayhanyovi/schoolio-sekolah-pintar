'use client';

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

export default function Dashboard() {
  // Demo data - will be replaced with real data from Supabase
  const stats = [
    { title: "Total Siswa", value: "60", icon: Users, variant: "primary" as const },
    { title: "Mata Pelajaran", value: "12", icon: BookOpen, variant: "info" as const },
    { title: "Kehadiran Hari Ini", value: "95%", icon: ClipboardCheck, variant: "success" as const },
    { title: "Tugas Aktif", value: "8", icon: FileText, variant: "warning" as const },
  ];

  const todaySchedule = [
    { subject: "Matematika", teacher: "Pak Budi", time: "07:00 - 08:30", isActive: true },
    { subject: "Bahasa Indonesia", teacher: "Bu Sari", time: "08:45 - 10:15", isNext: true },
    { subject: "Fisika", teacher: "Pak Ahmad", time: "10:30 - 12:00" },
    { subject: "Bahasa Inggris", teacher: "Bu Dewi", time: "13:00 - 14:30" },
  ];

  const recentAssignments = [
    { title: "Latihan Soal Integral", subject: "Matematika", dueDate: "7 Jan 2025", type: "MCQ" as const, status: "pending" as const },
    { title: "Essay Puisi Chairil Anwar", subject: "B. Indonesia", dueDate: "5 Jan 2025", type: "ESSAY" as const, status: "submitted" as const },
    { title: "Laporan Praktikum Gerak", subject: "Fisika", dueDate: "3 Jan 2025", type: "FILE" as const, status: "graded" as const, score: 85 },
  ];

  const today = new Date();
  const dayName = Object.values(DAYS_OF_WEEK)[today.getDay() === 0 ? 6 : today.getDay() - 1];

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
            {todaySchedule.map((schedule, index) => (
              <ScheduleCard key={index} {...schedule} />
            ))}
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
            {recentAssignments.map((assignment, index) => (
              <AssignmentCard key={index} {...assignment} />
            ))}
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
            {Object.entries(DAYS_OF_WEEK).map(([key, label], index) => {
              const attendance = index < 5 ? Math.floor(Math.random() * 10) + 90 : null;
              return (
                <div
                  key={key}
                  className="text-center p-4 rounded-xl bg-muted/50"
                >
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {label}
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
