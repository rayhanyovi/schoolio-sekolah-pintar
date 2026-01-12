import { prisma } from "@/lib/prisma";
import { isMockEnabled, jsonError, jsonOk } from "@/lib/api";
import { mockSubjects } from "@/lib/mockData";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  if (isMockEnabled()) {
    const data = mockSubjects.filter((subject) =>
      subject.classIds.includes(params.id)
    );
    return jsonOk(data);
  }

  const rows = await prisma.subjectClass.findMany({
    where: { classId: params.id },
    include: { subject: true },
  });

  const data = rows.map((row) => ({
    id: row.subject.id,
    name: row.subject.name,
    code: row.subject.code,
    category: row.subject.category,
    description: row.subject.description ?? "",
    hoursPerWeek: row.subject.hoursPerWeek,
  }));

  return jsonOk(data);
}

export async function PUT(request: Request, { params }: Params) {
  const body = await request.json();
  const subjectIds: string[] = body?.subjectIds ?? [];
  if (!Array.isArray(subjectIds)) {
    return jsonError("VALIDATION_ERROR", "subjectIds array is required");
  }

  await prisma.subjectClass.deleteMany({ where: { classId: params.id } });
  if (subjectIds.length) {
    await prisma.subjectClass.createMany({
      data: subjectIds.map((subjectId) => ({
        classId: params.id,
        subjectId,
      })),
      skipDuplicates: true,
    });
  }

  return jsonOk({ id: params.id, subjectIds });
}
