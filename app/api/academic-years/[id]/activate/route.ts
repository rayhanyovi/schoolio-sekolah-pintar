import { prisma } from "@/lib/prisma";
import {
  jsonError,
  jsonOk,
  requireAuth,
  requireRole,
  requireSchoolContext,
} from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { Prisma } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  try {
    const { id } = await params;
    const row = await prisma.$transaction(async (tx) => {
      const existing = await tx.academicYear.findFirst({
        where: { id, schoolId },
        select: { id: true },
      });
      if (!existing) {
        throw new Error("NOT_FOUND");
      }
      const previouslyActive = await tx.academicYear.findMany({
        where: { isActive: true, schoolId },
        select: { id: true },
      });

      await tx.academicYear.updateMany({
        where: { schoolId },
        data: { isActive: false },
      });
      const activated = await tx.academicYear.update({
        where: { id },
        data: { isActive: true },
      });

      await tx.auditLog.create({
        data: {
          actorId: auth.userId,
          actorRole: auth.role,
          action: "ACADEMIC_YEAR_ACTIVATED",
          entityType: "AcademicYear",
          entityId: activated.id,
          beforeData: {
            activeAcademicYearIds: previouslyActive.map((item) => item.id),
          },
          afterData: {
            activeAcademicYearIds: [activated.id],
            activatedAcademicYearId: activated.id,
          },
        },
      });

      return activated;
    });

    return jsonOk(row);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return jsonError("NOT_FOUND", "Academic year not found", 404);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("NOT_FOUND", "Academic year not found", 404);
    }
    throw error;
  }
}
