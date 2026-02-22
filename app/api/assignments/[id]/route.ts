import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { listLinkedStudentIds } from "@/lib/authz";
import { ROLES } from "@/lib/constants";
import { mockAssignments } from "@/lib/mockData";

type Params = { params: Promise<{ id: string }> };

const teacherCanManageSubject = async (teacherId: string, subjectId: string) => {
  const relation = await prisma.subjectTeacher.findUnique({
    where: {
      subjectId_teacherId: {
        subjectId,
        teacherId,
      },
    },
    select: { teacherId: true },
  });
  return Boolean(relation);
};

const subjectMatchesClasses = async (subjectId: string, classIds: string[]) => {
  if (!classIds.length) return true;
  const rows = await prisma.subjectClass.findMany({
    where: {
      subjectId,
      classId: { in: classIds },
    },
    select: { classId: true },
  });
  return rows.length === classIds.length;
};

const GRADE_COMPONENT_VALUES = ["HOMEWORK", "QUIZ", "EXAM", "PRACTICAL"] as const;
type GradeComponentValue = (typeof GRADE_COMPONENT_VALUES)[number];

const parseGradeComponent = (value: unknown): GradeComponentValue | null => {
  if (typeof value !== "string") return null;
  const normalized = value.toUpperCase();
  return GRADE_COMPONENT_VALUES.includes(normalized as GradeComponentValue)
    ? (normalized as GradeComponentValue)
    : null;
};

const toGradeComponent = (
  value: unknown,
  fallback: GradeComponentValue = "HOMEWORK"
): GradeComponentValue => parseGradeComponent(value) ?? fallback;

const inferGradeComponentFromKind = (
  value: unknown
): GradeComponentValue => {
  const normalized = typeof value === "string" ? value.toUpperCase() : "";
  if (normalized === "QUIZ") return "QUIZ";
  if (normalized === "EXAM") return "EXAM";
  if (normalized === "PROJECT") return "PRACTICAL";
  return "HOMEWORK";
};

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.PARENT,
  ]);
  if (roleError) return roleError;

  const { id } = await params;

  if (isMockEnabled()) {
    const item = mockAssignments.find((row) => row.id === id);
    if (!item) return jsonError("NOT_FOUND", "Assignment not found", 404);
    return jsonOk({
      ...item,
      kind: item.type,
      deliveryType: null,
      type: item.type,
      allowLateSubmission: false,
      lateUntil: null,
      maxAttempts: null,
      gradingPolicy: "LATEST",
      gradeComponent: inferGradeComponentFromKind(item.type),
    });
  }

  const row = await prisma.assignment.findUnique({
    where: { id },
    include: { subject: true, teacher: true, classes: true },
  });
  if (!row) return jsonError("NOT_FOUND", "Assignment not found", 404);

  if (auth.role === ROLES.TEACHER && row.teacherId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke tugas ini", 403);
  }
  if (auth.role === ROLES.STUDENT) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: auth.userId },
      select: { classId: true },
    });
    const ownClassId = profile?.classId ?? null;
    const classIds = row.classes.map((link) => link.classId);
    if (!ownClassId || !classIds.includes(ownClassId)) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke tugas ini", 403);
    }
  }
  if (auth.role === ROLES.PARENT) {
    const linkedStudentIds = await listLinkedStudentIds(auth.userId);
    if (!linkedStudentIds.length) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke tugas ini", 403);
    }
    const profiles = await prisma.studentProfile.findMany({
      where: { userId: { in: linkedStudentIds } },
      select: { classId: true },
    });
    const parentClassIds = new Set(
      profiles
        .map((profile) => profile.classId)
        .filter((value): value is string => Boolean(value))
    );
    const isAllowed = row.classes.some((link) => parentClassIds.has(link.classId));
    if (!isAllowed) {
      return jsonError("FORBIDDEN", "Anda tidak memiliki akses ke tugas ini", 403);
    }
  }

  const data = {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    subjectId: row.subjectId,
    subjectName: row.subject.name,
    teacherId: row.teacherId,
    teacherName: row.teacher.name,
    classIds: row.classes.map((link) => link.classId),
    dueDate: row.dueDate,
    allowLateSubmission: row.allowLateSubmission,
    lateUntil: row.lateUntil,
    maxAttempts: row.maxAttempts,
    gradingPolicy: row.gradingPolicy,
    gradeComponent: row.gradeComponent,
    createdAt: row.createdAt,
    kind: row.kind,
    deliveryType: row.deliveryType,
    type: row.deliveryType ?? row.kind,
    status: row.status,
  };

  return jsonOk(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { id } = await params;
  const existing = await prisma.assignment.findUnique({
    where: { id },
    include: { classes: true },
  });
  if (!existing) return jsonError("NOT_FOUND", "Assignment not found", 404);
  if (auth.role === ROLES.TEACHER && existing.teacherId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa mengubah tugas ini", 403);
  }

  const body = await request.json();
  const nextSubjectId =
    typeof body.subjectId === "string" ? body.subjectId : existing.subjectId;
  const nextClassIds = Array.isArray(body.classIds)
    ? body.classIds
    : existing.classes.map((row) => row.classId);
  const nextDueDate =
    body.dueDate !== undefined ? new Date(body.dueDate) : existing.dueDate;
  if (Number.isNaN(nextDueDate.getTime())) {
    return jsonError("VALIDATION_ERROR", "dueDate is invalid", 400);
  }
  const nextAllowLateSubmission =
    body.allowLateSubmission !== undefined
      ? Boolean(body.allowLateSubmission)
      : existing.allowLateSubmission;
  const nextLateUntil =
    body.lateUntil !== undefined
      ? body.lateUntil === null || body.lateUntil === ""
        ? null
        : new Date(body.lateUntil)
      : existing.lateUntil;
  if (nextLateUntil && Number.isNaN(nextLateUntil.getTime())) {
    return jsonError("VALIDATION_ERROR", "lateUntil is invalid", 400);
  }
  if (nextAllowLateSubmission && !nextLateUntil) {
    return jsonError(
      "VALIDATION_ERROR",
      "lateUntil wajib diisi saat allowLateSubmission aktif",
      400
    );
  }
  if (
    nextAllowLateSubmission &&
    nextLateUntil &&
    nextLateUntil.getTime() <= nextDueDate.getTime()
  ) {
    return jsonError(
      "VALIDATION_ERROR",
      "lateUntil harus lebih besar dari dueDate",
      400
    );
  }
  const nextMaxAttempts =
    body.maxAttempts !== undefined
      ? body.maxAttempts === null || body.maxAttempts === ""
        ? null
        : Number(body.maxAttempts)
      : existing.maxAttempts;
  if (
    nextMaxAttempts !== null &&
    (!Number.isInteger(nextMaxAttempts) || nextMaxAttempts <= 0)
  ) {
    return jsonError(
      "VALIDATION_ERROR",
      "maxAttempts harus berupa bilangan bulat positif",
      400
    );
  }
  const nextGradingPolicy =
    body.gradingPolicy !== undefined
      ? body.gradingPolicy === null || body.gradingPolicy === ""
        ? "LATEST"
        : String(body.gradingPolicy).toUpperCase()
      : existing.gradingPolicy;
  if (!["LATEST", "HIGHEST", "MANUAL"].includes(nextGradingPolicy)) {
    return jsonError(
      "VALIDATION_ERROR",
      "gradingPolicy harus salah satu dari LATEST, HIGHEST, MANUAL",
      400
    );
  }
  const requestedGradeComponent =
    body.gradeComponent === undefined ||
    body.gradeComponent === null ||
    body.gradeComponent === ""
      ? null
      : parseGradeComponent(body.gradeComponent);
  if (
    body.gradeComponent !== undefined &&
    body.gradeComponent !== null &&
    body.gradeComponent !== "" &&
    !requestedGradeComponent
  ) {
    return jsonError(
      "VALIDATION_ERROR",
      "gradeComponent harus salah satu dari HOMEWORK, QUIZ, EXAM, PRACTICAL",
      400
    );
  }
  const nextGradeComponent =
    requestedGradeComponent ??
    (body.gradeComponent !== undefined
      ? "HOMEWORK"
      : toGradeComponent(
          existing.gradeComponent,
          inferGradeComponentFromKind(existing.kind)
        ));

  if (auth.role === ROLES.TEACHER) {
    const hasSubjectAccess = await teacherCanManageSubject(
      auth.userId,
      nextSubjectId
    );
    if (!hasSubjectAccess) {
      return jsonError(
        "FORBIDDEN",
        "Guru tidak terdaftar sebagai pengampu mapel ini",
        403
      );
    }
    const hasClassAccess = await subjectMatchesClasses(
      nextSubjectId,
      nextClassIds
    );
    if (!hasClassAccess) {
      return jsonError(
        "FORBIDDEN",
        "Kelas yang dipilih tidak sesuai relasi mapel",
        403
      );
    }
  }

  const row = await prisma.assignment.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      subjectId: body.subjectId,
      teacherId:
        auth.role === ROLES.ADMIN ? body.teacherId : existing.teacherId,
      dueDate: body.dueDate !== undefined ? nextDueDate : undefined,
      allowLateSubmission:
        body.allowLateSubmission !== undefined ? nextAllowLateSubmission : undefined,
      lateUntil:
        body.allowLateSubmission === false
          ? null
          : body.lateUntil !== undefined
            ? nextLateUntil
            : undefined,
      maxAttempts:
        body.maxAttempts !== undefined ? nextMaxAttempts : undefined,
      gradingPolicy:
        body.gradingPolicy !== undefined ? nextGradingPolicy : undefined,
      gradeComponent:
        body.gradeComponent !== undefined ? nextGradeComponent : undefined,
      kind: body.kind ?? undefined,
      deliveryType: body.deliveryType ?? body.type ?? undefined,
      status: body.status,
    },
  });

  if (Array.isArray(body.classIds)) {
    await prisma.assignmentClass.deleteMany({ where: { assignmentId: row.id } });
    if (body.classIds.length) {
      await prisma.assignmentClass.createMany({
        data: body.classIds.map((cid: string) => ({
          assignmentId: row.id,
          classId: cid,
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

  const { id } = await params;
  const existing = await prisma.assignment.findUnique({
    where: { id },
    select: { teacherId: true },
  });
  if (!existing) return jsonError("NOT_FOUND", "Assignment not found", 404);
  if (auth.role === ROLES.TEACHER && existing.teacherId !== auth.userId) {
    return jsonError("FORBIDDEN", "Anda tidak bisa menghapus tugas ini", 403);
  }

  await prisma.assignment.delete({ where: { id } });
  return jsonOk({ id });
}
