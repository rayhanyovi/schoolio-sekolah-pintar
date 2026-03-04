import { GET as listParentChildren } from "@/app/api/parents/me/children/route";
import { GET as listGrades } from "@/app/api/grades/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api";
import { listLinkedStudentIds } from "@/lib/authz";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    academicYear: {
      findFirst: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    assignmentSubmission: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/authz", () => ({
  listLinkedStudentIds: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireAuth: vi.fn(),
    requireRole: vi.fn(),
  };
});

describe("E2E role journey - PARENT", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("monitor anak dengan scope aman", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedFindActiveYear = vi.mocked(prisma.academicYear.findFirst);
    const mockedFindChildren = vi.mocked(prisma.user.findMany);
    const mockedLinkedStudentIds = vi.mocked(listLinkedStudentIds);
    const mockedFindGrades = vi.mocked(prisma.assignmentSubmission.findMany);

    mockedRequireAuth.mockResolvedValue({
      userId: "parent-1",
      role: ROLES.PARENT,
      schoolId: "school-1",
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindActiveYear.mockResolvedValue({ id: "year-active" } as never);
    mockedLinkedStudentIds.mockResolvedValue(["student-1"] as never);
    mockedFindChildren.mockResolvedValue([
      {
        id: "student-1",
        name: "Alya",
        email: "alya@example.com",
        role: "STUDENT",
        studentProfile: { classId: "class-1", status: "ACTIVE" },
      },
    ] as never);
    mockedFindGrades.mockResolvedValue([] as never);

    const childrenResponse = await listParentChildren(
      new Request("http://localhost/api/parents/me/children", {
        method: "GET",
      }) as never
    );
    const invalidGradeResponse = await listGrades(
      new Request("http://localhost/api/grades?studentId=student-999", {
        method: "GET",
      }) as never
    );
    const validGradeResponse = await listGrades(
      new Request("http://localhost/api/grades?studentId=student-1", {
        method: "GET",
      }) as never
    );

    expect(childrenResponse.status).toBe(200);
    expect(invalidGradeResponse.status).toBe(403);
    expect(validGradeResponse.status).toBe(200);
  });
});
