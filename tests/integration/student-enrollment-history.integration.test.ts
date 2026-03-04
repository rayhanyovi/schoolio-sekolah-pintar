import { PATCH as updateUserProfile } from "@/app/api/users/[id]/profile/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireAuth: vi.fn(),
  };
});

describe("PATCH /api/users/[id]/profile - class enrollment history", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("menutup enrollment lama dan membuat enrollment baru saat class siswa berubah", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedTransaction = vi.mocked(prisma.$transaction);

    mockedRequireAuth.mockResolvedValue({
      userId: "admin-1",
      role: ROLES.ADMIN,
      schoolId: "school-1",
    } as never);

    const tx = {
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({
            id: "student-1",
            schoolId: "school-1",
            name: "Alya",
            email: "alya@example.com",
            firstName: "Alya",
            lastName: "Putri",
            phone: null,
            address: null,
            bio: null,
            avatarUrl: null,
            birthDate: null,
            studentProfile: { classId: "class-old", gender: "FEMALE" },
            teacherProfile: null,
            parentProfile: null,
          })
          .mockResolvedValueOnce({
            id: "student-1",
            schoolId: "school-1",
            name: "Alya",
            email: "alya@example.com",
            firstName: "Alya",
            lastName: "Putri",
            phone: null,
            address: null,
            bio: null,
            avatarUrl: null,
            birthDate: null,
            studentProfile: { classId: "class-new", gender: "FEMALE" },
            teacherProfile: null,
            parentProfile: null,
          }),
        update: vi.fn().mockResolvedValue({
          id: "student-1",
          name: "Alya",
        }),
      },
      studentProfile: {
        upsert: vi.fn().mockResolvedValue({}),
      },
      teacherProfile: {
        upsert: vi.fn().mockResolvedValue({}),
      },
      parentProfile: {
        upsert: vi.fn().mockResolvedValue({}),
      },
      studentClassEnrollment: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockResolvedValue({}),
      },
      class: {
        findFirst: vi.fn().mockResolvedValue({ id: "class-new" }),
        findUnique: vi.fn().mockResolvedValue({ academicYearId: "ay-2" }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({}),
      },
    };

    mockedTransaction.mockImplementation(async (callback: never) => {
      return callback(tx);
    });

    const request = new Request("http://localhost/api/users/student-1/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        studentProfile: {
          classId: "class-new",
          gender: "FEMALE",
        },
      }),
    });

    const response = await updateUserProfile(request as never, {
      params: { id: "student-1" },
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.id).toBe("student-1");
    expect(tx.studentClassEnrollment.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.studentClassEnrollment.create).toHaveBeenCalledTimes(1);
    expect(tx.studentClassEnrollment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studentId: "student-1",
        classId: "class-new",
        academicYearId: "ay-2",
      }),
    });
  });
});
