import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockPackages } from "@/lib/questionTypes";

type Params = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  if (isMockEnabled()) {
    const item = mockPackages.find((row) => row.id === params.id);
    if (!item) return jsonError("NOT_FOUND", "Package not found", 404);
    return jsonOk(item);
  }

  const row = await prisma.questionPackage.findUnique({
    where: { id: params.id },
    include: { items: true, subject: true },
  });
  if (!row) return jsonError("NOT_FOUND", "Package not found", 404);

  const data = {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    subject: row.subject?.name ?? row.subjectText ?? "",
    questionIds: row.items
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((item) => item.questionId),
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt ?? undefined,
    usageCount: row.usageCount,
  };

  return jsonOk(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const body = await request.json();
  const subjectId = body.subjectId ?? null;
  const row = await prisma.questionPackage.update({
    where: { id: params.id },
    data: {
      name: body.name,
      description: body.description,
      subjectId,
      subjectText: subjectId ? null : body.subject ?? null,
      lastUsedAt: body.lastUsedAt ? new Date(body.lastUsedAt) : undefined,
      usageCount: body.usageCount,
    },
  });

  if (Array.isArray(body.questionIds)) {
    await prisma.questionPackageItem.deleteMany({ where: { packageId: row.id } });
    if (body.questionIds.length) {
      await prisma.questionPackageItem.createMany({
        data: body.questionIds.map((questionId: string, index: number) => ({
          packageId: row.id,
          questionId,
          position: index + 1,
        })),
        skipDuplicates: true,
      });
    }
  }

  return jsonOk(row);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  await prisma.questionPackage.delete({ where: { id: params.id } });
  return jsonOk({ id: params.id });
}
