import { prisma } from "@/lib/prisma";
import { Role, ROLES } from "@/lib/constants";
import { AuthSession } from "@/lib/server-auth";

export type ActorContext = AuthSession & {
  schoolId: string | null;
};

export const toActorContext = (session: AuthSession): ActorContext => ({
  ...session,
  schoolId: null,
});

export const hasAnyRole = (actor: ActorContext, roles: Role[]) =>
  roles.includes(actor.role);

export const canAccessOwnUser = (actor: ActorContext, userId: string) =>
  actor.role === ROLES.ADMIN || actor.userId === userId;

export const listLinkedStudentIds = async (parentId: string) => {
  const rows = await prisma.parentStudent.findMany({
    where: { parentId },
    select: { studentId: true },
  });
  return rows.map((row) => row.studentId);
};

export const canViewStudent = async (
  actor: ActorContext,
  studentId: string
) => {
  if (actor.role === ROLES.ADMIN || actor.role === ROLES.TEACHER) {
    return true;
  }
  if (actor.role === ROLES.STUDENT) {
    return actor.userId === studentId;
  }
  if (actor.role === ROLES.PARENT) {
    const linked = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId: actor.userId,
          studentId,
        },
      },
      select: { studentId: true },
    });
    return Boolean(linked);
  }
  return false;
};

export const canViewParent = async (
  actor: ActorContext,
  parentId: string
) => {
  if (actor.role === ROLES.ADMIN || actor.role === ROLES.TEACHER) {
    return true;
  }
  if (actor.role === ROLES.PARENT) {
    return actor.userId === parentId;
  }
  return false;
};
