'use client';

import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, isAfter } from "date-fns";
import { id } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DAYS_OF_WEEK, DayOfWeek, ROLES } from "@/lib/constants";
import { ChevronLeft, ChevronRight, Clock, User, BookOpen, MapPin, FileText, AlertCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRoleContext } from "@/hooks/useRoleContext";
import { listAssignments } from "@/lib/handlers/assignments";
import { listClasses } from "@/lib/handlers/classes";
import {
  createTeacherAttendance,
  listAttendanceSessions,
  listTeacherAttendance,
  updateAttendanceSession,
} from "@/lib/handlers/attendance";
import { createSchedule, listSchedules } from "@/lib/handlers/schedules";
import { getScheduleTemplates } from "@/lib/handlers/settings";
import { listSubjects } from "@/lib/handlers/subjects";
import { getUser, listParents, listStudents, listTeachers } from "@/lib/handlers/users";
import {
  AssignmentSummary,
  ClassSummary,
  ScheduleSummary,
  ScheduleTemplateSummary,
  SubjectSummary,
  AttendanceSessionSummary,
  TeacherAttendanceSummary,
  UserSummary,
} from "@/lib/schemas";

// Map JS day (0=Sun, 1=Mon, etc.) to our DayOfWeek
const getDayOfWeek = (date: Date): DayOfWeek | null => {
  const jsDay = date.getDay();
  const mapping: Record<number, DayOfWeek> = {
    1: "MON",
    2: "TUE",
    3: "WED",
    4: "THU",
    5: "FRI",
    6: "SAT",
  };
  return mapping[jsDay] || null;
};

const getSchedulesForDate = (
  date: Date,
  schedules: ScheduleSummary[]
): ScheduleSummary[] => {
  const dayOfWeek = getDayOfWeek(date);
  if (!dayOfWeek) return [];
  return schedules.filter((s) => s.dayOfWeek === dayOfWeek);
};

// Get active assignments for a specific subject on/around a date
const getActiveAssignmentsForSubject = (
  subjectName: string,
  date: Date,
  assignments: AssignmentSummary[]
): AssignmentSummary[] => {
  return assignments.filter((assignment) => {
    const subjectMatch =
      assignment.subjectName.toLowerCase().includes(subjectName.toLowerCase()) ||
      subjectName.toLowerCase().includes(assignment.subjectName.toLowerCase());

    const isActive =
      assignment.status === "ACTIVE" &&
      (isAfter(assignment.dueDate, date) ||
        isSameDay(assignment.dueDate, date));

    return subjectMatch && isActive;
  });
};

const toMinutes = (value: string) => {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const hasTimeOverlap = (
  startA: string,
  endA: string,
  startB: string,
  endB: string
) => {
  const aStart = toMinutes(startA);
  const aEnd = toMinutes(endA);
  const bStart = toMinutes(startB);
  const bEnd = toMinutes(endB);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) {
    return false;
  }
  return aStart < bEnd && bStart < aEnd;
};

type ScheduleFormState = {
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: DayOfWeek | "";
  startTemplateId: string;
  endTemplateId: string;
  startTime: string;
  endTime: string;
  room: string;
};

const createEmptyScheduleForm = (classId?: string): ScheduleFormState => ({
  classId: classId ?? "",
  subjectId: "",
  teacherId: "none",
  dayOfWeek: "",
  startTemplateId: "",
  endTemplateId: "",
  startTime: "",
  endTime: "",
  room: "",
});

export default function Schedules() {
  const { role, userId } = useRoleContext();
  const { toast } = useToast();
  const isAdmin = role === ROLES.ADMIN;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
  const [validationSchedules, setValidationSchedules] = useState<ScheduleSummary[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [teachers, setTeachers] = useState<UserSummary[]>([]);
  const [scheduleTemplates, setScheduleTemplates] = useState<ScheduleTemplateSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [todaySessions, setTodaySessions] = useState<AttendanceSessionSummary[]>(
    []
  );
  const [todayTeacherAttendance, setTodayTeacherAttendance] = useState<
    TeacherAttendanceSummary[]
  >([]);
  const [assignMap, setAssignMap] = useState<Record<string, string>>({});
  const [isAssigningSubstitute, setIsAssigningSubstitute] = useState(false);
  const [formData, setFormData] = useState<ScheduleFormState>(() =>
    createEmptyScheduleForm()
  );
  const lessonTemplates = scheduleTemplates.filter((slot) => !slot.isBreak);
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const loadSchedules = async () => {
    try {
      setIsLoading(true);
      let scheduleData: ScheduleSummary[] = [];
      if (isAdmin) {
        scheduleData = await listSchedules(
          selectedClassId !== "all" ? { classId: selectedClassId } : undefined
        );
      } else if (role === ROLES.TEACHER && userId) {
        scheduleData = await listSchedules({ teacherId: userId });
      } else if (role === ROLES.STUDENT && userId) {
        const student = await getUser(userId);
        const classId = student.studentProfile?.classId ?? null;
        scheduleData = classId ? await listSchedules({ classId }) : [];
      } else if (role === ROLES.PARENT && userId) {
        const parents = await listParents();
        const parent = parents.find((item) => item.id === userId);
        const childIds = parent?.parentLinks?.map((link) => link.studentId) ?? [];
        if (childIds.length) {
          const students = await listStudents();
          const classIds = Array.from(
            new Set(
              students
                .filter((student) => childIds.includes(student.id))
                .map((student) => student.studentProfile?.classId)
                .filter(Boolean) as string[]
            )
          );
          if (classIds.length) {
            const allSchedules = await listSchedules();
            scheduleData = allSchedules.filter((schedule) =>
              classIds.includes(schedule.classId)
            );
          }
        }
      } else {
        scheduleData = await listSchedules();
      }
      setSchedules(scheduleData);
    } catch (error) {
      toast({
        title: "Gagal memuat jadwal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [selectedClassId, toast, isAdmin, role, userId]);

  useEffect(() => {
    let isActive = true;
    const loadAssignments = async () => {
      try {
        const assignmentData = await listAssignments();
        if (!isActive) return;
        setAssignments(assignmentData);
      } catch (error) {
        if (!isActive) return;
        toast({
          title: "Gagal memuat tugas",
          description: error instanceof Error ? error.message : "Terjadi kesalahan",
        });
      }
    };
    loadAssignments();
    return () => {
      isActive = false;
    };
  }, [toast]);

  useEffect(() => {
    if (!isAdmin) return;
    let isActive = true;
    const loadTodayData = async () => {
      try {
        const [sessions, attendance] = await Promise.all([
          listAttendanceSessions({ date: todayStr }),
          listTeacherAttendance({ dateFrom: todayStr, dateTo: todayStr }),
        ]);
        if (!isActive) return;
        setTodaySessions(sessions);
        setTodayTeacherAttendance(attendance);
      } catch {
        if (!isActive) return;
        setTodaySessions([]);
        setTodayTeacherAttendance([]);
      }
    };
    loadTodayData();
    return () => {
      isActive = false;
    };
  }, [isAdmin, todayStr]);

  useEffect(() => {
    if (!isAdmin) return;
    let isActive = true;
    const loadLookups = async () => {
      setIsLookupLoading(true);
      try {
        const [classData, subjectData, teacherData, templateData] = await Promise.all([
          listClasses(),
          listSubjects(),
          listTeachers(),
          getScheduleTemplates(),
        ]);
        if (!isActive) return;
        setClasses(classData);
        setSubjects(subjectData);
        setTeachers(teacherData);
        setScheduleTemplates(templateData);
      } catch (error) {
        if (!isActive) return;
        toast({
          title: "Gagal memuat data referensi",
          description: error instanceof Error ? error.message : "Terjadi kesalahan",
        });
      } finally {
        if (isActive) setIsLookupLoading(false);
      }
    };
    loadLookups();
    return () => {
      isActive = false;
    };
  }, [isAdmin, toast]);

  useEffect(() => {
    if (!isCreateOpen) return;
    setFormData(
      createEmptyScheduleForm(
        selectedClassId !== "all" ? selectedClassId : undefined
      )
    );
  }, [isCreateOpen, selectedClassId]);

  useEffect(() => {
    if (!isCreateOpen || !formData.classId) {
      setValidationSchedules([]);
      return;
    }
    if (selectedClassId === "all" || formData.classId === selectedClassId) {
      setValidationSchedules(schedules);
      return;
    }
    let isActive = true;
    const loadValidationSchedules = async () => {
      try {
        const data = await listSchedules({ classId: formData.classId });
        if (!isActive) return;
        setValidationSchedules(data);
      } catch {
        if (!isActive) return;
        setValidationSchedules([]);
      }
    };
    loadValidationSchedules();
    return () => {
      isActive = false;
    };
  }, [isCreateOpen, formData.classId, schedules, selectedClassId]);

  const conflicts = useMemo(() => {
    if (
      !formData.classId ||
      !formData.dayOfWeek ||
      !formData.startTime ||
      !formData.endTime
    ) {
      return [];
    }
    return validationSchedules.filter(
      (schedule) =>
        schedule.classId === formData.classId &&
        schedule.dayOfWeek === formData.dayOfWeek &&
        hasTimeOverlap(
          formData.startTime,
          formData.endTime,
          schedule.startTime,
          schedule.endTime
        )
    );
  }, [
    formData.classId,
    formData.dayOfWeek,
    formData.startTime,
    formData.endTime,
    validationSchedules,
  ]);

  const sessionsNeedingSubstitute = useMemo(() => {
    if (!todaySessions.length) return [];
    const absenceByTeacher = new Map<
      string,
      { allDay: boolean; sessionIds: Set<string> }
    >();
    todayTeacherAttendance.forEach((item) => {
      if (item.status !== "SICK" && item.status !== "PERMIT") return;
      const entry = absenceByTeacher.get(item.teacherId) ?? {
        allDay: false,
        sessionIds: new Set<string>(),
      };
      if (item.isAllDay) {
        entry.allDay = true;
      }
      if (item.sessionId) {
        entry.sessionIds.add(item.sessionId);
      }
      absenceByTeacher.set(item.teacherId, entry);
    });

    return todaySessions.filter((session) => {
      if (!session.teacherId) return false;
      if (session.takenByTeacherId) return false;
      const absence = absenceByTeacher.get(session.teacherId);
      if (!absence) return false;
      return absence.allDay || absence.sessionIds.has(session.id);
    });
  }, [todaySessions, todayTeacherAttendance]);

  const handleAssignSubstitute = async (sessionId: string) => {
    const teacherId = assignMap[sessionId];
    if (!teacherId) return;
    const session = todaySessions.find((item) => item.id === sessionId);
    if (!session) return;
    try {
      setIsAssigningSubstitute(true);
      await updateAttendanceSession(sessionId, {
        takenByTeacherId: teacherId,
      });
      await createTeacherAttendance({
        teacherId,
        sessionId,
        date: session.date,
        status: "PRESENT",
        isAllDay: false,
      });
      setTodaySessions((prev) =>
        prev.map((item) =>
          item.id === sessionId
            ? {
                ...item,
                takenByTeacherId: teacherId,
                takenByTeacherName:
                  teachers.find((t) => t.id === teacherId)?.name ?? "",
              }
            : item,
        ),
      );
      setAssignMap((prev) => {
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });
    } finally {
      setIsAssigningSubstitute(false);
    }
  };

  const hasConflict = conflicts.length > 0;

  const handleCreateSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.classId || !formData.subjectId || !formData.dayOfWeek) {
      toast({
        title: "Lengkapi data",
        description: "Kelas, mata pelajaran, dan hari wajib diisi.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.startTemplateId || !formData.startTime || !formData.endTime) {
      toast({
        title: "Lengkapi jam pelajaran",
        description: "Pilih jam pelajaran dari pengaturan terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }
    if (formData.endTemplateId) {
      const startIndex = lessonTemplates.findIndex(
        (slot) => slot.id === formData.startTemplateId
      );
      const endIndex = lessonTemplates.findIndex(
        (slot) => slot.id === formData.endTemplateId
      );
      if (startIndex !== -1 && endIndex !== -1 && endIndex < startIndex) {
        toast({
          title: "Jam pelajaran tidak valid",
          description: "Jam selesai tidak boleh lebih awal dari jam mulai.",
          variant: "destructive",
        });
        return;
      }
    }

    const payload = {
      classId: formData.classId,
      subjectId: formData.subjectId,
      teacherId: formData.teacherId === "none" ? null : formData.teacherId,
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      room: formData.room.trim() || null,
    };

    try {
      setIsSaving(true);
      await createSchedule(payload);
      toast({
        title: "Berhasil",
        description: "Jadwal pelajaran berhasil ditambahkan.",
      });
      setIsCreateOpen(false);
      await loadSchedules();
    } catch (error) {
      toast({
        title: "Gagal menambahkan jadwal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsSheetOpen(true);
  };

  const selectedSchedules = selectedDate
    ? getSchedulesForDate(selectedDate, schedules)
    : [];
  const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Jadwal Pelajaran</h1>
          <p className="text-muted-foreground mt-1">
            Lihat jadwal pelajaran dalam tampilan kalender
          </p>
        </div>
        {isAdmin && (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Filter kelas..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {classes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
                {classes.length === 0 && (
                  <SelectItem value="none" disabled>
                    {isLookupLoading ? "Memuat kelas..." : "Belum ada kelas"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setIsCreateOpen(true)}
              disabled={
                isLookupLoading ||
                classes.length === 0 ||
                subjects.length === 0 ||
                lessonTemplates.length === 0
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Jadwal Pelajaran
            </Button>
          </div>
        )}
      </div>

      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Sesi Membutuhkan Pengganti (Hari Ini)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionsNeedingSubstitute.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada sesi yang membutuhkan pengganti.
              </p>
            ) : (
              <div className="space-y-3">
                {sessionsNeedingSubstitute.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {session.className} • {session.subjectName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Guru asli: {session.teacherName || "-"} •{" "}
                        {session.startTime && session.endTime
                          ? `${session.startTime} - ${session.endTime}`
                          : "Waktu belum diisi"}
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2">
                      <Select
                        value={assignMap[session.id] ?? ""}
                        onValueChange={(value) =>
                          setAssignMap((prev) => ({
                            ...prev,
                            [session.id]: value,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full md:w-[220px]">
                          <SelectValue placeholder="Pilih guru pengganti..." />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </SelectItem>
                          ))}
                          {teachers.length === 0 && (
                            <SelectItem value="none" disabled>
                              Belum ada guru
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => handleAssignSubstitute(session.id)}
                        disabled={
                          isAssigningSubstitute || !assignMap[session.id]
                        }
                      >
                        Tetapkan
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Calendar Card */}
      <Card variant="elevated">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl font-semibold">
            {format(currentMonth, "MMMM yyyy", { locale: id })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Hari Ini
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {dayLabels.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-sm font-semibold text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const daySchedules = getSchedulesForDate(day, schedules);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isSunday = day.getDay() === 0;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => !isSunday && handleDateClick(day)}
                  disabled={isSunday}
                  className={cn(
                    "min-h-[100px] p-2 rounded-lg border text-left transition-all duration-200 flex flex-col",
                    isCurrentMonth
                      ? "bg-card hover:bg-accent/50"
                      : "bg-muted/30 text-muted-foreground",
                    isToday && "ring-2 ring-primary ring-offset-2",
                    isSelected && "bg-primary/10 border-primary",
                    isSunday && "opacity-50 cursor-not-allowed bg-muted/50"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium mb-1",
                      isToday && "text-primary font-bold",
                      isSunday && "text-muted-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  
                  {/* Schedule entries */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {daySchedules.slice(0, 3).map((schedule) => (
                      <div
                        key={schedule.id}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded text-white",
                          schedule.color || "bg-primary"
                        )}
                      >
                        <span className="flex items-center justify-between gap-2 w-full">
                          <span className="truncate min-w-0">
                            {schedule.subjectCode || schedule.subjectName}
                          </span>
                          {selectedClassId === "all" && schedule.className && (
                            <span className="shrink-0 text-[10px] opacity-90">
                              {schedule.className}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                    {daySchedules.length > 3 && (
                      <div className="text-xs text-muted-foreground pl-1">
                        +{daySchedules.length - 3} lainnya
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Jadwal Pelajaran</DialogTitle>
            <DialogDescription>
              Isi informasi jadwal pelajaran untuk kelas tertentu.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSchedule} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-class">Kelas</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, classId: value }))
                  }
                >
                  <SelectTrigger id="schedule-class">
                    <SelectValue placeholder="Pilih kelas..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                    {classes.length === 0 && (
                      <SelectItem value="none" disabled>
                        {isLookupLoading ? "Memuat kelas..." : "Belum ada kelas"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-subject">Mata Pelajaran</Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, subjectId: value }))
                  }
                >
                  <SelectTrigger id="schedule-subject">
                    <SelectValue placeholder="Pilih mata pelajaran..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                    {subjects.length === 0 && (
                      <SelectItem value="none" disabled>
                        {isLookupLoading
                          ? "Memuat mata pelajaran..."
                          : "Belum ada mata pelajaran"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-teacher">Guru (Opsional)</Label>
                <Select
                  value={formData.teacherId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, teacherId: value }))
                  }
                >
                  <SelectTrigger id="schedule-teacher">
                    <SelectValue placeholder="Pilih guru..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Belum ditentukan</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                    {teachers.length === 0 && (
                      <SelectItem value="none-empty" disabled>
                        {isLookupLoading ? "Memuat guru..." : "Belum ada guru"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-day">Hari</Label>
                <Select
                  value={formData.dayOfWeek}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      dayOfWeek: value as DayOfWeek,
                    }))
                  }
                >
                  <SelectTrigger id="schedule-day">
                    <SelectValue placeholder="Pilih hari..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DAYS_OF_WEEK).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-template">Jam Mulai</Label>
              <Select
                value={formData.startTemplateId}
                onValueChange={(value) => {
                  const selected = lessonTemplates.find((slot) => slot.id === value);
                  setFormData((prev) => {
                    const nextStartTime = selected?.startTime ?? "";
                    const nextStartEndTime = selected?.endTime ?? "";
                    const startIndex = lessonTemplates.findIndex(
                      (slot) => slot.id === value
                    );
                    const endIndex = lessonTemplates.findIndex(
                      (slot) => slot.id === prev.endTemplateId
                    );
                    const isEndValid =
                      prev.endTemplateId &&
                      startIndex !== -1 &&
                      endIndex !== -1 &&
                      endIndex >= startIndex;
                    return {
                      ...prev,
                      startTemplateId: value,
                      startTime: nextStartTime,
                      endTemplateId: isEndValid ? prev.endTemplateId : "",
                      endTime: isEndValid ? prev.endTime : nextStartEndTime,
                    };
                  });
                }}
              >
                <SelectTrigger id="schedule-template">
                  <SelectValue placeholder="Pilih jam pelajaran..." />
                </SelectTrigger>
                <SelectContent>
                  {lessonTemplates.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span>{slot.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  {lessonTemplates.length === 0 && (
                    <SelectItem value="none" disabled>
                      {isLookupLoading
                        ? "Memuat jam pelajaran..."
                        : "Belum ada jam pelajaran"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {formData.startTime && formData.endTime && (
                <p className="text-xs text-muted-foreground">
                  Jam: {formData.startTime} - {formData.endTime}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-template-secondary">Jam Selesai (Opsional)</Label>
              <Select
                value={formData.endTemplateId}
                onValueChange={(value) => {
                  if (value === "none") {
                    setFormData((prev) => ({
                      ...prev,
                      endTemplateId: "",
                      endTime: prev.startTemplateId
                        ? lessonTemplates.find((slot) => slot.id === prev.startTemplateId)
                            ?.endTime ?? ""
                        : "",
                    }));
                    return;
                  }
                  const selected = lessonTemplates.find((slot) => slot.id === value);
                  setFormData((prev) => {
                    const startIndex = lessonTemplates.findIndex(
                      (slot) => slot.id === prev.startTemplateId
                    );
                    const endIndex = lessonTemplates.findIndex((slot) => slot.id === value);
                    if (prev.startTemplateId && startIndex !== -1 && endIndex !== -1 && endIndex < startIndex) {
                      toast({
                        title: "Jam pelajaran tidak valid",
                        description: "Jam selesai tidak boleh lebih awal dari jam mulai.",
                        variant: "destructive",
                      });
                      return prev;
                    }
                    return {
                      ...prev,
                      endTemplateId: value,
                      endTime: selected?.endTime ?? prev.endTime,
                    };
                  });
                }}
              >
                <SelectTrigger id="schedule-template-secondary">
                  <SelectValue placeholder="Pilih jam selesai (opsional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {lessonTemplates.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span>{slot.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  {lessonTemplates.length === 0 && (
                    <SelectItem value="none-empty" disabled>
                      {isLookupLoading
                        ? "Memuat jam pelajaran..."
                        : "Belum ada jam pelajaran"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {formData.startTime && formData.endTime && formData.endTemplateId && (
                <p className="text-xs text-muted-foreground">
                  Rentang jam: {formData.startTime} - {formData.endTime}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-room">Ruangan (Opsional)</Label>
              <Input
                id="schedule-room"
                value={formData.room}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    room: event.target.value,
                  }))
                }
                placeholder="Ruang 201"
              />
            </div>

            {hasConflict && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Jadwal Bentrok</AlertTitle>
                <AlertDescription>
                  <p>
                    Pilihan jam ini sudah dipakai di kelas yang sama. Ganti jam
                    pelajaran atau hari terlebih dahulu.
                  </p>
                  <div className="mt-2 space-y-1 text-xs">
                    {conflicts.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2">
                        <span className="truncate min-w-0">
                          {item.subjectCode || item.subjectName}
                        </span>
                        <span className="shrink-0">
                          {item.startTime} - {item.endTime}
                        </span>
                      </div>
                    ))}
                    {conflicts.length > 3 && (
                      <div className="text-xs opacity-80">
                        +{conflicts.length - 3} jadwal lain bentrok
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSaving || hasConflict}>
                {isSaving ? "Menyimpan..." : "Simpan Jadwal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-xl">
              {selectedDate && (
                <>
                  <span className="text-primary">
                    {format(selectedDate, "EEEE", { locale: id })}
                  </span>
                  <span className="text-muted-foreground font-normal ml-2">
                    {format(selectedDate, "d MMMM yyyy", { locale: id })}
                  </span>
                </>
              )}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
            {selectedSchedules.length > 0 ? (
              <div className="space-y-4">
                {selectedSchedules.map((schedule, index) => (
                  <div
                    key={schedule.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: schedule.color.replace('bg-', '').includes('-') ? '' : undefined }}>
                      <div className={cn("h-1.5", schedule.color || "bg-primary")} />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{schedule.subjectName}</h3>
                            <Badge variant="outline" className="mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {schedule.startTime && schedule.endTime
                                ? `${schedule.startTime} - ${schedule.endTime}`
                                : "Waktu belum diisi"}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <span>{schedule.teacherName || "Belum ditentukan"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{schedule.room || "Belum ditentukan"}</span>
                          </div>
                        </div>

                        {/* Active Assignments Section */}
                        {selectedDate && (() => {
                          const activeAssignments = getActiveAssignmentsForSubject(
                            schedule.subjectName,
                            selectedDate,
                            assignments
                          );
                          if (activeAssignments.length === 0) return null;
                          
                          return (
                            <div className="mt-4 pt-4 border-t border-border">
                              <div className="flex items-center gap-2 mb-3">
                                <FileText className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-medium text-foreground">
                                  Tugas Aktif ({activeAssignments.length})
                                </span>
                              </div>
                              <div className="space-y-2">
                                {activeAssignments.map((assignment) => {
                                  const daysUntilDue = Math.ceil(
                                    (assignment.dueDate.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24)
                                  );
                                  const isUrgent = daysUntilDue <= 3;
                                  const assignmentKind = assignment.kind ?? assignment.type ?? "";
                                  const kindLabel =
                                    assignmentKind === "HOMEWORK"
                                      ? "PR"
                                      : assignmentKind === "PROJECT"
                                      ? "Proyek"
                                      : assignmentKind === "QUIZ"
                                      ? "Kuis"
                                      : assignmentKind === "EXAM"
                                      ? "Ujian"
                                      : assignmentKind || "Tugas";
                                  
                                  return (
                                    <div
                                      key={assignment.id}
                                      className={cn(
                                        "p-3 rounded-lg border",
                                        isUrgent 
                                          ? "bg-destructive/10 border-destructive/30" 
                                          : "bg-muted/50 border-border"
                                      )}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm text-foreground truncate">
                                            {assignment.title}
                                          </p>
                                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                            {assignment.description}
                                          </p>
                                        </div>
                                        <Badge 
                                          variant={isUrgent ? "destructive" : "secondary"}
                                          className="shrink-0 text-xs"
                                        >
                                          {kindLabel}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-2">
                                        {isUrgent && (
                                          <AlertCircle className="h-3 w-3 text-destructive" />
                                        )}
                                        <span className={cn(
                                          "text-xs",
                                          isUrgent ? "text-destructive font-medium" : "text-muted-foreground"
                                        )}>
                                          Deadline: {format(assignment.dueDate, "d MMM yyyy", { locale: id })}
                                          {daysUntilDue === 0 && " (Hari ini!)"}
                                          {daysUntilDue === 1 && " (Besok)"}
                                          {daysUntilDue > 1 && daysUntilDue <= 3 && ` (${daysUntilDue} hari lagi)`}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground font-medium">Tidak ada jadwal</p>
                <p className="text-sm text-muted-foreground/70">
                  Tidak ada pelajaran pada hari ini
                </p>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {isLoading && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Memuat jadwal...
        </p>
      )}
    </div>
  );
}
