import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import {
  canTeacherWriteAttendance,
  needsAdminAttendanceOverride,
} from "@/lib/attendance-policy";
import { ROLES } from "@/lib/constants";
import { AttendanceStatus } from "@prisma/client";

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
  const invalidRecord = records.find(
    (record) =>
      typeof record?.studentId !== "string" ||
      typeof record?.status !== "string" ||
      !["PRESENT", "ABSENT", "SICK", "PERMIT"].includes(record.status)
  );
  if (invalidRecord) {
    return jsonError(
      "VALIDATION_ERROR",
      "setiap record wajib punya studentId + status absensi valid",
      400
    );
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
      status: true,
      teacherId: true,
      takenByTeacherId: true,
      date: true,
    },
  });
  if (!session) return jsonError("NOT_FOUND", "Attendance session not found", 404);
  const overrideReason =
    typeof body.overrideReason === "string" ? body.overrideReason.trim() : "";

  if (auth.role === ROLES.TEACHER) {
    const canManage =
      session.teacherId === auth.userId ||
      session.takenByTeacherId === auth.userId;
    if (!canManage) {
      return jsonError("FORBIDDEN", "Anda tidak bisa mengubah sesi ini", 403);
    }
    const canWriteCurrentSession = canTeacherWriteAttendance(
      session.status,
      session.date
    );
    if (!canWriteCurrentSession) {
      return jsonError(
        "FORBIDDEN",
        "Periode edit absensi sudah ditutup untuk guru",
        403
      );
    }
  }

  const mustUseAdminOverride =
    auth.role === ROLES.ADMIN &&
    needsAdminAttendanceOverride(session.status, session.date);
  if (mustUseAdminOverride && !overrideReason) {
    return jsonError(
      "VALIDATION_ERROR",
      "overrideReason wajib diisi untuk edit di luar policy normal",
      400
    );
  }

  await prisma.$transaction(async (tx) => {
    if (mustUseAdminOverride) {
      await tx.attendanceSession.update({
        where: { id },
        data: {
          overrideReason,
          overriddenById: auth.userId,
          overriddenAt: new Date(),
        },
      });
    }

    await Promise.all(
      records.map((record) =>
        tx.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId: id,
              studentId: record.studentId,
            },
          },
          update: {
            status: record.status as AttendanceStatus,
            note: record.note ?? null,
          },
          create: {
            sessionId: id,
            studentId: record.studentId,
            status: record.status as AttendanceStatus,
            note: record.note ?? null,
          },
        })
      )
    );

    if (mustUseAdminOverride) {
      await tx.auditLog.create({
        data: {
          actorId: auth.userId,
          actorRole: auth.role,
          action: "ATTENDANCE_RECORDS_OVERRIDE_BULK",
          entityType: "AttendanceSession",
          entityId: id,
          reason: overrideReason,
          beforeData: {
            status: session.status,
            sessionDate: session.date,
          },
          afterData: {
            updatedRecords: records.length,
          },
        },
      });
    }
  });

  return jsonOk({ id });
}
