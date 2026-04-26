import { Suspense } from "react";
import Onboarding from "@/components/pages/Onboarding";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Onboarding />
    </Suspense>
  );
}
