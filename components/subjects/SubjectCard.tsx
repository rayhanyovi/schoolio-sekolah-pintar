'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Pencil, Trash2 } from "lucide-react";
import { SubjectSummary } from "@/lib/schemas";
import { SUBJECT_CATEGORIES, SUBJECT_CATEGORY_COLORS, SubjectCategory } from "@/lib/constants";

interface SubjectCardProps {
  subject: SubjectSummary;
  onEdit: (subject: SubjectSummary) => void;
  onDelete: (id: string) => void;
}

export function SubjectCard({ subject, onEdit, onDelete }: SubjectCardProps) {
  const categoryColor = SUBJECT_CATEGORY_COLORS[subject.category as SubjectCategory];

  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">{subject.name}</h3>
              <Badge variant="outline" className="text-xs">{subject.code}</Badge>
            </div>
            <Badge className={categoryColor}>
              {SUBJECT_CATEGORIES[subject.category as SubjectCategory]}
            </Badge>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => onEdit(subject)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(subject.id)} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{subject.description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Guru Pengampu:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {subject.teachers.map((teacher) => (
              <Badge key={teacher.id} variant="secondary" className="text-xs">
                {teacher.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{subject.hoursPerWeek} jam/minggu</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {subject.classIds.length} kelas
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
