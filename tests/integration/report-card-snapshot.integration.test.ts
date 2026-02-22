import { POST as publishReportCard } from "@/app/api/grades/report-cards/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    academicYear: {
      findUnique: vi.fn(),
    },
    assignmentSubmission: {
      findMany: vi.fn(),
    },
    gradeWeight: {
      findMany: vi.fn(),
    },
    reportCardSnapshot: {
      create: vi.fn(),
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

describe("POST /api/grades/report-cards", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("membuat snapshot baru setiap publish (immutable history)", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedFindAcademicYear = vi.mocked(prisma.academicYear.findUnique);
    const mockedFindSubmissions = vi.mocked(prisma.assignmentSubmission.findMany);
    const mockedFindWeights = vi.mocked(prisma.gradeWeight.findMany);
    const mockedCreateSnapshot = vi.mocked(prisma.reportCardSnapshot.create);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindAcademicYear.mockResolvedValue({
      id: "year-1",
      year: "2025/2026",
      semester: "ODD",
      startDate: new Date("2025-07-01T00:00:00.000Z"),
      endDate: new Date("2025-12-31T23:59:59.999Z"),
    } as never);
    mockedFindSubmissions.mockResolvedValue([
      {
        studentId: "student-1",
        grade: 88,
        student: { id: "student-1", name: "Alya" },
        assignment: {
          subjectId: "subject-1",
          gradeComponent: "HOMEWORK",
          subject: { name: "Matematika" },
        },
      },
    ] as never);
    mockedFindWeights.mockResolvedValue([] as never);
    mockedCreateSnapshot
      .mockResolvedValueOnce({
        id: "snapshot-1",
        classId: "class-1",
        academicYearId: "year-1",
        semester: "ODD",
        publishedById: "admin-1",
        publishedAt: new Date("2026-02-22T00:00:00.000Z"),
      } as never)
      .mockResolvedValueOnce({
        id: "snapshot-2",
        classId: "class-1",
        academicYearId: "year-1",
        semester: "ODD",
        publishedById: "admin-1",
        publishedAt: new Date("2026-02-22T00:05:00.000Z"),
      } as never);

    const payload = { classId: "class-1", academicYearId: "year-1" };
    const request1 = new Request("http://localhost/api/grades/report-cards", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const request2 = new Request("http://localhost/api/grades/report-cards", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response1 = await publishReportCard(request1 as never);
    const response2 = await publishReportCard(request2 as never);
    const payload1 = await response1.json();
    const payload2 = await response2.json();

    expect(response1.status).toBe(201);
    expect(response2.status).toBe(201);
    expect(payload1.data.id).toBe("snapshot-1");
    expect(payload2.data.id).toBe("snapshot-2");
    expect(payload1.data.id).not.toBe(payload2.data.id);
    expect(mockedCreateSnapshot).toHaveBeenCalledTimes(2);
  });
});
