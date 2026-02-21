import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { mockNotes } from "@/lib/mockData";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]);
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const visibility = searchParams.get("visibility");
  const subjectId = searchParams.get("subjectId");
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  if (isMockEnabled()) {
    const data = mockNotes.filter((item) => {
      const visibilityMatch = visibility ? item.visibility === visibility : true;
      const subjectMatch = subjectId ? item.subjectId === subjectId : true;
      const queryMatch = q ? item.title.toLowerCase().includes(q) : true;
      return visibilityMatch && subjectMatch && queryMatch;
    });
    return jsonOk(data);
  }

  const where: Prisma.NoteWhereInput = {};
  if (visibility) where.visibility = visibility;
  if (subjectId) where.subjectId = subjectId;
  if (q) where.title = { contains: q, mode: "insensitive" };

  if (auth.role === ROLES.TEACHER) {
    where.OR = [{ authorId: auth.userId }, { visibility: "CLASS" }];
  }

  if (auth.role === ROLES.STUDENT) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: auth.userId },
      select: { classId: true },
    });
    const studentClassId = profile?.classId ?? null;
    if (studentClassId) {
      where.OR = [
        { authorId: auth.userId },
        { visibility: "CLASS", classId: studentClassId },
      ];
    } else {
      where.authorId = auth.userId;
    }
  }

  const rows = await prisma.note.findMany({
    where,
    include: { subject: true, class: true, author: true },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });

  const data = rows.map((row) => ({
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
  }));

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]);
  if (roleError) return roleError;

  const body = await request.json();
  if (!body?.title || !body?.content) {
    return jsonError("VALIDATION_ERROR", "title and content are required");
  }

  const row = await prisma.note.create({
    data: {
      title: body.title,
      content: body.content,
      subjectId: body.subjectId ?? null,
      classId: body.classId ?? null,
      authorId: auth.userId,
      visibility: body.visibility ?? "PRIVATE",
      isPinned: Boolean(body.isPinned),
      color: body.color ?? null,
      tags: body.tags ?? [],
    },
  });

  return jsonOk(row, { status: 201 });
}
