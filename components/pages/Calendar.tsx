'use client';

import { useState, useMemo } from "react";
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
  AlertCircle
} from "lucide-react";
import { EventCard } from "@/components/calendar/EventCard";
import { EventFormDialog } from "@/components/calendar/EventFormDialog";
import { mockEvents, CalendarEvent } from "@/lib/mockData";
import { EVENT_TYPES, EVENT_COLORS, EventType } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useRoleContext } from "@/hooks/useRoleContext";
import { format, isSameDay, isSameMonth, addMonths, subMonths, isAfter, isBefore, addDays } from "date-fns";
import { id } from "date-fns/locale";

export default function AcademicCalendar() {
  const { role } = useRoleContext();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedType, setSelectedType] = useState<string>("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const canEdit = role === "ADMIN" || role === "TEACHER";

  // Filter events by type
  const filteredEvents = events.filter(e => 
    selectedType === "all" || e.type === selectedType
  );

  // Events for selected date
  const eventsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter(e => isSameDay(e.date, selectedDate));
  }, [selectedDate, filteredEvents]);

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    return filteredEvents
      .filter(e => isAfter(e.date, today) && isBefore(e.date, nextWeek))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filteredEvents]);

  // Get dates with events for calendar highlighting
  const datesWithEvents = useMemo(() => {
    return filteredEvents.map(e => e.date);
  }, [filteredEvents]);

  const handleSubmit = (data: Partial<CalendarEvent>) => {
    if (selectedEvent) {
      setEvents(events.map(e => e.id === selectedEvent.id ? { ...e, ...data } as CalendarEvent : e));
      toast({ title: "Berhasil", description: "Event berhasil diperbarui" });
    } else {
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: data.title || "",
        description: data.description || "",
        date: data.date || new Date(),
        endDate: data.endDate,
        type: data.type || "ACADEMIC",
        isRecurring: data.isRecurring || false,
        createdBy: "current-user",
      };
      setEvents([...events, newEvent]);
      toast({ title: "Berhasil", description: "Event baru berhasil ditambahkan" });
    }
    setSelectedEvent(null);
  };

  const handleDelete = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
    toast({ title: "Berhasil", description: "Event berhasil dihapus" });
  };

  const handleEdit = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setFormDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kalender Akademik</h1>
          <p className="text-muted-foreground">Jadwal kegiatan dan event sekolah</p>
        </div>
        {canEdit && (
          <Button onClick={() => { setSelectedEvent(null); setFormDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Event
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs defaultValue="all" onValueChange={setSelectedType}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          {Object.entries(EVENT_TYPES).map(([key, label]) => (
            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
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
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
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
              className="rounded-md border p-3"
              modifiers={{
                hasEvent: datesWithEvents,
              }}
              modifiersClassNames={{
                hasEvent: "bg-primary/20 font-semibold",
              }}
            />

            {/* Events on selected date */}
            {selectedDate && (
              <div className="mt-6 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  Event pada {format(selectedDate, "d MMMM yyyy", { locale: id })}
                </h4>
                {eventsOnSelectedDate.length > 0 ? (
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
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Tidak ada event pada tanggal ini
                  </p>
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
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedDate(event.date)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{event.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(event.date, "d MMM yyyy", { locale: id })}
                            </p>
                          </div>
                          <Badge className={`${EVENT_COLORS[event.type as EventType]} text-xs`}>
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
                    <div className={`w-3 h-3 rounded-full ${EVENT_COLORS[key as EventType].split(" ")[0]}`} />
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
