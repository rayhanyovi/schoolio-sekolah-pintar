import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockMajorTeachers, mockTeachers } from "@/lib/mockData";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { id } = await params;
  if (!id) return jsonError("VALIDATION_ERROR", "id is required");

  if (isMockEnabled()) {
    const teacherIds = mockMajorTeachers[id] ?? [];
    const data = mockTeachers.filter((teacher) => teacherIds.includes(teacher.id));
    return jsonOk(data);
  }

  const rows = await prisma.majorTeacher.findMany({
    where: { majorId: id },
    include: { teacher: true },
    orderBy: { teacher: { name: "asc" } },
  });

  return jsonOk(rows.map((row) => row.teacher));
}

export async function PUT(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const { id } = await params;
  if (!id) return jsonError("VALIDATION_ERROR", "id is required");

  const body = await request.json();
  const teacherIds: string[] = body?.teacherIds ?? [];
  if (!Array.isArray(teacherIds)) {
    return jsonError("VALIDATION_ERROR", "teacherIds array is required");
  }

  await prisma.majorTeacher.deleteMany({ where: { majorId: id } });
  if (teacherIds.length) {
    await prisma.majorTeacher.createMany({
      data: teacherIds.map((teacherId) => ({
        majorId: id,
        teacherId,
      })),
      skipDuplicates: true,
    });
  }

  return jsonOk({ id, teacherIds });
}
