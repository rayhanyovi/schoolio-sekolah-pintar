import { POST as seedAttendanceSessions } from "@/app/api/attendance/sessions/seed/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    academicYear: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    classSchedule: {
      findMany: vi.fn(),
    },
    calendarEvent: {
      findMany: vi.fn(),
    },
    attendanceSession: {
      findMany: vi.fn(),
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

describe("POST /api/attendance/sessions/seed - event policy", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("melewati seeding jika hari termasuk SCHOOL_HOLIDAY", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedFindActiveYear = vi.mocked(prisma.academicYear.findFirst);
    const mockedFindSchedules = vi.mocked(prisma.classSchedule.findMany);
    const mockedFindEvents = vi.mocked(prisma.calendarEvent.findMany);
    const mockedFindExisting = vi.mocked(prisma.attendanceSession.findMany);
    const mockedCreateSession = vi.mocked(prisma.attendanceSession.create);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindActiveYear.mockResolvedValue({ id: "year-active" } as never);
    mockedFindSchedules.mockResolvedValue([
      {
        id: "sch-1",
        classId: "class-1",
        subjectId: "subject-1",
        teacherId: "teacher-1",
        dayOfWeek: "MON",
        startTime: "07:00",
        endTime: "08:00",
      },
    ] as never);
    mockedFindEvents.mockResolvedValue([
      {
        id: "event-holiday",
        title: "Libur Nasional",
        description: null,
        type: "HOLIDAY",
        date: new Date("2026-03-02T00:00:00.000Z"),
        endDate: null,
        classes: [],
      },
    ] as never);
    mockedFindExisting.mockResolvedValue([] as never);

    const request = new Request("http://localhost/api/attendance/sessions/seed", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        dateFrom: "2026-03-02",
        dateTo: "2026-03-02",
      }),
    });
    const response = await seedAttendanceSessions(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.createdSessions).toBe(0);
    expect(payload.data.skippedByPolicy).toBe(1);
    expect(payload.data.policyBreakdown.SCHOOL_HOLIDAY).toBe(1);
    expect(mockedCreateSession).not.toHaveBeenCalled();
  });

  it("membuat sesi absensi pada NORMAL_DAY", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedFindActiveYear = vi.mocked(prisma.academicYear.findFirst);
    const mockedFindSchedules = vi.mocked(prisma.classSchedule.findMany);
    const mockedFindEvents = vi.mocked(prisma.calendarEvent.findMany);
    const mockedFindExisting = vi.mocked(prisma.attendanceSession.findMany);
    const mockedCreateSession = vi.mocked(prisma.attendanceSession.create);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindActiveYear.mockResolvedValue({ id: "year-active" } as never);
    mockedFindSchedules.mockResolvedValue([
      {
        id: "sch-1",
        classId: "class-1",
        subjectId: "subject-1",
        teacherId: "teacher-1",
        dayOfWeek: "MON",
        startTime: "07:00",
        endTime: "08:00",
      },
    ] as never);
    mockedFindEvents.mockResolvedValue([] as never);
    mockedFindExisting.mockResolvedValue([] as never);
    mockedCreateSession.mockResolvedValue({
      id: "session-1",
      sessionKey: "schedule:sch-1:2026-03-02",
    } as never);

    const request = new Request("http://localhost/api/attendance/sessions/seed", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        dateFrom: "2026-03-02",
        dateTo: "2026-03-02",
      }),
    });
    const response = await seedAttendanceSessions(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.createdSessions).toBe(1);
    expect(payload.data.skippedByPolicy).toBe(0);
    expect(payload.data.policyBreakdown.NORMAL_DAY).toBe(1);
    expect(mockedCreateSession).toHaveBeenCalledTimes(1);
  });
});
