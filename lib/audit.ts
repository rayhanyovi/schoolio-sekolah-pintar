import { Prisma } from "@prisma/client";
import { ActorContext } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

type AuditClient = {
  auditLog: {
    create: (args: { data: Prisma.AuditLogUncheckedCreateInput }) => Promise<unknown>;
  };
};

type AuditActor =
  | {
      userId?: ActorContext["userId"] | null;
      role?: ActorContext["role"] | null;
    }
  | null
  | undefined;

type AuditEvent = {
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: unknown;
  reason?: string | null;
};

const toAuditJson = (
  value: unknown
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === Prisma.JsonNull) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
};

export const recordAudit = async (
  actor: AuditActor,
  event: AuditEvent,
  client: AuditClient = prisma
) => {
  await client.auditLog.create({
    data: {
      actorId: actor?.userId ?? null,
      actorRole: actor?.role ?? null,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId ?? null,
      beforeData: toAuditJson(event.beforeData),
      afterData: toAuditJson(event.afterData),
      metadata: toAuditJson(event.metadata),
      reason: event.reason ?? null,
    },
  });
};
