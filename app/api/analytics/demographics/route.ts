import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

export async function GET() {
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
