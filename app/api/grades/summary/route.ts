import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { GradeComponent, Prisma, Semester } from "@prisma/client";

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

const toSemester = (value: string | null): Semester | null => {
  if (!value) return null;
  const normalized = value.toUpperCase();
  if (normalized === "ODD" || normalized === "EVEN") {
    return normalized as Semester;
  }
  return null;
};

const buildEmptyComponentAccumulator = (): ComponentAccumulator => ({
  HOMEWORK: { total: 0, count: 0 },
  QUIZ: { total: 0, count: 0 },
  EXAM: { total: 0, count: 0 },
  PRACTICAL: { total: 0, count: 0 },
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN, ROLES.TEACHER]);
  if (roleError) return roleError;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const semesterParam = searchParams.get("semester");
  const requestedSemester = toSemester(semesterParam);
  if (semesterParam && !requestedSemester) {
    return jsonError("VALIDATION_ERROR", "semester harus ODD atau EVEN", 400);
  }

  const where: Record<string, unknown> = {};
  if (subjectId) where.assignment = { subjectId };
  if (classId) {
    where.assignment = {
      ...(where.assignment ?? {}),
      classes: { some: { classId } },
    };
  }
  if (auth.role === ROLES.TEACHER) {
    where.assignment = {
      ...(where.assignment ?? {}),
      teacherId: auth.userId,
    };
  }

  const rows = await prisma.assignmentSubmission.findMany({
    where: where as Prisma.AssignmentSubmissionWhereInput,
    include: {
      student: true,
      assignment: {
        select: {
          subjectId: true,
          gradeComponent: true,
        },
      },
    },
  });

  const effectiveSemester =
    requestedSemester ??
    (
      await prisma.academicYear.findFirst({
        where: { isActive: true },
        select: { semester: true },
      })
    )?.semester ??
    null;

  const weightPolicy =
    classId && subjectId && effectiveSemester
      ? await prisma.gradeWeight.findUnique({
          where: {
            subjectId_classId_semester: {
              subjectId,
              classId,
              semester: effectiveSemester,
            },
          },
          select: {
            homeworkWeight: true,
            quizWeight: true,
            examWeight: true,
            practicalWeight: true,
          },
        })
      : null;

  const componentWeights: ComponentWeights = weightPolicy
    ? {
        HOMEWORK: weightPolicy.homeworkWeight,
        QUIZ: weightPolicy.quizWeight,
        EXAM: weightPolicy.examWeight,
        PRACTICAL: weightPolicy.practicalWeight,
      }
    : DEFAULT_COMPONENT_WEIGHTS;

  const aggregates = new Map<
    string,
    {
      studentId: string;
      studentName: string;
      assignments: number;
      componentTotals: ComponentAccumulator;
    }
  >();

  for (const row of rows) {
    if (row.grade === null || row.grade === undefined) continue;
    const existing = aggregates.get(row.studentId);
    const component = row.assignment.gradeComponent ?? "HOMEWORK";

    if (existing) {
      existing.assignments += 1;
      existing.componentTotals[component].total += row.grade;
      existing.componentTotals[component].count += 1;
    } else {
      aggregates.set(row.studentId, {
        studentId: row.studentId,
        studentName: row.student.name,
        assignments: 1,
        componentTotals: {
          ...buildEmptyComponentAccumulator(),
          [component]: { total: row.grade, count: 1 },
        },
      });
    }
  }

  const data = Array.from(aggregates.values())
    .map((entry) => {
      const componentAverages = GRADE_COMPONENTS.reduce<ComponentAverageMap>(
        (acc, component) => {
          const stat = entry.componentTotals[component];
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
        (sum, component) => sum + componentWeights[component],
        0
      );
      const weightedTotal = usedComponents.reduce(
        (sum, component) =>
          sum +
          (componentAverages[component] ?? 0) * componentWeights[component],
        0
      );
      const average =
        weightDenominator > 0 ? weightedTotal / weightDenominator : 0;

      return {
        studentId: entry.studentId,
        studentName: entry.studentName,
        average,
        assignments: entry.assignments,
        componentAverages,
        weights: componentWeights,
        semester: effectiveSemester,
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName));

  return jsonOk(data);
}
