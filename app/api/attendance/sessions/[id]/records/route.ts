import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const records = body?.records;
  if (!Array.isArray(records)) {
    return jsonError("VALIDATION_ERROR", "records array is required");
  }
  if (!id) {
    return jsonError("VALIDATION_ERROR", "sessionId is required");
  }

  await prisma.$transaction(
    records.map((record) =>
      prisma.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId: id,
            studentId: record.studentId,
          },
        },
        update: {
          status: record.status,
          note: record.note ?? null,
        },
        create: {
          sessionId: id,
          studentId: record.studentId,
          status: record.status,
          note: record.note ?? null,
        },
      })
    )
  );

  return jsonOk({ id });
}
