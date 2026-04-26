import { Suspense } from "react";
import Auth from "@/components/pages/Auth";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Auth />
    </Suspense>
  );
}
