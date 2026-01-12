import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk } from "@/lib/api";
import { mockScheduleTemplate } from "@/lib/mockData";

export async function GET() {
  if (isMockEnabled()) {
    return jsonOk(mockScheduleTemplate);
  }

  const rows = await prisma.scheduleTemplate.findMany({
    orderBy: [{ position: "asc" }, { startTime: "asc" }],
  });
  return jsonOk(rows);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const templates = body?.templates;
  if (!Array.isArray(templates)) {
    return jsonError("VALIDATION_ERROR", "templates array is required");
  }

  for (const [index, item] of templates.entries()) {
    if (!item?.id || !item?.name) continue;
    await prisma.scheduleTemplate.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        startTime: item.startTime,
        endTime: item.endTime,
        duration: item.duration,
        isBreak: item.isBreak,
        position: index + 1,
      },
      create: {
        id: item.id,
        name: item.name,
        startTime: item.startTime,
        endTime: item.endTime,
        duration: item.duration,
        isBreak: item.isBreak,
        position: index + 1,
      },
    });
  }

  const rows = await prisma.scheduleTemplate.findMany({
    orderBy: [{ position: "asc" }, { startTime: "asc" }],
  });
  return jsonOk(rows);
}
