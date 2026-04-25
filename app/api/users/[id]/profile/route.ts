import { NextRequest } from "next/server";
import { StudentLifecycleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  jsonError,
  jsonOk,
  parseJsonRecordBody,
  requireAuth,
  requireSchoolContext,
} from "@/lib/api";
import { ROLES } from "@/lib/constants";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const STUDENT_LIFECYCLE_VALUES: StudentLifecycleStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "GRADUATED",
  "TRANSFERRED_OUT",
];

const toStudentLifecycleStatus = (
  value: unknown
): StudentLifecycleStatus | null => {
  if (typeof value !== "string") return null;
  const normalized = value.toUpperCase();
  return STUDENT_LIFECYCLE_VALUES.includes(normalized as StudentLifecycleStatus)
    ? (normalized as StudentLifecycleStatus)
    : null;
};

const toProfileSnapshot = (
  row:
    | {
        name: string;
        email: string | null;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        address: string | null;
        bio: string | null;
        avatarUrl: string | null;
        birthDate: Date | null;
        studentProfile: {
          classId: string | null;
          gender: string | null;
          status: StudentLifecycleStatus;
        } | null;
        teacherProfile: { title: string | null } | null;
        parentProfile: { id: string } | null;
      }
    | null
) => {
  if (!row) return null;
  return {
    name: row.name,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    address: row.address,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    birthDate: row.birthDate?.toISOString() ?? null,
    studentProfile: row.studentProfile
      ? {
          classId: row.studentProfile.classId,
          gender: row.studentProfile.gender,
          status: row.studentProfile.status,
        }
      : null,
    teacherProfile: row.teacherProfile
      ? {
          title: row.teacherProfile.title,
        }
      : null,
    parentProfile: row.parentProfile
      ? {
          id: row.parentProfile.id,
        }
      : null,
  };
};

const resolveUserId = async (context: RouteContext) => {
  const params = await context.params;
  const userId = params?.id;
  return typeof userId === "string" && userId.trim().length ? userId : null;
};

const authorizeProfileAccess = async (request: NextRequest, userId: string) => {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;
  if (auth.role !== ROLES.ADMIN && auth.userId !== userId) {
    return jsonError("FORBIDDEN", "You are not allowed to access this profile", 403);
  }
  return { auth, schoolId };
};

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = await resolveUserId(context);
  if (!userId) return jsonError("VALIDATION_ERROR", "User id tidak valid", 400);

  const authContext = await authorizeProfileAccess(request, userId);
  if (authContext instanceof Response) return authContext;
  const { schoolId } = authContext;

  const row = await prisma.user.findFirst({
    where: { id: userId, schoolId },
    include: {
      studentProfile: { include: { class: true } },
      teacherProfile: true,
      parentProfile: true,
    },
  });
  if (!row) return jsonError("NOT_FOUND", "User not found", 404);

  return jsonOk(row);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await resolveUserId(context);
  if (!userId) return jsonError("VALIDATION_ERROR", "User id tidak valid", 400);

  const authContext = await authorizeProfileAccess(request, userId);
  if (authContext instanceof Response) return authContext;
  const { auth, schoolId } = authContext;

  const parsedRequestBody = await parseJsonRecordBody(request);
  if (parsedRequestBody instanceof Response) return parsedRequestBody;
  const body = parsedRequestBody;

  const derivedName =
    typeof body.name === "string" && body.name.trim().length
      ? body.name.trim()
      : [body.firstName, body.lastName].filter(Boolean).join(" ").trim();
  const emailValue =
    body.email === "" || body.email === null ? null : body.email ?? undefined;
  const birthDateValue =
    body.birthDate === "" || body.birthDate === null
      ? null
      : body.birthDate
      ? new Date(body.birthDate)
      : undefined;
  const requestedStudentStatus =
    body.studentProfile &&
    body.studentProfile.status !== undefined &&
    body.studentProfile.status !== null &&
    body.studentProfile.status !== ""
      ? toStudentLifecycleStatus(body.studentProfile.status)
      : null;

  if (
    body.studentProfile &&
    body.studentProfile.status !== undefined &&
    body.studentProfile.status !== null &&
    body.studentProfile.status !== "" &&
    !requestedStudentStatus
  ) {
    return jsonError("VALIDATION_ERROR", "studentProfile.status tidak valid", 400);
  }

  try {
    const row = await prisma.$transaction(async (tx) => {
      const before = await tx.user.findUnique({
        where: { id: userId },
        include: {
          studentProfile: true,
          teacherProfile: true,
          parentProfile: true,
        },
      });
      if (!before || before.schoolId !== schoolId) return null;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          name: derivedName ? derivedName : undefined,
          email: emailValue,
          firstName: body.firstName,
          lastName: body.lastName,
          phone: body.phone,
          address: body.address,
          bio: body.bio,
          avatarUrl: body.avatarUrl,
          birthDate: birthDateValue,
        },
      });

      if (body.studentProfile) {
        const previousClassId = before.studentProfile?.classId ?? null;
        const nextClassId =
          body.studentProfile.classId === undefined
            ? previousClassId
            : body.studentProfile.classId ?? null;

        if (nextClassId) {
          const targetClass = await tx.class.findFirst({
            where: { id: nextClassId, schoolId },
            select: { id: true },
          });
          if (!targetClass) {
            throw new Error("FORBIDDEN_CLASS");
          }
        }

        const nextStatus =
          requestedStudentStatus ?? before.studentProfile?.status ?? "ACTIVE";
        await tx.studentProfile.upsert({
          where: { userId },
          update: {
            classId: nextClassId,
            gender: body.studentProfile.gender ?? null,
            status: nextStatus,
          },
          create: {
            userId,
            classId: nextClassId,
            gender: body.studentProfile.gender ?? null,
            status: nextStatus,
          },
        });

        if (previousClassId !== nextClassId) {
          const now = new Date();
          await tx.studentClassEnrollment.updateMany({
            where: {
              studentId: userId,
              endedAt: null,
            },
            data: { endedAt: now },
          });

          if (nextClassId) {
            const classRow = await tx.class.findUnique({
              where: { id: nextClassId },
              select: { academicYearId: true },
            });
            await tx.studentClassEnrollment.create({
              data: {
                studentId: userId,
                classId: nextClassId,
                academicYearId: classRow?.academicYearId ?? null,
                startedAt: now,
              },
            });
          }
        }
      }

      if (body.teacherProfile) {
        await tx.teacherProfile.upsert({
          where: { userId },
          update: { title: body.teacherProfile.title ?? null },
          create: { userId, title: body.teacherProfile.title ?? null },
        });
      }

      if (body.parentProfile) {
        await tx.parentProfile.upsert({
          where: { userId },
          update: {},
          create: { userId },
        });
      }

      const after = await tx.user.findUnique({
        where: { id: userId },
        include: {
          studentProfile: true,
          teacherProfile: true,
          parentProfile: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: auth.userId,
          actorRole: auth.role,
          action: "USER_PROFILE_UPDATED",
          entityType: "User",
          entityId: userId,
          beforeData: toProfileSnapshot(before),
          afterData: toProfileSnapshot(after),
        },
      });

      return updatedUser;
    });

    if (!row) return jsonError("NOT_FOUND", "User not found", 404);
    return jsonOk(row);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_CLASS") {
      return jsonError("FORBIDDEN", "Kelas tidak valid untuk sekolah ini", 403);
    }
    throw error;
  }
}
