import { prisma } from "@/lib/prisma";
import { jsonOk, requireAuth, requireRole, requireSchoolContext } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.PARENT,
  ]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const [totalStudents, totalTeachers, totalParents, totalClasses] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT", schoolId } }),
      prisma.user.count({ where: { role: "TEACHER", schoolId } }),
      prisma.user.count({ where: { role: "PARENT", schoolId } }),
      prisma.class.count({ where: { schoolId } }),
    ]);

  return jsonOk({
    totalStudents,
    totalTeachers,
    totalParents,
    totalClasses,
  });
}
