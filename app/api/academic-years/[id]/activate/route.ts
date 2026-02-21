import { prisma } from "@/lib/prisma";
import { jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  await prisma.academicYear.updateMany({ data: { isActive: false } });
  const row = await prisma.academicYear.update({
    where: { id: params.id },
    data: { isActive: true },
  });
  return jsonOk(row);
}
