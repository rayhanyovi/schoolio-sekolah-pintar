import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, parseNumber, requireAuth, requireRole } from "@/lib/api";
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
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const page = parseNumber(searchParams.get("page")) ?? 1;
  const pageSize = parseNumber(searchParams.get("pageSize")) ?? 20;
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));

  const where: Prisma.NotificationWhereInput = {
    recipientId: auth.userId,
    ...(unreadOnly ? { isRead: false } : {}),
  };

  const rows = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
  });

  return jsonOk(
    rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      isRead: row.isRead,
      readAt: row.readAt ?? undefined,
      createdAt: row.createdAt,
      data: row.data ?? null,
    }))
  );
}
