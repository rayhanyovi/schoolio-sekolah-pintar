import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockStudents } from "@/lib/mockData";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { id } = await params;
  if (!id) {
    return jsonOk([]);
  }
  if (isMockEnabled()) {
    const data = mockStudents.filter((student) => student.classId === id);
    return jsonOk(data);
  }

  const rows = await prisma.studentProfile.findMany({
    where: { classId: id },
    include: { user: true, class: true },
    orderBy: { user: { name: "asc" } },
  });

  const data = rows.map((row) => ({
    id: row.userId,
    name: row.user.name,
    email: row.user.email,
    gender: row.gender,
    classId: row.classId,
    className: row.class?.name ?? "",
  }));

  return jsonOk(data);
}
