import { PrismaClient } from "@prisma/client";

type RolloverMode = "FREEZE" | "CLONE_CLASSES";

type ParsedArgs = {
  targetAcademicYearId: string;
  sourceAcademicYearId: string | null;
  mode: RolloverMode;
  activateTarget: boolean;
  dryRun: boolean;
  actorId: string | null;
};

const prisma = new PrismaClient();

const printUsage = () => {
  console.log("Usage:");
  console.log(
    "  npx tsx scripts/academic-year-rollover.ts --targetAcademicYearId=<id> [options]"
  );
  console.log("");
  console.log("Options:");
  console.log(
    "  --sourceAcademicYearId=<id>   Sumber tahun ajaran (wajib jika mode=CLONE_CLASSES)"
  );
  console.log("  --mode=FREEZE|CLONE_CLASSES  Default: FREEZE");
  console.log("  --activateTarget=true|false   Default: true");
  console.log("  --dryRun=true|false           Default: false");
  console.log("  --actorId=<userId>            Optional audit actor");
  console.log("  --help                        Tampilkan bantuan");
};

const parseBooleanArg = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  throw new Error(`Nilai boolean tidak valid: ${value}`);
};

const parseModeArg = (value: string | undefined): RolloverMode => {
  if (!value) return "FREEZE";
  const normalized = value.trim().toUpperCase();
  if (normalized === "FREEZE" || normalized === "CLONE_CLASSES") {
    return normalized;
  }
  throw new Error(`Mode rollover tidak valid: ${value}`);
};

const parseArgs = (argv: string[]): ParsedArgs | null => {
  const raw = new Map<string, string>();
  for (const entry of argv) {
    if (!entry.startsWith("--")) continue;
    const [key, value] = entry.split("=", 2);
    raw.set(key.slice(2), value ?? "true");
  }

  if (raw.has("help")) {
    return null;
  }

  const targetAcademicYearId = raw.get("targetAcademicYearId");
  if (!targetAcademicYearId) {
    throw new Error("targetAcademicYearId wajib diisi");
  }

  const mode = parseModeArg(raw.get("mode"));
  const sourceAcademicYearId = raw.get("sourceAcademicYearId") ?? null;
  if (mode === "CLONE_CLASSES" && !sourceAcademicYearId) {
    throw new Error(
      "sourceAcademicYearId wajib diisi saat mode=CLONE_CLASSES"
    );
  }

  return {
    targetAcademicYearId,
    sourceAcademicYearId,
    mode,
    activateTarget: parseBooleanArg(raw.get("activateTarget"), true),
    dryRun: parseBooleanArg(raw.get("dryRun"), false),
    actorId: raw.get("actorId") ?? null,
  };
};

const run = async () => {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed) {
    printUsage();
    return;
  }

  const targetYear = await prisma.academicYear.findUnique({
    where: { id: parsed.targetAcademicYearId },
    select: {
      id: true,
      year: true,
      semester: true,
      isActive: true,
    },
  });
  if (!targetYear) {
    throw new Error("Target academic year tidak ditemukan");
  }

  const sourceYear = parsed.sourceAcademicYearId
    ? await prisma.academicYear.findUnique({
        where: { id: parsed.sourceAcademicYearId },
        select: {
          id: true,
          year: true,
          semester: true,
        },
      })
    : null;
  if (parsed.sourceAcademicYearId && !sourceYear) {
    throw new Error("Source academic year tidak ditemukan");
  }

  const sourceClasses =
    parsed.mode === "CLONE_CLASSES" && sourceYear
      ? await prisma.class.findMany({
          where: { academicYearId: sourceYear.id },
          select: {
            id: true,
            name: true,
            grade: true,
            major: true,
            section: true,
            homeroomTeacherId: true,
            subjectLinks: {
              select: {
                subjectId: true,
              },
            },
          },
          orderBy: { name: "asc" },
        })
      : [];

  const existingTargetClassCount =
    parsed.mode === "CLONE_CLASSES"
      ? await prisma.class.count({
          where: { academicYearId: targetYear.id },
        })
      : 0;
  if (parsed.mode === "CLONE_CLASSES" && existingTargetClassCount > 0) {
    throw new Error(
      "Target academic year sudah memiliki class. Hentikan untuk mencegah duplikasi."
    );
  }

  const planSummary = {
    targetAcademicYearId: targetYear.id,
    targetYear: targetYear.year,
    targetSemester: targetYear.semester,
    activateTarget: parsed.activateTarget,
    mode: parsed.mode,
    sourceAcademicYearId: sourceYear?.id ?? null,
    sourceClassCount: sourceClasses.length,
    dryRun: parsed.dryRun,
  };

  console.log("[academic-rollover] Plan summary:");
  console.log(JSON.stringify(planSummary, null, 2));

  if (parsed.dryRun) {
    console.log("[academic-rollover] DRY-RUN selesai. Tidak ada perubahan data.");
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    let activatedYearId: string | null = null;
    let clonedClasses = 0;
    let clonedSubjectLinks = 0;

    if (parsed.activateTarget) {
      await tx.academicYear.updateMany({ data: { isActive: false } });
      const activated = await tx.academicYear.update({
        where: { id: targetYear.id },
        data: { isActive: true },
        select: { id: true },
      });
      activatedYearId = activated.id;
    }

    if (parsed.mode === "CLONE_CLASSES") {
      for (const sourceClass of sourceClasses) {
        const createdClass = await tx.class.create({
          data: {
            name: sourceClass.name,
            grade: sourceClass.grade,
            major: sourceClass.major,
            section: sourceClass.section,
            academicYearId: targetYear.id,
            homeroomTeacherId: sourceClass.homeroomTeacherId,
            // Reset count untuk tahun ajaran baru.
            studentCount: 0,
            maleCount: 0,
            femaleCount: 0,
          },
          select: { id: true },
        });
        clonedClasses += 1;

        if (sourceClass.subjectLinks.length) {
          await tx.subjectClass.createMany({
            data: sourceClass.subjectLinks.map((link) => ({
              subjectId: link.subjectId,
              classId: createdClass.id,
            })),
            skipDuplicates: true,
          });
          clonedSubjectLinks += sourceClass.subjectLinks.length;
        }
      }
    }

    if (parsed.actorId) {
      await tx.auditLog.create({
        data: {
          actorId: parsed.actorId,
          action: "ACADEMIC_YEAR_ROLLOVER_EXECUTED",
          entityType: "AcademicYear",
          entityId: targetYear.id,
          metadata: {
            mode: parsed.mode,
            sourceAcademicYearId: sourceYear?.id ?? null,
            activateTarget: parsed.activateTarget,
            activatedYearId,
            clonedClasses,
            clonedSubjectLinks,
          },
        },
      });
    }

    return {
      activatedYearId,
      clonedClasses,
      clonedSubjectLinks,
    };
  });

  console.log("[academic-rollover] Selesai dieksekusi.");
  console.log(JSON.stringify(result, null, 2));
};

run()
  .catch((error) => {
    console.error("[academic-rollover] Gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
