import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isMockEnabled,
  jsonError,
  jsonOk,
  parseJsonRecordBody,
  requireAuth,
  requireRole,
  requireSchoolContext,
} from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockScheduleTemplate } from "@/lib/mockData";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  if (isMockEnabled()) {
    return jsonOk(mockScheduleTemplate);
  }

  const rows = await prisma.scheduleTemplate.findMany({
    where: { schoolId },
    orderBy: [{ position: "asc" }, { startTime: "asc" }],
  });
  return jsonOk(rows);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const parsedRequestBody = await parseJsonRecordBody(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  const templates = body?.templates;
  if (!Array.isArray(templates)) {
    return jsonError("VALIDATION_ERROR", "templates array is required");
  }

  for (const [index, item] of templates.entries()) {
    if (!item?.name) continue;
    const existing = item.id
      ? await prisma.scheduleTemplate.findFirst({
          where: {
            id: item.id,
            schoolId,
          },
          select: { id: true },
        })
      : null;
    if (existing) {
      await prisma.scheduleTemplate.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          startTime: item.startTime,
          endTime: item.endTime,
          duration: item.duration,
          isBreak: item.isBreak,
          position: index + 1,
        },
      });
    } else {
      await prisma.scheduleTemplate.create({
        data: {
          schoolId,
          name: item.name,
          startTime: item.startTime,
          endTime: item.endTime,
          duration: item.duration,
          isBreak: item.isBreak,
          position: index + 1,
        },
      });
    }
  }

  const rows = await prisma.scheduleTemplate.findMany({
    where: { schoolId },
    orderBy: [{ position: "asc" }, { startTime: "asc" }],
  });
  return jsonOk(rows);
}
