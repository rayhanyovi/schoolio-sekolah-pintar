import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import {
  getStudentClassId,
  listLinkedClassIdsForParent,
} from "@/lib/authz";
import { ROLES } from "@/lib/constants";
import { mockEvents } from "@/lib/mockData";
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
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const type = searchParams.get("type");
  const classId = searchParams.get("classId");

  if (isMockEnabled()) {
    const data = mockEvents.filter((item) => {
      const typeMatch = type ? item.type === type : true;
      const classMatch = classId
        ? (item.classIds ?? []).includes(classId)
        : true;
      const fromMatch = dateFrom ? item.date >= new Date(dateFrom) : true;
      const toMatch = dateTo ? item.date <= new Date(dateTo) : true;
      return typeMatch && classMatch && fromMatch && toMatch;
    });
    return jsonOk(data);
  }

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (classId) where.classes = { some: { classId } };
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo);
  }

  if (auth.role === ROLES.STUDENT) {
    const ownClassId = await getStudentClassId(auth.userId);
    if (!ownClassId) {
      return jsonOk([]);
    }
    if (classId && classId !== ownClassId) {
      return jsonError("FORBIDDEN", "Class access out of scope", 403);
    }
    if (!classId) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { classes: { some: { classId: ownClassId } } },
            { classes: { none: {} } },
          ],
        },
      ];
    }
  }

  if (auth.role === ROLES.PARENT) {
    const linkedClassIds = await listLinkedClassIdsForParent(auth.userId);
    if (!linkedClassIds.length) {
      return jsonOk([]);
    }
    if (classId && !linkedClassIds.includes(classId)) {
      return jsonError("FORBIDDEN", "Class access out of scope", 403);
    }
    if (!classId) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { classes: { some: { classId: { in: linkedClassIds } } } },
            { classes: { none: {} } },
          ],
        },
      ];
    }
  }

  const rows = await prisma.calendarEvent.findMany({
    where: where as Prisma.CalendarEventWhereInput,
    include: { classes: true },
    orderBy: { date: "asc" },
  });

  const data = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    date: row.date,
    endDate: row.endDate ?? undefined,
    type: row.type,
    classIds: row.classes.map((link) => link.classId),
    isRecurring: row.isRecurring,
    createdBy: row.createdById ?? "",
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const body = await request.json();
  if (!body?.title || !body?.date) {
    return jsonError("VALIDATION_ERROR", "title and date are required");
  }

  const row = await prisma.calendarEvent.create({
    data: {
      title: body.title,
      description: body.description ?? "",
      date: new Date(body.date),
      endDate: body.endDate ? new Date(body.endDate) : null,
      type: body.type ?? "ACADEMIC",
      isRecurring: Boolean(body.isRecurring),
      createdById: auth.userId,
    },
  });

  const classIds: string[] = body.classIds ?? [];
  if (classIds.length) {
    await prisma.calendarEventClass.createMany({
      data: classIds.map((cid) => ({ eventId: row.id, classId: cid })),
      skipDuplicates: true,
    });
  }

  return jsonOk(row, { status: 201 });
}
