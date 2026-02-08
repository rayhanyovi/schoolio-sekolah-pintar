import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!id) return jsonError("VALIDATION_ERROR", "id is required");

  const row = await prisma.major.findUnique({ where: { id } });
  if (!row) return jsonError("NOT_FOUND", "Major not found", 404);

  return jsonOk(row);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!id) return jsonError("VALIDATION_ERROR", "id is required");

  const body = await request.json();
  const code =
    typeof body?.code === "string" && body.code.trim()
      ? body.code.trim().toUpperCase()
      : undefined;
  const name =
    typeof body?.name === "string" && body.name.trim()
      ? body.name.trim()
      : undefined;
  const description =
    typeof body?.description === "string"
      ? body.description.trim() || null
      : undefined;

  const row = await prisma.major.update({
    where: { id },
    data: {
      code,
      name,
      description,
    },
  });

  return jsonOk(row);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!id) return jsonError("VALIDATION_ERROR", "id is required");

  await prisma.major.delete({ where: { id } });
  return jsonOk({ id });
}
