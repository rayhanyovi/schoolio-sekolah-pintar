import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardRootLayout({ children }: DashboardLayoutProps) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
