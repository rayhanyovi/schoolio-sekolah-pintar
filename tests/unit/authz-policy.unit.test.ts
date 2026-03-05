import { ROLES } from "@/lib/constants";
import {
  ActorContext,
  canAccessOwnUser,
  canViewParent,
  canViewStudent,
  hasAnyRole,
} from "@/lib/authz";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
    parentStudent: {
      findUnique: vi.fn(),
    },
  },
}));

const makeActor = (role: ActorContext["role"], userId: string): ActorContext => ({
  role,
  userId,
  schoolId: "school-1",
});

describe("Authz policy unit", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("hasAnyRole bekerja sesuai daftar role yang diizinkan", () => {
    const admin = makeActor(ROLES.ADMIN, "admin-1");

    expect(hasAnyRole(admin, [ROLES.ADMIN])).toBe(true);
    expect(hasAnyRole(admin, [ROLES.TEACHER, ROLES.STUDENT])).toBe(false);
  });

  it("canAccessOwnUser mengizinkan admin dan owner", () => {
    const admin = makeActor(ROLES.ADMIN, "admin-1");
    const student = makeActor(ROLES.STUDENT, "student-1");

    expect(canAccessOwnUser(admin, "any-user")).toBe(true);
    expect(canAccessOwnUser(student, "student-1")).toBe(true);
    expect(canAccessOwnUser(student, "student-2")).toBe(false);
  });

  it("canViewStudent menutup akses student ke data student lain", async () => {
    const student = makeActor(ROLES.STUDENT, "student-1");

    await expect(canViewStudent(student, "student-1")).resolves.toBe(true);
    await expect(canViewStudent(student, "student-2")).resolves.toBe(false);
  });

  it("canViewStudent untuk parent bergantung relasi parent-student", async () => {
    const parent = makeActor(ROLES.PARENT, "parent-1");
    const mockedFindUnique = vi.mocked(prisma.parentStudent.findUnique);

    mockedFindUnique.mockResolvedValueOnce({
      student: { schoolId: "school-1" },
    } as never);
    await expect(canViewStudent(parent, "student-1")).resolves.toBe(true);

    mockedFindUnique.mockResolvedValueOnce(null);
    await expect(canViewStudent(parent, "student-2")).resolves.toBe(false);
  });

  it("canViewParent mengikuti policy role", async () => {
    const admin = makeActor(ROLES.ADMIN, "admin-1");
    const teacher = makeActor(ROLES.TEACHER, "teacher-1");
    const parent = makeActor(ROLES.PARENT, "parent-1");
    const student = makeActor(ROLES.STUDENT, "student-1");
    const mockedFindParent = vi.mocked(prisma.user.findFirst);

    mockedFindParent.mockResolvedValue({ id: "parent-x" } as never);

    await expect(canViewParent(admin, "parent-x")).resolves.toBe(true);
    await expect(canViewParent(teacher, "parent-x")).resolves.toBe(true);
    await expect(canViewParent(parent, "parent-1")).resolves.toBe(true);
    await expect(canViewParent(parent, "parent-2")).resolves.toBe(false);
    await expect(canViewParent(student, "parent-1")).resolves.toBe(false);
  });
});
