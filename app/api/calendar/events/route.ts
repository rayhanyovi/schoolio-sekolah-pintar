import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonOk } from "@/lib/api";
import { mockEvents } from "@/lib/mockData";

export async function GET(request: NextRequest) {
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

  const where: any = {};
  if (type) where.type = type;
  if (classId) where.classes = { some: { classId } };
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo);
  }

  const rows = await prisma.calendarEvent.findMany({
    where,
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
  const body = await request.json();
  const row = await prisma.calendarEvent.create({
    data: {
      title: body.title,
      description: body.description ?? "",
      date: new Date(body.date),
      endDate: body.endDate ? new Date(body.endDate) : null,
      type: body.type ?? "ACADEMIC",
      isRecurring: Boolean(body.isRecurring),
      createdById: body.createdById ?? null,
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
