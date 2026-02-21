import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { canTeacherManageSubjectClass } from "@/lib/authz";
import { ROLES } from "@/lib/constants";

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const existing = await prisma.attendanceRecord.findUnique({
    where: { id: params.id },
    include: {
      session: {
        select: {
          classId: true,
          subjectId: true,
          teacherId: true,
          takenByTeacherId: true,
        },
      },
    },
  });
  if (!existing) return jsonError("NOT_FOUND", "Attendance record not found", 404);
  if (auth.role === ROLES.TEACHER) {
    const canManage =
      existing.session.teacherId === auth.userId ||
      existing.session.takenByTeacherId === auth.userId ||
      (await canTeacherManageSubjectClass(
        auth.userId,
        existing.session.subjectId,
        existing.session.classId
      ));
    if (!canManage) {
      return jsonError("FORBIDDEN", "Anda tidak bisa mengubah record ini", 403);
    }
  }

  const body = await request.json();
  const row = await prisma.attendanceRecord.update({
    where: { id: params.id },
    data: {
      status: body.status,
      note: body.note,
    },
  });
  return jsonOk(row);
}
