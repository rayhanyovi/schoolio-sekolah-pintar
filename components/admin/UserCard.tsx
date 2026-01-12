'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Role, ROLE_LABELS } from "@/lib/constants";
import { MoreVertical, Pencil, Trash2, Link2, UserCog } from "lucide-react";

interface UserCardProps {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  className?: string;
  linkedTo?: string; // For parents: child name. For students: parent name
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onLink?: (id: string) => void;
}

const roleStyles: Record<Role, string> = {
  ADMIN: "bg-role-admin/10 text-role-admin border-role-admin/20",
  TEACHER: "bg-primary/10 text-primary border-primary/20",
  STUDENT: "bg-success/10 text-success border-success/20",
  PARENT: "bg-warning/10 text-warning border-warning/20",
};

export function UserCard({
  id,
  name,
  email,
  role,
  avatar,
  className,
  linkedTo,
  onEdit,
  onDelete,
  onLink,
}: UserCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className={`group hover:shadow-md transition-all duration-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 ring-2 ring-muted">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-info text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-foreground truncate">{name}</h4>
                <p className="text-sm text-muted-foreground truncate">{email}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(id)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {(role === "STUDENT" || role === "PARENT") && (
                    <DropdownMenuItem onClick={() => onLink?.(id)}>
                      <Link2 className="h-4 w-4 mr-2" />
                      {role === "STUDENT" ? "Hubungkan ke Ortu" : "Hubungkan ke Anak"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete?.(id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={roleStyles[role]}>
                {ROLE_LABELS[role]}
              </Badge>
              {linkedTo && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Link2 className="h-3 w-3" />
                  <span>{linkedTo}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
