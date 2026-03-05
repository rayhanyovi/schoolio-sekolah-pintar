import { POST as register } from "@/app/api/auth/register/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

vi.mock("@/lib/prisma", () => ({
  prisma: {
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
  },
  authCredential: {
    create: vi.fn(),
  },
  parentInvite: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  parentProfile: {
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

  it("membuat akun baru tanpa memilih role saat register", async () => {
    const mockedFindCredential = vi.mocked(prisma.authCredential.findUnique);
    const mockedTransaction = vi.mocked(prisma.$transaction);
    const tx = buildTransactionMock();
    tx.user.create.mockResolvedValue({
      id: "user-1",
      name: "",
      role: ROLES.STUDENT,
      onboardingCompletedAt: null,
    });
    mockedFindCredential.mockResolvedValue(null as never);
    mockedTransaction.mockImplementation(
      async (callback: (tx: typeof tx) => unknown) => callback(tx) as never
    );

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "user-baru@example.com",
        password: "password123",
        confirmPassword: "password123",
      }),
    });

    const response = await register(request as never);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.data.user.id).toBe("user-1");
    expect(payload.data.user.role).toBe(ROLES.STUDENT);
    expect(payload.data.onboardingCompleted).toBe(false);
    expect(payload.data.roleSelectionRequired).toBe(true);
  });

  it("menolak identifier yang sudah terdaftar", async () => {
    vi.mocked(prisma.authCredential.findUnique).mockResolvedValue({
      id: "cred-1",
    } as never);

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "existing-user@example.com",
        password: "password123",
        confirmPassword: "password123",
      }),
    });

    const response = await register(request as never);
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("CONFLICT");
  });

  it("menolak payload jika konfirmasi password tidak cocok", async () => {
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "baru@example.com",
        password: "password123",
        confirmPassword: "beda-password",
      }),
    });

    const response = await register(request as never);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
  });

  it("register parent via invite code valid akan langsung role parent", async () => {
    const mockedFindCredential = vi.mocked(prisma.authCredential.findUnique);
    const mockedTransaction = vi.mocked(prisma.$transaction);
    const tx = buildTransactionMock();
    tx.parentInvite.findFirst.mockResolvedValue({
      id: "invite-1",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      schoolId: "school-1",
      student: {
        id: "student-1",
        name: "Siswa",
        role: ROLES.STUDENT,
        schoolId: "school-1",
      },
    });
    tx.user.create.mockResolvedValue({
      id: "parent-1",
      name: "",
      role: ROLES.PARENT,
      onboardingCompletedAt: null,
      schoolId: "school-1",
    });
    mockedFindCredential.mockResolvedValue(null as never);
    mockedTransaction.mockImplementation(
      async (callback: (tx: typeof tx) => unknown) => callback(tx) as never
    );

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "ortu@example.com",
        password: "password123",
        confirmPassword: "password123",
        parentInviteCode: "ABCD-EFGH-JKLM",
      }),
    });

    const response = await register(request as never);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.data.user.role).toBe(ROLES.PARENT);
    expect(payload.data.roleSelectionRequired).toBe(false);
    expect(tx.parentStudent.create).toHaveBeenCalledTimes(1);
    expect(tx.parentInvite.update).toHaveBeenCalledTimes(1);
  });
});
