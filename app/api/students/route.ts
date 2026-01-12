import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  const where: any = { role: "STUDENT" };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (classId) {
    where.studentProfile = { classId };
  }

  const rows = await prisma.user.findMany({
    where,
    include: { studentProfile: true },
    orderBy: { name: "asc" },
  });

  return jsonOk(rows);
}
