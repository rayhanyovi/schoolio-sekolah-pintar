"use client";

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
  GraduationCap,
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

// Mock data for analytics
const attendanceData = [
  { month: "Jan", hadir: 92, sakit: 4, izin: 3, alpa: 1 },
  { month: "Feb", hadir: 94, sakit: 3, izin: 2, alpa: 1 },
  { month: "Mar", hadir: 91, sakit: 5, izin: 3, alpa: 1 },
  { month: "Apr", hadir: 93, sakit: 4, izin: 2, alpa: 1 },
  { month: "Mei", hadir: 95, sakit: 2, izin: 2, alpa: 1 },
  { month: "Jun", hadir: 90, sakit: 5, izin: 4, alpa: 1 },
];

const gradeDistribution = [
  { grade: "A", count: 45, fill: "hsl(142, 76%, 36%)" },
  { grade: "B", count: 78, fill: "hsl(199, 89%, 48%)" },
  { grade: "C", count: 52, fill: "hsl(38, 92%, 50%)" },
  { grade: "D", count: 18, fill: "hsl(262, 83%, 58%)" },
  { grade: "E", count: 7, fill: "hsl(0, 84%, 60%)" },
];

const subjectPerformance = [
  { subject: "MTK", nilai: 78 },
  { subject: "FIS", nilai: 82 },
  { subject: "KIM", nilai: 75 },
  { subject: "BIO", nilai: 85 },
  { subject: "BIND", nilai: 88 },
  { subject: "BING", nilai: 80 },
  { subject: "SEJ", nilai: 83 },
  { subject: "GEO", nilai: 79 },
];

const classPerformance = [
  { class: "X-A", avg: 82, trend: "up" },
  { class: "X-B", avg: 78, trend: "down" },
  { class: "X-C", avg: 80, trend: "up" },
  { class: "XI-A", avg: 85, trend: "up" },
  { class: "XI-B", avg: 76, trend: "down" },
  { class: "XII-A", avg: 88, trend: "up" },
  { class: "XII-B", avg: 84, trend: "up" },
];

const studentTrend = [
  { year: "2020", total: 580 },
  { year: "2021", total: 612 },
  { year: "2022", total: 645 },
  { year: "2023", total: 678 },
  { year: "2024", total: 720 },
  { year: "2025", total: 756 },
];

const genderDistribution = [
  { name: "Laki-laki", value: 380, fill: "hsl(221, 83%, 53%)" },
  { name: "Perempuan", value: 376, fill: "hsl(330, 81%, 60%)" },
];

const COLORS = ["hsl(221, 83%, 53%)", "hsl(330, 81%, 60%)"];

export default function Analytics() {
  const { role } = useRoleContext();

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">
          Statistik dan analisis performa sekolah
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Siswa</p>
                <p className="text-2xl font-bold">756</p>
                <div className="flex items-center gap-1 text-xs text-success mt-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>+5.3% dari tahun lalu</span>
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
                <p className="text-2xl font-bold">81.2</p>
                <div className="flex items-center gap-1 text-xs text-success mt-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>+2.1 dari semester lalu</span>
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
                <p className="text-2xl font-bold">93.2%</p>
                <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                  <TrendingDown className="h-3 w-3" />
                  <span>-0.8% dari bulan lalu</span>
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
                <p className="text-sm text-muted-foreground">Siswa Berisiko</p>
                <p className="text-2xl font-bold">12</p>
                <div className="flex items-center gap-1 text-xs text-warning mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Perlu perhatian</span>
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
              <CardTitle>Tren Kehadiran Bulanan</CardTitle>
              <CardDescription>
                Persentase kehadiran siswa per bulan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hadir"
                      stackId="1"
                      stroke="hsl(142, 76%, 36%)"
                      fill="hsl(142, 76%, 36%)"
                      fillOpacity={0.6}
                      name="Hadir (%)"
                    />
                    <Area
                      type="monotone"
                      dataKey="sakit"
                      stackId="2"
                      stroke="hsl(38, 92%, 50%)"
                      fill="hsl(38, 92%, 50%)"
                      fillOpacity={0.6}
                      name="Sakit (%)"
                    />
                    <Area
                      type="monotone"
                      dataKey="izin"
                      stackId="3"
                      stroke="hsl(199, 89%, 48%)"
                      fill="hsl(199, 89%, 48%)"
                      fillOpacity={0.6}
                      name="Izin (%)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Attendance by Class */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kehadiran per Kelas</CardTitle>
                <CardDescription>
                  Performa kehadiran masing-masing kelas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classPerformance.map((cls) => (
                    <div
                      key={cls.class}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <span className="font-medium">{cls.class}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${cls.avg}%` }}
                          />
                        </div>
                        <span className="font-semibold w-12">{cls.avg}%</span>
                        {cls.trend === "up" ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Kehadiran Hari Ini</CardTitle>
                <CardDescription>Rekap kehadiran seluruh siswa</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={[
                          {
                            name: "Hadir",
                            value: 702,
                            fill: "hsl(142, 76%, 36%)",
                          },
                          {
                            name: "Sakit",
                            value: 28,
                            fill: "hsl(38, 92%, 50%)",
                          },
                          {
                            name: "Izin",
                            value: 18,
                            fill: "hsl(199, 89%, 48%)",
                          },
                          { name: "Alpa", value: 8, fill: "hsl(0, 84%, 60%)" },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      ></Pie>
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
                <CardTitle>Distribusi Nilai</CardTitle>
                <CardDescription>
                  Jumlah siswa per kategori nilai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeDistribution}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis dataKey="grade" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Jumlah Siswa"
                        radius={[4, 4, 0, 0]}
                      >
                        {gradeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rata-rata Nilai per Mata Pelajaran</CardTitle>
                <CardDescription>
                  Perbandingan nilai antar mata pelajaran
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectPerformance} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="subject" type="category" width={50} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="nilai"
                        fill="hsl(221, 83%, 53%)"
                        name="Nilai Rata-rata"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top & Bottom Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-warning" />
                  Top 5 Siswa Berprestasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Siti Aminah", class: "XII-A", avg: 96.5 },
                    { name: "Budi Pratama", class: "XII-A", avg: 95.2 },
                    { name: "Dewi Safitri", class: "XI-A", avg: 94.8 },
                    { name: "Andi Wijaya", class: "XII-B", avg: 94.1 },
                    { name: "Putri Handayani", class: "XI-B", avg: 93.7 },
                  ].map((student, index) => (
                    <div
                      key={index}
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
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.class}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-success text-success-foreground">
                        {student.avg}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Siswa Perlu Perhatian
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      name: "Rizky Ramadhan",
                      class: "X-C",
                      avg: 58.2,
                      issue: "Nilai rendah",
                    },
                    {
                      name: "Fajar Nugroho",
                      class: "XI-B",
                      avg: 61.5,
                      issue: "Kehadiran rendah",
                    },
                    {
                      name: "Dimas Prasetyo",
                      class: "X-B",
                      avg: 63.1,
                      issue: "Nilai menurun",
                    },
                    {
                      name: "Larasati Putri",
                      class: "X-A",
                      avg: 64.8,
                      issue: "Nilai rendah",
                    },
                  ].map((student, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.class}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">{student.avg}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {student.issue}
                        </p>
                      </div>
                    </div>
                  ))}
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
                <CardTitle>Tren Jumlah Siswa</CardTitle>
                <CardDescription>
                  Pertumbuhan siswa dari tahun ke tahun
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={studentTrend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="hsl(221, 83%, 53%)"
                        strokeWidth={3}
                        dot={{
                          fill: "hsl(221, 83%, 53%)",
                          strokeWidth: 2,
                          r: 4,
                        }}
                        name="Total Siswa"
                      />
                    </LineChart>
                  </ResponsiveContainer>
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
                        data={genderDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {genderDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-8 mt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">380</p>
                    <p className="text-sm text-muted-foreground">
                      Laki-laki (50.3%)
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pink-500">376</p>
                    <p className="text-sm text-muted-foreground">
                      Perempuan (49.7%)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Students per Grade */}
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Siswa per Tingkat</CardTitle>
              <CardDescription>
                Jumlah siswa di setiap tingkat kelas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    grade: "Kelas 10",
                    count: 280,
                    classes: 3,
                    color: "bg-primary",
                  },
                  {
                    grade: "Kelas 11",
                    count: 256,
                    classes: 2,
                    color: "bg-secondary",
                  },
                  {
                    grade: "Kelas 12",
                    count: 220,
                    classes: 2,
                    color: "bg-accent",
                  },
                ].map((item) => (
                  <div
                    key={item.grade}
                    className="p-6 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`h-3 w-3 rounded-full ${item.color}`} />
                      <h4 className="font-semibold">{item.grade}</h4>
                    </div>
                    <p className="text-3xl font-bold">{item.count}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.classes} kelas
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
