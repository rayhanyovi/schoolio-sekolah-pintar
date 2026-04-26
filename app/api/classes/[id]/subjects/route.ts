import { prisma } from "@/lib/prisma";
import {
  isMockEnabled,
  jsonError,
  jsonOk,
  parseJsonRecordBody,
  requireAuth,
  requireRole,
  requireSchoolContext,
} from "@/lib/api";
import {
  getStudentClassId,
  listLinkedClassIdsForParent,
} from "@/lib/authz";
import { ROLES } from "@/lib/constants";
import { mockSubjects } from "@/lib/mockData";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const routeParams = await params;
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.PARENT,
  ]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const classRow = await prisma.class.findFirst({
    where: { id: routeParams.id, schoolId },
    select: { id: true },
  });
  if (!classRow) {
    return jsonError("NOT_FOUND", "Class not found", 404);
  }
  if (auth.role === ROLES.STUDENT) {
    const ownClassId = await getStudentClassId(auth.userId);
    if (!ownClassId || ownClassId !== routeParams.id) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke kelas ini", 403);
    }
  }
  if (auth.role === ROLES.PARENT) {
    const linkedClassIds = await listLinkedClassIdsForParent(auth.userId);
    if (!linkedClassIds.includes(routeParams.id)) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke kelas ini", 403);
    }
  }

  if (isMockEnabled()) {
    const data = mockSubjects.filter((subject) =>
      subject.classIds.includes(routeParams.id)
    );
    return jsonOk(data);
  }

  const rows = await prisma.subjectClass.findMany({
    where: { classId: routeParams.id, subject: { schoolId } },
    include: { subject: true },
  });

  const data = rows.map((row) => ({
    id: row.subject.id,
    name: row.subject.name,
    code: row.subject.code,
    category: row.subject.category,
    description: row.subject.description ?? "",
    hoursPerWeek: row.subject.hoursPerWeek,
  }));

  return jsonOk(data);
}

export async function PUT(request: Request, { params }: Params) {
  const routeParams = await params;
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const parsedRequestBody = await parseJsonRecordBody(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  const subjectIds: string[] = body?.subjectIds ?? [];
  if (!Array.isArray(subjectIds)) {
    return jsonError("VALIDATION_ERROR", "subjectIds array is required");
  }
  const classRow = await prisma.class.findFirst({
    where: { id: routeParams.id, schoolId },
    select: { id: true },
  });
  if (!classRow) {
    return jsonError("NOT_FOUND", "Class not found", 404);
  }
  if (subjectIds.length) {
    const availableSubjects = await prisma.subject.count({
      where: {
        id: { in: subjectIds },
        schoolId,
      },
    });
    if (availableSubjects !== subjectIds.length) {
      return jsonError("FORBIDDEN", "Ada mata pelajaran lintas sekolah", 403);
    }
  }

  await prisma.subjectClass.deleteMany({ where: { classId: routeParams.id } });
  if (subjectIds.length) {
    await prisma.subjectClass.createMany({
      data: subjectIds.map((subjectId) => ({
        classId: routeParams.id,
        subjectId,
      })),
      skipDuplicates: true,
    });
  }

  return jsonOk({ id: routeParams.id, subjectIds });
}
