'use client';

import { Role, ROLES, ROLE_LABELS } from "@/lib/constants";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";

interface DebugPanelProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}

export function DebugPanel({ currentRole, onRoleChange }: DebugPanelProps) {
  const roles = Object.values(ROLES) as Role[];

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
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Role aktif:</span>
        <RoleBadge role={currentRole} size="sm" />
      </div>
    </div>
  );
}
