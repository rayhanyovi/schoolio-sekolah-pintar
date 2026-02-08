'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Calendar, Clock, Repeat } from "lucide-react";
import { CalendarEventSummary } from "@/lib/schemas";
import { EVENT_TYPES, EVENT_COLORS, EventType } from "@/lib/constants";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface EventCardProps {
  event: CalendarEventSummary;
  onEdit: (event: CalendarEventSummary) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}

export function EventCard({ event, onEdit, onDelete, canEdit }: EventCardProps) {
  const eventColor = EVENT_COLORS[event.type as EventType];
  const accent = eventColor.split(" ")[0].replace("bg-", "border-");

  return (
    <Card
      className={`group hover:shadow-md transition-all duration-300 border-l-4 ${accent}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-foreground">{event.title}</h4>
              <Badge className={eventColor}>
                {EVENT_TYPES[event.type as EventType]}
              </Badge>
              {event.isRecurring && (
                <Badge variant="outline" className="text-xs">
                  <Repeat className="h-3 w-3 mr-1" />
                  Berulang
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(event.date, "d MMM yyyy", { locale: id })}</span>
              </div>
              {event.endDate && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>s/d {format(event.endDate, "d MMM yyyy", { locale: id })}</span>
                </div>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(event)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive hover:text-destructive" 
                onClick={() => onDelete(event.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
