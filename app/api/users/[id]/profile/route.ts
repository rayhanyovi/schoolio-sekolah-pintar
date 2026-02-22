import { NextRequest } from "next/server";
import { StudentLifecycleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

type Params = { params: { id: string } };

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

const authorizeProfileAccess = async (request: NextRequest, userId: string) => {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  if (auth.role !== ROLES.ADMIN && auth.userId !== userId) {
    return jsonError("FORBIDDEN", "You are not allowed to access this profile", 403);
  }
  return auth;
};

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await authorizeProfileAccess(request, params.id);
  if (auth instanceof Response) return auth;

  const row = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      studentProfile: { include: { class: true } },
      teacherProfile: true,
      parentProfile: true,
    },
  });
  if (!row) return jsonError("NOT_FOUND", "User not found", 404);

  return jsonOk(row);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await authorizeProfileAccess(request, params.id);
  if (auth instanceof Response) return auth;

  const body = await request.json();
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
  const row = await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({
      where: { id: params.id },
      include: {
        studentProfile: true,
        teacherProfile: true,
        parentProfile: true,
      },
    });
    if (!before) return null;

    const updatedUser = await tx.user.update({
      where: { id: params.id },
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
      const nextStatus =
        requestedStudentStatus ?? before.studentProfile?.status ?? "ACTIVE";
      await tx.studentProfile.upsert({
        where: { userId: params.id },
        update: {
          classId: nextClassId,
          gender: body.studentProfile.gender ?? null,
          status: nextStatus,
        },
        create: {
          userId: params.id,
          classId: nextClassId,
          gender: body.studentProfile.gender ?? null,
          status: nextStatus,
        },
      });

      if (previousClassId !== nextClassId) {
        const now = new Date();
        await tx.studentClassEnrollment.updateMany({
          where: {
            studentId: params.id,
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
              studentId: params.id,
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
        where: { userId: params.id },
        update: { title: body.teacherProfile.title ?? null },
        create: { userId: params.id, title: body.teacherProfile.title ?? null },
      });
    }

    if (body.parentProfile) {
      await tx.parentProfile.upsert({
        where: { userId: params.id },
        update: {},
        create: { userId: params.id },
      });
    }

    const after = await tx.user.findUnique({
      where: { id: params.id },
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
        entityId: params.id,
        beforeData: toProfileSnapshot(before),
        afterData: toProfileSnapshot(after),
      },
    });

    return updatedUser;
  });

  if (!row) return jsonError("NOT_FOUND", "User not found", 404);
  return jsonOk(row);
}
