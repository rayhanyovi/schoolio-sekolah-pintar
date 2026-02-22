import { GET as listMaterials } from "@/app/api/materials/route";
import { POST as submitAssignment } from "@/app/api/assignments/[id]/submissions/route";
import { GET as listGrades } from "@/app/api/grades/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    academicYear: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    studentProfile: {
      findUnique: vi.fn(),
    },
    material: {
      findMany: vi.fn(),
    },
    assignment: {
      findUnique: vi.fn(),
    },
    assignmentSubmission: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireAuth: vi.fn(),
    requireRole: vi.fn(),
    isMockEnabled: vi.fn(() => false),
  };
});

describe("E2E role journey - STUDENT", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("menjalankan flow materi, submit tugas, lalu lihat nilai", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedRequireRole = vi.mocked(requireRole);
    const mockedFindActiveYear = vi.mocked(prisma.academicYear.findFirst);
    const mockedFindStudentProfile = vi.mocked(prisma.studentProfile.findUnique);
    const mockedFindMaterials = vi.mocked(prisma.material.findMany);
    const mockedFindAssignment = vi.mocked(prisma.assignment.findUnique);
    const mockedTransaction = vi.mocked(prisma.$transaction);
    const mockedFindGrades = vi.mocked(prisma.assignmentSubmission.findMany);

    mockedRequireAuth.mockResolvedValue({
      userId: "student-1",
      role: ROLES.STUDENT,
      schoolId: null,
    } as never);
    mockedRequireRole.mockReturnValue(null);
    mockedFindActiveYear.mockResolvedValue({ id: "year-active" } as never);
    mockedFindStudentProfile.mockResolvedValue({ classId: "class-1" } as never);
    mockedFindMaterials.mockResolvedValue([
      {
        id: "material-1",
        title: "Ringkasan Bab 1",
        description: "Materi pembuka",
        subjectId: "subject-1",
        classId: "class-1",
        teacherId: "teacher-1",
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
        subject: { name: "Matematika" },
        class: { name: "X IPA" },
        teacher: { name: "Bu Sari" },
        attachments: [],
      },
    ] as never);
    mockedFindAssignment.mockResolvedValue({
      id: "assignment-1",
      dueDate: new Date("2099-03-10T00:00:00.000Z"),
      allowLateSubmission: false,
      lateUntil: null,
      maxAttempts: null,
    } as never);
    mockedTransaction.mockImplementation(async (callback: never) =>
      callback({
        assignmentSubmission: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockResolvedValue({
            id: "submission-1",
            assignmentId: "assignment-1",
            studentId: "student-1",
            status: "SUBMITTED",
            attemptCount: 1,
            submittedAt: new Date("2026-03-03T00:00:00.000Z"),
          }),
        },
        auditLog: {
          create: vi.fn().mockResolvedValue({ id: "audit-1" }),
        },
      } as never)
    );
    mockedFindGrades.mockResolvedValue([
      {
        id: "submission-1",
        assignmentId: "assignment-1",
        studentId: "student-1",
        status: "GRADED",
        grade: 92,
        submittedAt: new Date("2026-03-03T00:00:00.000Z"),
        createdAt: new Date("2026-03-03T00:00:00.000Z"),
        student: { name: "Alya" },
        assignment: {
          title: "Latihan Bab 1",
          subjectId: "subject-1",
          gradeComponent: "HOMEWORK",
          subject: { name: "Matematika" },
        },
      },
    ] as never);

    const materialsResponse = await listMaterials(
      new Request("http://localhost/api/materials", { method: "GET" }) as never
    );
    const submitRequest = new Request(
      "http://localhost/api/assignments/assignment-1/submissions",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "SUBMITTED",
          response: { essay: "Jawaban saya" },
        }),
      }
    );
    const submitResponse = await submitAssignment(submitRequest as never, {
      params: Promise.resolve({ id: "assignment-1" }),
    } as never);
    const gradesResponse = await listGrades(
      new Request("http://localhost/api/grades", { method: "GET" }) as never
    );
    const gradesPayload = await gradesResponse.json();

    expect(materialsResponse.status).toBe(200);
    expect(submitResponse.status).toBe(200);
    expect(gradesResponse.status).toBe(200);
    expect(gradesPayload.data).toHaveLength(1);
    expect(gradesPayload.data[0].studentId).toBe("student-1");
  });
});
