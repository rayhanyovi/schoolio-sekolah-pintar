import { POST as createParentInvite } from "@/app/api/parent-invites/route";
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
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const buildTransactionMock = () => ({
  parentInvite: {
    updateMany: vi.fn(),
    create: vi.fn(),
  },
});

describe("parent invites route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({
      userId: "admin-1",
      name: "Admin",
      role: ROLES.ADMIN,
      canUseDebugPanel: false,
      onboardingCompleted: true,
      schoolId: "school-1",
      issuedAt: 1,
      expiresAt: 2,
    } as never);
  });

  it("admin bisa membuat kode invite parent untuk siswa satu tenant", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "student-1",
      name: "Siswa A",
    } as never);
    const tx = buildTransactionMock();
    tx.parentInvite.create.mockResolvedValue({
      id: "invite-1",
      expiresAt: new Date("2026-03-12T00:00:00.000Z"),
    });
    vi.mocked(prisma.$transaction).mockImplementation(
      async (callback: (tx: typeof tx) => unknown) => callback(tx) as never
    );

    const response = await createParentInvite(
      new Request("http://localhost/api/parent-invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId: "student-1" }),
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.student.id).toBe("student-1");
    expect(payload.data.code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(tx.parentInvite.updateMany).toHaveBeenCalledTimes(1);
  });

  it("menolak jika siswa tidak ditemukan di tenant", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null as never);

    const response = await createParentInvite(
      new Request("http://localhost/api/parent-invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId: "student-tidak-ada" }),
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("NOT_FOUND");
  });
});

