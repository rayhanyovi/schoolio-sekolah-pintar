import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
  const row = await prisma.material.findUnique({
    where: { id: params.id },
    include: { subject: true, class: true, teacher: true, attachments: true },
  });
  return jsonOk(row);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json();
  const row = await prisma.material.update({
    where: { id: params.id },
    data: {
      title: body.title,
      description: body.description,
      subjectId: body.subjectId,
      classId: body.classId,
      teacherId: body.teacherId,
    },
  });
  return jsonOk(row);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  await prisma.material.delete({ where: { id: params.id } });
  return jsonOk({ id: params.id });
}
