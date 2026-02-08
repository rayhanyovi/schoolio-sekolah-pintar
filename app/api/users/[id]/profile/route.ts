import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
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
  const row = await prisma.user.update({
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
    await prisma.studentProfile.upsert({
      where: { userId: params.id },
      update: {
        classId: body.studentProfile.classId ?? null,
        gender: body.studentProfile.gender ?? null,
      },
      create: {
        userId: params.id,
        classId: body.studentProfile.classId ?? null,
        gender: body.studentProfile.gender ?? null,
      },
    });
  }

  if (body.teacherProfile) {
    await prisma.teacherProfile.upsert({
      where: { userId: params.id },
      update: { title: body.teacherProfile.title ?? null },
      create: { userId: params.id, title: body.teacherProfile.title ?? null },
    });
  }

  if (body.parentProfile) {
    await prisma.parentProfile.upsert({
      where: { userId: params.id },
      update: {},
      create: { userId: params.id },
    });
  }

  return jsonOk(row);
}
