import { prisma } from "@/lib/prisma";
import {
  jsonError,
  jsonOk,
  parseJsonRecordBody,
  requireAuth,
  requireRole,
  requireSchoolContext,
} from "@/lib/api";
import { ROLES } from "@/lib/constants";

type Params = { params: { id: string } };

export async function PUT(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const parsedRequestBody = await parseJsonRecordBody(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  const classIds: string[] = body?.classIds ?? [];
  if (!Array.isArray(classIds)) {
    return jsonError("VALIDATION_ERROR", "classIds array is required");
  }
  const subject = await prisma.subject.findFirst({
    where: { id: params.id, schoolId },
    select: { id: true },
  });
  if (!subject) {
    return jsonError("NOT_FOUND", "Subject not found", 404);
  }
  if (classIds.length) {
    const classCount = await prisma.class.count({
      where: {
        id: { in: classIds },
        schoolId,
      },
    });
    if (classCount !== classIds.length) {
      return jsonError("FORBIDDEN", "Ada kelas lintas sekolah", 403);
    }
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
