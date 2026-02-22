import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const classId = searchParams.get("classId");
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  const where: Prisma.UserWhereInput = {};
  if (role) where.role = role;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (classId) {
    where.studentProfile = { classId };
  }

  const rows = await prisma.user.findMany({
    where,
    include: { studentProfile: true, teacherProfile: true, parentProfile: true },
    orderBy: { name: "asc" },
  });

  return jsonOk(rows);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const body = await request.json();
  if (!body?.name || !body?.role) {
    return jsonError("VALIDATION_ERROR", "name and role are required");
  }

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: body.name,
        email: body.email ?? null,
        role: body.role,
        phone: body.phone ?? null,
        address: body.address ?? null,
        bio: body.bio ?? null,
        avatarUrl: body.avatarUrl ?? null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
      },
    });

    if (body.role === "STUDENT") {
      await tx.studentProfile.create({
        data: {
          userId: created.id,
          classId: body.classId ?? null,
          gender: body.gender ?? null,
        },
      });
    }

    if (body.role === "TEACHER") {
      await tx.teacherProfile.create({ data: { userId: created.id } });
    }

    if (body.role === "PARENT") {
      await tx.parentProfile.create({ data: { userId: created.id } });
    }

    await tx.auditLog.create({
      data: {
        actorId: auth.userId,
        actorRole: auth.role,
        action: "USER_CREATED",
        entityType: "User",
        entityId: created.id,
        beforeData: null,
        afterData: {
          id: created.id,
          name: created.name,
          email: created.email,
          role: created.role,
        },
      },
    });

    return created;
  });

  return jsonOk(row, { status: 201 });
}
