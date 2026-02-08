import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const FIRST_NAMES_ID = [
  "Aditya",
  "Bima",
  "Dimas",
  "Fajar",
  "Gilang",
  "Hendra",
  "Iqbal",
  "Joko",
  "Kevin",
  "Naufal",
  "Raka",
  "Rizky",
  "Taufik",
  "Wahyu",
  "Yusuf",
  "Agus",
  "Andi",
  "Bagas",
  "Bayu",
  "Dewi",
  "Dinda",
  "Eka",
  "Farhan",
  "Intan",
  "Kartika",
  "Nadia",
  "Putra",
  "Salsa",
  "Siti",
  "Tri",
];

const LAST_NAMES_ID = [
  "Pratama",
  "Saputra",
  "Wijaya",
  "Santoso",
  "Nugroho",
  "Hidayat",
  "Putri",
  "Siregar",
  "Hasan",
  "Wibowo",
  "Ramadhan",
  "Maulana",
  "Kurniawan",
  "Mahendra",
  "Permata",
  "Setiawan",
  "Gunawan",
  "Purnama",
  "Utama",
  "Fauzan",
  "Syahputra",
  "Anggraini",
  "Lestari",
  "Handayani",
  "Iskandar",
  "Firmansyah",
  "Yulianto",
  "Suryadi",
  "Anwar",
  "Harahap",
];

type SubjectSeed = {
  name: string;
  code: string;
  category: "SCIENCE" | "SOCIAL" | "LANGUAGE";
  color: string;
  major: "MIPA" | "IPS";
};

const SUBJECTS: SubjectSeed[] = [
  { name: "Bahasa Inggris", code: "BING", category: "LANGUAGE", color: "bg-primary", major: "MIPA" },
  { name: "Matematika", code: "MTK", category: "SCIENCE", color: "bg-secondary", major: "MIPA" },
  { name: "Fisika", code: "FIS", category: "SCIENCE", color: "bg-info", major: "MIPA" },
  { name: "Bahasa Inggris", code: "BING", category: "LANGUAGE", color: "bg-primary", major: "IPS" },
  { name: "Matematika", code: "MTK", category: "SCIENCE", color: "bg-secondary", major: "IPS" },
  { name: "Sejarah", code: "SEJ", category: "SOCIAL", color: "bg-warning", major: "IPS" },
];

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const LESSON_SLOTS = [
  { name: "Jam 1", start: "07:00", end: "08:00" },
  { name: "Jam 2", start: "08:00", end: "09:00" },
  { name: "Jam 3", start: "10:00", end: "11:00" },
  { name: "Jam 4", start: "11:00", end: "12:00" },
  { name: "Jam 5", start: "13:00", end: "14:00" },
  { name: "Jam 6", start: "14:00", end: "15:00" },
];

const BREAK_SLOTS = [
  { name: "Istirahat 1", start: "09:00", end: "10:00" },
  { name: "Istirahat 2", start: "12:00", end: "13:00" },
];

const randPick = <T,>(arr: T[], index: number) => arr[index % arr.length];
const buildName = (index: number) => {
  const first = FIRST_NAMES_ID[index % FIRST_NAMES_ID.length];
  const last = LAST_NAMES_ID[Math.floor(index / FIRST_NAMES_ID.length) % LAST_NAMES_ID.length];
  return `${first} ${last}`;
};

async function main() {
  await prisma.$transaction([
    prisma.attendanceRecord.deleteMany(),
    prisma.attendanceSession.deleteMany(),
    prisma.assignmentSubmission.deleteMany(),
    prisma.assignmentQuestion.deleteMany(),
    prisma.assignmentClass.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.materialAttachment.deleteMany(),
    prisma.material.deleteMany(),
    prisma.forumReply.deleteMany(),
    prisma.forumThread.deleteMany(),
    prisma.note.deleteMany(),
    prisma.calendarEventClass.deleteMany(),
    prisma.calendarEvent.deleteMany(),
    prisma.classSchedule.deleteMany(),
    prisma.subjectTeacher.deleteMany(),
    prisma.subjectClass.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.studentProfile.deleteMany(),
    prisma.teacherProfile.deleteMany(),
    prisma.parentProfile.deleteMany(),
    prisma.parentStudent.deleteMany(),
    prisma.class.deleteMany(),
    prisma.academicYear.deleteMany(),
    prisma.majorTeacher.deleteMany(),
    prisma.major.deleteMany(),
    prisma.scheduleTemplate.deleteMany(),
    prisma.schoolProfile.deleteMany(),
    prisma.questionPackageItem.deleteMany(),
    prisma.questionPackage.deleteMany(),
    prisma.question.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const academicYear = await prisma.academicYear.create({
    data: {
      year: "2024/2025",
      semester: "ODD",
      startDate: new Date(2024, 6, 15),
      endDate: new Date(2024, 11, 20),
      isActive: true,
    },
  });

  await prisma.schoolProfile.create({
    data: {
      name: "SMA Negeri 1 Sekolah Pintar",
      address: "Jl. Pendidikan No. 123",
      phone: "021-123456",
      email: "info@sekolah-pintar.id",
      website: "sekolah-pintar.id",
      principalName: "Drs. Budi Santoso",
    },
  });

  const [majorMipa, majorIps] = await Promise.all([
    prisma.major.create({ data: { code: "MIPA", name: "MIPA", description: "Matematika & IPA" } }),
    prisma.major.create({ data: { code: "IPS", name: "IPS", description: "Ilmu Pengetahuan Sosial" } }),
  ]);

  for (const slot of LESSON_SLOTS) {
    await prisma.scheduleTemplate.create({
      data: {
        name: slot.name,
        startTime: slot.start,
        endTime: slot.end,
        duration: 60,
        isBreak: false,
      },
    });
  }
  for (const slot of BREAK_SLOTS) {
    await prisma.scheduleTemplate.create({
      data: {
        name: slot.name,
        startTime: slot.start,
        endTime: slot.end,
        duration: 60,
        isBreak: true,
      },
    });
  }

  const admin = await prisma.user.create({
    data: {
      name: buildName(0),
      role: Role.ADMIN,
      email: "admin@school.local",
    },
  });

  const subjectsByMajor: Record<"MIPA" | "IPS", typeof SUBJECTS> = {
    MIPA: SUBJECTS.filter((s) => s.major === "MIPA"),
    IPS: SUBJECTS.filter((s) => s.major === "IPS"),
  };

  const subjectMap = new Map<string, { id: string; color: string; name: string }>();
  const subjectTeachers = new Map<string, string[]>();
  const teachers: { id: string; name: string }[] = [];

  for (const subject of SUBJECTS) {
    const key = `${subject.name}-${subject.major}`;
    if (subjectMap.has(key)) continue;
    const created = await prisma.subject.create({
      data: {
        name: subject.name,
        code: subject.code,
        category: subject.category,
        description: `${subject.name} untuk jurusan ${subject.major}`,
        color: subject.color,
        hoursPerWeek: 12,
      },
    });
    subjectMap.set(key, { id: created.id, color: created.color ?? subject.color, name: created.name });

    const teacherA = await prisma.user.create({
      data: {
        name: `${buildName(teachers.length + 1)} (${subject.major})`,
        role: Role.TEACHER,
        email: `teacher_${subject.code.toLowerCase()}_a_${subject.major.toLowerCase()}@school.local`,
      },
    });
    const teacherB = await prisma.user.create({
      data: {
        name: `${buildName(teachers.length + 2)} (${subject.major})`,
        role: Role.TEACHER,
        email: `teacher_${subject.code.toLowerCase()}_b_${subject.major.toLowerCase()}@school.local`,
      },
    });
    teachers.push({ id: teacherA.id, name: teacherA.name });
    teachers.push({ id: teacherB.id, name: teacherB.name });

    await prisma.teacherProfile.createMany({
      data: [{ userId: teacherA.id }, { userId: teacherB.id }],
      skipDuplicates: true,
    });

    await prisma.subjectTeacher.createMany({
      data: [
        { subjectId: created.id, teacherId: teacherA.id },
        { subjectId: created.id, teacherId: teacherB.id },
      ],
      skipDuplicates: true,
    });

    subjectTeachers.set(created.id, [teacherA.id, teacherB.id]);
  }

  await prisma.majorTeacher.createMany({
    data: teachers.map((teacher) => ({
      majorId: teacher.name.includes("(MIPA)") ? majorMipa.id : majorIps.id,
      teacherId: teacher.id,
    })),
    skipDuplicates: true,
  });

  const classes: { id: string; name: string; grade: number; major: "MIPA" | "IPS"; section: string }[] = [];

  for (const grade of [10, 11, 12]) {
    for (const major of ["MIPA", "IPS"] as const) {
      for (const section of ["1", "2"]) {
        const roman =
          grade === 10 ? "X" : grade === 11 ? "XI" : grade === 12 ? "XII" : grade.toString();
        const className = `${roman} ${major} ${section}`;
        const homeroomTeacher = randPick(teachers, classes.length).id;
        const created = await prisma.class.create({
          data: {
            name: className,
            grade,
            major,
            section,
            academicYearId: academicYear.id,
            homeroomTeacherId: homeroomTeacher,
            studentCount: 5,
            maleCount: 3,
            femaleCount: 2,
          },
        });
        classes.push({ id: created.id, name: created.name, grade, major, section });
      }
    }
  }

  const parents: { id: string; name: string }[] = [];
  const students: { id: string; name: string; classId: string }[] = [];

  let studentIndex = 1;
  for (const cls of classes) {
    for (let i = 0; i < 5; i += 1) {
      const student = await prisma.user.create({
        data: {
          name: buildName(100 + studentIndex),
          role: Role.STUDENT,
          email: `student_${studentIndex}@school.local`,
        },
      });
      await prisma.studentProfile.create({
        data: {
          userId: student.id,
          classId: cls.id,
          gender: i % 2 === 0 ? "MALE" : "FEMALE",
        },
      });
      students.push({ id: student.id, name: student.name, classId: cls.id });

      const parent = await prisma.user.create({
        data: {
          name: buildName(1000 + studentIndex),
          role: Role.PARENT,
          email: `parent_${studentIndex}@school.local`,
        },
      });
      await prisma.parentProfile.create({ data: { userId: parent.id } });
      await prisma.parentStudent.create({
        data: { parentId: parent.id, studentId: student.id },
      });
      parents.push({ id: parent.id, name: parent.name });
      studentIndex += 1;
    }
  }

  for (const cls of classes) {
    const subjectSeeds = subjectsByMajor[cls.major];
    const subjectIds = subjectSeeds.map((s) => subjectMap.get(`${s.name}-${s.major}`)!.id);
    await prisma.subjectClass.createMany({
      data: subjectIds.map((subjectId) => ({
        subjectId,
        classId: cls.id,
      })),
      skipDuplicates: true,
    });
  }

  let scheduleIndex = 0;
  for (const cls of classes) {
    const subjectSeeds = subjectsByMajor[cls.major];
    const subjectIds = subjectSeeds.map((s) => subjectMap.get(`${s.name}-${s.major}`)!.id);
    const subjectsCycle = Array.from({ length: 36 }).map((_, idx) =>
      subjectIds[idx % subjectIds.length]
    );

    for (const day of DAYS) {
      for (const slot of LESSON_SLOTS) {
        const subjectId = subjectsCycle[scheduleIndex % subjectsCycle.length];
        const teacherIds = subjectTeachers.get(subjectId) ?? [];
        const teacherId = teacherIds[scheduleIndex % teacherIds.length];
        const subjectMeta = Array.from(subjectMap.values()).find((s) => s.id === subjectId);
        await prisma.classSchedule.create({
          data: {
            classId: cls.id,
            subjectId,
            teacherId: teacherId ?? null,
            dayOfWeek: day,
            startTime: slot.start,
            endTime: slot.end,
            room: `R-${cls.section}`,
            color: subjectMeta?.color ?? "bg-primary",
          },
        });
        scheduleIndex += 1;
      }
    }
  }

  // Assignments, questions, packages
  const questionIds: string[] = [];
  for (const [key, subject] of subjectMap.entries()) {
    const q1 = await prisma.question.create({
      data: {
        type: "ESSAY",
        subjectId: subject.id,
        topic: `Materi ${subject.name} 1`,
        difficulty: "MEDIUM",
        text: `Jelaskan konsep dasar ${subject.name}.`,
        points: 10,
      },
    });
    const q2 = await prisma.question.create({
      data: {
        type: "MCQ",
        subjectId: subject.id,
        topic: `Materi ${subject.name} 2`,
        difficulty: "EASY",
        text: `Pertanyaan pilihan ganda tentang ${subject.name}.`,
        options: ["A", "B", "C", "D"],
        correctAnswers: [0],
        points: 5,
      },
    });
    questionIds.push(q1.id, q2.id);

    const pkg = await prisma.questionPackage.create({
      data: {
        name: `Paket Soal ${subject.name}`,
        description: `Paket soal untuk ${subject.name}`,
        subjectId: subject.id,
      },
    });
    await prisma.questionPackageItem.createMany({
      data: [
        { packageId: pkg.id, questionId: q1.id, position: 1 },
        { packageId: pkg.id, questionId: q2.id, position: 2 },
      ],
    });
  }

  for (const cls of classes) {
    const subjectSeeds = subjectsByMajor[cls.major];
    for (const subjectSeed of subjectSeeds) {
      const subjectId = subjectMap.get(`${subjectSeed.name}-${subjectSeed.major}`)!.id;
      const teacherId = (subjectTeachers.get(subjectId) ?? [])[0] ?? null;
      const assignment = await prisma.assignment.create({
        data: {
          title: `Tugas ${subjectSeed.name} ${cls.name}`,
          description: `Tugas untuk ${subjectSeed.name} kelas ${cls.name}`,
          subjectId,
          teacherId: teacherId!,
          dueDate: new Date(2025, 0, 20),
          kind: "HOMEWORK",
          status: "ACTIVE",
        },
      });
      await prisma.assignmentClass.create({
        data: { assignmentId: assignment.id, classId: cls.id },
      });
      const classStudents = students.filter((s) => s.classId === cls.id);
      for (const student of classStudents) {
        await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignment.id,
            studentId: student.id,
            status: "PENDING",
          },
        });
      }
    }
  }

  for (const cls of classes) {
    const subjectSeeds = subjectsByMajor[cls.major];
    for (const subjectSeed of subjectSeeds) {
      const subjectId = subjectMap.get(`${subjectSeed.name}-${subjectSeed.major}`)!.id;
      const teacherId = (subjectTeachers.get(subjectId) ?? [])[0] ?? null;
      const material = await prisma.material.create({
        data: {
          title: `Materi ${subjectSeed.name} ${cls.name}`,
          description: `Ringkasan materi ${subjectSeed.name}`,
          subjectId,
          classId: cls.id,
          teacherId: teacherId!,
        },
      });
      await prisma.materialAttachment.create({
        data: {
          materialId: material.id,
          fileName: "materi.pdf",
          fileType: "application/pdf",
          sizeLabel: "1MB",
          url: "https://example.com/materi.pdf",
        },
      });
    }
  }

  const event = await prisma.calendarEvent.create({
    data: {
      title: "Kegiatan Awal Semester",
      description: "Orientasi awal semester",
      date: new Date(2025, 0, 10),
      type: "ACADEMIC",
      createdById: admin.id,
    },
  });
  await prisma.calendarEventClass.createMany({
    data: classes.map((cls) => ({ eventId: event.id, classId: cls.id })),
    skipDuplicates: true,
  });

  for (const cls of classes.slice(0, 4)) {
    const subjectSeed = subjectsByMajor[cls.major][0];
    const subjectId = subjectMap.get(`${subjectSeed.name}-${subjectSeed.major}`)!.id;
    const teacherId = (subjectTeachers.get(subjectId) ?? [])[0] ?? null;
    const thread = await prisma.forumThread.create({
      data: {
        title: `Diskusi ${subjectSeed.name} ${cls.name}`,
        content: "Silakan diskusikan materi minggu ini.",
        subjectId,
        classId: cls.id,
        authorId: teacherId!,
        authorRole: Role.TEACHER,
        status: "OPEN",
      },
    });
    await prisma.forumReply.create({
      data: {
        threadId: thread.id,
        content: "Silakan tanya jika ada yang belum jelas.",
        authorId: students.find((s) => s.classId === cls.id)!.id,
        authorRole: Role.STUDENT,
      },
    });
  }

  for (const cls of classes.slice(0, 4)) {
    const subjectSeed = subjectsByMajor[cls.major][1];
    const subjectId = subjectMap.get(`${subjectSeed.name}-${subjectSeed.major}`)!.id;
    const authorId = students.find((s) => s.classId === cls.id)!.id;
    await prisma.note.create({
      data: {
        title: `Catatan ${subjectSeed.name}`,
        content: `Ringkasan materi ${subjectSeed.name} untuk ${cls.name}`,
        subjectId,
        classId: cls.id,
        authorId,
        visibility: "CLASS",
        isPinned: false,
        color: "bg-info",
        tags: ["ringkasan"],
      },
    });
  }

  for (const cls of classes.slice(0, 6)) {
    const subjectSeed = subjectsByMajor[cls.major][0];
    const subjectId = subjectMap.get(`${subjectSeed.name}-${subjectSeed.major}`)!.id;
    const teacherId = (subjectTeachers.get(subjectId) ?? [])[0] ?? null;
    const session = await prisma.attendanceSession.create({
      data: {
        classId: cls.id,
        subjectId,
        teacherId: teacherId!,
        date: new Date(2025, 0, 15),
        startTime: "07:00",
        endTime: "08:00",
      },
    });
    const classStudents = students.filter((s) => s.classId === cls.id);
    await prisma.attendanceRecord.createMany({
      data: classStudents.map((student, index) => ({
        sessionId: session.id,
        studentId: student.id,
        status: index % 5 === 0 ? "ABSENT" : "PRESENT",
        note: index % 5 === 0 ? "Izin" : null,
      })),
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
