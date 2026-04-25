import { prisma } from "@/lib/prisma";
import { jsonOk, requireAuth, requireRole, requireSchoolContext } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;
  const schoolId = requireSchoolContext(auth);
  if (schoolId instanceof Response) return schoolId;

  const [male, female, unknown] = await Promise.all([
    prisma.studentProfile.count({
      where: { gender: "MALE", user: { schoolId } },
    }),
    prisma.studentProfile.count({
      where: { gender: "FEMALE", user: { schoolId } },
    }),
    prisma.studentProfile.count({
      where: { gender: null, user: { schoolId } },
    }),
  ]);

  return jsonOk({
    gender: {
      MALE: male,
      FEMALE: female,
      UNKNOWN: unknown,
    },
  });
}
