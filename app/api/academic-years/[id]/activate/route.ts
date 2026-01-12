import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

type Params = { params: { id: string } };

export async function POST(_: Request, { params }: Params) {
  await prisma.academicYear.updateMany({ data: { isActive: false } });
  const row = await prisma.academicYear.update({
    where: { id: params.id },
    data: { isActive: true },
  });
  return jsonOk(row);
}
