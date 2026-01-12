import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const classId = searchParams.get("classId");
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  const where: any = {};
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
  const body = await request.json();
  if (!body?.name || !body?.role) {
    return jsonError("VALIDATION_ERROR", "name and role are required");
  }

  const row = await prisma.user.create({
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
    await prisma.studentProfile.create({
      data: {
        userId: row.id,
        classId: body.classId ?? null,
        gender: body.gender ?? null,
      },
    });
  }

  if (body.role === "TEACHER") {
    await prisma.teacherProfile.create({ data: { userId: row.id } });
  }

  if (body.role === "PARENT") {
    await prisma.parentProfile.create({ data: { userId: row.id } });
  }

  return jsonOk(row, { status: 201 });
}
