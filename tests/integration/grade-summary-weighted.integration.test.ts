import { GET as getGradeSummary } from "@/app/api/grades/summary/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    assignmentSubmission: {
      findMany: vi.fn(),
    },
    gradeWeight: {
      findUnique: vi.fn(),
    },
    academicYear: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireAuth: vi.fn(),
    requireRole: vi.fn(),
  };
});

describe("GET /api/grades/summary - weighted average", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("menggunakan bobot komponen (bukan average mentah)", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedFindMany = vi.mocked(prisma.assignmentSubmission.findMany);
    const mockedFindWeight = vi.mocked(prisma.gradeWeight.findUnique);
    const mockedFindActiveYear = vi.mocked(prisma.academicYear.findFirst);

    mockedRequireAuth.mockResolvedValue({
      userId: "teacher-1",
      role: ROLES.TEACHER,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindActiveYear
      .mockResolvedValueOnce({ id: "year-active" } as never)
      .mockResolvedValueOnce({ semester: "ODD" } as never);
    mockedFindWeight.mockResolvedValue({
      homeworkWeight: 30,
      quizWeight: 0,
      examWeight: 70,
      practicalWeight: 0,
    } as never);
    mockedFindMany.mockResolvedValue([
      {
        studentId: "student-1",
        grade: 80,
        student: { name: "Alya" },
        assignment: { subjectId: "subject-1", gradeComponent: "HOMEWORK" },
      },
      {
        studentId: "student-1",
        grade: 60,
        student: { name: "Alya" },
        assignment: { subjectId: "subject-1", gradeComponent: "EXAM" },
      },
    ] as never);

    const request = new Request(
      "http://localhost/api/grades/summary?classId=class-1&subjectId=subject-1",
      { method: "GET" }
    );
    const response = await getGradeSummary(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0].average).toBe(66);
    expect(payload.data[0].assignments).toBe(2);
    expect(payload.data[0].weights).toEqual({
      HOMEWORK: 30,
      QUIZ: 0,
      EXAM: 70,
      PRACTICAL: 0,
    });
    expect(mockedFindWeight).toHaveBeenCalledTimes(1);
  });
});
