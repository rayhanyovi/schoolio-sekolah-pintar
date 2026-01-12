'use client';

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { DebugPanel } from "./DebugPanel";
import { Role, ROLES } from "@/lib/constants";
import { RoleProvider } from "@/hooks/useRoleContext";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  initialRole?: Role;
  userName?: string;
  children?: React.ReactNode;
}

export function DashboardLayout({ 
  initialRole = ROLES.STUDENT, 
  userName = "Pengguna Demo",
  children,
}: DashboardLayoutProps) {
  const [role, setRole] = useState<Role>(initialRole);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar role={role} userName={userName} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Debug Panel */}
        <DebugPanel currentRole={role} onRoleChange={setRole} />

        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari..."
                className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <RoleProvider role={role}>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </RoleProvider>
      </div>
    </div>
  );
}
