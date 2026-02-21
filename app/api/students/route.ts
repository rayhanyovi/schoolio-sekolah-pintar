import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, requireAuth, requireRole } from "@/lib/api";
import { listLinkedStudentIds } from "@/lib/authz";
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
  const classId = searchParams.get("classId");
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  const where: Prisma.UserWhereInput = { role: "STUDENT" };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (classId) {
    where.studentProfile = { classId };
  }

  if (auth.role === ROLES.STUDENT) {
    where.id = auth.userId;
  }

  if (auth.role === ROLES.PARENT) {
    const linkedStudentIds = await listLinkedStudentIds(auth.userId);
    if (!linkedStudentIds.length) {
      return jsonOk([]);
    }
    where.id = { in: linkedStudentIds };
  }

  const rows = await prisma.user.findMany({
    where,
    include: { studentProfile: true },
    orderBy: { name: "asc" },
  });

  return jsonOk(rows);
}
