'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserCircle, Pencil, Trash2, Eye } from "lucide-react";
import { ClassSummary } from "@/lib/schemas";

interface ClassCardProps {
  classData: ClassSummary;
  onEdit: (classData: ClassSummary) => void;
  onDelete: (id: string) => void;
  onViewDetails: (classData: ClassSummary) => void;
}

export function ClassCard({ classData, onEdit, onDelete, onViewDetails }: ClassCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground">{classData.name}</h3>
            <Badge variant="secondary" className="mt-1">
              Kelas {classData.grade}
            </Badge>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => onViewDetails(classData)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onEdit(classData)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(classData.id)} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <UserCircle className="h-4 w-4" />
          <span className="text-sm">{classData.homeroomTeacher}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{classData.studentCount} Siswa</span>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">
            L: {classData.maleCount}
          </Badge>
          <Badge variant="outline" className="text-xs">
            P: {classData.femaleCount}
          </Badge>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Tahun Ajaran: {classData.academicYear}
        </div>
      </CardContent>
    </Card>
  );
}
