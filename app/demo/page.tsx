import { notFound } from "next/navigation";
import Demo from "@/components/pages/Demo";
import { DEMO_CATALOG, DEMO_PUBLIC_ROLES } from "@/lib/demo-catalog";
import { isDemoModeEnabled } from "@/lib/demo-mode";

export default function Page() {
  if (!isDemoModeEnabled()) {
    notFound();
  }

  return (
    <Demo
      password={DEMO_CATALOG.password}
      roles={[...DEMO_PUBLIC_ROLES]}
      school={DEMO_CATALOG.templateSchool}
    />
  );
}

