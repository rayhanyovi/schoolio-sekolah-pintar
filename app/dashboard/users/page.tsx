import Users from "@/components/pages/Users";
import { isSaasMode } from "@/lib/app-mode";

export default function Page() {
  return <Users isSaasMode={isSaasMode()} />;
}
