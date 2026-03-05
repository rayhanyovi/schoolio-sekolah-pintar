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
  const teacherIds: string[] = body?.teacherIds ?? [];
  if (!Array.isArray(teacherIds)) {
    return jsonError("VALIDATION_ERROR", "teacherIds array is required");
  }
  const subject = await prisma.subject.findFirst({
    where: { id: params.id, schoolId },
    select: { id: true },
  });
  if (!subject) {
    return jsonError("NOT_FOUND", "Subject not found", 404);
  }
  if (teacherIds.length) {
    const teacherCount = await prisma.user.count({
      where: {
        id: { in: teacherIds },
        role: ROLES.TEACHER,
        schoolId,
      },
    });
    if (teacherCount !== teacherIds.length) {
      return jsonError("FORBIDDEN", "Ada guru lintas sekolah", 403);
    }
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
