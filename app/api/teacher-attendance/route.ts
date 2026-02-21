import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { Prisma } from "@prisma/client";

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacherId") ?? undefined;
  const dateFrom = parseDate(searchParams.get("dateFrom"));
  const dateTo = parseDate(searchParams.get("dateTo"));

  const where: Record<string, unknown> = {};
  if (auth.role === ROLES.TEACHER) {
    where.teacherId = auth.userId;
  } else if (teacherId) {
    where.teacherId = teacherId;
  }
  if (dateFrom || dateTo) {
    where.date = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const rows = await prisma.teacherAttendance.findMany({
    where: where as Prisma.TeacherAttendanceWhereInput,
    orderBy: { date: "asc" },
    include: { teacher: true },
  });

  return jsonOk(rows);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const body = await request.json();
  const teacherId =
    auth.role === ROLES.ADMIN
      ? (body?.teacherId as string | undefined)
      : auth.userId;
  const status = body?.status as string | undefined;
  const sessionId = body?.sessionId as string | undefined;
  const isAllDay = Boolean(body?.isAllDay);
  const note = body?.note ?? null;
  const dateValue = parseDate(body?.date);

  if (!teacherId || !status || !dateValue) {
    return jsonError(
      "VALIDATION_ERROR",
      "teacherId, status, and date are required"
    );
  }

  const existing = await prisma.teacherAttendance.findFirst({
    where: {
      teacherId,
      date: dateValue,
      sessionId: sessionId ?? null,
    },
  });

  if (existing) {
    const updated = await prisma.teacherAttendance.update({
      where: { id: existing.id },
      data: {
        status,
        note,
        isAllDay,
      },
      include: { teacher: true },
    });
    return jsonOk(updated);
  }

  const created = await prisma.teacherAttendance.create({
    data: {
      teacherId,
      status,
      sessionId: sessionId ?? null,
      date: dateValue,
      note,
      isAllDay,
    },
    include: { teacher: true },
  });

  return jsonOk(created);
}
