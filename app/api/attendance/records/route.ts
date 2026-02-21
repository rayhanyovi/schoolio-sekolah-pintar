import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { listLinkedStudentIds } from "@/lib/authz";
import { ROLES } from "@/lib/constants";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.PARENT,
  ]);
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const subjectId = searchParams.get("subjectId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const where: Record<string, unknown> = {};
  if (studentId) where.studentId = studentId;
  if (subjectId) where.session = { subjectId };
  if (dateFrom || dateTo) {
    where.session = {
      ...(where.session ?? {}),
      date: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      },
    };
  }

  if (auth.role === ROLES.STUDENT) {
    where.studentId = auth.userId;
  }

  if (auth.role === ROLES.PARENT) {
    const linkedStudentIds = await listLinkedStudentIds(auth.userId);
    if (!linkedStudentIds.length) {
      return jsonOk([]);
    }
    if (studentId && !linkedStudentIds.includes(studentId)) {
      return jsonError("FORBIDDEN", "Student access out of scope", 403);
    }
    where.studentId = studentId
      ? studentId
      : { in: linkedStudentIds };
  }

  const rows = await prisma.attendanceRecord.findMany({
    where: where as Prisma.AttendanceRecordWhereInput,
    include: {
      student: true,
      session: { include: { class: true, subject: true } },
    },
    orderBy: { recordedAt: "desc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    sessionId: row.sessionId,
    studentId: row.studentId,
    studentName: row.student.name,
    status: row.status,
    note: row.note ?? "",
    recordedAt: row.recordedAt,
    date: row.session.date,
    classId: row.session.classId,
    className: row.session.class.name,
    subjectId: row.session.subjectId,
    subjectName: row.session.subject.name,
  }));

  return jsonOk(data);
}
