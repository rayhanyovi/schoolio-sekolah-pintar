'use client';

import { useState } from "react";
import { ROLES } from "@/lib/constants";
import { useRoleContext } from "@/hooks/useRoleContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Award,
  BookOpen,
  Download,
  User,
  Users,
  Calculator,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

// Demo data
const demoSchedules = [
  { id: "1", className: "X-A", subject: "Matematika" },
  { id: "2", className: "X-B", subject: "Matematika" },
  { id: "3", className: "XI-A", subject: "Fisika" },
];

const demoChildren = [
  { id: "1", name: "Anak 1 - Ahmad", class: "X-A" },
  { id: "2", name: "Anak 2 - Budi", class: "XI-B" },
];

// Teacher grade data
const demoStudentGrades = [
  { id: "1", name: "Ahmad Rizki", assignments: [85, 90, 78], average: 84.3 },
  { id: "2", name: "Budi Santoso", assignments: [90, 88, 92], average: 90.0 },
  { id: "3", name: "Citra Dewi", assignments: [75, 80, 85], average: 80.0 },
  { id: "4", name: "Dian Purnama", assignments: [88, 85, 90], average: 87.7 },
  { id: "5", name: "Eka Wijaya", assignments: [70, 75, 80], average: 75.0 },
  { id: "6", name: "Fitri Handayani", assignments: [95, 92, 98], average: 95.0 },
  { id: "7", name: "Galih Pratama", assignments: [82, 78, 85], average: 81.7 },
  { id: "8", name: "Hana Safitri", assignments: [88, 90, 87], average: 88.3 },
];

// Student grade data
const demoSubjectGrades = [
  { subject: "Matematika", teacher: "Pak Budi", assignments: 3, average: 85, trend: "up" },
  { subject: "Fisika", teacher: "Bu Sari", assignments: 2, average: 78, trend: "down" },
  { subject: "Kimia", teacher: "Pak Andi", assignments: 3, average: 92, trend: "up" },
  { subject: "Biologi", teacher: "Bu Dewi", assignments: 2, average: 88, trend: "stable" },
  { subject: "Bahasa Indonesia", teacher: "Pak Ahmad", assignments: 4, average: 90, trend: "up" },
  { subject: "Bahasa Inggris", teacher: "Bu Linda", assignments: 3, average: 82, trend: "stable" },
];

const demoAssignmentGrades = [
  { id: "1", title: "Quiz Aljabar Linear", subject: "Matematika", grade: 85, maxGrade: 100, date: "5 Jan 2025" },
  { id: "2", title: "Laporan Praktikum Newton", subject: "Fisika", grade: 78, maxGrade: 100, date: "10 Jan 2025" },
  { id: "3", title: "Esai Trigonometri", subject: "Matematika", grade: 90, maxGrade: 100, date: "12 Jan 2025" },
  { id: "4", title: "Ujian Kimia Dasar", subject: "Kimia", grade: 92, maxGrade: 100, date: "15 Jan 2025" },
];

const chartColors = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--info))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
];

export default function Grades() {
  const { role } = useRoleContext();
  
  if (role === ROLES.TEACHER || role === ROLES.ADMIN) {
    return <TeacherGradesView />;
  }
  
  if (role === ROLES.PARENT) {
    return <ParentGradesView />;
  }
  
  return <StudentGradesView />;
}

function TeacherGradesView() {
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");
  const [editingGrade, setEditingGrade] = useState<{ studentId: string; assignmentIdx: number } | null>(null);

  const classAverage = demoStudentGrades.reduce((sum, s) => sum + s.average, 0) / demoStudentGrades.length;
  const highestAvg = Math.max(...demoStudentGrades.map(s => s.average));
  const lowestAvg = Math.min(...demoStudentGrades.map(s => s.average));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Penilaian</h1>
          <p className="text-muted-foreground">Kelola dan input nilai siswa</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Rekap
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Siswa</p>
                <p className="text-xl font-bold">{demoStudentGrades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rata-rata Kelas</p>
                <p className="text-xl font-bold">{classAverage.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tertinggi</p>
                <p className="text-xl font-bold">{highestAvg.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Terendah</p>
                <p className="text-xl font-bold">{lowestAvg.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Pilih jadwal..." />
            </SelectTrigger>
            <SelectContent>
              {demoSchedules.map((schedule) => (
                <SelectItem key={schedule.id} value={schedule.id}>
                  {schedule.className} - {schedule.subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Grade Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Nilai</CardTitle>
          <CardDescription>Klik nilai untuk mengedit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead className="text-center">Tugas 1</TableHead>
                  <TableHead className="text-center">Tugas 2</TableHead>
                  <TableHead className="text-center">Tugas 3</TableHead>
                  <TableHead className="text-center">Rata-rata</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoStudentGrades.map((student, idx) => (
                  <TableRow key={student.id}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    {student.assignments.map((grade, aIdx) => (
                      <TableCell key={aIdx} className="text-center">
                        {editingGrade?.studentId === student.id && editingGrade?.assignmentIdx === aIdx ? (
                          <Input
                            type="number"
                            defaultValue={grade}
                            className="w-16 h-8 text-center mx-auto"
                            onBlur={() => setEditingGrade(null)}
                            autoFocus
                          />
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "font-medium",
                              grade >= 85 ? "text-success" : grade >= 70 ? "text-warning" : "text-destructive"
                            )}
                            onClick={() => setEditingGrade({ studentId: student.id, assignmentIdx: aIdx })}
                          >
                            {grade}
                          </Button>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "font-bold",
                          student.average >= 85 ? "bg-success/20 text-success" : 
                          student.average >= 70 ? "bg-warning/20 text-warning" : 
                          "bg-destructive/20 text-destructive"
                        )}
                      >
                        {student.average.toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {student.average >= 75 ? (
                        <Badge className="bg-success text-success-foreground">Lulus</Badge>
                      ) : (
                        <Badge variant="destructive">Remedial</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StudentGradesView() {
  const overallAverage = demoSubjectGrades.reduce((sum, s) => sum + s.average, 0) / demoSubjectGrades.length;
  const totalAssignments = demoSubjectGrades.reduce((sum, s) => sum + s.assignments, 0);

  const chartData = demoSubjectGrades.map(s => ({
    name: s.subject.slice(0, 3),
    fullName: s.subject,
    value: s.average,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nilai Saya</h1>
        <p className="text-muted-foreground">Lihat ringkasan nilai dan perkembangan belajar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata Keseluruhan</p>
                <p className="text-2xl font-bold text-primary">{overallAverage.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mata Pelajaran</p>
                <p className="text-xl font-bold">{demoSubjectGrades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tugas Dinilai</p>
                <p className="text-xl font-bold">{totalAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Peringkat</p>
                <p className="text-xl font-bold">5 / 30</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nilai per Mata Pelajaran</CardTitle>
            <CardDescription>Perbandingan rata-rata nilai</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border rounded-lg p-2 shadow-lg">
                            <p className="text-sm font-medium">{payload[0].payload.fullName}</p>
                            <p className="text-sm text-muted-foreground">Nilai: {payload[0].value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subject List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ringkasan per Mapel</CardTitle>
            <CardDescription>Detail nilai masing-masing mata pelajaran</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoSubjectGrades.map((subject, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: chartColors[i % chartColors.length] }}
                  >
                    {subject.subject.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{subject.subject}</p>
                    <p className="text-xs text-muted-foreground">{subject.teacher}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">{subject.average}</span>
                      {subject.trend === "up" && <TrendingUp className="h-4 w-4 text-success" />}
                      {subject.trend === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{subject.assignments} tugas</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Grades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nilai Tugas Terbaru</CardTitle>
          <CardDescription>Daftar nilai dari tugas yang sudah dinilai</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {demoAssignmentGrades.map((grade) => (
              <div key={grade.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    grade.grade >= 85 ? "bg-success/10" : grade.grade >= 70 ? "bg-warning/10" : "bg-destructive/10"
                  )}>
                    <FileText className={cn(
                      "h-5 w-5",
                      grade.grade >= 85 ? "text-success" : grade.grade >= 70 ? "text-warning" : "text-destructive"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium">{grade.title}</p>
                    <p className="text-sm text-muted-foreground">{grade.subject} • {grade.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-2xl font-bold",
                    grade.grade >= 85 ? "text-success" : grade.grade >= 70 ? "text-warning" : "text-destructive"
                  )}>
                    {grade.grade}
                  </p>
                  <p className="text-xs text-muted-foreground">/ {grade.maxGrade}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ParentGradesView() {
  const [selectedChild, setSelectedChild] = useState<string>(demoChildren[0]?.id || "");
  
  const overallAverage = demoSubjectGrades.reduce((sum, s) => sum + s.average, 0) / demoSubjectGrades.length;

  const chartData = demoSubjectGrades.map(s => ({
    name: s.subject.slice(0, 3),
    fullName: s.subject,
    value: s.average,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nilai Anak</h1>
          <p className="text-muted-foreground">Pantau perkembangan nilai anak Anda</p>
        </div>
        <Select value={selectedChild} onValueChange={setSelectedChild}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Pilih anak..." />
          </SelectTrigger>
          <SelectContent>
            {demoChildren.map((child) => (
              <SelectItem key={child.id} value={child.id}>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {child.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata Keseluruhan</p>
                <p className="text-4xl font-bold text-primary">{overallAverage.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">dari {demoSubjectGrades.length} mata pelajaran</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{demoSubjectGrades.filter(s => s.average >= 85).length}</p>
                <p className="text-xs text-muted-foreground">Nilai A</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-info">{demoSubjectGrades.filter(s => s.average >= 75 && s.average < 85).length}</p>
                <p className="text-xs text-muted-foreground">Nilai B</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-warning">{demoSubjectGrades.filter(s => s.average < 75).length}</p>
                <p className="text-xs text-muted-foreground">Perlu Perhatian</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nilai per Mata Pelajaran</CardTitle>
          <CardDescription>Perbandingan nilai antar mata pelajaran</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border rounded-lg p-2 shadow-lg">
                          <p className="text-sm font-medium">{payload[0].payload.fullName}</p>
                          <p className="text-sm text-muted-foreground">Nilai: {payload[0].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subject Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detail per Mata Pelajaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {demoSubjectGrades.map((subject, i) => (
              <div key={i} className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: chartColors[i % chartColors.length] }}
                    />
                    <span className="font-medium">{subject.subject}</span>
                  </div>
                  <Badge 
                    className={cn(
                      subject.average >= 85 ? "bg-success text-success-foreground" :
                      subject.average >= 75 ? "bg-info text-info-foreground" :
                      "bg-warning text-warning-foreground"
                    )}
                  >
                    {subject.average}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span>{subject.average}%</span>
                  </div>
                  <Progress value={subject.average} className="h-2" />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{subject.teacher}</span>
                  <span className="flex items-center gap-1">
                    {subject.trend === "up" && <TrendingUp className="h-3 w-3 text-success" />}
                    {subject.trend === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
                    {subject.assignments} tugas dinilai
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
