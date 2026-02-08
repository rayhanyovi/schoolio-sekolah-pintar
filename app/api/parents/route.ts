import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  const where: Prisma.UserWhereInput = { role: "PARENT" };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.user.findMany({
    where,
    include: { parentProfile: true, parentLinks: true },
    orderBy: { name: "asc" },
  });

  return jsonOk(rows);
}
