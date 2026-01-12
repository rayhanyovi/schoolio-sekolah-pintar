import { PrismaClient, Role } from "@prisma/client";
import {
  mockClasses,
  mockSubjects,
  mockEvents,
  mockThreads,
  mockReplies,
  mockNotes,
  mockSchoolProfile,
  mockAcademicYears,
  mockScheduleTemplate,
  mockTeachers,
  mockStudents,
  mockAssignments,
} from "../lib/mockData";
import { mockQuestions, mockPackages } from "../lib/questionTypes";

const prisma = new PrismaClient();

const ensureRole = (value: string): Role => {
  if (value === "ADMIN") return Role.ADMIN;
  if (value === "TEACHER") return Role.TEACHER;
  if (value === "PARENT") return Role.PARENT;
  return Role.STUDENT;
};

const inferRoleFromId = (id: string): Role => {
  if (id === "admin") return Role.ADMIN;
  if (id.startsWith("t")) return Role.TEACHER;
  if (id.startsWith("st")) return Role.STUDENT;
  if (id.startsWith("p")) return Role.PARENT;
  return Role.TEACHER;
};

const defaultEmail = (id: string, role: Role) => {
  return `${id}@${role.toLowerCase()}.local`;
};

async function main() {
  const subjectByName = new Map(mockSubjects.map((s) => [s.name, s.id]));
  const academicYearByYear = new Map<string, string>();

  for (const year of mockAcademicYears) {
    academicYearByYear.set(year.year, year.id);
    await prisma.academicYear.upsert({
      where: { id: year.id },
      update: {
        year: year.year,
        semester: year.semester,
        startDate: year.startDate,
        endDate: year.endDate,
        isActive: year.isActive,
      },
      create: {
        id: year.id,
        year: year.year,
        semester: year.semester,
        startDate: year.startDate,
        endDate: year.endDate,
        isActive: year.isActive,
      },
    });
  }

  await prisma.schoolProfile.upsert({
    where: { id: "school_profile" },
    update: {
      name: mockSchoolProfile.name,
      address: mockSchoolProfile.address,
      phone: mockSchoolProfile.phone,
      email: mockSchoolProfile.email,
      website: mockSchoolProfile.website,
      principalName: mockSchoolProfile.principalName,
      logoUrl: mockSchoolProfile.logo,
    },
    create: {
      id: "school_profile",
      name: mockSchoolProfile.name,
      address: mockSchoolProfile.address,
      phone: mockSchoolProfile.phone,
      email: mockSchoolProfile.email,
      website: mockSchoolProfile.website,
      principalName: mockSchoolProfile.principalName,
      logoUrl: mockSchoolProfile.logo,
    },
  });

  for (const [index, slot] of mockScheduleTemplate.entries()) {
    await prisma.scheduleTemplate.upsert({
      where: { id: slot.id },
      update: {
        name: slot.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        isBreak: slot.isBreak,
        position: index + 1,
      },
      create: {
        id: slot.id,
        name: slot.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        isBreak: slot.isBreak,
        position: index + 1,
      },
    });
  }

  const userSeeds = new Map<string, { name: string; role: Role }>();
  userSeeds.set("admin", { name: "Admin", role: Role.ADMIN });

  for (const teacher of mockTeachers) {
    userSeeds.set(teacher.id, { name: teacher.name, role: Role.TEACHER });
  }

  for (const student of mockStudents) {
    userSeeds.set(student.id, { name: student.name, role: Role.STUDENT });
  }

  for (const thread of mockThreads) {
    userSeeds.set(thread.authorId, {
      name: thread.authorName,
      role: ensureRole(thread.authorRole),
    });
  }

  for (const reply of mockReplies) {
    userSeeds.set(reply.authorId, {
      name: reply.authorName,
      role: ensureRole(reply.authorRole),
    });
  }

  for (const note of mockNotes) {
    if (!userSeeds.has(note.authorId)) {
      userSeeds.set(note.authorId, {
        name: note.authorName,
        role: inferRoleFromId(note.authorId),
      });
    }
  }

  for (const event of mockEvents) {
    if (!userSeeds.has(event.createdBy)) {
      userSeeds.set(event.createdBy, {
        name: event.createdBy === "admin" ? "Admin" : event.createdBy,
        role: inferRoleFromId(event.createdBy),
      });
    }
  }

  for (const assignment of mockAssignments) {
    if (!userSeeds.has(assignment.teacherId)) {
      userSeeds.set(assignment.teacherId, {
        name: assignment.teacherName,
        role: Role.TEACHER,
      });
    }
  }

  for (const classData of mockClasses) {
    if (!userSeeds.has(classData.homeroomTeacherId)) {
      userSeeds.set(classData.homeroomTeacherId, {
        name: classData.homeroomTeacher,
        role: Role.TEACHER,
      });
    }
  }

  for (const [id, data] of userSeeds.entries()) {
    await prisma.user.upsert({
      where: { id },
      update: {
        name: data.name,
        role: data.role,
        email: defaultEmail(id, data.role),
      },
      create: {
        id,
        name: data.name,
        role: data.role,
        email: defaultEmail(id, data.role),
      },
    });
  }

  for (const classData of mockClasses) {
    const academicYearId = academicYearByYear.get(classData.academicYear) ?? null;
    await prisma.class.upsert({
      where: { id: classData.id },
      update: {
        name: classData.name,
        grade: classData.grade,
        section: classData.section,
        academicYearId,
        homeroomTeacherId: classData.homeroomTeacherId,
        studentCount: classData.studentCount,
        maleCount: classData.maleCount,
        femaleCount: classData.femaleCount,
      },
      create: {
        id: classData.id,
        name: classData.name,
        grade: classData.grade,
        section: classData.section,
        academicYearId,
        homeroomTeacherId: classData.homeroomTeacherId,
        studentCount: classData.studentCount,
        maleCount: classData.maleCount,
        femaleCount: classData.femaleCount,
      },
    });
  }

  for (const [id, data] of userSeeds.entries()) {
    if (data.role === Role.STUDENT) {
      const student = mockStudents.find((s) => s.id === id);
      await prisma.studentProfile.upsert({
        where: { userId: id },
        update: {
          classId: student?.classId ?? null,
          gender: student?.gender === "L" ? "MALE" : student?.gender === "P" ? "FEMALE" : null,
        },
        create: {
          userId: id,
          classId: student?.classId ?? null,
          gender: student?.gender === "L" ? "MALE" : student?.gender === "P" ? "FEMALE" : null,
        },
      });
    }

    if (data.role === Role.TEACHER) {
      await prisma.teacherProfile.upsert({
        where: { userId: id },
        update: {},
        create: { userId: id },
      });
    }

    if (data.role === Role.PARENT) {
      await prisma.parentProfile.upsert({
        where: { userId: id },
        update: {},
        create: { userId: id },
      });
    }
  }

  for (const subject of mockSubjects) {
    await prisma.subject.upsert({
      where: { id: subject.id },
      update: {
        name: subject.name,
        code: subject.code,
        category: subject.category,
        description: subject.description,
        hoursPerWeek: subject.hoursPerWeek,
      },
      create: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        category: subject.category,
        description: subject.description,
        hoursPerWeek: subject.hoursPerWeek,
      },
    });
  }

  await prisma.subjectTeacher.createMany({
    data: mockSubjects.flatMap((subject) =>
      subject.teachers.map((teacher) => ({
        subjectId: subject.id,
        teacherId: teacher.id,
      }))
    ),
    skipDuplicates: true,
  });

  await prisma.subjectClass.createMany({
    data: mockSubjects.flatMap((subject) =>
      subject.classIds.map((classId) => ({
        subjectId: subject.id,
        classId,
      }))
    ),
    skipDuplicates: true,
  });

  for (const event of mockEvents) {
    await prisma.calendarEvent.upsert({
      where: { id: event.id },
      update: {
        title: event.title,
        description: event.description,
        date: event.date,
        endDate: event.endDate,
        type: event.type,
        isRecurring: event.isRecurring,
        createdById: event.createdBy,
      },
      create: {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        endDate: event.endDate,
        type: event.type,
        isRecurring: event.isRecurring,
        createdById: event.createdBy,
      },
    });
  }

  await prisma.calendarEventClass.createMany({
    data: mockEvents.flatMap((event) =>
      (event.classIds ?? []).map((classId) => ({
        eventId: event.id,
        classId,
      }))
    ),
    skipDuplicates: true,
  });

  for (const thread of mockThreads) {
    await prisma.forumThread.upsert({
      where: { id: thread.id },
      update: {
        title: thread.title,
        content: thread.content,
        subjectId: thread.subjectId,
        classId: thread.classId ?? null,
        authorId: thread.authorId,
        authorRole: ensureRole(thread.authorRole),
        status: thread.status,
        isPinned: thread.isPinned,
        replyCount: thread.replyCount,
        upvotes: thread.upvotes,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      },
      create: {
        id: thread.id,
        title: thread.title,
        content: thread.content,
        subjectId: thread.subjectId,
        classId: thread.classId ?? null,
        authorId: thread.authorId,
        authorRole: ensureRole(thread.authorRole),
        status: thread.status,
        isPinned: thread.isPinned,
        replyCount: thread.replyCount,
        upvotes: thread.upvotes,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      },
    });
  }

  for (const reply of mockReplies) {
    await prisma.forumReply.upsert({
      where: { id: reply.id },
      update: {
        threadId: reply.threadId,
        content: reply.content,
        authorId: reply.authorId,
        authorRole: ensureRole(reply.authorRole),
        isAcceptedAnswer: reply.isAcceptedAnswer,
        upvotes: reply.upvotes,
        createdAt: reply.createdAt,
      },
      create: {
        id: reply.id,
        threadId: reply.threadId,
        content: reply.content,
        authorId: reply.authorId,
        authorRole: ensureRole(reply.authorRole),
        isAcceptedAnswer: reply.isAcceptedAnswer,
        upvotes: reply.upvotes,
        createdAt: reply.createdAt,
      },
    });
  }

  for (const note of mockNotes) {
    await prisma.note.upsert({
      where: { id: note.id },
      update: {
        title: note.title,
        content: note.content,
        subjectId: note.subjectId ?? null,
        classId: note.classId ?? null,
        authorId: note.authorId,
        visibility: note.visibility,
        isPinned: note.isPinned,
        color: note.color,
        tags: note.tags,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
      create: {
        id: note.id,
        title: note.title,
        content: note.content,
        subjectId: note.subjectId ?? null,
        classId: note.classId ?? null,
        authorId: note.authorId,
        visibility: note.visibility,
        isPinned: note.isPinned,
        color: note.color,
        tags: note.tags,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    });
  }

  for (const assignment of mockAssignments) {
    await prisma.assignment.upsert({
      where: { id: assignment.id },
      update: {
        title: assignment.title,
        description: assignment.description,
        subjectId: assignment.subjectId,
        teacherId: assignment.teacherId,
        dueDate: assignment.dueDate,
        kind: assignment.type,
        status: assignment.status,
        createdAt: assignment.createdAt,
      },
      create: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        subjectId: assignment.subjectId,
        teacherId: assignment.teacherId,
        dueDate: assignment.dueDate,
        kind: assignment.type,
        status: assignment.status,
        createdAt: assignment.createdAt,
      },
    });
  }

  await prisma.assignmentClass.createMany({
    data: mockAssignments.flatMap((assignment) =>
      assignment.classIds.map((classId) => ({
        assignmentId: assignment.id,
        classId,
      }))
    ),
    skipDuplicates: true,
  });

  for (const question of mockQuestions) {
    const subjectId = subjectByName.get(question.subject) ?? null;
    await prisma.question.upsert({
      where: { id: question.id },
      update: {
        type: question.type,
        subjectId,
        subjectText: subjectId ? null : question.subject,
        topic: question.topic,
        difficulty: question.difficulty,
        text: question.text,
        options: question.options ?? [],
        correctAnswers: question.correctAnswers ?? [],
        rubric: question.rubric ?? null,
        allowedFormats: question.allowedFormats ?? [],
        points: question.points,
        usageCount: question.usageCount,
        createdAt: question.createdAt,
      },
      create: {
        id: question.id,
        type: question.type,
        subjectId,
        subjectText: subjectId ? null : question.subject,
        topic: question.topic,
        difficulty: question.difficulty,
        text: question.text,
        options: question.options ?? [],
        correctAnswers: question.correctAnswers ?? [],
        rubric: question.rubric ?? null,
        allowedFormats: question.allowedFormats ?? [],
        points: question.points,
        usageCount: question.usageCount,
        createdAt: question.createdAt,
      },
    });
  }

  for (const pkg of mockPackages) {
    const subjectId = subjectByName.get(pkg.subject) ?? null;
    await prisma.questionPackage.upsert({
      where: { id: pkg.id },
      update: {
        name: pkg.name,
        description: pkg.description,
        subjectId,
        subjectText: subjectId ? null : pkg.subject,
        lastUsedAt: pkg.lastUsedAt ?? null,
        usageCount: pkg.usageCount,
        createdAt: pkg.createdAt,
      },
      create: {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        subjectId,
        subjectText: subjectId ? null : pkg.subject,
        lastUsedAt: pkg.lastUsedAt ?? null,
        usageCount: pkg.usageCount,
        createdAt: pkg.createdAt,
      },
    });
  }

  await prisma.questionPackageItem.createMany({
    data: mockPackages.flatMap((pkg) =>
      pkg.questionIds.map((questionId, index) => ({
        packageId: pkg.id,
        questionId,
        position: index + 1,
      }))
    ),
    skipDuplicates: true,
  });
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
