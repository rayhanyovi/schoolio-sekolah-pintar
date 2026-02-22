import { POST as postReply } from "@/app/api/forum/threads/[id]/replies/route";
import { PATCH as patchReply } from "@/app/api/forum/replies/[id]/route";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    forumThread: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    forumReply: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireAuth: vi.fn(),
  };
});

describe("Forum lock enforcement - direct API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("menolak create reply untuk student saat thread LOCKED", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedThreadFindUnique = vi.mocked(prisma.forumThread.findUnique);
    const mockedReplyCreate = vi.mocked(prisma.forumReply.create);
    const mockedThreadUpdate = vi.mocked(prisma.forumThread.update);

    mockedRequireAuth.mockResolvedValue({
      userId: "student-1",
      role: ROLES.STUDENT,
      schoolId: null,
    } as never);
    mockedThreadFindUnique.mockResolvedValue({ status: "LOCKED" } as never);

    const request = new Request("http://localhost/api/forum/threads/thread-1/replies", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "Saya coba bypass lock" }),
    });

    const response = await postReply(request as never, {
      params: { id: "thread-1" },
    });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(mockedReplyCreate).not.toHaveBeenCalled();
    expect(mockedThreadUpdate).not.toHaveBeenCalled();
  });

  it("menolak edit reply untuk owner student saat thread LOCKED", async () => {
    const mockedRequireAuth = vi.mocked(requireAuth);
    const mockedReplyFindUnique = vi.mocked(prisma.forumReply.findUnique);
    const mockedReplyUpdate = vi.mocked(prisma.forumReply.update);

    mockedRequireAuth.mockResolvedValue({
      userId: "student-1",
      role: ROLES.STUDENT,
      schoolId: null,
    } as never);
    mockedReplyFindUnique.mockResolvedValue({
      id: "reply-1",
      authorId: "student-1",
      thread: { status: "LOCKED" },
    } as never);

    const request = new Request("http://localhost/api/forum/replies/reply-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "Saya coba edit pas lock" }),
    });

    const response = await patchReply(request as never, {
      params: { id: "reply-1" },
    });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(mockedReplyUpdate).not.toHaveBeenCalled();
  });
});
