"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
} from "lucide-react";
import { useRoleContext } from "@/hooks/useRoleContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  getAnalyticsAttendance,
  getAnalyticsDemographics,
  getAnalyticsGrades,
  getAnalyticsOverview,
} from "@/lib/handlers/analytics";
import {
  AnalyticsAttendance,
  AnalyticsDemographics,
  AnalyticsGrades,
  AnalyticsOverview,
} from "@/lib/schemas";
import { ATTENDANCE_STATUS } from "@/lib/constants";

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "hsl(142, 76%, 36%)",
  SICK: "hsl(38, 92%, 50%)",
  PERMIT: "hsl(199, 89%, 48%)",
  ABSENT: "hsl(0, 84%, 60%)",
};

const GENDER_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(330, 81%, 60%)",
  "hsl(45, 93%, 47%)",
];

export default function Analytics() {
  const { role } = useRoleContext();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [attendance, setAttendance] = useState<AnalyticsAttendance | null>(null);
  const [grades, setGrades] = useState<AnalyticsGrades | null>(null);
  const [demographics, setDemographics] =
    useState<AnalyticsDemographics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [overviewResult, attendanceResult, gradesResult, demoResult] =
        await Promise.allSettled([
          getAnalyticsOverview(),
          getAnalyticsAttendance(),
          getAnalyticsGrades(),
          getAnalyticsDemographics(),
        ]);
      if (overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value);
      }
      if (attendanceResult.status === "fulfilled") {
        setAttendance(attendanceResult.value);
      }
      if (gradesResult.status === "fulfilled") {
        setGrades(gradesResult.value);
      }
      if (demoResult.status === "fulfilled") {
        setDemographics(demoResult.value);
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  if (role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Akses Terbatas
          </h2>
          <p className="text-sm text-muted-foreground">
            Hanya Administrator yang dapat mengakses halaman ini
          </p>
        </div>
      </div>
    );
  }

  const attendanceCounts = attendance?.counts ?? {
    PRESENT: 0,
    ABSENT: 0,
    SICK: 0,
    PERMIT: 0,
  };
  const attendanceTotal = Object.values(attendanceCounts).reduce(
    (sum, value) => sum + value,
    0
  );
  const attendanceRate = attendanceTotal
    ? Math.round((attendanceCounts.PRESENT / attendanceTotal) * 1000) / 10
    : 0;

  const attendanceChartData = (Object.entries(attendanceCounts) as [
    keyof typeof attendanceCounts,
    number
  ][]).map(([key, count]) => ({
    key,
    label: ATTENDANCE_STATUS[key],
    count,
    fill: STATUS_COLORS[key],
    percent: attendanceTotal ? (count / attendanceTotal) * 100 : 0,
  }));

  const gradeData = grades?.data ?? [];
  const weightedAverage = useMemo(() => {
    if (gradeData.length === 0) return 0;
    const totalSubmissions = gradeData.reduce(
      (sum, row) => sum + row.submissions,
      0
    );
    if (totalSubmissions === 0) {
      const total = gradeData.reduce((sum, row) => sum + row.average, 0);
      return total / gradeData.length;
    }
    const totalScore = gradeData.reduce(
      (sum, row) => sum + row.average * row.submissions,
      0
    );
    return totalScore / totalSubmissions;
  }, [gradeData]);

  const gradeChartData = gradeData.map((row) => ({
    subject: row.subjectName,
    short: row.subjectName.slice(0, 3).toUpperCase(),
    average: row.average,
    submissions: row.submissions,
  }));

  const topSubjects = [...gradeData]
    .sort((a, b) => b.average - a.average)
    .slice(0, 5);
  const bottomSubjects = [...gradeData]
    .sort((a, b) => a.average - b.average)
    .slice(0, 5);

  const genderCounts = demographics?.gender ?? {
    MALE: 0,
    FEMALE: 0,
    UNKNOWN: 0,
  };
  const genderData = [
    { name: "Laki-laki", value: genderCounts.MALE, fill: GENDER_COLORS[0] },
    { name: "Perempuan", value: genderCounts.FEMALE, fill: GENDER_COLORS[1] },
    { name: "Belum Diisi", value: genderCounts.UNKNOWN, fill: GENDER_COLORS[2] },
  ];
  const totalGender = genderData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">
          Statistik dan analisis performa sekolah
          {isLoading ? " • Memuat data..." : ""}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Siswa</p>
                <p className="text-2xl font-bold">
                  {overview?.totalStudents ?? 0}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Users className="h-3 w-3" />
                  <span>Total data siswa</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata Nilai</p>
                <p className="text-2xl font-bold">
                  {weightedAverage.toFixed(1)}
                </p>
                <div className="flex items-center gap-1 text-xs text-success mt-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Rata-rata pengumpulan</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Tingkat Kehadiran
                </p>
                <p className="text-2xl font-bold">{attendanceRate}%</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Rasio hadir</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Catatan Tidak Hadir
                </p>
                <p className="text-2xl font-bold">
                  {attendanceCounts.ABSENT}
                </p>
                <div className="flex items-center gap-1 text-xs text-warning mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Rekap absensi</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Kehadiran
          </TabsTrigger>
          <TabsTrigger value="grades" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Nilai
          </TabsTrigger>
          <TabsTrigger value="demographics" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Demografi
          </TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rekap Status Kehadiran</CardTitle>
              <CardDescription>
                Jumlah status kehadiran berdasarkan catatan absensi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" className="text-xs" />
                    <YAxis className="text-xs" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" name="Jumlah">
                      {attendanceChartData.map((entry) => (
                        <Cell key={entry.key} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Kehadiran</CardTitle>
                <CardDescription>
                  Persentase status dari total catatan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceChartData.map((row) => (
                    <div
                      key={row.key}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: row.fill }}
                        />
                        <span className="font-medium">{row.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${row.percent}%`, backgroundColor: row.fill }}
                          />
                        </div>
                        <span className="font-semibold w-12 text-right">
                          {row.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribusi Kehadiran</CardTitle>
                <CardDescription>Komposisi status kehadiran</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={attendanceChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="label"
                        label={({ label, percent }) =>
                          `${label} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {attendanceChartData.map((entry) => (
                          <Cell key={entry.key} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rata-rata Nilai per Mapel</CardTitle>
                <CardDescription>
                  Perbandingan nilai antar mata pelajaran
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="short" type="category" width={50} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value, _, entry) => [
                          value,
                          entry?.payload?.subject,
                        ]}
                      />
                      <Bar
                        dataKey="average"
                        fill="hsl(221, 83%, 53%)"
                        name="Nilai Rata-rata"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pengumpulan per Mapel</CardTitle>
                <CardDescription>Jumlah submission yang dinilai</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="short" />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value, _, entry) => [
                          value,
                          entry?.payload?.subject,
                        ]}
                      />
                      <Bar
                        dataKey="submissions"
                        fill="hsl(199, 89%, 48%)"
                        name="Jumlah Pengumpulan"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-warning" />
                  Top Mapel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSubjects.map((subject, index) => (
                    <div
                      key={subject.subjectId}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="secondary"
                          className="w-6 h-6 rounded-full p-0 flex items-center justify-center"
                        >
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{subject.subjectName}</p>
                          <p className="text-xs text-muted-foreground">
                            {subject.submissions} pengumpulan
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-success text-success-foreground">
                        {subject.average.toFixed(1)}
                      </Badge>
                    </div>
                  ))}
                  {topSubjects.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada data nilai
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Mapel Perlu Perhatian
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bottomSubjects.map((subject, index) => (
                    <div
                      key={`${subject.subjectId}-${index}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <div>
                          <p className="font-medium">{subject.subjectName}</p>
                          <p className="text-xs text-muted-foreground">
                            {subject.submissions} pengumpulan
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">
                          {subject.average.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {bottomSubjects.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada data nilai
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Populasi</CardTitle>
                <CardDescription>Jumlah pengguna dan kelas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground">Siswa</p>
                    <p className="text-2xl font-bold">
                      {overview?.totalStudents ?? 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground">Guru</p>
                    <p className="text-2xl font-bold">
                      {overview?.totalTeachers ?? 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground">Orang Tua</p>
                    <p className="text-2xl font-bold">
                      {overview?.totalParents ?? 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground">Kelas</p>
                    <p className="text-2xl font-bold">
                      {overview?.totalClasses ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribusi Gender</CardTitle>
                <CardDescription>Perbandingan jumlah siswa L/P</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {genderData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.fill}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-8 mt-4">
                  {genderData.map((entry, index) => (
                    <div key={entry.name} className="text-center">
                      <p
                        className="text-2xl font-bold"
                        style={{ color: GENDER_COLORS[index] }}
                      >
                        {entry.value}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {totalGender
                          ? `${entry.name} (${Math.round(
                              (entry.value / totalGender) * 100
                            )}%)`
                          : entry.name}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
