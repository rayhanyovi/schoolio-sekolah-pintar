import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function POST(request: NextRequest, { params }: Params) {
  const body = await request.json();
  if (!body?.fileName || !body?.fileType) {
    return jsonError("VALIDATION_ERROR", "fileName and fileType are required");
  }

  const row = await prisma.materialAttachment.create({
    data: {
      materialId: params.id,
      fileName: body.fileName,
      fileType: body.fileType,
      sizeLabel: body.sizeLabel ?? null,
      url: body.url ?? null,
      storageKey: body.storageKey ?? null,
    },
  });

  return jsonOk(row, { status: 201 });
}
