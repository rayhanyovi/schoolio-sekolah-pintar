import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonOk } from "@/lib/api";
import { mockStudents } from "@/lib/mockData";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;
  if (!id) {
    return jsonOk([]);
  }
  if (isMockEnabled()) {
    const data = mockStudents.filter((student) => student.classId === id);
    return jsonOk(data);
  }

  const rows = await prisma.studentProfile.findMany({
    where: { classId: id },
    include: { user: true, class: true },
    orderBy: { user: { name: "asc" } },
  });

  const data = rows.map((row) => ({
    id: row.userId,
    name: row.user.name,
    email: row.user.email,
    gender: row.gender,
    classId: row.classId,
    className: row.class?.name ?? "",
  }));

  return jsonOk(data);
}
