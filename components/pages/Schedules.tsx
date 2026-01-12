'use client';

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, isAfter, isBefore, addDays } from "date-fns";
import { id } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DAYS_OF_WEEK, DayOfWeek } from "@/lib/constants";
import { ChevronLeft, ChevronRight, Clock, User, BookOpen, MapPin, FileText, AlertCircle } from "lucide-react";
import { mockAssignments, Assignment } from "@/lib/mockData";

// Demo schedule data
interface ScheduleEntry {
  id: string;
  subject: string;
  teacher: string;
  time: string;
  startTime: string;
  endTime: string;
  room: string;
  dayOfWeek: DayOfWeek;
  color: string;
}

const demoSchedules: ScheduleEntry[] = [
  { id: "1", subject: "Matematika", teacher: "Pak Budi Santoso", time: "07:00 - 08:30", startTime: "07:00", endTime: "08:30", room: "Ruang 101", dayOfWeek: "MON", color: "bg-blue-500" },
  { id: "2", subject: "Bahasa Indonesia", teacher: "Bu Sari Dewi", time: "08:45 - 10:15", startTime: "08:45", endTime: "10:15", room: "Ruang 101", dayOfWeek: "MON", color: "bg-emerald-500" },
  { id: "3", subject: "Fisika", teacher: "Pak Ahmad Wijaya", time: "10:30 - 12:00", startTime: "10:30", endTime: "12:00", room: "Lab Fisika", dayOfWeek: "MON", color: "bg-purple-500" },
  { id: "4", subject: "Bahasa Inggris", teacher: "Bu Dewi Lestari", time: "07:00 - 08:30", startTime: "07:00", endTime: "08:30", room: "Ruang 102", dayOfWeek: "TUE", color: "bg-amber-500" },
  { id: "5", subject: "Kimia", teacher: "Pak Hendra", time: "08:45 - 10:15", startTime: "08:45", endTime: "10:15", room: "Lab Kimia", dayOfWeek: "TUE", color: "bg-rose-500" },
  { id: "6", subject: "Biologi", teacher: "Bu Ratna", time: "10:30 - 12:00", startTime: "10:30", endTime: "12:00", room: "Lab Biologi", dayOfWeek: "TUE", color: "bg-teal-500" },
  { id: "7", subject: "Sejarah", teacher: "Pak Joko", time: "07:00 - 08:30", startTime: "07:00", endTime: "08:30", room: "Ruang 103", dayOfWeek: "WED", color: "bg-orange-500" },
  { id: "8", subject: "Geografi", teacher: "Bu Maya", time: "08:45 - 10:15", startTime: "08:45", endTime: "10:15", room: "Ruang 103", dayOfWeek: "WED", color: "bg-cyan-500" },
  { id: "9", subject: "Ekonomi", teacher: "Pak Bambang", time: "10:30 - 12:00", startTime: "10:30", endTime: "12:00", room: "Ruang 104", dayOfWeek: "WED", color: "bg-indigo-500" },
  { id: "10", subject: "PKN", teacher: "Bu Ani", time: "07:00 - 08:30", startTime: "07:00", endTime: "08:30", room: "Ruang 101", dayOfWeek: "THU", color: "bg-pink-500" },
  { id: "11", subject: "Matematika", teacher: "Pak Budi Santoso", time: "08:45 - 10:15", startTime: "08:45", endTime: "10:15", room: "Ruang 101", dayOfWeek: "THU", color: "bg-blue-500" },
  { id: "12", subject: "Seni Budaya", teacher: "Pak Rudi", time: "10:30 - 12:00", startTime: "10:30", endTime: "12:00", room: "Ruang Seni", dayOfWeek: "THU", color: "bg-violet-500" },
  { id: "13", subject: "Olahraga", teacher: "Pak Dedi", time: "07:00 - 08:30", startTime: "07:00", endTime: "08:30", room: "Lapangan", dayOfWeek: "FRI", color: "bg-green-500" },
  { id: "14", subject: "Bahasa Indonesia", teacher: "Bu Sari Dewi", time: "08:45 - 10:15", startTime: "08:45", endTime: "10:15", room: "Ruang 102", dayOfWeek: "FRI", color: "bg-emerald-500" },
  { id: "15", subject: "Fisika", teacher: "Pak Ahmad Wijaya", time: "10:30 - 12:00", startTime: "10:30", endTime: "12:00", room: "Lab Fisika", dayOfWeek: "SAT", color: "bg-purple-500" },
];

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

const getSchedulesForDate = (date: Date): ScheduleEntry[] => {
  const dayOfWeek = getDayOfWeek(date);
  if (!dayOfWeek) return [];
  return demoSchedules.filter((s) => s.dayOfWeek === dayOfWeek);
};

// Get active assignments for a specific subject on/around a date
const getActiveAssignmentsForSubject = (subjectName: string, date: Date): Assignment[] => {
  return mockAssignments.filter((assignment) => {
    // Match subject name (case insensitive partial match)
    const subjectMatch = 
      assignment.subjectName.toLowerCase().includes(subjectName.toLowerCase()) ||
      subjectName.toLowerCase().includes(assignment.subjectName.toLowerCase());
    
    // Check if assignment is still active (due date is after or on the selected date)
    const isActive = assignment.status === "ACTIVE" && 
      (isAfter(assignment.dueDate, date) || isSameDay(assignment.dueDate, date));
    
    return subjectMatch && isActive;
  });
};

export default function Schedules() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsSheetOpen(true);
  };

  const selectedSchedules = selectedDate ? getSchedulesForDate(selectedDate) : [];
  const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Jadwal Pelajaran</h1>
        <p className="text-muted-foreground mt-1">Lihat jadwal pelajaran dalam tampilan kalender</p>
      </div>

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
              const schedules = getSchedulesForDate(day);
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
                    {schedules.slice(0, 3).map((schedule) => (
                      <div
                        key={schedule.id}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded text-white truncate",
                          schedule.color
                        )}
                      >
                        {schedule.subject}
                      </div>
                    ))}
                    {schedules.length > 3 && (
                      <div className="text-xs text-muted-foreground pl-1">
                        +{schedules.length - 3} lainnya
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
                      <div className={cn("h-1.5", schedule.color)} />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{schedule.subject}</h3>
                            <Badge variant="outline" className="mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {schedule.time}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <span>{schedule.teacher}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{schedule.room}</span>
                          </div>
                        </div>

                        {/* Active Assignments Section */}
                        {selectedDate && (() => {
                          const assignments = getActiveAssignmentsForSubject(schedule.subject, selectedDate);
                          if (assignments.length === 0) return null;
                          
                          return (
                            <div className="mt-4 pt-4 border-t border-border">
                              <div className="flex items-center gap-2 mb-3">
                                <FileText className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-medium text-foreground">
                                  Tugas Aktif ({assignments.length})
                                </span>
                              </div>
                              <div className="space-y-2">
                                {assignments.map((assignment) => {
                                  const daysUntilDue = Math.ceil(
                                    (assignment.dueDate.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24)
                                  );
                                  const isUrgent = daysUntilDue <= 3;
                                  
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
                                          {assignment.type === "HOMEWORK" && "PR"}
                                          {assignment.type === "PROJECT" && "Proyek"}
                                          {assignment.type === "QUIZ" && "Kuis"}
                                          {assignment.type === "EXAM" && "Ujian"}
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
    </div>
  );
}
