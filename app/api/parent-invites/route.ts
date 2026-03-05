import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  jsonError,
  jsonOk,
  parseJsonBody,
  requireAuth,
  requireRole,
  requireSchoolContext,
} from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  generateParentInviteCode,
  hashParentInviteCode,
} from "@/lib/parent-invite-code";

const createParentInviteSchema = z.object({
  studentId: z.string().trim().min(1, "studentId wajib diisi"),
});

const INVITE_TTL_DAYS = 7;

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const parsedBody = await parseJsonBody(request, createParentInviteSchema);
  if (parsedBody instanceof Response) return parsedBody;
  const body = parsedBody;

  const student = await prisma.user.findFirst({
    where: {
      id: body.studentId,
      role: ROLES.STUDENT,
      schoolId,
    },
    select: {
      id: true,
      name: true,
    },
  });
  if (!student) {
    return jsonError("NOT_FOUND", "Siswa tidak ditemukan", 404);
  }

  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const created = await prisma.$transaction(async (tx) => {
    await tx.parentInvite.updateMany({
      where: {
        schoolId,
        studentId: student.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = generateParentInviteCode();
      try {
        const invite = await tx.parentInvite.create({
          data: {
            schoolId,
            studentId: student.id,
            createdByUserId: auth.userId,
            codeHash: hashParentInviteCode(code),
            expiresAt,
            isActive: true,
          },
          select: {
            id: true,
            expiresAt: true,
          },
        });
        return {
          inviteId: invite.id,
          code,
          expiresAt: invite.expiresAt,
        };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          continue;
        }
        throw error;
      }
    }
    throw new Error("FAILED_TO_GENERATE_PARENT_INVITE_CODE");
  });

  return jsonOk({
    inviteId: created.inviteId,
    code: created.code,
    expiresAt: created.expiresAt.toISOString(),
    student: {
      id: student.id,
      name: student.name,
    },
  });
}

