'use client';

import { Role, ROLES, ROLE_LABELS } from "@/lib/constants";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listParents, listStudents, listTeachers } from "@/lib/handlers/users";
import { UserSummary } from "@/lib/schemas";
import { Bug } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface DebugPanelProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  selectedUserId: string;
  onUserChange: (id: string, name: string) => void;
}

export function DebugPanel({
  currentRole,
  onRoleChange,
  selectedUserId,
  onUserChange,
}: DebugPanelProps) {
  const roles = Object.values(ROLES) as Role[];
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (
      currentRole !== ROLES.TEACHER &&
      currentRole !== ROLES.STUDENT &&
      currentRole !== ROLES.PARENT
    ) {
      setUsers([]);
      return;
    }
    let isActive = true;
    setIsLoadingUsers(true);
    const loadUsers = async () => {
      try {
        const data =
          currentRole === ROLES.TEACHER
            ? await listTeachers()
            : currentRole === ROLES.PARENT
            ? await listParents()
            : await listStudents();
        if (!isActive) return;
        setUsers(data);
      } finally {
        if (isActive) setIsLoadingUsers(false);
      }
    };
    loadUsers();
    return () => {
      isActive = false;
    };
  }, [currentRole]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  useEffect(() => {
    if (!users.length) return;
    if (!selectedUserId || !selectedUser) {
      const first = users[0];
      onUserChange(first.id, first.name);
    }
  }, [users, selectedUserId, selectedUser, onUserChange]);

  return (
    <div className="h-12 bg-warning/10 border-b border-warning/30 px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 text-sm text-warning-foreground">
        <Bug className="h-4 w-4" />
        <span className="font-medium">Debug Mode</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">Lihat sebagai:</span>
        {roles.map((role) => (
          <Button
            key={role}
            variant={currentRole === role ? "default" : "outline"}
            size="sm"
            onClick={() => onRoleChange(role)}
            className="h-7 text-xs"
          >
            {ROLE_LABELS[role]}
          </Button>
        ))}
        {(currentRole === ROLES.TEACHER ||
          currentRole === ROLES.STUDENT ||
          currentRole === ROLES.PARENT) && (
          <Select
            value={selectedUserId}
            onValueChange={(value) => {
              const user = users.find((item) => item.id === value);
              if (user) onUserChange(user.id, user.name);
            }}
            disabled={isLoadingUsers}
          >
            <SelectTrigger className="h-7 w-[200px]">
              <SelectValue
                placeholder={
                  isLoadingUsers ? "Memuat..." : "Pilih pengguna"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
              {users.length === 0 && (
                <SelectItem value="none" disabled>
                  Tidak ada data
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Role aktif:</span>
        <RoleBadge role={currentRole} size="sm" />
      </div>
    </div>
  );
}
