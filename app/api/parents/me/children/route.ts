import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { listLinkedStudentIds } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.PARENT]);
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const q = searchParams.get("q")?.trim() ?? "";

  const linkedStudentIds = await listLinkedStudentIds(auth.userId);
  if (!linkedStudentIds.length) {
    return jsonOk([]);
  }

  const where: Prisma.UserWhereInput = {
    role: "STUDENT",
    id: { in: linkedStudentIds },
  };

  if (classId) {
    where.studentProfile = { classId };
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.user.findMany({
    where,
    include: { studentProfile: true },
    orderBy: { name: "asc" },
  });

  return jsonOk(rows);
}
