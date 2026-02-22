import { NextRequest } from "next/server";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";
import { Prisma, Semester } from "@prisma/client";

const toSemester = (value: unknown): Semester | null => {
  if (typeof value !== "string") return null;
  const normalized = value.toUpperCase();
  if (normalized === "ODD" || normalized === "EVEN") {
    return normalized as Semester;
  }
  return null;
};

const toWeight = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
};

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");
  const classId = searchParams.get("classId");
  const semesterParam = searchParams.get("semester");
  const semester = semesterParam ? toSemester(semesterParam) : null;
  if (semesterParam && !semester) {
    return jsonError("VALIDATION_ERROR", "semester harus ODD atau EVEN", 400);
  }

  const where: Prisma.GradeWeightWhereInput = {};
  if (subjectId) where.subjectId = subjectId;
  if (classId) where.classId = classId;
  if (semester) where.semester = semester;

  const rows = await prisma.gradeWeight.findMany({
    where,
    include: {
      subject: { select: { name: true } },
      class: { select: { name: true, section: true } },
    },
    orderBy: [{ subjectId: "asc" }, { classId: "asc" }, { semester: "asc" }],
  });

  const data = rows.map((row) => ({
    id: row.id,
    subjectId: row.subjectId,
    subjectName: row.subject.name,
    classId: row.classId,
    className: `${row.class.name} ${row.class.section}`.trim(),
    semester: row.semester,
    homeworkWeight: row.homeworkWeight,
    quizWeight: row.quizWeight,
    examWeight: row.examWeight,
    practicalWeight: row.practicalWeight,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  return jsonOk(data);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const body = await request.json();
  if (!body?.subjectId || !body?.classId || !body?.semester) {
    return jsonError(
      "VALIDATION_ERROR",
      "subjectId, classId, semester are required",
      400
    );
  }

  const semester = toSemester(body.semester);
  if (!semester) {
    return jsonError("VALIDATION_ERROR", "semester harus ODD atau EVEN", 400);
  }

  const homeworkWeight = toWeight(body.homeworkWeight);
  const quizWeight = toWeight(body.quizWeight);
  const examWeight = toWeight(body.examWeight);
  const practicalWeight = toWeight(body.practicalWeight);
  if (
    homeworkWeight === null ||
    quizWeight === null ||
    examWeight === null ||
    practicalWeight === null
  ) {
    return jsonError(
      "VALIDATION_ERROR",
      "Semua bobot harus bilangan bulat >= 0",
      400
    );
  }

  const totalWeight =
    homeworkWeight + quizWeight + examWeight + practicalWeight;
  if (totalWeight !== 100) {
    return jsonError(
      "VALIDATION_ERROR",
      "Total bobot harus tepat 100",
      400
    );
  }

  const row = await prisma.gradeWeight.upsert({
    where: {
      subjectId_classId_semester: {
        subjectId: body.subjectId,
        classId: body.classId,
        semester,
      },
    },
    update: {
      homeworkWeight,
      quizWeight,
      examWeight,
      practicalWeight,
    },
    create: {
      subjectId: body.subjectId,
      classId: body.classId,
      semester,
      homeworkWeight,
      quizWeight,
      examWeight,
      practicalWeight,
    },
    include: {
      subject: { select: { name: true } },
      class: { select: { name: true, section: true } },
    },
  });

  return jsonOk({
    id: row.id,
    subjectId: row.subjectId,
    subjectName: row.subject.name,
    classId: row.classId,
    className: `${row.class.name} ${row.class.section}`.trim(),
    semester: row.semester,
    homeworkWeight: row.homeworkWeight,
    quizWeight: row.quizWeight,
    examWeight: row.examWeight,
    practicalWeight: row.practicalWeight,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
