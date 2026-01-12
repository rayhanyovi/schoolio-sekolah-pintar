import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
  const row = await prisma.user.findUnique({
    where: { id: params.id },
    include: { studentProfile: true, teacherProfile: true, parentProfile: true },
  });
  return jsonOk(row);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json();
  const row = await prisma.user.update({
    where: { id: params.id },
    data: {
      name: body.name,
      email: body.email,
      role: body.role,
      phone: body.phone,
      address: body.address,
      bio: body.bio,
      avatarUrl: body.avatarUrl,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
    },
  });
  return jsonOk(row);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  await prisma.user.delete({ where: { id: params.id } });
  return jsonOk({ id: params.id });
}
