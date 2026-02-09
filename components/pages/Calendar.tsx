"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  AlertCircle,
} from "lucide-react";
import { EventCard } from "@/components/calendar/EventCard";
import { EventFormDialog } from "@/components/calendar/EventFormDialog";
import {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
} from "@/lib/handlers/calendar";
import { CalendarEventSummary } from "@/lib/schemas";
import { EVENT_TYPES, EVENT_COLORS, EventType } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useRoleContext } from "@/hooks/useRoleContext";
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { id } from "date-fns/locale";

export default function AcademicCalendar() {
  const { role } = useRoleContext();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [selectedType, setSelectedType] = useState<string>("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEventSummary | null>(null);

  const canEdit = role === "ADMIN" || role === "TEACHER";

  const loadEvents = async (month: Date) => {
    try {
      setIsLoading(true);
      const from = startOfMonth(month).toISOString();
      const to = addDays(endOfMonth(month), 7).toISOString();
      const data = await listEvents({ dateFrom: from, dateTo: to });
      setEvents(data);
    } catch (error) {
      toast({
        title: "Gagal memuat event",
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents(currentMonth);
  }, [currentMonth]);

  // Filter events by type
  const filteredEvents = events.filter(
    (e) => selectedType === "all" || e.type === selectedType,
  );

  // Events for selected date
  const eventsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter((e) => isSameDay(e.date, selectedDate));
  }, [selectedDate, filteredEvents]);

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    return filteredEvents
      .filter((e) => isAfter(e.date, today) && isBefore(e.date, nextWeek))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filteredEvents]);

  const eventTypeMap = useMemo(() => {
    const map = new Map<string, Set<EventType>>();
    filteredEvents.forEach((event) => {
      const key = format(event.date, "yyyy-MM-dd");
      const entry = map.get(key) ?? new Set<EventType>();
      entry.add(event.type as EventType);
      map.set(key, entry);
    });
    return map;
  }, [filteredEvents]);

  const dayHighlightTypeMap = useMemo(() => {
    const priority: EventType[] = ["HOLIDAY", "DEADLINE", "ACTIVITY", "ACADEMIC"];
    const map = new Map<string, EventType>();
    eventTypeMap.forEach((types, key) => {
      const winner = priority.find((type) => types.has(type));
      if (winner) map.set(key, winner);
    });
    return map;
  }, [eventTypeMap]);

  const dayModifiers = useMemo(
    () => ({
      holiday: (date: Date) =>
        dayHighlightTypeMap.get(format(date, "yyyy-MM-dd")) === "HOLIDAY",
      deadline: (date: Date) =>
        dayHighlightTypeMap.get(format(date, "yyyy-MM-dd")) === "DEADLINE",
      activity: (date: Date) =>
        dayHighlightTypeMap.get(format(date, "yyyy-MM-dd")) === "ACTIVITY",
      academic: (date: Date) =>
        dayHighlightTypeMap.get(format(date, "yyyy-MM-dd")) === "ACADEMIC",
    }),
    [dayHighlightTypeMap],
  );

  const handleSubmit = async (data: Partial<CalendarEventSummary>) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        date: data.date,
        endDate: data.endDate,
        type: data.type,
        isRecurring: data.isRecurring,
      };
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, payload);
        toast({ title: "Berhasil", description: "Event berhasil diperbarui" });
      } else {
        await createEvent(payload);
        toast({
          title: "Berhasil",
          description: "Event baru berhasil ditambahkan",
        });
      }
      setSelectedEvent(null);
      await loadEvents(currentMonth);
    } catch (error) {
      toast({
        title: "Gagal menyimpan event",
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      toast({ title: "Berhasil", description: "Event berhasil dihapus" });
      await loadEvents(currentMonth);
    } catch (error) {
      toast({
        title: "Gagal menghapus event",
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    }
  };

  const handleEdit = (event: CalendarEventSummary) => {
    setSelectedEvent(event);
    setFormDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Kalender Akademik
          </h1>
          <p className="text-muted-foreground">
            Jadwal kegiatan dan event sekolah
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              setSelectedEvent(null);
              setFormDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Event
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs defaultValue="all" onValueChange={setSelectedType}>
        <TabsList className="h-10 w-full flex-nowrap overflow-x-auto rounded-full bg-muted/40 p-1">
          <TabsTrigger
            value="all"
            className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Semua
          </TabsTrigger>
          {Object.entries(EVENT_TYPES).map(([key, label]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {format(currentMonth, "MMMM yyyy", { locale: id })}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
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
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              modifiers={dayModifiers}
              className="rounded-md p-3"
              modifiersClassNames={{
                holiday:
                  "[&>button]:bg-destructive/20 [&>button]:text-destructive [&>button]:font-semibold",
                deadline:
                  "[&>button]:bg-warning/25 [&>button]:text-warning [&>button]:font-semibold",
                activity: "[&>button]:bg-secondary/40",
                academic: "[&>button]:bg-primary/20 [&>button]:text-primary",
              }}
              classNames={{
                months: "flex flex-col space-y-4",
                month: "space-y-3",
                head_row: "flex w-full justify-between",
                head_cell:
                  "text-muted-foreground rounded-md w-12 font-medium text-[0.75rem] uppercase tracking-wide",
                row: "flex w-full justify-between mt-2",
                cell: "h-12 w-12 text-center text-sm p-0 relative focus-within:z-20",
                day: "h-12 w-12 p-0 rounded-lg transition-colors",
                day_button:
                  "h-full w-full rounded-lg p-0 flex items-center justify-center hover:bg-muted/50",
                day_selected:
                  "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:focus:bg-primary",
                day_today:
                  "[&>button]:border [&>button]:border-primary/60 [&>button]:text-primary [&>button]:font-semibold",
                day_outside: "text-muted-foreground/40",
                day_disabled: "text-muted-foreground opacity-30",
              }}
            />

            {/* Events on selected date */}
            {selectedDate && (
              <div className="mt-6 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  Event pada{" "}
                  {format(selectedDate, "d MMMM yyyy", { locale: id })}
                </h4>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                    Memuat event...
                  </div>
                ) : eventsOnSelectedDate.length > 0 ? (
                  <div className="space-y-2">
                    {eventsOnSelectedDate.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        canEdit={canEdit}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                    Tidak ada event pada tanggal ini
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Event Mendatang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Memuat event...
                    </p>
                  </div>
                ) : upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg border hover:bg-muted/40 cursor-pointer transition-colors"
                        onClick={() => setSelectedDate(event.date)}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`${EVENT_COLORS[event.type as EventType].split(" ")[0]} mt-1 h-2 w-2 rounded-full`}
                          />
                          <div className="flex-1 space-y-1">
                            <p className="font-medium text-sm">{event.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(event.date, "d MMM yyyy", { locale: id })}
                            </p>
                          </div>
                          <Badge
                            className={`${EVENT_COLORS[event.type as EventType]} text-xs`}
                          >
                            {EVENT_TYPES[event.type as EventType]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Tidak ada event dalam 7 hari ke depan
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Legenda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(EVENT_TYPES).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${EVENT_COLORS[key as EventType].split(" ")[0]}`}
                    />
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog */}
      <EventFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        event={selectedEvent}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
