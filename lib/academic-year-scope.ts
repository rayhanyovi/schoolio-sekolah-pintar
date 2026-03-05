import { NextRequest } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export type AcademicYearScope = {
  academicYearId: string | null;
  includeAllAcademicYears: boolean;
};

type AcademicYearScopeResult =
  | { scope: AcademicYearScope; error: null }
  | { scope: null; error: Response };

type ResolveAcademicYearScopeOptions = {
  schoolId?: string | null;
};

export const resolveAcademicYearScope = async (
  request: NextRequest,
  options?: ResolveAcademicYearScopeOptions
): Promise<AcademicYearScopeResult> => {
  const { searchParams } = new URL(request.url);
  const includeAllAcademicYears =
    searchParams.get("includeAllAcademicYears") === "true";
  const requestedAcademicYearId = searchParams.get("academicYearId");
  const schoolId = options?.schoolId ?? null;

  if (includeAllAcademicYears && requestedAcademicYearId) {
    return {
      scope: null,
      error: jsonError(
        "VALIDATION_ERROR",
        "Gunakan salah satu: academicYearId atau includeAllAcademicYears=true",
        400
      ),
    };
  }

  if (requestedAcademicYearId) {
    const academicYear = await prisma.academicYear.findFirst({
      where: {
        id: requestedAcademicYearId,
        ...(schoolId ? { schoolId } : {}),
      },
      select: { id: true },
    });
    if (!academicYear) {
      return {
        scope: null,
        error: jsonError("NOT_FOUND", "Academic year tidak ditemukan", 404),
      };
    }
    return {
      scope: {
        academicYearId: academicYear.id,
        includeAllAcademicYears: false,
      },
      error: null,
    };
  }

  if (includeAllAcademicYears) {
    return {
      scope: { academicYearId: null, includeAllAcademicYears: true },
      error: null,
    };
  }

  const activeAcademicYear = await prisma.academicYear.findFirst({
    where: {
      isActive: true,
      ...(schoolId ? { schoolId } : {}),
    },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });

  return {
    scope: {
      academicYearId: activeAcademicYear?.id ?? null,
      includeAllAcademicYears: false,
    },
    error: null,
  };
};

export const appendWhereAndCondition = (
  where: Record<string, unknown>,
  condition: Record<string, unknown>
) => {
  if (!where.AND) {
    where.AND = [condition];
    return;
  }
  if (Array.isArray(where.AND)) {
    where.AND = [...where.AND, condition];
    return;
  }
  where.AND = [where.AND, condition];
};
