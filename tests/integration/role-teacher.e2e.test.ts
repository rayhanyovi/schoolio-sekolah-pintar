import { POST as createAssignment } from "@/app/api/assignments/route";
import { POST as createAttendanceSession } from "@/app/api/attendance/sessions/route";
import { PATCH as gradeSubmission } from "@/app/api/submissions/[id]/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api";
import { canTeacherManageSubjectClass } from "@/lib/authz";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subjectTeacher: {
      findUnique: vi.fn(),
    },
    subjectClass: {
      findMany: vi.fn(),
    },
    assignment: {
      create: vi.fn(),
    },
    assignmentClass: {
      createMany: vi.fn(),
    },
    studentProfile: {
      findMany: vi.fn(),
    },
    attendanceSession: {
      upsert: vi.fn(),
    },
    assignmentSubmission: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/authz", () => ({
  canTeacherManageSubjectClass: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/notification-service", () => ({
  createInAppNotifications: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireAuth: vi.fn(),
    requireRole: vi.fn(),
  };
});

describe("E2E role journey - TEACHER", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("menjalankan flow ajar, absen, tugas, dan nilai", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedSubjectTeacher = vi.mocked(prisma.subjectTeacher.findUnique);
    const mockedSubjectClass = vi.mocked(prisma.subjectClass.findMany);
    const mockedCreateAssignment = vi.mocked(prisma.assignment.create);
    const mockedCreateAssignmentClass = vi.mocked(prisma.assignmentClass.createMany);
    const mockedFindStudentProfiles = vi.mocked(prisma.studentProfile.findMany);
    const mockedUpsertSession = vi.mocked(prisma.attendanceSession.upsert);
    const mockedFindSubmission = vi.mocked(prisma.assignmentSubmission.findUnique);
    const mockedTransaction = vi.mocked(prisma.$transaction);
    const mockedCanTeacherManage = vi.mocked(canTeacherManageSubjectClass);

    mockedRequireAuth.mockResolvedValue({
      userId: "teacher-1",
      role: ROLES.TEACHER,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedCanTeacherManage.mockResolvedValue(true as never);
    mockedSubjectTeacher.mockResolvedValue({ teacherId: "teacher-1" } as never);
    mockedSubjectClass.mockResolvedValue([{ classId: "class-1" }] as never);
    mockedCreateAssignment.mockResolvedValue({
      id: "assignment-1",
      title: "Latihan Bab 1",
      description: "",
      subjectId: "subject-1",
      teacherId: "teacher-1",
      dueDate: new Date("2026-03-05T00:00:00.000Z"),
      allowLateSubmission: false,
      lateUntil: null,
      maxAttempts: null,
      gradingPolicy: "LATEST",
      gradeComponent: "HOMEWORK",
      kind: "HOMEWORK",
      deliveryType: "ESSAY",
      status: "ACTIVE",
    } as never);
    mockedCreateAssignmentClass.mockResolvedValue({ count: 1 } as never);
    mockedFindStudentProfiles.mockResolvedValue([] as never);
    mockedUpsertSession.mockResolvedValue({
      id: "session-1",
      classId: "class-1",
      subjectId: "subject-1",
      status: "OPEN",
    } as never);
    mockedFindSubmission.mockResolvedValue({
      id: "submission-1",
      studentId: "student-1",
      assignmentId: "assignment-1",
      status: "SUBMITTED",
      grade: null,
      feedback: null,
      response: null,
      submittedAt: new Date("2026-03-03T00:00:00.000Z"),
      attemptCount: 1,
      assignment: {
        teacherId: "teacher-1",
        dueDate: new Date("2026-03-05T00:00:00.000Z"),
        allowLateSubmission: false,
        lateUntil: null,
        maxAttempts: null,
        gradingPolicy: "LATEST",
      },
    } as never);
    mockedTransaction.mockImplementation(async (callback: never) =>
      callback({
        assignmentSubmission: {
          update: vi.fn().mockResolvedValue({
            id: "submission-1",
            assignmentId: "assignment-1",
            studentId: "student-1",
            status: "GRADED",
            grade: 90,
            feedback: "Bagus",
            response: null,
            submittedAt: new Date("2026-03-03T00:00:00.000Z"),
            attemptCount: 1,
          }),
        },
        auditLog: {
          create: vi.fn().mockResolvedValue({ id: "audit-1" }),
        },
        parentStudent: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      } as never)
    );

    const assignmentRequest = new Request("http://localhost/api/assignments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Latihan Bab 1",
        subjectId: "subject-1",
        dueDate: "2026-03-05",
        classIds: ["class-1"],
        kind: "HOMEWORK",
        deliveryType: "ESSAY",
      }),
    });
    const assignmentResponse = await createAssignment(assignmentRequest as never);

    const attendanceRequest = new Request(
      "http://localhost/api/attendance/sessions",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          classId: "class-1",
          subjectId: "subject-1",
          date: "2026-03-03",
          startTime: "07:00",
          endTime: "08:00",
        }),
      }
    );
    const attendanceResponse = await createAttendanceSession(
      attendanceRequest as never
    );

    const gradeRequest = new Request(
      "http://localhost/api/submissions/submission-1",
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "GRADED",
          grade: 90,
          feedback: "Bagus",
          reason: "Penilaian akhir",
        }),
      }
    );
    const gradeResponse = await gradeSubmission(gradeRequest as never, {
      params: Promise.resolve({ id: "submission-1" }),
    } as never);

    expect(assignmentResponse.status).toBe(201);
    expect(attendanceResponse.status).toBe(200);
    expect(gradeResponse.status).toBe(200);
  });
});
