'use client';

import Dashboard from "@/components/pages/Dashboard";
import Analytics from "@/components/pages/Analytics";
import { useRoleContext } from "@/hooks/useRoleContext";
import { ROLES } from "@/lib/constants";

export default function Page() {
  const { role } = useRoleContext();
  if (role === ROLES.ADMIN) {
    return <Analytics />;
  }
  return <Dashboard />;
}
