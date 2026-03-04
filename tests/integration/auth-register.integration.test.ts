import { POST as register } from "@/app/api/auth/register/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      count: vi.fn(),
    },
    schoolProfile: {
      findFirst: vi.fn(),
    },
    authCredential: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/password", () => ({
  hashPassword: vi.fn(),
}));

const buildTransactionMock = () => ({
  user: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
  teacherProfile: {
    create: vi.fn(),
  },
  studentProfile: {
    create: vi.fn(),
  },
  parentProfile: {
    create: vi.fn(),
  },
  authCredential: {
    create: vi.fn(),
  },
  parentStudent: {
    create: vi.fn(),
  },
});

describe("auth register route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(hashPassword).mockResolvedValue({
      passwordHash: "hash",
      passwordSalt: "salt",
    });
  });

  it("membuat admin pertama", async () => {
    const mockedCount = vi.mocked(prisma.user.count);
    const mockedFindCredential = vi.mocked(prisma.authCredential.findUnique);
    const mockedTransaction = vi.mocked(prisma.$transaction);
    const tx = buildTransactionMock();
    tx.user.create.mockResolvedValue({
      id: "admin-1",
      name: "Admin Pertama",
      role: ROLES.ADMIN,
      onboardingCompletedAt: null,
    });
    mockedCount.mockResolvedValue(0 as never);
    mockedFindCredential.mockResolvedValue(null as never);
    mockedTransaction.mockImplementation(
      async (callback: (tx: typeof tx) => unknown) => callback(tx) as never
    );

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Admin Pertama",
        identifier: "admin-baru",
        password: "password123",
        role: ROLES.ADMIN,
      }),
    });

    const response = await register(request as never);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.data.user.id).toBe("admin-1");
    expect(payload.data.onboardingCompleted).toBe(false);
  });

  it("menolak registrasi admin kedua", async () => {
    vi.mocked(prisma.user.count).mockResolvedValue(1 as never);

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Admin Kedua",
        identifier: "admin-kedua",
        password: "password123",
        role: ROLES.ADMIN,
      }),
    });

    const response = await register(request as never);
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("CONFLICT");
  });

  it("menolak registrasi teacher tanpa school code", async () => {
    vi.mocked(prisma.authCredential.findUnique).mockResolvedValue(null as never);

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Guru Baru",
        identifier: "guru-baru",
        password: "password123",
        role: ROLES.TEACHER,
      }),
    });

    const response = await register(request as never);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
  });

  it("menolak registrasi non-admin dengan school code invalid", async () => {
    vi.mocked(prisma.schoolProfile.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.authCredential.findUnique).mockResolvedValue(null as never);

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Siswa Baru",
        identifier: "siswa-baru",
        password: "password123",
        role: ROLES.STUDENT,
        schoolCode: "SCH-SALAH",
      }),
    });

    const response = await register(request as never);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
  });

  it("menghubungkan parent ke siswa saat childStudentId valid", async () => {
    const mockedFindSchool = vi.mocked(prisma.schoolProfile.findFirst);
    const mockedFindCredential = vi.mocked(prisma.authCredential.findUnique);
    const mockedTransaction = vi.mocked(prisma.$transaction);
    const tx = buildTransactionMock();
    tx.user.create.mockResolvedValue({
      id: "parent-1",
      name: "Orang Tua Baru",
      role: ROLES.PARENT,
      onboardingCompletedAt: null,
    });
    tx.user.findFirst.mockResolvedValue({
      id: "student-1",
      name: "Siswa Satu",
    });
    mockedFindSchool.mockResolvedValue({ id: "school-1" } as never);
    mockedFindCredential.mockResolvedValue(null as never);
    mockedTransaction.mockImplementation(
      async (callback: (tx: typeof tx) => unknown) => callback(tx) as never
    );

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Orang Tua Baru",
        identifier: "ortu-baru",
        password: "password123",
        role: ROLES.PARENT,
        schoolCode: "SCH-DEMO01",
        childStudentId: "student-1",
      }),
    });

    const response = await register(request as never);
    expect(response.status).toBe(201);
    expect(tx.parentStudent.create).toHaveBeenCalledTimes(1);
  });

  it("mengembalikan NOT_FOUND saat childStudentId tidak valid", async () => {
    const mockedFindSchool = vi.mocked(prisma.schoolProfile.findFirst);
    const mockedFindCredential = vi.mocked(prisma.authCredential.findUnique);
    const mockedTransaction = vi.mocked(prisma.$transaction);
    const tx = buildTransactionMock();
    tx.user.create.mockResolvedValue({
      id: "parent-2",
      name: "Orang Tua Dua",
      role: ROLES.PARENT,
      onboardingCompletedAt: null,
    });
    tx.user.findFirst.mockResolvedValue(null);
    mockedFindSchool.mockResolvedValue({ id: "school-1" } as never);
    mockedFindCredential.mockResolvedValue(null as never);
    mockedTransaction.mockImplementation(
      async (callback: (tx: typeof tx) => unknown) => callback(tx) as never
    );

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Orang Tua Dua",
        identifier: "ortu-dua",
        password: "password123",
        role: ROLES.PARENT,
        schoolCode: "SCH-DEMO01",
        childStudentId: "student-tidak-ada",
      }),
    });

    const response = await register(request as never);
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("NOT_FOUND");
  });
});
