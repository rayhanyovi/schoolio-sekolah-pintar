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

export const getStudentClassId = async (studentId: string) => {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: studentId },
    select: { classId: true },
  });
  return profile?.classId ?? null;
};

export const listLinkedClassIdsForParent = async (parentId: string) => {
  const linkedStudentIds = await listLinkedStudentIds(parentId);
  if (!linkedStudentIds.length) {
    return [];
  }

  const profiles = await prisma.studentProfile.findMany({
    where: { userId: { in: linkedStudentIds } },
    select: { classId: true },
  });

  return Array.from(
    new Set(
      profiles
        .map((profile) => profile.classId)
        .filter((value): value is string => Boolean(value))
    )
  );
};

export const isTeacherAssignedToSubject = async (
  teacherId: string,
  subjectId: string
) => {
  const relation = await prisma.subjectTeacher.findUnique({
    where: {
      subjectId_teacherId: {
        subjectId,
        teacherId,
      },
    },
    select: { teacherId: true },
  });
  return Boolean(relation);
};

export const isSubjectLinkedToClass = async (
  subjectId: string,
  classId: string
) => {
  const relation = await prisma.subjectClass.findUnique({
    where: {
      subjectId_classId: {
        subjectId,
        classId,
      },
    },
    select: { classId: true },
  });
  return Boolean(relation);
};

export const isSubjectLinkedToAllClasses = async (
  subjectId: string,
  classIds: string[]
) => {
  if (!classIds.length) return true;
  const rows = await prisma.subjectClass.findMany({
    where: {
      subjectId,
      classId: { in: classIds },
    },
    select: { classId: true },
  });
  return rows.length === classIds.length;
};

export const canTeacherManageSubjectClass = async (
  teacherId: string,
  subjectId: string,
  classId?: string | null
) => {
  const hasSubjectAccess = await isTeacherAssignedToSubject(teacherId, subjectId);
  if (!hasSubjectAccess) return false;
  if (!classId) return true;
  return isSubjectLinkedToClass(subjectId, classId);
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
