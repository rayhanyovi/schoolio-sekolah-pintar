import { NextRequest } from "next/server";
import { GradeComponent, Prisma, Semester } from "@prisma/client";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { resolveAcademicYearScope } from "@/lib/academic-year-scope";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

const GRADE_COMPONENTS: GradeComponent[] = [
  "HOMEWORK",
  "QUIZ",
  "EXAM",
  "PRACTICAL",
];

type ComponentWeights = Record<GradeComponent, number>;
type ComponentAverageMap = Record<GradeComponent, number | null>;
type ComponentAccumulator = Record<
  GradeComponent,
  { total: number; count: number }
>;

const DEFAULT_COMPONENT_WEIGHTS: ComponentWeights = {
  HOMEWORK: 25,
  QUIZ: 25,
  EXAM: 25,
  PRACTICAL: 25,
};

const buildEmptyComponentAccumulator = (): ComponentAccumulator => ({
  HOMEWORK: { total: 0, count: 0 },
  QUIZ: { total: 0, count: 0 },
  EXAM: { total: 0, count: 0 },
  PRACTICAL: { total: 0, count: 0 },
});

const toSemester = (value: unknown): Semester | null => {
  if (typeof value !== "string") return null;
  const normalized = value.toUpperCase();
  if (normalized === "ODD" || normalized === "EVEN") {
    return normalized as Semester;
  }
  return null;
};

const toWeightMap = (
  row:
    | {
        homeworkWeight: number;
        quizWeight: number;
        examWeight: number;
        practicalWeight: number;
      }
    | null
    | undefined
): ComponentWeights =>
  row
    ? {
        HOMEWORK: row.homeworkWeight,
        QUIZ: row.quizWeight,
        EXAM: row.examWeight,
        PRACTICAL: row.practicalWeight,
      }
    : DEFAULT_COMPONENT_WEIGHTS;

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const semesterParam = searchParams.get("semester");
  const includeSnapshot = searchParams.get("includeSnapshot") === "true";
  const yearScopeResult = await resolveAcademicYearScope(request);
  if (yearScopeResult.error) return yearScopeResult.error;
  const { academicYearId, includeAllAcademicYears } = yearScopeResult.scope;
  if (!includeAllAcademicYears && !academicYearId) {
    return jsonOk([]);
  }
  const semester = semesterParam ? toSemester(semesterParam) : null;
  if (semesterParam && !semester) {
    return jsonError("VALIDATION_ERROR", "semester harus ODD atau EVEN", 400);
  }

  const where: Prisma.ReportCardSnapshotWhereInput = {};
  if (classId) where.classId = classId;
  if (academicYearId) where.academicYearId = academicYearId;
  if (semester) where.semester = semester;

  const rows = await prisma.reportCardSnapshot.findMany({
    where,
    include: {
      class: { select: { name: true, section: true } },
      academicYear: { select: { year: true, semester: true } },
      publishedBy: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  const data = rows.map((row) => {
    const snapshotPayload = row.snapshot as
      | { students?: Array<unknown> }
      | null
      | undefined;
    const studentCount = Array.isArray(snapshotPayload?.students)
      ? snapshotPayload.students.length
      : 0;

    return {
      id: row.id,
      classId: row.classId,
      className: `${row.class.name} ${row.class.section}`.trim(),
      academicYearId: row.academicYearId,
      academicYearLabel: `${row.academicYear.year} ${row.academicYear.semester}`,
      semester: row.semester,
      publishedById: row.publishedById,
      publishedByName: row.publishedBy.name,
      publishedAt: row.publishedAt,
      studentCount,
      snapshot: includeSnapshot ? row.snapshot : undefined,
    };
  });

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const body = await request.json();
  if (!body?.classId || !body?.academicYearId) {
    return jsonError(
      "VALIDATION_ERROR",
      "classId and academicYearId are required",
      400
    );
  }

  const academicYear = await prisma.academicYear.findUnique({
    where: { id: body.academicYearId },
    select: {
      id: true,
      year: true,
      semester: true,
      startDate: true,
      endDate: true,
    },
  });
  if (!academicYear) {
    return jsonError("NOT_FOUND", "Academic year not found", 404);
  }

  const gradedRows = await prisma.assignmentSubmission.findMany({
    where: {
      grade: { not: null },
      assignment: {
        classes: { some: { classId: body.classId } },
        dueDate: {
          gte: academicYear.startDate,
          lte: academicYear.endDate,
        },
      },
    },
    include: {
      student: { select: { id: true, name: true } },
      assignment: {
        select: {
          subjectId: true,
          gradeComponent: true,
          subject: { select: { name: true } },
        },
      },
    },
  });

  const subjectIds = Array.from(
    new Set(gradedRows.map((row) => row.assignment.subjectId))
  );
  const gradeWeights = subjectIds.length
    ? await prisma.gradeWeight.findMany({
        where: {
          classId: body.classId,
          semester: academicYear.semester,
          subjectId: { in: subjectIds },
        },
        select: {
          subjectId: true,
          homeworkWeight: true,
          quizWeight: true,
          examWeight: true,
          practicalWeight: true,
        },
      })
    : [];
  const gradeWeightMap = new Map(gradeWeights.map((row) => [row.subjectId, row]));

  const studentAggregate = new Map<
    string,
    {
      studentId: string;
      studentName: string;
      subjects: Map<
        string,
        {
          subjectId: string;
          subjectName: string;
          assignments: number;
          componentTotals: ComponentAccumulator;
        }
      >;
    }
  >();

  for (const row of gradedRows) {
    if (row.grade === null || row.grade === undefined) continue;
    const studentEntry =
      studentAggregate.get(row.studentId) ??
      (() => {
        const created = {
          studentId: row.studentId,
          studentName: row.student.name,
          subjects: new Map(),
        };
        studentAggregate.set(row.studentId, created);
        return created;
      })();

    const subjectEntry =
      studentEntry.subjects.get(row.assignment.subjectId) ??
      (() => {
        const created = {
          subjectId: row.assignment.subjectId,
          subjectName: row.assignment.subject.name,
          assignments: 0,
          componentTotals: buildEmptyComponentAccumulator(),
        };
        studentEntry.subjects.set(row.assignment.subjectId, created);
        return created;
      })();

    const component = row.assignment.gradeComponent ?? "HOMEWORK";
    subjectEntry.assignments += 1;
    subjectEntry.componentTotals[component].total += row.grade;
    subjectEntry.componentTotals[component].count += 1;
  }

  const students = Array.from(studentAggregate.values())
    .map((student) => {
      const subjects = Array.from(student.subjects.values())
        .map((subject) => {
          const weights = toWeightMap(gradeWeightMap.get(subject.subjectId));
          const componentAverages = GRADE_COMPONENTS.reduce<ComponentAverageMap>(
            (acc, component) => {
              const stat = subject.componentTotals[component];
              acc[component] = stat.count ? stat.total / stat.count : null;
              return acc;
            },
            {
              HOMEWORK: null,
              QUIZ: null,
              EXAM: null,
              PRACTICAL: null,
            }
          );
          const usedComponents = GRADE_COMPONENTS.filter(
            (component) => componentAverages[component] !== null
          );
          const weightDenominator = usedComponents.reduce(
            (sum, component) => sum + weights[component],
            0
          );
          const weightedTotal = usedComponents.reduce(
            (sum, component) =>
              sum + (componentAverages[component] ?? 0) * weights[component],
            0
          );
          const finalGrade =
            weightDenominator > 0 ? weightedTotal / weightDenominator : 0;

          return {
            subjectId: subject.subjectId,
            subjectName: subject.subjectName,
            assignments: subject.assignments,
            finalGrade,
            componentAverages,
            weights,
          };
        })
        .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

      const overallAverage = subjects.length
        ? subjects.reduce((sum, subject) => sum + subject.finalGrade, 0) /
          subjects.length
        : 0;

      return {
        studentId: student.studentId,
        studentName: student.studentName,
        overallAverage,
        subjects,
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName));

  const snapshotPayload = {
    generatedAt: new Date().toISOString(),
    classId: body.classId,
    academicYearId: academicYear.id,
    semester: academicYear.semester,
    students,
  };

  const published = await prisma.reportCardSnapshot.create({
    data: {
      classId: body.classId,
      academicYearId: academicYear.id,
      semester: academicYear.semester,
      publishedById: auth.userId,
      snapshot: snapshotPayload,
    },
  });

  return jsonOk(
    {
      id: published.id,
      classId: published.classId,
      academicYearId: published.academicYearId,
      semester: published.semester,
      publishedById: published.publishedById,
      publishedAt: published.publishedAt,
      studentCount: students.length,
      snapshot: snapshotPayload,
    },
    { status: 201 }
  );
}
