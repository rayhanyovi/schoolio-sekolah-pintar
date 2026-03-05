import { POST as selectRole } from "@/app/api/auth/onboarding/select-role/route";
import { requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireAuth: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    schoolProfile: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const buildTransactionMock = () => ({
  user: {
    update: vi.fn(),
  },
  schoolProfile: {
    create: vi.fn(),
  },
  teacherProfile: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
  studentProfile: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
  parentProfile: {
    deleteMany: vi.fn(),
  },
  parentStudent: {
    deleteMany: vi.fn(),
  },
});

describe("auth onboarding select-role route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({
      userId: "user-1",
      name: "User Baru",
      role: ROLES.STUDENT,
      canUseDebugPanel: false,
      onboardingCompleted: false,
      issuedAt: 1,
      expiresAt: 2,
      schoolId: null,
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      name: "User Baru",
      roleSelectedAt: null,
      onboardingCompletedAt: null,
    } as never);
  });

  it("memilih role teacher dengan schoolCode valid", async () => {
    const tx = buildTransactionMock();
    tx.user.update.mockResolvedValue({
      id: "user-1",
      name: "Guru Baru",
      role: ROLES.TEACHER,
      schoolId: "school-1",
    });

    vi.mocked(prisma.schoolProfile.findUnique).mockResolvedValue({
      id: "school-1",
    } as never);
    vi.mocked(prisma.$transaction).mockImplementation(
      async (callback: (tx: typeof tx) => unknown) => callback(tx) as never
    );

    const request = new Request("http://localhost/api/auth/onboarding/select-role", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Guru Baru",
        role: ROLES.TEACHER,
        schoolCode: "sch-demo01",
      }),
    });

    const response = await selectRole(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.user.role).toBe(ROLES.TEACHER);
    expect(tx.teacherProfile.upsert).toHaveBeenCalledTimes(1);
  });

  it("menolak role teacher tanpa schoolCode", async () => {
    const request = new Request("http://localhost/api/auth/onboarding/select-role", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Guru Tanpa Kode",
        role: ROLES.TEACHER,
      }),
    });

    const response = await selectRole(request as never);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
  });

  it("memilih role admin dan membuat tenant sekolah baru", async () => {
    const tx = buildTransactionMock();
    tx.schoolProfile.create.mockResolvedValue({ id: "school-2" });
    tx.user.update.mockResolvedValue({
      id: "user-1",
      name: "Admin Baru",
      role: ROLES.ADMIN,
      schoolId: "school-2",
    });
    vi.mocked(prisma.$transaction).mockImplementation(
      async (callback: (tx: typeof tx) => unknown) => callback(tx) as never
    );

    const request = new Request("http://localhost/api/auth/onboarding/select-role", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Admin Baru",
        role: ROLES.ADMIN,
      }),
    });

    const response = await selectRole(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.user.role).toBe(ROLES.ADMIN);
    expect(payload.data.schoolId).toBe("school-2");
    expect(tx.schoolProfile.create).toHaveBeenCalledTimes(1);
  });
});
