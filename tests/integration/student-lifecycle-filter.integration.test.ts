import { GET as listStudentsRoute } from "@/app/api/students/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    academicYear: {
      findFirst: vi.fn(),
    },
    user: {
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

describe("GET /api/students lifecycle default filter", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("default hanya mengambil student ACTIVE jika includeInactive tidak diaktifkan", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedFindActiveYear = vi.mocked(prisma.academicYear.findFirst);
    const mockedFindMany = vi.mocked(prisma.user.findMany);

    mockedRequireAuth.mockResolvedValue({
      userId: "teacher-1",
      role: ROLES.TEACHER,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindActiveYear.mockResolvedValue({ id: "year-active" } as never);
    mockedFindMany.mockResolvedValue([] as never);

    const request = new Request("http://localhost/api/students", {
      method: "GET",
    });
    const response = await listStudentsRoute(request as never);

    expect(response.status).toBe(200);
    expect(mockedFindMany).toHaveBeenCalledTimes(1);
    const where = (mockedFindMany.mock.calls[0]?.[0] as { where: unknown }).where as {
      studentProfile?: { status?: string; class?: { academicYearId?: string } };
    };
    expect(where.studentProfile?.status).toBe("ACTIVE");
    expect(where.studentProfile?.class?.academicYearId).toBe("year-active");
  });

  it("mengizinkan includeInactive=true untuk menonaktifkan filter status default", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedFindActiveYear = vi.mocked(prisma.academicYear.findFirst);
    const mockedFindMany = vi.mocked(prisma.user.findMany);

    mockedRequireAuth.mockResolvedValue({
      userId: "teacher-1",
      role: ROLES.TEACHER,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindActiveYear.mockResolvedValue({ id: "year-active" } as never);
    mockedFindMany.mockResolvedValue([] as never);

    const request = new Request(
      "http://localhost/api/students?includeInactive=true",
      { method: "GET" }
    );
    const response = await listStudentsRoute(request as never);

    expect(response.status).toBe(200);
    const where = (mockedFindMany.mock.calls[0]?.[0] as { where: unknown }).where as {
      studentProfile?: { status?: string };
    };
    expect(where.studentProfile?.status).toBeUndefined();
  });
});
