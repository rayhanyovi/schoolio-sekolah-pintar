import { POST as createAcademicYear } from "@/app/api/academic-years/route";
import { POST as createClass } from "@/app/api/classes/route";
import { GET as getMetrics } from "@/app/api/metrics/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    academicYear: {
      create: vi.fn(),
    },
    class: {
      create: vi.fn(),
    },
    uploadScanJob: {
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    $queryRaw: vi.fn(),
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

describe("E2E role journey - ADMIN", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("menjalankan flow master data sampai monitoring", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedCreateYear = vi.mocked(prisma.academicYear.create);
    const mockedCreateClass = vi.mocked(prisma.class.create);
    const mockedUploadScanJobCount = vi.mocked(prisma.uploadScanJob.count);
    const mockedUploadScanJobFindFirst = vi.mocked(prisma.uploadScanJob.findFirst);
    const mockedQueryRaw = vi.mocked(prisma.$queryRaw);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedCreateYear.mockResolvedValue({
      id: "year-1",
      year: "2026/2027",
      semester: "ODD",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-12-31T23:59:59.999Z"),
      isActive: true,
    } as never);
    mockedCreateClass.mockResolvedValue({
      id: "class-1",
      name: "X IPA",
      grade: 10,
      major: "SCIENCE",
      section: "A",
      homeroomTeacherId: null,
      homeroomTeacher: null,
      academicYear: { year: "2026/2027" },
      studentCount: 0,
      maleCount: 0,
      femaleCount: 0,
    } as never);
    mockedUploadScanJobCount.mockResolvedValue(0 as never);
    mockedUploadScanJobFindFirst.mockResolvedValue(null as never);
    mockedQueryRaw.mockResolvedValue([{ "?column?": 1 }] as never);

    const yearRequest = new Request("http://localhost/api/academic-years", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        year: "2026/2027",
        semester: "ODD",
        startDate: "2026-07-01",
        endDate: "2026-12-31",
        isActive: true,
      }),
    });
    const yearResponse = await createAcademicYear(yearRequest as never);

    const classRequest = new Request("http://localhost/api/classes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "X IPA",
        grade: 10,
        section: "A",
        major: "SCIENCE",
        academicYearId: "year-1",
      }),
    });
    const classResponse = await createClass(classRequest as never);
    const metricsResponse = await getMetrics(
      new Request("http://localhost/api/metrics", { method: "GET" }) as never
    );
    const metricsPayload = await metricsResponse.json();

    expect(yearResponse.status).toBe(201);
    expect(classResponse.status).toBe(201);
    expect(metricsResponse.status).toBe(200);
    expect(metricsPayload.data.status).toBe("ok");
  });
});
