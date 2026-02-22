import { POST } from "@/app/api/schedules/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    classSchedule: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    subject: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/authz", () => ({
  canTeacherManageSubjectClass: vi.fn(),
  getStudentClassId: vi.fn(),
  listLinkedClassIdsForParent: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireAuth: vi.fn(),
    requireRole: vi.fn(),
  };
});

describe("POST /api/schedules - overlap guard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("menolak bypass direct API call saat jadwal kelas bentrok", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedFindMany = vi.mocked(prisma.classSchedule.findMany);
    const mockedCreate = vi.mocked(prisma.classSchedule.create);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindMany.mockResolvedValue([
      {
        id: "schedule-existing",
        classId: "class-1",
        dayOfWeek: "MON",
        startTime: "08:00",
        endTime: "09:00",
      },
    ] as never);

    const request = new Request("http://localhost/api/schedules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        classId: "class-1",
        subjectId: "subject-1",
        dayOfWeek: "MON",
        startTime: "08:30",
        endTime: "09:30",
      }),
    });

    const response = await POST(request as never);
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("CONFLICT");
    expect(mockedCreate).not.toHaveBeenCalled();
  });
});
