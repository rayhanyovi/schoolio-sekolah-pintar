import { POST as createUser } from "@/app/api/users/route";
import { GET as getUserById } from "@/app/api/users/[id]/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
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

describe("Sensitive auth/authz endpoints", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("menolak bypass role untuk POST /api/users dari actor non-admin", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedTransaction = vi.mocked(prisma.$transaction);

    mockedRequireAuth.mockResolvedValue({
      userId: "student-1",
      role: ROLES.STUDENT,
      schoolId: null,
    } as never);

    const request = new Request("http://localhost/api/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Bypass Attempt",
        role: ROLES.TEACHER,
      }),
    });

    const response = await createUser(request as never);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(mockedTransaction).not.toHaveBeenCalled();
  });

  it("menolak bypass ownership untuk GET /api/users/[id] dari user lain", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedFindUnique = vi.mocked(prisma.user.findUnique);

    mockedRequireAuth.mockResolvedValue({
      userId: "student-1",
      role: ROLES.STUDENT,
      schoolId: null,
    } as never);

    const request = new Request("http://localhost/api/users/target-user", {
      method: "GET",
    });

    const response = await getUserById(request as never, {
      params: Promise.resolve({ id: "target-user" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });
});
