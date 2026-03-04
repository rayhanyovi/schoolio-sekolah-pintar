import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk, parseJsonBody, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  studentId: z.string().trim().min(1, "studentId wajib diisi"),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.PARENT]);
  if (roleError) return roleError;

  const parsedBody = await parseJsonBody(request, payloadSchema);
  if (parsedBody instanceof Response) return parsedBody;
  const body = parsedBody;

  const student = await prisma.user.findFirst({
    where: {
      id: body.studentId,
      role: ROLES.STUDENT,
    },
    select: {
      id: true,
      name: true,
    },
  });
  if (!student) {
    return jsonError("NOT_FOUND", "Siswa tidak ditemukan", 404);
  }

  const existing = await prisma.parentStudent.findUnique({
    where: {
      parentId_studentId: {
        parentId: auth.userId,
        studentId: student.id,
      },
    },
    select: { parentId: true },
  });

  if (!existing) {
    await prisma.parentStudent.create({
      data: {
        parentId: auth.userId,
        studentId: student.id,
      },
    });
  }

  return jsonOk({
    linked: true,
    child: {
      id: student.id,
      name: student.name,
    },
  });
}
