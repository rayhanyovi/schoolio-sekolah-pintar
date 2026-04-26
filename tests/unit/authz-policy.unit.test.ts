import { ROLES } from "@/lib/constants";
import {
  ActorContext,
  canAccessOwnUser,
  canTeacherManageSubjectClass,
  canViewParent,
  canViewStudent,
  hasAnyRole,
  listLinkedClassIdsForParent,
} from "@/lib/authz";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
    subject: {
      findFirst: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
    },
    subjectTeacher: {
      findUnique: vi.fn(),
    },
    subjectClass: {
      findUnique: vi.fn(),
    },
    studentProfile: {
      findMany: vi.fn(),
    },
    parentStudent: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
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

  it("canTeacherManageSubjectClass wajib subject dan class berada di sekolah actor", async () => {
    vi.mocked(prisma.subject.findFirst).mockResolvedValue({ id: "subject-1" } as never);
    vi.mocked(prisma.class.findFirst).mockResolvedValue({ id: "class-1" } as never);
    vi.mocked(prisma.subjectTeacher.findUnique).mockResolvedValue({
      teacherId: "teacher-1",
    } as never);
    vi.mocked(prisma.subjectClass.findUnique).mockResolvedValue({
      classId: "class-1",
    } as never);

    await expect(
      canTeacherManageSubjectClass(
        "teacher-1",
        "subject-1",
        "school-1",
        "class-1"
      )
    ).resolves.toBe(true);

    expect(prisma.subject.findFirst).toHaveBeenCalledWith({
      where: { id: "subject-1", schoolId: "school-1" },
      select: { id: true },
    });
    expect(prisma.class.findFirst).toHaveBeenCalledWith({
      where: { id: "class-1", schoolId: "school-1" },
      select: { id: true },
    });
  });

  it("canTeacherManageSubjectClass menolak subject lintas sekolah", async () => {
    vi.mocked(prisma.subject.findFirst).mockResolvedValue(null);

    await expect(
      canTeacherManageSubjectClass(
        "teacher-1",
        "subject-other-school",
        "school-1",
        "class-1"
      )
    ).resolves.toBe(false);

    expect(prisma.subjectTeacher.findUnique).not.toHaveBeenCalled();
    expect(prisma.subjectClass.findUnique).not.toHaveBeenCalled();
  });

  it("canTeacherManageSubjectClass menolak class lintas sekolah", async () => {
    vi.mocked(prisma.subject.findFirst).mockResolvedValue({ id: "subject-1" } as never);
    vi.mocked(prisma.class.findFirst).mockResolvedValue(null);

    await expect(
      canTeacherManageSubjectClass(
        "teacher-1",
        "subject-1",
        "school-1",
        "class-other-school"
      )
    ).resolves.toBe(false);

    expect(prisma.subjectTeacher.findUnique).not.toHaveBeenCalled();
    expect(prisma.subjectClass.findUnique).not.toHaveBeenCalled();
  });

  it("listLinkedClassIdsForParent hanya mengembalikan class unik dari anak tertaut", async () => {
    vi.mocked(prisma.parentStudent.findMany).mockResolvedValue([
      { studentId: "student-1" },
      { studentId: "student-2" },
      { studentId: "student-3" },
    ] as never);
    vi.mocked(prisma.studentProfile.findMany).mockResolvedValue([
      { classId: "class-1" },
      { classId: "class-1" },
      { classId: "class-2" },
      { classId: null },
    ] as never);

    await expect(listLinkedClassIdsForParent("parent-1")).resolves.toEqual([
      "class-1",
      "class-2",
    ]);

    expect(prisma.studentProfile.findMany).toHaveBeenCalledWith({
      where: { userId: { in: ["student-1", "student-2", "student-3"] } },
      select: { classId: true },
    });
  });
});
