import { prisma } from "@/lib/prisma";
import { jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [ROLES.ADMIN]);
  if (roleError) return roleError;

  const [male, female, unknown] = await Promise.all([
    prisma.studentProfile.count({ where: { gender: "MALE" } }),
    prisma.studentProfile.count({ where: { gender: "FEMALE" } }),
    prisma.studentProfile.count({ where: { gender: null } }),
  ]);

  return jsonOk({
    gender: {
      MALE: male,
      FEMALE: female,
      UNKNOWN: unknown,
    },
  });
}
