import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import {
  canTeacherWriteAttendance,
  needsAdminAttendanceOverride,
} from "@/lib/attendance-policy";
import { ROLES } from "@/lib/constants";
import { AttendanceStatus } from "@prisma/client";

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
          status: true,
          teacherId: true,
          takenByTeacherId: true,
          date: true,
          id: true,
        },
      },
    },
  });
  if (!existing) return jsonError("NOT_FOUND", "Attendance record not found", 404);
  if (auth.role === ROLES.TEACHER) {
    const canManage =
      existing.session.teacherId === auth.userId ||
      existing.session.takenByTeacherId === auth.userId;
    if (!canManage) {
      return jsonError("FORBIDDEN", "Anda tidak bisa mengubah record ini", 403);
    }
    const canWriteCurrentSession = canTeacherWriteAttendance(
      existing.session.status,
      existing.session.date
    );
    if (!canWriteCurrentSession) {
      return jsonError(
        "FORBIDDEN",
        "Periode edit absensi sudah ditutup untuk guru",
        403
      );
    }
  }

  const body = (await request.json()) as Record<string, unknown>;
  const nextStatus =
    typeof body.status === "string" ? body.status : undefined;
  if (
    nextStatus !== undefined &&
    !["PRESENT", "ABSENT", "SICK", "PERMIT"].includes(nextStatus)
  ) {
    return jsonError("VALIDATION_ERROR", "status absensi tidak valid", 400);
  }
  const overrideReason =
    typeof body.overrideReason === "string" ? body.overrideReason.trim() : "";
  const mustUseAdminOverride =
    auth.role === ROLES.ADMIN &&
    needsAdminAttendanceOverride(existing.session.status, existing.session.date);
  if (mustUseAdminOverride && !overrideReason) {
    return jsonError(
      "VALIDATION_ERROR",
      "overrideReason wajib diisi untuk edit di luar policy normal",
      400
    );
  }

  const row = await prisma.$transaction(async (tx) => {
    if (mustUseAdminOverride) {
      await tx.attendanceSession.update({
        where: { id: existing.session.id },
        data: {
          overrideReason,
          overriddenById: auth.userId,
          overriddenAt: new Date(),
        },
      });
    }

    return tx.attendanceRecord.update({
      where: { id: params.id },
      data: {
        status: nextStatus as AttendanceStatus | undefined,
        note: body.note as string | null | undefined,
      },
    });
  });
  return jsonOk(row);
}
