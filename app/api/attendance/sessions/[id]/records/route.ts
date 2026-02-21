import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { canTeacherManageSubjectClass } from "@/lib/authz";
import { ROLES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { id } = await params;
  const body = await request.json();
  const records = body?.records;
  if (!Array.isArray(records)) {
    return jsonError("VALIDATION_ERROR", "records array is required");
  }
  if (!id) {
    return jsonError("VALIDATION_ERROR", "sessionId is required");
  }
  const session = await prisma.attendanceSession.findUnique({
    where: { id },
    select: {
      id: true,
      classId: true,
      subjectId: true,
      teacherId: true,
      takenByTeacherId: true,
    },
  });
  if (!session) return jsonError("NOT_FOUND", "Attendance session not found", 404);
  if (auth.role === ROLES.TEACHER) {
    const canManage =
      session.teacherId === auth.userId ||
      session.takenByTeacherId === auth.userId ||
      (await canTeacherManageSubjectClass(
        auth.userId,
        session.subjectId,
        session.classId
      ));
    if (!canManage) {
      return jsonError("FORBIDDEN", "Anda tidak bisa mengubah sesi ini", 403);
    }
  }

  await prisma.$transaction(
    records.map((record) =>
      prisma.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId: id,
            studentId: record.studentId,
          },
        },
        update: {
          status: record.status,
          note: record.note ?? null,
        },
        create: {
          sessionId: id,
          studentId: record.studentId,
          status: record.status,
          note: record.note ?? null,
        },
      })
    )
  );

  return jsonOk({ id });
}
