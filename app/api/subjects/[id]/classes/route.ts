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
  const classIds: string[] = body?.classIds ?? [];
  if (!Array.isArray(classIds)) {
    return jsonError("VALIDATION_ERROR", "classIds array is required");
  }

  await prisma.subjectClass.deleteMany({ where: { subjectId: params.id } });
  if (classIds.length) {
    await prisma.subjectClass.createMany({
      data: classIds.map((classId) => ({
        subjectId: params.id,
        classId,
      })),
      skipDuplicates: true,
    });
  }

  return jsonOk({ id: params.id, classIds });
}
