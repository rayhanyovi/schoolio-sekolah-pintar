import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (from || to) {
    where.session = {
      date: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      },
    };
  }

  const rows = await prisma.attendanceRecord.findMany({
    where,
    select: { status: true },
  });

  const counts = rows.reduce(
    (acc, row) => {
      acc[row.status] += 1;
      return acc;
    },
    { PRESENT: 0, ABSENT: 0, SICK: 0, PERMIT: 0 } as Record<string, number>
  );

  return jsonOk({ from, to, counts });
}
