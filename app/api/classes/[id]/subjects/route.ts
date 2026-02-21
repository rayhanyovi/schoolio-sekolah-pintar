import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import {
  getStudentClassId,
  listLinkedClassIdsForParent,
} from "@/lib/authz";
import { ROLES } from "@/lib/constants";
import { mockSubjects } from "@/lib/mockData";

type Params = { params: { id: string } };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.PARENT,
  ]);
  if (roleError) return roleError;

  if (auth.role === ROLES.STUDENT) {
    const ownClassId = await getStudentClassId(auth.userId);
    if (!ownClassId || ownClassId !== params.id) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke kelas ini", 403);
    }
  }
  if (auth.role === ROLES.PARENT) {
    const linkedClassIds = await listLinkedClassIdsForParent(auth.userId);
    if (!linkedClassIds.includes(params.id)) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke kelas ini", 403);
    }
  }

  if (isMockEnabled()) {
    const data = mockSubjects.filter((subject) =>
      subject.classIds.includes(params.id)
    );
    return jsonOk(data);
  }

  const rows = await prisma.subjectClass.findMany({
    where: { classId: params.id },
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
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const body = await request.json();
  const subjectIds: string[] = body?.subjectIds ?? [];
  if (!Array.isArray(subjectIds)) {
    return jsonError("VALIDATION_ERROR", "subjectIds array is required");
  }

  await prisma.subjectClass.deleteMany({ where: { classId: params.id } });
  if (subjectIds.length) {
    await prisma.subjectClass.createMany({
      data: subjectIds.map((subjectId) => ({
        classId: params.id,
        subjectId,
      })),
      skipDuplicates: true,
    });
  }

  return jsonOk({ id: params.id, subjectIds });
}
