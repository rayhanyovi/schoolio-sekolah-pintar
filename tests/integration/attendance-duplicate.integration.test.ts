import { POST } from "@/app/api/attendance/sessions/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    attendanceSession: {
      upsert: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
    },
    subject: {
      findFirst: vi.fn(),
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

describe("POST /api/attendance/sessions - duplicate guard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("tetap idempotent untuk request duplikat direct API", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedUpsert = vi.mocked(prisma.attendanceSession.upsert);
    const mockedFindClass = vi.mocked(prisma.class.findFirst);
    const mockedFindSubject = vi.mocked(prisma.subject.findFirst);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: "school-1",
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindClass.mockResolvedValue({ id: "class-1" } as never);
    mockedFindSubject.mockResolvedValue({ id: "subject-1" } as never);

    const sessionMap = new Map<string, { id: string; sessionKey: string }>();
    mockedUpsert.mockImplementation(async (args: never) => {
      const key = (args as { where: { sessionKey: string } }).where.sessionKey;
      if (!sessionMap.has(key)) {
        sessionMap.set(key, {
          id: `session-${sessionMap.size + 1}`,
          sessionKey: key,
        });
      }
      return sessionMap.get(key) as never;
    });

    const payload = {
      classId: "class-1",
      subjectId: "subject-1",
      teacherId: "teacher-1",
      date: "2026-02-22",
      startTime: "08:00",
      endTime: "09:00",
    };

    const request1 = new Request("http://localhost/api/attendance/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const request2 = new Request("http://localhost/api/attendance/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response1 = await POST(request1 as never);
    const response2 = await POST(request2 as never);
    const payload1 = await response1.json();
    const payload2 = await response2.json();

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(payload1.data.id).toBe(payload2.data.id);
    expect(mockedUpsert).toHaveBeenCalledTimes(2);

    const firstSessionKey = (
      mockedUpsert.mock.calls[0]?.[0] as { where: { sessionKey: string } }
    ).where.sessionKey;
    const secondSessionKey = (
      mockedUpsert.mock.calls[1]?.[0] as { where: { sessionKey: string } }
    ).where.sessionKey;

    expect(firstSessionKey).toBe(secondSessionKey);
  });

  it("mengabaikan sessionKey dari body dan selalu menghitung business key server-side", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedUpsert = vi.mocked(prisma.attendanceSession.upsert);
    const mockedFindClass = vi.mocked(prisma.class.findFirst);
    const mockedFindSubject = vi.mocked(prisma.subject.findFirst);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: "school-1",
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindClass.mockResolvedValue({ id: "class-1" } as never);
    mockedFindSubject.mockResolvedValue({ id: "subject-1" } as never);
    mockedUpsert.mockResolvedValue({
      id: "session-1",
      sessionKey: "manual:class-1:subject-1:2026-02-22:08:00:09:00",
    } as never);

    const request = new Request("http://localhost/api/attendance/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionKey: "manual:evil:subject-1:2026-02-22:00:00:01:00",
        classId: "class-1",
        subjectId: "subject-1",
        teacherId: "teacher-1",
        date: "2026-02-22",
        startTime: "08:00",
        endTime: "09:00",
      }),
    });

    const response = await POST(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.id).toBe("session-1");
    expect(mockedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          sessionKey: "manual:class-1:subject-1:2026-02-22:08:00:09:00",
        },
      })
    );
  });
});
