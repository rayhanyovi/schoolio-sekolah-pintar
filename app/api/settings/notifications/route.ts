import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, parseJsonRecordBody, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { ensureNotificationPreference } from "@/lib/notification-service";

const mapPreferenceResponse = (row: {
  emailNotifications: boolean;
  assignmentReminders: boolean;
  attendanceAlerts: boolean;
  gradePublished: boolean;
}) => ({
  emailNotifications: row.emailNotifications,
  assignmentReminders: row.assignmentReminders,
  attendanceAlerts: row.attendanceAlerts,
  gradePublished: row.gradePublished,
});

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

  const row = await ensureNotificationPreference(prisma, auth.userId);
  return jsonOk(mapPreferenceResponse(row));
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.PARENT,
  ]);
  if (roleError) return roleError;

  const parsedRequestBody = await parseJsonRecordBody(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;
  const row = await prisma.notificationPreference.upsert({
    where: { userId: auth.userId },
    update: {
      emailNotifications:
        typeof body.emailNotifications === "boolean"
          ? body.emailNotifications
          : undefined,
      assignmentReminders:
        typeof body.assignmentReminders === "boolean"
          ? body.assignmentReminders
          : undefined,
      attendanceAlerts:
        typeof body.attendanceAlerts === "boolean"
          ? body.attendanceAlerts
          : undefined,
      gradePublished:
        typeof body.gradePublished === "boolean"
          ? body.gradePublished
          : undefined,
    },
    create: {
      userId: auth.userId,
      emailNotifications:
        typeof body.emailNotifications === "boolean"
          ? body.emailNotifications
          : true,
      assignmentReminders:
        typeof body.assignmentReminders === "boolean"
          ? body.assignmentReminders
          : true,
      attendanceAlerts:
        typeof body.attendanceAlerts === "boolean"
          ? body.attendanceAlerts
          : true,
      gradePublished:
        typeof body.gradePublished === "boolean"
          ? body.gradePublished
          : true,
    },
  });

  return jsonOk(mapPreferenceResponse(row));
}
