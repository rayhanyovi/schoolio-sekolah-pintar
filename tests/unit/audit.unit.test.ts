import { recordAudit } from "@/lib/audit";
import { ROLES } from "@/lib/constants";

describe("audit writer", () => {
  it("mencatat actor, target, snapshot JSON-safe, metadata, dan reason", async () => {
    const client = {
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-1" }),
      },
    };

    await recordAudit(
      {
        userId: "actor-1",
        role: ROLES.ADMIN,
      },
      {
        action: "SCHOOL_PROFILE_UPDATED",
        entityType: "SchoolProfile",
        entityId: "school-1",
        beforeData: {
          name: "Old School",
          updatedAt: new Date("2026-04-25T08:00:00.000Z"),
        },
        afterData: {
          name: "New School",
          updatedAt: new Date("2026-04-25T09:00:00.000Z"),
        },
        metadata: {
          source: "unit-test",
        },
        reason: "admin update",
      },
      client
    );

    expect(client.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: "actor-1",
        actorRole: ROLES.ADMIN,
        action: "SCHOOL_PROFILE_UPDATED",
        entityType: "SchoolProfile",
        entityId: "school-1",
        beforeData: {
          name: "Old School",
          updatedAt: "2026-04-25T08:00:00.000Z",
        },
        afterData: {
          name: "New School",
          updatedAt: "2026-04-25T09:00:00.000Z",
        },
        metadata: {
          source: "unit-test",
        },
        reason: "admin update",
      },
    });
  });
});
