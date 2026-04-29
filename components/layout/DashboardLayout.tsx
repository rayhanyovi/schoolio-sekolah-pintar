'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { DebugPanel } from "./DebugPanel";
import { Role, ROLES } from "@/lib/constants";
import { RoleProvider } from "@/hooks/useRoleContext";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HelpMenu } from "@/components/help/HelpMenu";
import { apiGet } from "@/lib/api-client";
import { isDemoModeEnabled } from "@/lib/demo-mode";

type SessionResponse = {
  userId: string;
  name: string;
  role: Role;
  canUseDebugPanel: boolean;
  isDemo: boolean;
  demoInstanceId: string | null;
};

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
  const router = useRouter();
  const [role, setRole] = useState<Role>(initialRole);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isDemoSession, setIsDemoSession] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserName, setSelectedUserName] = useState<string>(userName);
  const shouldShowDemoRibbon = isDemoModeEnabled() && isDemoSession;

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const session = await apiGet<SessionResponse>("/api/auth/session");
        if (!isMounted) return;
        setRole(session.role);
        setShowDebugPanel(session.canUseDebugPanel);
        setIsDemoSession(session.isDemo);
        setSelectedUserId(session.userId);
        setSelectedUserName(session.name);
      } catch {
        if (!isMounted) return;
        router.replace("/auth");
      } finally {
        if (!isMounted) return;
        setIsSessionReady(true);
      }
    };

    loadSession();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole);
    setSelectedUserId("");
    setSelectedUserName(userName);
  };

  const handleUserChange = (id: string, name: string) => {
    setSelectedUserId(id);
    setSelectedUserName(name);
  };

  if (!isSessionReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Memuat sesi…
      </div>
    );
  }

  return (
    <div className="dashboard-shell flex h-screen bg-background">
      <a
        href="#dashboard-main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Lewati ke konten utama
      </a>
      <Sidebar role={role} userName={selectedUserName} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Debug Panel */}
        {showDebugPanel && (
          <DebugPanel
            currentRole={role}
            onRoleChange={handleRoleChange}
            selectedUserId={selectedUserId}
            onUserChange={handleUserChange}
          />
        )}

        {/* Top Bar */}
        <header className="dashboard-topbar h-16 border-b border-border/80 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Cari di dashboard"
                autoComplete="off"
                name="dashboard-search"
                placeholder="Cari…"
                className="pl-10 border-input/80 bg-background/80 focus-visible:ring-1 focus-visible:ring-ring/50"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <HelpMenu role={role} />
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Lihat notifikasi"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <RoleProvider role={role} userId={selectedUserId} userName={selectedUserName}>
          <main id="dashboard-main" className="relative flex-1 overflow-auto p-6">
            {shouldShowDemoRibbon && (
              <div className="sticky top-0 z-20 mb-4 flex justify-end pointer-events-none">
                <div className="rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-2 text-right shadow-sm dark:border-amber-400/30 dark:bg-amber-950/40">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    Demo App
                  </p>
                  <p className="text-xs text-amber-800/80 dark:text-amber-100/75">
                    Full version is still ongoing
                  </p>
                </div>
              </div>
            )}
            <div className="mx-auto w-full max-w-7xl">
              {children}
            </div>
          </main>
        </RoleProvider>
      </div>
    </div>
  );
}
