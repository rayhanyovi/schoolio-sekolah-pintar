import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER, ROLES.PARENT]);
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  const where: Prisma.UserWhereInput = { role: "PARENT" };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (auth.role === ROLES.PARENT) {
    where.id = auth.userId;
  }

  const rows = await prisma.user.findMany({
    where,
    include: { parentProfile: true, parentLinks: true },
    orderBy: { name: "asc" },
  });

  return jsonOk(rows);
}
