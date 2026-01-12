import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonOk } from "@/lib/api";
import { mockStudents } from "@/lib/mockData";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  if (isMockEnabled()) {
    const data = mockStudents.filter((student) => student.classId === params.id);
    return jsonOk(data);
  }

  const rows = await prisma.studentProfile.findMany({
    where: { classId: params.id },
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
