import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

export async function GET() {
  const [totalStudents, totalTeachers, totalParents, totalClasses] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.user.count({ where: { role: "PARENT" } }),
      prisma.class.count(),
    ]);

  return jsonOk({
    totalStudents,
    totalTeachers,
    totalParents,
    totalClasses,
  });
}
