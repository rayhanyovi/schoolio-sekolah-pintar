import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";

type Params = { params: { id: string } };

export async function PUT(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const body = await request.json();
  const teacherIds: string[] = body?.teacherIds ?? [];
  if (!Array.isArray(teacherIds)) {
    return jsonError("VALIDATION_ERROR", "teacherIds array is required");
  }

  await prisma.subjectTeacher.deleteMany({ where: { subjectId: params.id } });
  if (teacherIds.length) {
    await prisma.subjectTeacher.createMany({
      data: teacherIds.map((teacherId) => ({
        subjectId: params.id,
        teacherId,
      })),
      skipDuplicates: true,
    });
  }

  return jsonOk({ id: params.id, teacherIds });
}
