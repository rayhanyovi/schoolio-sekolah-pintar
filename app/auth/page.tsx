import { Suspense } from "react";
import { redirect } from "next/navigation";
import Auth from "@/components/pages/Auth";
import { isDemoModeEnabled } from "@/lib/demo-mode";

export default function Page() {
  if (isDemoModeEnabled()) {
    redirect("/demo");
  }

  return (
    <Suspense fallback={null}>
      <Auth />
    </Suspense>
  );
}
