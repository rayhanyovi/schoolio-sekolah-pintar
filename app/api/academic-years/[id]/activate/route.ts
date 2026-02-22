import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { Prisma } from "@prisma/client";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  try {
    const row = await prisma.$transaction(async (tx) => {
      const previouslyActive = await tx.academicYear.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      await tx.academicYear.updateMany({ data: { isActive: false } });
      const activated = await tx.academicYear.update({
        where: { id: params.id },
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("NOT_FOUND", "Academic year not found", 404);
    }
    throw error;
  }
}
