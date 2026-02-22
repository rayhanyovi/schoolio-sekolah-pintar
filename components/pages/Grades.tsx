'use client';

import { useEffect, useMemo, useState } from "react";
import { ROLES } from "@/lib/constants";
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
  Users,
  Calculator,
  FileText,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { listSchedules } from "@/lib/handlers/schedules";
import { getGradesSummary, listGrades } from "@/lib/handlers/grades";
import { listStudents } from "@/lib/handlers/users";
import {
  GradeSummary,
  GradeSummaryRow,
  ScheduleSummary,
  UserSummary,
} from "@/lib/schemas";

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
    return <StudentGradesView title="Nilai Anak" allowStudentSelect />;
  }

  return <StudentGradesView title="Nilai Saya" allowStudentSelect={false} />;
}

function TeacherGradesView() {
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [gradeSummary, setGradeSummary] = useState<GradeSummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSchedules = async () => {
      setIsLoading(true);
      try {
        const data = await listSchedules();
        setSchedules(data);
        if (!selectedScheduleId && data.length > 0) {
          setSelectedScheduleId(data[0].id);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadSchedules();
  }, [selectedScheduleId]);

  useEffect(() => {
    const loadGrades = async () => {
      const selected = schedules.find((schedule) => schedule.id === selectedScheduleId);
      if (!selected) {
        setGradeSummary([]);
        return;
      }
      setIsLoading(true);
      try {
        const summary = await getGradesSummary({
          classId: selected.classId,
          subjectId: selected.subjectId,
        });
        setGradeSummary(summary);
      } finally {
        setIsLoading(false);
      }
    };
    loadGrades();
  }, [selectedScheduleId, schedules]);

  const classAverage = gradeSummary.length
    ? gradeSummary.reduce((sum, row) => sum + row.average, 0) / gradeSummary.length
    : 0;
  const highestAvg = gradeSummary.length
    ? Math.max(...gradeSummary.map((row) => row.average))
    : 0;
  const lowestAvg = gradeSummary.length
    ? Math.min(...gradeSummary.map((row) => row.average))
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Penilaian</h1>
          <p className="text-muted-foreground">Rekap nilai siswa berdasarkan pengumpulan tugas</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Rekap
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Siswa</p>
                <p className="text-xl font-bold">{gradeSummary.length}</p>
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

      <Card>
        <CardContent className="p-4">
          <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder={isLoading ? "Memuat jadwal..." : "Pilih jadwal..."} />
            </SelectTrigger>
            <SelectContent>
              {schedules.map((schedule) => (
                <SelectItem key={schedule.id} value={schedule.id}>
                  {schedule.className} - {schedule.subjectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Nilai</CardTitle>
          <CardDescription>Rekap rata-rata nilai per siswa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead className="text-center">Jumlah Tugas</TableHead>
                  <TableHead className="text-center">Rata-rata</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradeSummary.map((student, idx) => (
                  <TableRow key={student.studentId}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{student.studentName}</TableCell>
                    <TableCell className="text-center">{student.assignments}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-bold",
                          student.average >= 85
                            ? "bg-success/20 text-success"
                            : student.average >= 70
                            ? "bg-warning/20 text-warning"
                            : "bg-destructive/20 text-destructive"
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
                {gradeSummary.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      Belum ada data nilai
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type StudentGradesViewProps = {
  title: string;
  allowStudentSelect: boolean;
};

function StudentGradesView({ title, allowStudentSelect }: StudentGradesViewProps) {
  const [students, setStudents] = useState<UserSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [grades, setGrades] = useState<GradeSummary[]>([]);
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const showNoStudents = allowStudentSelect && !isLoading && students.length === 0;

  useEffect(() => {
    const loadBase = async () => {
      setIsLoading(true);
      try {
        const [studentsData, schedulesData] = await Promise.all([
          listStudents(),
          listSchedules(),
        ]);
        setStudents(studentsData);
        setSchedules(schedulesData);
      } finally {
        setIsLoading(false);
      }
    };
    loadBase();
  }, []);

  useEffect(() => {
    if (!students.length) {
      setSelectedStudentId("");
      return;
    }
    if (!selectedStudentId || !students.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  useEffect(() => {
    const loadGrades = async () => {
      if (!selectedStudentId) {
        setGrades([]);
        return;
      }
      setIsLoading(true);
      try {
        const data = await listGrades({ studentId: selectedStudentId });
        setGrades(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadGrades();
  }, [selectedStudentId]);

  const selectedStudent = students.find((student) => student.id === selectedStudentId);
  const classId = selectedStudent?.studentProfile?.classId ?? null;
  const teacherBySubject = useMemo(() => {
    const map = new Map<string, string>();
    schedules
      .filter((schedule) => (classId ? schedule.classId === classId : true))
      .forEach((schedule) => {
        if (!map.has(schedule.subjectId)) {
          map.set(schedule.subjectId, schedule.teacherName);
        }
      });
    return map;
  }, [schedules, classId]);

  const subjectGrades = useMemo(() => {
    const buckets = new Map<
      string,
      { subjectId: string; subjectName: string; total: number; count: number }
    >();
    grades.forEach((entry) => {
      if (entry.grade === null || entry.grade === undefined) return;
      const existing = buckets.get(entry.subjectId);
      if (existing) {
        existing.total += entry.grade;
        existing.count += 1;
      } else {
        buckets.set(entry.subjectId, {
          subjectId: entry.subjectId,
          subjectName: entry.subjectName,
          total: entry.grade,
          count: 1,
        });
      }
    });
    return Array.from(buckets.values()).map((entry) => ({
      subjectId: entry.subjectId,
      subjectName: entry.subjectName,
      assignments: entry.count,
      average: entry.count ? entry.total / entry.count : 0,
      teacherName: teacherBySubject.get(entry.subjectId) ?? "-",
    }));
  }, [grades, teacherBySubject]);

  const overallAverage = subjectGrades.length
    ? subjectGrades.reduce((sum, subject) => sum + subject.average, 0) / subjectGrades.length
    : 0;
  const totalAssignments = subjectGrades.reduce((sum, subject) => sum + subject.assignments, 0);

  const chartData = subjectGrades.map((subject) => ({
    name: subject.subjectName.slice(0, 3),
    fullName: subject.subjectName,
    value: subject.average,
  }));

  const recentGrades = grades
    .filter((grade) => grade.grade !== null && grade.grade !== undefined)
    .slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">Lihat ringkasan nilai dan perkembangan belajar</p>
        </div>
        {allowStudentSelect && (
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Pilih siswa..." />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {student.name}
                  </div>
                </SelectItem>
              ))}
              {students.length === 0 && (
                <SelectItem value="none" disabled>
                  Belum ada siswa
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {showNoStudents && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <User className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Belum ada siswa terdaftar</p>
            <p className="text-sm">Tambahkan siswa terlebih dahulu untuk melihat nilai.</p>
          </div>
        </Card>
      )}

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
                <p className="text-xl font-bold">{subjectGrades.length}</p>
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
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-xl font-bold">
                  {overallAverage >= 75 ? "Baik" : "Perlu" }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
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
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ringkasan per Mapel</CardTitle>
            <CardDescription>Detail nilai masing-masing mata pelajaran</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subjectGrades.map((subject, i) => (
                <div key={subject.subjectId} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: chartColors[i % chartColors.length] }}
                  >
                    {subject.subjectName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{subject.subjectName}</p>
                    <p className="text-xs text-muted-foreground">{subject.teacherName}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">{subject.average.toFixed(1)}</span>
                      {subject.average >= 85 && <TrendingUp className="h-4 w-4 text-success" />}
                      {subject.average < 70 && <TrendingDown className="h-4 w-4 text-destructive" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{subject.assignments} tugas</p>
                  </div>
                </div>
              ))}
              {subjectGrades.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada nilai untuk ditampilkan
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nilai Tugas Terbaru</CardTitle>
          <CardDescription>Daftar nilai dari tugas yang sudah dinilai</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentGrades.map((grade) => (
              <div key={grade.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      grade.grade >= 85
                        ? "bg-success/10"
                        : grade.grade >= 70
                        ? "bg-warning/10"
                        : "bg-destructive/10"
                    )}
                  >
                    <FileText
                      className={cn(
                        "h-5 w-5",
                        grade.grade >= 85
                          ? "text-success"
                          : grade.grade >= 70
                          ? "text-warning"
                          : "text-destructive"
                      )}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{grade.assignmentTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {grade.subjectName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      grade.grade >= 85
                        ? "text-success"
                        : grade.grade >= 70
                        ? "text-warning"
                        : "text-destructive"
                    )}
                  >
                    {grade.grade}
                  </p>
                  <p className="text-xs text-muted-foreground">/ 100</p>
                </div>
              </div>
            ))}
            {recentGrades.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada nilai yang dipublikasikan
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Memuat data nilai...</p>
      )}
    </div>
  );
}
