import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockNotes } from "@/lib/mockData";

type Params = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]);
  if (roleError) return roleError;

  if (isMockEnabled()) {
    const item = mockNotes.find((row) => row.id === params.id);
    if (!item) return jsonError("NOT_FOUND", "Note not found", 404);
    return jsonOk(item);
  }

  const row = await prisma.note.findUnique({
    where: { id: params.id },
    include: { subject: true, class: true, author: true },
  });
  if (!row) return jsonError("NOT_FOUND", "Note not found", 404);

  const isAuthor = row.authorId === auth.userId;
  const isAdmin = auth.role === ROLES.ADMIN;
  if (!isAdmin && !isAuthor) {
    if (row.visibility !== "CLASS") {
      return jsonError("FORBIDDEN", "Anda tidak bisa mengakses catatan ini", 403);
    }
    if (auth.role === ROLES.STUDENT) {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: auth.userId },
        select: { classId: true },
      });
      if (!profile?.classId || profile.classId !== row.classId) {
        return jsonError("FORBIDDEN", "Anda tidak bisa mengakses catatan ini", 403);
      }
    }
  }

  const data = {
    id: row.id,
    title: row.title,
    content: row.content,
    subjectId: row.subjectId ?? undefined,
    subjectName: row.subject?.name ?? undefined,
    classId: row.classId ?? undefined,
    className: row.class?.name ?? undefined,
    authorId: row.authorId,
    authorName: row.author.name,
    visibility: row.visibility,
    isPinned: row.isPinned,
    color: row.color ?? "",
    tags: row.tags,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };

  return jsonOk(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]);
  if (roleError) return roleError;

  const existing = await prisma.note.findUnique({
    where: { id: params.id },
    select: { authorId: true },
  });
  if (!existing) return jsonError("NOT_FOUND", "Note not found", 404);
  if (auth.role !== ROLES.ADMIN && existing.authorId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa mengubah catatan ini", 403);
  }

  const body = await request.json();
  const row = await prisma.note.update({
    where: { id: params.id },
    data: {
      title: body.title,
      content: body.content,
      subjectId: body.subjectId,
      classId: body.classId,
      visibility: body.visibility,
      isPinned: body.isPinned,
      color: body.color,
      tags: body.tags,
    },
  });
  return jsonOk(row);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]);
  if (roleError) return roleError;

  const existing = await prisma.note.findUnique({
    where: { id: params.id },
    select: { authorId: true },
  });
  if (!existing) return jsonError("NOT_FOUND", "Note not found", 404);
  if (auth.role !== ROLES.ADMIN && existing.authorId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa menghapus catatan ini", 403);
  }

  await prisma.note.delete({ where: { id: params.id } });
  return jsonOk({ id: params.id });
}
