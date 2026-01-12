'use client';

import { useState } from "react";
import { ROLES, ATTENDANCE_STATUS, AttendanceStatus } from "@/lib/constants";
import { useRoleContext } from "@/hooks/useRoleContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock,
  Users,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Thermometer,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { id } from "date-fns/locale";


// Demo data for teacher view
const demoSessions = [
  { id: "1", className: "X-A", subject: "Matematika", time: "07:30 - 09:00", date: new Date() },
  { id: "2", className: "X-B", subject: "Matematika", time: "09:15 - 10:45", date: new Date() },
  { id: "3", className: "XI-A", subject: "Fisika", time: "11:00 - 12:30", date: new Date() },
];

const demoStudents = [
  { id: "1", name: "Ahmad Rizki", status: "PRESENT" as AttendanceStatus },
  { id: "2", name: "Budi Santoso", status: "PRESENT" as AttendanceStatus },
  { id: "3", name: "Citra Dewi", status: "ABSENT" as AttendanceStatus },
  { id: "4", name: "Dian Purnama", status: "SICK" as AttendanceStatus },
  { id: "5", name: "Eka Wijaya", status: "PRESENT" as AttendanceStatus },
  { id: "6", name: "Fitri Handayani", status: "PERMIT" as AttendanceStatus },
  { id: "7", name: "Galih Pratama", status: "PRESENT" as AttendanceStatus },
  { id: "8", name: "Hana Safitri", status: "PRESENT" as AttendanceStatus },
];

// Demo data for student view
const demoStudentAttendance = [
  { date: new Date(2025, 0, 2), status: "PRESENT" as AttendanceStatus, subject: "Matematika" },
  { date: new Date(2025, 0, 3), status: "PRESENT" as AttendanceStatus, subject: "Bahasa Indonesia" },
  { date: new Date(2025, 0, 4), status: "SICK" as AttendanceStatus, subject: "Fisika" },
  { date: new Date(2025, 0, 5), status: "PRESENT" as AttendanceStatus, subject: "Kimia" },
  { date: new Date(2025, 0, 6), status: "PERMIT" as AttendanceStatus, subject: "Biologi" },
];

const statusConfig: Record<AttendanceStatus, { icon: typeof CheckCircle2; color: string; bgColor: string }> = {
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
    return <ParentAttendanceView />;
  }
  
  return <StudentAttendanceView />;
}

function TeacherAttendanceView() {
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [students, setStudents] = useState(demoStudents);

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setStudents(prev => 
      prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s)
    );
  };

  const handleBulkAction = (status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const counts = {
    PRESENT: students.filter(s => s.status === "PRESENT").length,
    ABSENT: students.filter(s => s.status === "ABSENT").length,
    SICK: students.filter(s => s.status === "SICK").length,
    PERMIT: students.filter(s => s.status === "PERMIT").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Absensi Kelas</h1>
        <p className="text-muted-foreground">Rekam kehadiran siswa untuk setiap sesi pelajaran</p>
      </div>

      {/* Session Picker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Pilih Sesi</CardTitle>
          <CardDescription>Pilih kelas dan mata pelajaran untuk hari ini</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Pilih sesi pelajaran..." />
            </SelectTrigger>
            <SelectContent>
              {demoSessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{session.className}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{session.subject}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{session.time}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedSession && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.entries(counts) as [AttendanceStatus, number][]).map(([status, count]) => {
              const config = statusConfig[status];
              const Icon = config.icon;
              return (
                <Card key={status} className={cn("border-l-4", config.bgColor)} style={{ borderLeftColor: `hsl(var(--${status === 'PRESENT' ? 'success' : status === 'ABSENT' ? 'destructive' : status === 'SICK' ? 'warning' : 'info'}))` }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{ATTENDANCE_STATUS[status]}</p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                      <Icon className={cn("h-8 w-8", config.color)} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Bulk Actions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Daftar Siswa</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction("PRESENT")}>
                    <Check className="h-4 w-4 mr-1" />
                    Semua Hadir
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction("ABSENT")}>
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
                      <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                      <span className="font-medium">{student.name}</span>
                    </div>
                    <div className="flex gap-1">
                      {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
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
                            onClick={() => handleStatusChange(student.id, status)}
                            title={ATTENDANCE_STATUS[status]}
                          >
                            <Icon className="h-4 w-4" />
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t flex justify-end">
                <Button>
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

function StudentAttendanceView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate stats
  const stats = {
    total: 20,
    present: 16,
    absent: 1,
    sick: 2,
    permit: 1,
  };

  const attendanceRate = Math.round((stats.present / stats.total) * 100);

  const getStatusForDate = (date: Date): AttendanceStatus | null => {
    const record = demoStudentAttendance.find(a => isSameDay(a.date, date));
    return record?.status || null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kehadiran Saya</h1>
        <p className="text-muted-foreground">Lihat ringkasan dan riwayat kehadiran Anda</p>
      </div>

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
        
        {(Object.entries({ PRESENT: stats.present, ABSENT: stats.absent, SICK: stats.sick, PERMIT: stats.permit }) as [AttendanceStatus, number][]).map(([status, count]) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", config.bgColor)}>
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{ATTENDANCE_STATUS[status]}</p>
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
                  onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[120px] text-center">
                  {format(currentMonth, "MMMM yyyy", { locale: id })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month start */}
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
                    <span className={cn(
                      "font-medium",
                      config?.color,
                      !isSameMonth(day, currentMonth) && "text-muted-foreground/50"
                    )}>
                      {format(day, "d")}
                    </span>
                    {status && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                        {config && <config.icon className={cn("h-3 w-3", config.color)} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              {(Object.entries(statusConfig) as [AttendanceStatus, typeof statusConfig[AttendanceStatus]][]).map(([status, config]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={cn("h-4 w-4 rounded", config.bgColor)}>
                    <config.icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <span className="text-xs text-muted-foreground">{ATTENDANCE_STATUS[status]}</span>
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
              {demoStudentAttendance
                .filter(a => a.status !== "PRESENT")
                .map((record, i) => {
                  const config = statusConfig[record.status];
                  return (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", config.bgColor)}>
                        <config.icon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{record.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(record.date, "EEEE, d MMMM", { locale: id })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {ATTENDANCE_STATUS[record.status]}
                      </Badge>
                    </div>
                  );
                })}
              
              {demoStudentAttendance.filter(a => a.status !== "PRESENT").length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada ketidakhadiran bulan ini 🎉
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ParentAttendanceView() {
  // Parent sees the same as student but for their children
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kehadiran Anak</h1>
        <p className="text-muted-foreground">Pantau kehadiran anak Anda di sekolah</p>
      </div>

      {/* Child Selector */}
      <Card>
        <CardContent className="p-4">
          <Select defaultValue="1">
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Pilih anak..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Ahmad Rizki - Kelas X-A</SelectItem>
              <SelectItem value="2">Siti Aisyah - Kelas VII-B</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Reuse StudentAttendanceView content */}
      <StudentAttendanceView />
    </div>
  );
}
