import { GET as listAssignmentsRoute } from "@/app/api/assignments/route";
import { GET as listClassesRoute } from "@/app/api/classes/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    academicYear: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    class: {
      findMany: vi.fn(),
    },
    assignment: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/authz", () => ({
  getStudentClassId: vi.fn(),
  listLinkedClassIdsForParent: vi.fn(),
  listLinkedStudentIds: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    isMockEnabled: vi.fn(() => false),
    requireAuth: vi.fn(),
    requireRole: vi.fn(),
  };
});

describe("Academic year scoping default behavior", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET /api/classes default memakai academic year aktif", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedFindActiveYear = vi.mocked(prisma.academicYear.findFirst);
    const mockedFindClasses = vi.mocked(prisma.class.findMany);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindActiveYear.mockResolvedValue({ id: "year-active" } as never);
    mockedFindClasses.mockResolvedValue([] as never);

    const request = new Request("http://localhost/api/classes", {
      method: "GET",
    });
    const response = await listClassesRoute(request as never);

    expect(response.status).toBe(200);
    const where = (mockedFindClasses.mock.calls[0]?.[0] as { where: unknown }).where as {
      academicYearId?: string;
    };
    expect(where.academicYearId).toBe("year-active");
  });

  it("GET /api/classes mengizinkan includeAllAcademicYears=true", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedFindActiveYear = vi.mocked(prisma.academicYear.findFirst);
    const mockedFindClasses = vi.mocked(prisma.class.findMany);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindClasses.mockResolvedValue([] as never);

    const request = new Request(
      "http://localhost/api/classes?includeAllAcademicYears=true",
      { method: "GET" }
    );
    const response = await listClassesRoute(request as never);

    expect(response.status).toBe(200);
    expect(mockedFindActiveYear).not.toHaveBeenCalled();
    const where = (mockedFindClasses.mock.calls[0]?.[0] as { where: unknown }).where as {
      academicYearId?: string;
    };
    expect(where.academicYearId).toBeUndefined();
  });

  it("GET /api/classes return kosong jika tidak ada active year", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedFindActiveYear = vi.mocked(prisma.academicYear.findFirst);
    const mockedFindClasses = vi.mocked(prisma.class.findMany);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindActiveYear.mockResolvedValue(null as never);

    const request = new Request("http://localhost/api/classes", {
      method: "GET",
    });
    const response = await listClassesRoute(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toEqual([]);
    expect(mockedFindClasses).not.toHaveBeenCalled();
  });

  it("GET /api/assignments default ter-scope ke academic year aktif", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedFindActiveYear = vi.mocked(prisma.academicYear.findFirst);
    const mockedFindAssignments = vi.mocked(prisma.assignment.findMany);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindActiveYear.mockResolvedValue({ id: "year-active" } as never);
    mockedFindAssignments.mockResolvedValue([] as never);

    const request = new Request("http://localhost/api/assignments", {
      method: "GET",
    });
    const response = await listAssignmentsRoute(request as never);

    expect(response.status).toBe(200);
    const where = (mockedFindAssignments.mock.calls[0]?.[0] as { where: unknown }).where as {
      classes?: { some?: { class?: { academicYearId?: string } } };
    };
    expect(where.classes?.some?.class?.academicYearId).toBe("year-active");
  });
});
