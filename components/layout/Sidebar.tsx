'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { RoleBadge } from "@/components/RoleBadge";
import { Role, ROLES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  BookOpen,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  GraduationCap,
  School,
  Library,
  CalendarDays,
  MessageSquare,
  StickyNote,
  User,
  Layers,
} from "lucide-react";

interface SidebarProps {
  role: Role;
  userName: string;
}

const menuItems: Record<Role, Array<{ icon: typeof LayoutDashboard; label: string; href: string }>> = {
  ADMIN: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Pengguna", href: "/dashboard/users" },
    { icon: School, label: "Kelas", href: "/dashboard/classes" },
    { icon: Layers, label: "Jurusan", href: "/dashboard/majors" },
    { icon: GraduationCap, label: "Mata Pelajaran", href: "/dashboard/subjects" },
    { icon: Calendar, label: "Jadwal", href: "/dashboard/schedules" },
    { icon: CalendarDays, label: "Kalender Akademik", href: "/dashboard/calendar" },
    { icon: ClipboardCheck, label: "Absensi", href: "/dashboard/attendance" },
    { icon: Settings, label: "Pengaturan", href: "/dashboard/settings" },
  ],
  TEACHER: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Calendar, label: "Jadwal Saya", href: "/dashboard/schedules" },
    { icon: ClipboardCheck, label: "Absensi", href: "/dashboard/attendance" },
    { icon: BookOpen, label: "Materi", href: "/dashboard/materials" },
    { icon: FileText, label: "Tugas", href: "/dashboard/assignments" },
    { icon: Library, label: "Bank Soal", href: "/dashboard/question-bank" },
    { icon: BarChart3, label: "Penilaian", href: "/dashboard/grades" },
    { icon: CalendarDays, label: "Kalender", href: "/dashboard/calendar" },
    { icon: MessageSquare, label: "Forum", href: "/dashboard/forum" },
    { icon: StickyNote, label: "Catatan", href: "/dashboard/notes" },
  ],
  STUDENT: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Calendar, label: "Jadwal", href: "/dashboard/schedules" },
    { icon: ClipboardCheck, label: "Kehadiran", href: "/dashboard/attendance" },
    { icon: BookOpen, label: "Materi", href: "/dashboard/materials" },
    { icon: FileText, label: "Tugas", href: "/dashboard/assignments" },
    { icon: BarChart3, label: "Nilai", href: "/dashboard/grades" },
    { icon: CalendarDays, label: "Kalender", href: "/dashboard/calendar" },
    { icon: MessageSquare, label: "Forum", href: "/dashboard/forum" },
    { icon: StickyNote, label: "Catatan", href: "/dashboard/notes" },
  ],
  PARENT: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: ClipboardCheck, label: "Kehadiran Anak", href: "/dashboard/attendance" },
    { icon: FileText, label: "Tugas Anak", href: "/dashboard/assignments" },
    { icon: BarChart3, label: "Nilai Anak", href: "/dashboard/grades" },
    { icon: CalendarDays, label: "Kalender", href: "/dashboard/calendar" },
  ],
};

export function Sidebar({ role, userName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const items = menuItems[role];

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <Logo size="sm" showText={!collapsed} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", collapsed && "mx-auto")} />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="mb-3">
            <Link
              href="/dashboard/profile"
              className="font-semibold text-sidebar-foreground truncate hover:text-primary transition-colors cursor-pointer block"
            >
              {userName}
            </Link>
            <RoleBadge role={role} size="sm" />
          </div>
        )}
        <div className="space-y-1">
          {collapsed ? (
            <Link href="/dashboard/profile">
              <Button variant="ghost" size="icon" className="w-full">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard/profile" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <User className="h-5 w-5" />
                <span className="ml-2">Profil Saya</span>
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-2">Keluar</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
