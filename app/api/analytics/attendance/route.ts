import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.session = {
      date: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      },
    };
  }

  if (auth.role === ROLES.TEACHER) {
    where.session = {
      ...(where.session ?? {}),
      OR: [{ teacherId: auth.userId }, { takenByTeacherId: auth.userId }],
    };
  }

  const rows = await prisma.attendanceRecord.findMany({
    where: where as Prisma.AttendanceRecordWhereInput,
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
