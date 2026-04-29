import { randomUUID } from "node:crypto";
import { Prisma, Role } from "@prisma/client";
import { DEMO_PUBLIC_ROLES } from "@/lib/demo-catalog";
import {
  getDemoSandboxExpiry,
  getDemoTemplateSchoolCode,
} from "@/lib/demo-mode";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;
type IdMap = Map<string, string>;

export type DemoInstanceSummary = {
  id: string;
  schoolId: string;
  templateSchoolId: string;
  adminUserId: string;
  teacherUserId: string;
  studentUserId: string;
  parentUserId: string;
  expiresAt: Date;
  lastAccessedAt: Date;
  createdAt: Date;
};

export type DemoPruneResult = {
  scannedCount: number;
  deletedCount: number;
};

const demoInstanceSelect = {
  id: true,
  schoolId: true,
  templateSchoolId: true,
  adminUserId: true,
  teacherUserId: true,
  studentUserId: true,
  parentUserId: true,
  expiresAt: true,
  lastAccessedAt: true,
  createdAt: true,
} satisfies Prisma.DemoInstanceSelect;

const shortInstanceId = (instanceId: string) =>
  instanceId.replace(/[^a-zA-Z0-9]/g, "").slice(-12).toLowerCase();

export const createDemoInstanceId = () =>
  `demo_${randomUUID().replace(/-/g, "").slice(0, 24)}`;

export const buildSandboxSchoolCode = (
  templateSchoolCode: string,
  instanceId: string,
) => `${templateSchoolCode}-DEMO-${shortInstanceId(instanceId).toUpperCase()}`;

export const buildSandboxIdentifier = (
  identifier: string,
  instanceId: string,
) => {
  const suffix = shortInstanceId(instanceId);
  const [localPart, domain] = identifier.split("@", 2);
  if (localPart && domain) {
    return `${localPart}+demo-${suffix}@${domain}`;
  }
  return `${identifier}.demo.${suffix}`;
};

export const buildSandboxEmail = (email: string | null, instanceId: string) => {
  if (!email) return null;
  return buildSandboxIdentifier(email, instanceId);
};

const mapOptionalId = (map: IdMap, value?: string | null) =>
  value ? map.get(value) ?? null : null;

const requireMappedId = (map: IdMap, value: string, label: string) => {
  const mapped = map.get(value);
  if (!mapped) {
    throw new Error(`DEMO_CLONE_MISSING_${label}`);
  }
  return mapped;
};

const cloneJson = (value: Prisma.JsonValue | null | undefined) =>
  value === null || value === undefined
    ? undefined
    : (value as Prisma.InputJsonValue);

const cloneRequiredJson = (value: Prisma.JsonValue) =>
  value as Prisma.InputJsonValue;

const mapEntityId = (
  entityType: string,
  entityId: string | null,
  maps: {
    schoolId: string;
    userMap: IdMap;
    classMap: IdMap;
    subjectMap: IdMap;
    academicYearMap: IdMap;
    assignmentMap: IdMap;
    materialMap: IdMap;
    eventMap: IdMap;
  },
) => {
  if (!entityId) return null;
  if (entityType === "SchoolProfile") return maps.schoolId;
  if (entityType === "User") return maps.userMap.get(entityId) ?? entityId;
  if (entityType === "Class") return maps.classMap.get(entityId) ?? entityId;
  if (entityType === "Subject") return maps.subjectMap.get(entityId) ?? entityId;
  if (entityType === "AcademicYear") {
    return maps.academicYearMap.get(entityId) ?? entityId;
  }
  if (entityType === "Assignment") {
    return maps.assignmentMap.get(entityId) ?? entityId;
  }
  if (entityType === "Material") return maps.materialMap.get(entityId) ?? entityId;
  if (entityType === "CalendarEvent") {
    return maps.eventMap.get(entityId) ?? entityId;
  }
  return entityId;
};

const resolvePublicRoleUserIds = (
  clonedUsers: Array<{ id: string; role: Role; originalIdentifier: string | null }>,
) => {
  const byIdentifier = new Map(
    clonedUsers
      .filter((user) => user.originalIdentifier)
      .map((user) => [user.originalIdentifier as string, user]),
  );

  const findRoleUser = (role: Role, seedIdentifier: string) => {
    const exact = byIdentifier.get(seedIdentifier);
    if (exact?.role === role) return exact.id;

    const fallback = clonedUsers.find((user) => user.role === role);
    if (!fallback) throw new Error(`DEMO_ROLE_USER_NOT_FOUND_${role}`);
    return fallback.id;
  };

  const admin = DEMO_PUBLIC_ROLES.find((item) => item.role === "ADMIN");
  const teacher = DEMO_PUBLIC_ROLES.find((item) => item.role === "TEACHER");
  const student = DEMO_PUBLIC_ROLES.find((item) => item.role === "STUDENT");
  const parent = DEMO_PUBLIC_ROLES.find((item) => item.role === "PARENT");
  if (!admin || !teacher || !student || !parent) {
    throw new Error("DEMO_PUBLIC_ROLE_CATALOG_INCOMPLETE");
  }

  return {
    adminUserId: findRoleUser(Role.ADMIN, admin.seedIdentifier),
    teacherUserId: findRoleUser(Role.TEACHER, teacher.seedIdentifier),
    studentUserId: findRoleUser(Role.STUDENT, student.seedIdentifier),
    parentUserId: findRoleUser(Role.PARENT, parent.seedIdentifier),
  };
};

const cloneTemplateSchoolGraph = async (
  tx: Tx,
  templateSchoolId: string,
  instanceId: string,
  expiresAt: Date,
) => {
  const templateSchool = await tx.schoolProfile.findUnique({
    where: { id: templateSchoolId },
  });
  if (!templateSchool) throw new Error("DEMO_TEMPLATE_SCHOOL_NOT_FOUND");

  const sandboxSchool = await tx.schoolProfile.create({
    data: {
      schoolCode: buildSandboxSchoolCode(templateSchool.schoolCode, instanceId),
      name: `${templateSchool.name} Demo ${shortInstanceId(instanceId).toUpperCase()}`,
      address: templateSchool.address,
      phone: templateSchool.phone,
      email: buildSandboxIdentifier(templateSchool.email, instanceId),
      website: templateSchool.website,
      principalName: templateSchool.principalName,
      logoUrl: templateSchool.logoUrl,
    },
  });

  const userMap: IdMap = new Map();
  const academicYearMap: IdMap = new Map();
  const scheduleTemplateMap: IdMap = new Map();
  const majorMap: IdMap = new Map();
  const subjectMap: IdMap = new Map();
  const classMap: IdMap = new Map();
  const scheduleMap: IdMap = new Map();
  const questionMap: IdMap = new Map();
  const questionPackageMap: IdMap = new Map();
  const assignmentMap: IdMap = new Map();
  const materialMap: IdMap = new Map();
  const uploadIntentMap: IdMap = new Map();
  const threadMap: IdMap = new Map();
  const eventMap: IdMap = new Map();
  const attendanceSessionMap: IdMap = new Map();
  const clonedUsers: Array<{
    id: string;
    role: Role;
    originalIdentifier: string | null;
  }> = [];

  const users = await tx.user.findMany({
    where: { schoolId: templateSchoolId },
    include: {
      credential: true,
      teacherProfile: true,
      parentProfile: true,
      notificationPreference: true,
    },
    orderBy: { createdAt: "asc" },
  });

  for (const user of users) {
    const created = await tx.user.create({
      data: {
        authUserId: user.authUserId
          ? buildSandboxIdentifier(user.authUserId, instanceId)
          : null,
        email: buildSandboxEmail(user.email, instanceId),
        schoolId: sandboxSchool.id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        birthDate: user.birthDate,
        onboardingCompletedAt: user.onboardingCompletedAt,
        roleSelectedAt: user.roleSelectedAt,
      },
    });
    userMap.set(user.id, created.id);
    clonedUsers.push({
      id: created.id,
      role: created.role,
      originalIdentifier: user.credential?.identifier ?? null,
    });

    if (user.credential) {
      await tx.authCredential.create({
        data: {
          userId: created.id,
          identifier: buildSandboxIdentifier(
            user.credential.identifier,
            instanceId,
          ),
          passwordHash: user.credential.passwordHash,
          passwordSalt: user.credential.passwordSalt,
          mustChangePassword: false,
          isDefaultPassword: false,
        },
      });
    }

    if (user.notificationPreference) {
      await tx.notificationPreference.create({
        data: {
          userId: created.id,
          emailNotifications: user.notificationPreference.emailNotifications,
          assignmentReminders: user.notificationPreference.assignmentReminders,
          attendanceAlerts: user.notificationPreference.attendanceAlerts,
          gradePublished: user.notificationPreference.gradePublished,
        },
      });
    }

    if (user.teacherProfile) {
      await tx.teacherProfile.create({
        data: {
          userId: created.id,
          title: user.teacherProfile.title,
        },
      });
    }

    if (user.parentProfile) {
      await tx.parentProfile.create({
        data: {
          userId: created.id,
        },
      });
    }
  }

  const academicYears = await tx.academicYear.findMany({
    where: { schoolId: templateSchoolId },
    orderBy: { startDate: "asc" },
  });
  for (const academicYear of academicYears) {
    const created = await tx.academicYear.create({
      data: {
        schoolId: sandboxSchool.id,
        year: academicYear.year,
        semester: academicYear.semester,
        startDate: academicYear.startDate,
        endDate: academicYear.endDate,
        isActive: academicYear.isActive,
      },
    });
    academicYearMap.set(academicYear.id, created.id);
  }

  const scheduleTemplates = await tx.scheduleTemplate.findMany({
    where: { schoolId: templateSchoolId },
    orderBy: { position: "asc" },
  });
  for (const template of scheduleTemplates) {
    const created = await tx.scheduleTemplate.create({
      data: {
        schoolId: sandboxSchool.id,
        name: template.name,
        startTime: template.startTime,
        endTime: template.endTime,
        duration: template.duration,
        isBreak: template.isBreak,
        position: template.position,
      },
    });
    scheduleTemplateMap.set(template.id, created.id);
  }

  const majors = await tx.major.findMany({
    where: { schoolId: templateSchoolId },
    orderBy: { code: "asc" },
  });
  for (const major of majors) {
    const created = await tx.major.create({
      data: {
        schoolId: sandboxSchool.id,
        code: major.code,
        name: major.name,
        description: major.description,
      },
    });
    majorMap.set(major.id, created.id);
  }

  const subjects = await tx.subject.findMany({
    where: { schoolId: templateSchoolId },
    orderBy: { code: "asc" },
  });
  for (const subject of subjects) {
    const created = await tx.subject.create({
      data: {
        schoolId: sandboxSchool.id,
        name: subject.name,
        code: subject.code,
        category: subject.category,
        description: subject.description,
        color: subject.color,
        hoursPerWeek: subject.hoursPerWeek,
        appliesToAllMajors: subject.appliesToAllMajors,
      },
    });
    subjectMap.set(subject.id, created.id);
  }

  const classes = await tx.class.findMany({
    where: { schoolId: templateSchoolId },
    orderBy: [{ grade: "asc" }, { name: "asc" }],
  });
  for (const classRow of classes) {
    const created = await tx.class.create({
      data: {
        schoolId: sandboxSchool.id,
        name: classRow.name,
        grade: classRow.grade,
        major: classRow.major,
        section: classRow.section,
        academicYearId: mapOptionalId(academicYearMap, classRow.academicYearId),
        homeroomTeacherId: mapOptionalId(userMap, classRow.homeroomTeacherId),
        studentCount: classRow.studentCount,
        maleCount: classRow.maleCount,
        femaleCount: classRow.femaleCount,
      },
    });
    classMap.set(classRow.id, created.id);
  }

  const studentProfiles = await tx.studentProfile.findMany({
    where: { user: { schoolId: templateSchoolId } },
  });
  for (const profile of studentProfiles) {
    await tx.studentProfile.create({
      data: {
        userId: requireMappedId(userMap, profile.userId, "STUDENT_USER"),
        classId: mapOptionalId(classMap, profile.classId),
        gender: profile.gender,
        status: profile.status,
      },
    });
  }

  const parentLinks = await tx.parentStudent.findMany({
    where: {
      OR: [
        { parent: { schoolId: templateSchoolId } },
        { student: { schoolId: templateSchoolId } },
      ],
    },
  });
  for (const link of parentLinks) {
    const parentId = userMap.get(link.parentId);
    const studentId = userMap.get(link.studentId);
    if (!parentId || !studentId) continue;
    await tx.parentStudent.create({ data: { parentId, studentId } });
  }

  const enrollments = await tx.studentClassEnrollment.findMany({
    where: { student: { schoolId: templateSchoolId } },
  });
  for (const enrollment of enrollments) {
    await tx.studentClassEnrollment.create({
      data: {
        studentId: requireMappedId(userMap, enrollment.studentId, "ENROLLMENT_STUDENT"),
        classId: requireMappedId(classMap, enrollment.classId, "ENROLLMENT_CLASS"),
        academicYearId: mapOptionalId(academicYearMap, enrollment.academicYearId),
        startedAt: enrollment.startedAt,
        endedAt: enrollment.endedAt,
      },
    });
  }

  const subjectTeachers = await tx.subjectTeacher.findMany({
    where: { subject: { schoolId: templateSchoolId } },
  });
  for (const link of subjectTeachers) {
    const subjectId = subjectMap.get(link.subjectId);
    const teacherId = userMap.get(link.teacherId);
    if (!subjectId || !teacherId) continue;
    await tx.subjectTeacher.create({ data: { subjectId, teacherId } });
  }

  const subjectClasses = await tx.subjectClass.findMany({
    where: { class: { schoolId: templateSchoolId } },
  });
  for (const link of subjectClasses) {
    const subjectId = subjectMap.get(link.subjectId);
    const classId = classMap.get(link.classId);
    if (!subjectId || !classId) continue;
    await tx.subjectClass.create({ data: { subjectId, classId } });
  }

  const subjectMajors = await tx.subjectMajor.findMany({
    where: { subject: { schoolId: templateSchoolId } },
  });
  for (const link of subjectMajors) {
    const subjectId = subjectMap.get(link.subjectId);
    const majorId = majorMap.get(link.majorId);
    if (!subjectId || !majorId) continue;
    await tx.subjectMajor.create({ data: { subjectId, majorId } });
  }

  const majorTeachers = await tx.majorTeacher.findMany({
    where: { major: { schoolId: templateSchoolId } },
  });
  for (const link of majorTeachers) {
    const majorId = majorMap.get(link.majorId);
    const teacherId = userMap.get(link.teacherId);
    if (!majorId || !teacherId) continue;
    await tx.majorTeacher.create({ data: { majorId, teacherId } });
  }

  const gradeWeights = await tx.gradeWeight.findMany({
    where: { class: { schoolId: templateSchoolId } },
  });
  for (const weight of gradeWeights) {
    await tx.gradeWeight.create({
      data: {
        subjectId: requireMappedId(subjectMap, weight.subjectId, "GRADE_SUBJECT"),
        classId: requireMappedId(classMap, weight.classId, "GRADE_CLASS"),
        semester: weight.semester,
        homeworkWeight: weight.homeworkWeight,
        quizWeight: weight.quizWeight,
        examWeight: weight.examWeight,
        practicalWeight: weight.practicalWeight,
      },
    });
  }

  const schedules = await tx.classSchedule.findMany({
    where: { class: { schoolId: templateSchoolId } },
  });
  for (const schedule of schedules) {
    const created = await tx.classSchedule.create({
      data: {
        classId: requireMappedId(classMap, schedule.classId, "SCHEDULE_CLASS"),
        subjectId: requireMappedId(subjectMap, schedule.subjectId, "SCHEDULE_SUBJECT"),
        teacherId: mapOptionalId(userMap, schedule.teacherId),
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: schedule.room,
        color: schedule.color,
      },
    });
    scheduleMap.set(schedule.id, created.id);
  }

  const questions = await tx.question.findMany({
    where: { subject: { is: { schoolId: templateSchoolId } } },
  });
  for (const question of questions) {
    const created = await tx.question.create({
      data: {
        type: question.type,
        subjectId: mapOptionalId(subjectMap, question.subjectId),
        subjectText: question.subjectText,
        topic: question.topic,
        difficulty: question.difficulty,
        text: question.text,
        options: [...question.options],
        correctAnswers: [...question.correctAnswers],
        rubric: question.rubric,
        allowedFormats: [...question.allowedFormats],
        points: question.points,
        usageCount: question.usageCount,
      },
    });
    questionMap.set(question.id, created.id);
  }

  const questionPackages = await tx.questionPackage.findMany({
    where: { subject: { is: { schoolId: templateSchoolId } } },
  });
  for (const questionPackage of questionPackages) {
    const created = await tx.questionPackage.create({
      data: {
        name: questionPackage.name,
        description: questionPackage.description,
        subjectId: mapOptionalId(subjectMap, questionPackage.subjectId),
        subjectText: questionPackage.subjectText,
        lastUsedAt: questionPackage.lastUsedAt,
        usageCount: questionPackage.usageCount,
      },
    });
    questionPackageMap.set(questionPackage.id, created.id);
  }

  const questionPackageItems = await tx.questionPackageItem.findMany({
    where: { package: { subject: { is: { schoolId: templateSchoolId } } } },
  });
  for (const item of questionPackageItems) {
    const packageId = questionPackageMap.get(item.packageId);
    const questionId = questionMap.get(item.questionId);
    if (!packageId || !questionId) continue;
    await tx.questionPackageItem.create({
      data: { packageId, questionId, position: item.position },
    });
  }

  const assignments = await tx.assignment.findMany({
    where: { subject: { schoolId: templateSchoolId } },
  });
  for (const assignment of assignments) {
    const created = await tx.assignment.create({
      data: {
        title: assignment.title,
        description: assignment.description,
        subjectId: requireMappedId(subjectMap, assignment.subjectId, "ASSIGNMENT_SUBJECT"),
        teacherId: requireMappedId(userMap, assignment.teacherId, "ASSIGNMENT_TEACHER"),
        dueDate: assignment.dueDate,
        allowLateSubmission: assignment.allowLateSubmission,
        lateUntil: assignment.lateUntil,
        maxAttempts: assignment.maxAttempts,
        gradingPolicy: assignment.gradingPolicy,
        gradeComponent: assignment.gradeComponent,
        kind: assignment.kind,
        deliveryType: assignment.deliveryType,
        status: assignment.status,
        questionPackageId: mapOptionalId(
          questionPackageMap,
          assignment.questionPackageId,
        ),
      },
    });
    assignmentMap.set(assignment.id, created.id);
  }

  const assignmentClasses = await tx.assignmentClass.findMany({
    where: { assignment: { subject: { schoolId: templateSchoolId } } },
  });
  for (const link of assignmentClasses) {
    const assignmentId = assignmentMap.get(link.assignmentId);
    const classId = classMap.get(link.classId);
    if (!assignmentId || !classId) continue;
    await tx.assignmentClass.create({ data: { assignmentId, classId } });
  }

  const assignmentQuestions = await tx.assignmentQuestion.findMany({
    where: { assignment: { subject: { schoolId: templateSchoolId } } },
  });
  for (const link of assignmentQuestions) {
    const assignmentId = assignmentMap.get(link.assignmentId);
    const questionId = questionMap.get(link.questionId);
    if (!assignmentId || !questionId) continue;
    await tx.assignmentQuestion.create({
      data: { assignmentId, questionId, position: link.position },
    });
  }

  const submissions = await tx.assignmentSubmission.findMany({
    where: { assignment: { subject: { schoolId: templateSchoolId } } },
  });
  for (const submission of submissions) {
    const assignmentId = assignmentMap.get(submission.assignmentId);
    const studentId = userMap.get(submission.studentId);
    if (!assignmentId || !studentId) continue;
    await tx.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId,
        status: submission.status,
        attemptCount: submission.attemptCount,
        submittedAt: submission.submittedAt,
        grade: submission.grade,
        feedback: submission.feedback,
        response: cloneJson(submission.response),
      },
    });
  }

  const materials = await tx.material.findMany({
    where: { subject: { schoolId: templateSchoolId } },
  });
  for (const material of materials) {
    const created = await tx.material.create({
      data: {
        title: material.title,
        description: material.description,
        subjectId: requireMappedId(subjectMap, material.subjectId, "MATERIAL_SUBJECT"),
        classId: mapOptionalId(classMap, material.classId),
        teacherId: requireMappedId(userMap, material.teacherId, "MATERIAL_TEACHER"),
      },
    });
    materialMap.set(material.id, created.id);
  }

  const uploadIntents = await tx.uploadIntent.findMany({
    where: { material: { subject: { schoolId: templateSchoolId } } },
  });
  for (const intent of uploadIntents) {
    const created = await tx.uploadIntent.create({
      data: {
        materialId: requireMappedId(materialMap, intent.materialId, "UPLOAD_MATERIAL"),
        uploadedById: requireMappedId(userMap, intent.uploadedById, "UPLOAD_USER"),
        confirmedById: mapOptionalId(userMap, intent.confirmedById),
        fileName: intent.fileName,
        fileType: intent.fileType,
        sizeBytes: intent.sizeBytes,
        checksumSha256: intent.checksumSha256,
        storageKey: intent.storageKey,
        uploadTokenHash: `${intent.uploadTokenHash}:${shortInstanceId(instanceId)}`,
        uploadedSizeBytes: intent.uploadedSizeBytes,
        uploadedChecksumSha256: intent.uploadedChecksumSha256,
        status: intent.status,
        scanStatus: intent.scanStatus,
        scanResult: intent.scanResult,
        expiresAt: intent.expiresAt,
        uploadedAt: intent.uploadedAt,
        confirmedAt: intent.confirmedAt,
      },
    });
    uploadIntentMap.set(intent.id, created.id);
  }

  const attachments = await tx.materialAttachment.findMany({
    where: { material: { subject: { schoolId: templateSchoolId } } },
  });
  for (const attachment of attachments) {
    await tx.materialAttachment.create({
      data: {
        materialId: requireMappedId(
          materialMap,
          attachment.materialId,
          "ATTACHMENT_MATERIAL",
        ),
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        sizeLabel: attachment.sizeLabel,
        url: attachment.url,
        storageKey: attachment.storageKey,
        checksumSha256: attachment.checksumSha256,
        etag: attachment.etag,
        scanStatus: attachment.scanStatus,
        uploadIntentId: mapOptionalId(uploadIntentMap, attachment.uploadIntentId),
      },
    });
  }

  const uploadScanJobs = await tx.uploadScanJob.findMany({
    where: {
      intent: { material: { subject: { schoolId: templateSchoolId } } },
    },
  });
  for (const job of uploadScanJobs) {
    const intentId = uploadIntentMap.get(job.intentId);
    if (!intentId) continue;
    await tx.uploadScanJob.create({
      data: {
        intentId,
        status: job.status,
        provider: job.provider,
        result: job.result,
        queuedAt: job.queuedAt,
        completedAt: job.completedAt,
      },
    });
  }

  const threads = await tx.forumThread.findMany({
    where: { subject: { schoolId: templateSchoolId } },
  });
  for (const thread of threads) {
    const created = await tx.forumThread.create({
      data: {
        title: thread.title,
        content: thread.content,
        subjectId: requireMappedId(subjectMap, thread.subjectId, "THREAD_SUBJECT"),
        classId: mapOptionalId(classMap, thread.classId),
        authorId: requireMappedId(userMap, thread.authorId, "THREAD_AUTHOR"),
        authorRole: thread.authorRole,
        status: thread.status,
        isPinned: thread.isPinned,
        replyCount: thread.replyCount,
        upvotes: thread.upvotes,
      },
    });
    threadMap.set(thread.id, created.id);
  }

  const replies = await tx.forumReply.findMany({
    where: { thread: { subject: { schoolId: templateSchoolId } } },
  });
  for (const reply of replies) {
    const threadId = threadMap.get(reply.threadId);
    const authorId = userMap.get(reply.authorId);
    if (!threadId || !authorId) continue;
    await tx.forumReply.create({
      data: {
        threadId,
        content: reply.content,
        authorId,
        authorRole: reply.authorRole,
        isAcceptedAnswer: reply.isAcceptedAnswer,
        upvotes: reply.upvotes,
      },
    });
  }

  const notes = await tx.note.findMany({
    where: { author: { schoolId: templateSchoolId } },
  });
  for (const note of notes) {
    await tx.note.create({
      data: {
        title: note.title,
        content: note.content,
        subjectId: mapOptionalId(subjectMap, note.subjectId),
        classId: mapOptionalId(classMap, note.classId),
        authorId: requireMappedId(userMap, note.authorId, "NOTE_AUTHOR"),
        visibility: note.visibility,
        isPinned: note.isPinned,
        color: note.color,
        tags: [...note.tags],
      },
    });
  }

  const linkedEventIds = await tx.calendarEventClass.findMany({
    where: { class: { schoolId: templateSchoolId } },
    select: { eventId: true },
  });
  const events = await tx.calendarEvent.findMany({
    where: {
      OR: [
        { id: { in: linkedEventIds.map((link) => link.eventId) } },
        { createdBy: { is: { schoolId: templateSchoolId } } },
      ],
    },
  });
  for (const event of events) {
    const created = await tx.calendarEvent.create({
      data: {
        title: event.title,
        description: event.description,
        date: event.date,
        endDate: event.endDate,
        type: event.type,
        isRecurring: event.isRecurring,
        createdById: mapOptionalId(userMap, event.createdById),
      },
    });
    eventMap.set(event.id, created.id);
  }

  const eventClasses = await tx.calendarEventClass.findMany({
    where: { eventId: { in: Array.from(eventMap.keys()) } },
  });
  for (const link of eventClasses) {
    const eventId = eventMap.get(link.eventId);
    const classId = classMap.get(link.classId);
    if (!eventId || !classId) continue;
    await tx.calendarEventClass.create({ data: { eventId, classId } });
  }

  const attendanceSessions = await tx.attendanceSession.findMany({
    where: { class: { schoolId: templateSchoolId } },
  });
  for (const session of attendanceSessions) {
    const created = await tx.attendanceSession.create({
      data: {
        sessionKey: `${session.sessionKey}:demo:${shortInstanceId(instanceId)}`,
        classId: requireMappedId(classMap, session.classId, "ATTENDANCE_CLASS"),
        subjectId: requireMappedId(subjectMap, session.subjectId, "ATTENDANCE_SUBJECT"),
        status: session.status,
        teacherId: mapOptionalId(userMap, session.teacherId),
        takenByTeacherId: mapOptionalId(userMap, session.takenByTeacherId),
        overriddenById: mapOptionalId(userMap, session.overriddenById),
        overrideReason: session.overrideReason,
        overriddenAt: session.overriddenAt,
        lockedAt: session.lockedAt,
        finalizedAt: session.finalizedAt,
        scheduleId: mapOptionalId(scheduleMap, session.scheduleId),
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
      },
    });
    attendanceSessionMap.set(session.id, created.id);
  }

  const attendanceRecords = await tx.attendanceRecord.findMany({
    where: { session: { class: { schoolId: templateSchoolId } } },
  });
  for (const record of attendanceRecords) {
    const sessionId = attendanceSessionMap.get(record.sessionId);
    const studentId = userMap.get(record.studentId);
    if (!sessionId || !studentId) continue;
    await tx.attendanceRecord.create({
      data: {
        sessionId,
        studentId,
        status: record.status,
        note: record.note,
        recordedAt: record.recordedAt,
      },
    });
  }

  const teacherAttendanceRows = await tx.teacherAttendance.findMany({
    where: {
      OR: [
        { teacher: { schoolId: templateSchoolId } },
        { session: { class: { schoolId: templateSchoolId } } },
      ],
    },
  });
  for (const row of teacherAttendanceRows) {
    const teacherId = userMap.get(row.teacherId);
    if (!teacherId) continue;
    await tx.teacherAttendance.create({
      data: {
        teacherId,
        sessionId: mapOptionalId(attendanceSessionMap, row.sessionId),
        date: row.date,
        status: row.status,
        note: row.note,
        isAllDay: row.isAllDay,
      },
    });
  }

  const notifications = await tx.notification.findMany({
    where: { recipient: { schoolId: templateSchoolId } },
  });
  for (const notification of notifications) {
    const recipientId = userMap.get(notification.recipientId);
    if (!recipientId) continue;
    await tx.notification.create({
      data: {
        recipientId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: cloneJson(notification.data),
        isRead: notification.isRead,
        readAt: notification.readAt,
        triggeredById: mapOptionalId(userMap, notification.triggeredById),
        createdAt: notification.createdAt,
      },
    });
  }

  const reportCards = await tx.reportCardSnapshot.findMany({
    where: { class: { schoolId: templateSchoolId } },
  });
  for (const reportCard of reportCards) {
    await tx.reportCardSnapshot.create({
      data: {
        classId: requireMappedId(classMap, reportCard.classId, "REPORT_CLASS"),
        academicYearId: requireMappedId(
          academicYearMap,
          reportCard.academicYearId,
          "REPORT_YEAR",
        ),
        semester: reportCard.semester,
        publishedById: requireMappedId(
          userMap,
          reportCard.publishedById,
          "REPORT_USER",
        ),
        publishedAt: reportCard.publishedAt,
        snapshot: cloneRequiredJson(reportCard.snapshot),
      },
    });
  }

  const parentInvites = await tx.parentInvite.findMany({
    where: { schoolId: templateSchoolId },
  });
  for (const invite of parentInvites) {
    const studentId = userMap.get(invite.studentId);
    const createdByUserId = userMap.get(invite.createdByUserId);
    if (!studentId || !createdByUserId) continue;
    await tx.parentInvite.create({
      data: {
        schoolId: sandboxSchool.id,
        studentId,
        createdByUserId,
        codeHash: `${invite.codeHash}:demo:${shortInstanceId(instanceId)}`,
        expiresAt: invite.expiresAt,
        isActive: invite.isActive,
        redeemedAt: invite.redeemedAt,
        redeemedByUserId: mapOptionalId(userMap, invite.redeemedByUserId),
      },
    });
  }

  const auditLogs = await tx.auditLog.findMany({
    where: { actor: { is: { schoolId: templateSchoolId } } },
  });
  for (const log of auditLogs) {
    await tx.auditLog.create({
      data: {
        actorId: mapOptionalId(userMap, log.actorId),
        actorRole: log.actorRole,
        action: log.action,
        entityType: log.entityType,
        entityId: mapEntityId(log.entityType, log.entityId, {
          schoolId: sandboxSchool.id,
          userMap,
          classMap,
          subjectMap,
          academicYearMap,
          assignmentMap,
          materialMap,
          eventMap,
        }),
        beforeData: cloneJson(log.beforeData),
        afterData: cloneJson(log.afterData),
        metadata: cloneJson(log.metadata),
        reason: log.reason,
        createdAt: log.createdAt,
      },
    });
  }

  const roleUserIds = resolvePublicRoleUserIds(clonedUsers);

  return tx.demoInstance.create({
    data: {
      id: instanceId,
      schoolId: sandboxSchool.id,
      templateSchoolId,
      ...roleUserIds,
      expiresAt,
      lastAccessedAt: new Date(),
    },
    select: demoInstanceSelect,
  });
};

export const provisionDemoInstance = async () => {
  const templateSchoolCode = getDemoTemplateSchoolCode();
  const templateSchool = await prisma.schoolProfile.findUnique({
    where: { schoolCode: templateSchoolCode },
    select: { id: true },
  });

  if (!templateSchool) {
    throw new Error(`DEMO_TEMPLATE_SCHOOL_NOT_FOUND:${templateSchoolCode}`);
  }

  const instanceId = createDemoInstanceId();
  const expiresAt = getDemoSandboxExpiry();

  return prisma.$transaction(
    (tx) =>
      cloneTemplateSchoolGraph(tx, templateSchool.id, instanceId, expiresAt),
    { timeout: 60_000 },
  );
};

export const getLiveDemoInstance = async (
  instanceId: string | null | undefined,
  now = new Date(),
) => {
  if (!instanceId) return null;

  const instance = await prisma.demoInstance.findUnique({
    where: { id: instanceId },
    select: demoInstanceSelect,
  });
  if (!instance || instance.expiresAt <= now) return null;

  return prisma.demoInstance.update({
    where: { id: instance.id },
    data: { lastAccessedAt: now },
    select: demoInstanceSelect,
  });
};

export const getOrCreateDemoInstance = async (
  instanceId: string | null | undefined,
) => {
  const existing = await getLiveDemoInstance(instanceId);
  if (existing) return existing;

  await pruneExpiredDemoInstances();
  return provisionDemoInstance();
};

const collectSchoolGraphIds = async (tx: Tx, schoolId: string) => {
  const [users, classes, subjects, academicYears, majors, materials] =
    await Promise.all([
      tx.user.findMany({ where: { schoolId }, select: { id: true } }),
      tx.class.findMany({ where: { schoolId }, select: { id: true } }),
      tx.subject.findMany({ where: { schoolId }, select: { id: true } }),
      tx.academicYear.findMany({ where: { schoolId }, select: { id: true } }),
      tx.major.findMany({ where: { schoolId }, select: { id: true } }),
      tx.material.findMany({
        where: { subject: { schoolId } },
        select: { id: true },
      }),
    ]);

  const userIds = users.map((item) => item.id);
  const classIds = classes.map((item) => item.id);
  const subjectIds = subjects.map((item) => item.id);
  const academicYearIds = academicYears.map((item) => item.id);
  const majorIds = majors.map((item) => item.id);
  const materialIds = materials.map((item) => item.id);

  const [
    assignments,
    questions,
    questionPackages,
    uploadIntents,
    threads,
    attendanceSessions,
    calendarEventLinks,
    calendarEventsByCreator,
  ] = await Promise.all([
    tx.assignment.findMany({
      where: { subjectId: { in: subjectIds } },
      select: { id: true },
    }),
    tx.question.findMany({
      where: { subjectId: { in: subjectIds } },
      select: { id: true },
    }),
    tx.questionPackage.findMany({
      where: { subjectId: { in: subjectIds } },
      select: { id: true },
    }),
    tx.uploadIntent.findMany({
      where: { materialId: { in: materialIds } },
      select: { id: true },
    }),
    tx.forumThread.findMany({
      where: { subjectId: { in: subjectIds } },
      select: { id: true },
    }),
    tx.attendanceSession.findMany({
      where: { classId: { in: classIds } },
      select: { id: true },
    }),
    tx.calendarEventClass.findMany({
      where: { classId: { in: classIds } },
      select: { eventId: true },
    }),
    tx.calendarEvent.findMany({
      where: { createdById: { in: userIds } },
      select: { id: true },
    }),
  ]);

  const assignmentIds = assignments.map((item) => item.id);
  const questionIds = questions.map((item) => item.id);
  const questionPackageIds = questionPackages.map((item) => item.id);
  const uploadIntentIds = uploadIntents.map((item) => item.id);
  const threadIds = threads.map((item) => item.id);
  const attendanceSessionIds = attendanceSessions.map((item) => item.id);
  const eventIds = Array.from(
    new Set([
      ...calendarEventLinks.map((item) => item.eventId),
      ...calendarEventsByCreator.map((item) => item.id),
    ]),
  );

  return {
    userIds,
    classIds,
    subjectIds,
    academicYearIds,
    majorIds,
    materialIds,
    assignmentIds,
    questionIds,
    questionPackageIds,
    uploadIntentIds,
    threadIds,
    attendanceSessionIds,
    eventIds,
  };
};

const deleteDemoInstanceGraph = async (
  tx: Tx,
  instance: Pick<DemoInstanceSummary, "id" | "schoolId">,
) => {
  const ids = await collectSchoolGraphIds(tx, instance.schoolId);

  await tx.demoInstance.delete({ where: { id: instance.id } });

  await tx.uploadScanJob.deleteMany({
    where: { intentId: { in: ids.uploadIntentIds } },
  });
  await tx.materialAttachment.deleteMany({
    where: {
      OR: [
        { materialId: { in: ids.materialIds } },
        { uploadIntentId: { in: ids.uploadIntentIds } },
      ],
    },
  });
  await tx.uploadIntent.deleteMany({
    where: { id: { in: ids.uploadIntentIds } },
  });
  await tx.assignmentSubmission.deleteMany({
    where: { assignmentId: { in: ids.assignmentIds } },
  });
  await tx.assignmentQuestion.deleteMany({
    where: {
      OR: [
        { assignmentId: { in: ids.assignmentIds } },
        { questionId: { in: ids.questionIds } },
      ],
    },
  });
  await tx.assignmentClass.deleteMany({
    where: { assignmentId: { in: ids.assignmentIds } },
  });
  await tx.assignment.deleteMany({ where: { id: { in: ids.assignmentIds } } });
  await tx.questionPackageItem.deleteMany({
    where: {
      OR: [
        { packageId: { in: ids.questionPackageIds } },
        { questionId: { in: ids.questionIds } },
      ],
    },
  });
  await tx.questionPackage.deleteMany({
    where: { id: { in: ids.questionPackageIds } },
  });
  await tx.question.deleteMany({ where: { id: { in: ids.questionIds } } });
  await tx.attendanceRecord.deleteMany({
    where: { sessionId: { in: ids.attendanceSessionIds } },
  });
  await tx.teacherAttendance.deleteMany({
    where: {
      OR: [
        { teacherId: { in: ids.userIds } },
        { sessionId: { in: ids.attendanceSessionIds } },
      ],
    },
  });
  await tx.attendanceSession.deleteMany({
    where: { id: { in: ids.attendanceSessionIds } },
  });
  await tx.classSchedule.deleteMany({
    where: {
      OR: [
        { classId: { in: ids.classIds } },
        { subjectId: { in: ids.subjectIds } },
        { teacherId: { in: ids.userIds } },
      ],
    },
  });
  await tx.material.deleteMany({ where: { id: { in: ids.materialIds } } });
  await tx.forumReply.deleteMany({ where: { threadId: { in: ids.threadIds } } });
  await tx.forumThread.deleteMany({ where: { id: { in: ids.threadIds } } });
  await tx.note.deleteMany({
    where: {
      OR: [
        { authorId: { in: ids.userIds } },
        { subjectId: { in: ids.subjectIds } },
        { classId: { in: ids.classIds } },
      ],
    },
  });
  await tx.calendarEventClass.deleteMany({
    where: {
      OR: [
        { eventId: { in: ids.eventIds } },
        { classId: { in: ids.classIds } },
      ],
    },
  });
  await tx.calendarEvent.deleteMany({ where: { id: { in: ids.eventIds } } });
  await tx.notification.deleteMany({
    where: {
      OR: [
        { recipientId: { in: ids.userIds } },
        { triggeredById: { in: ids.userIds } },
      ],
    },
  });
  await tx.notificationPreference.deleteMany({
    where: { userId: { in: ids.userIds } },
  });
  await tx.parentInvite.deleteMany({
    where: {
      OR: [
        { schoolId: instance.schoolId },
        { studentId: { in: ids.userIds } },
        { createdByUserId: { in: ids.userIds } },
        { redeemedByUserId: { in: ids.userIds } },
      ],
    },
  });
  await tx.parentStudent.deleteMany({
    where: {
      OR: [
        { parentId: { in: ids.userIds } },
        { studentId: { in: ids.userIds } },
      ],
    },
  });
  await tx.studentClassEnrollment.deleteMany({
    where: {
      OR: [
        { studentId: { in: ids.userIds } },
        { classId: { in: ids.classIds } },
        { academicYearId: { in: ids.academicYearIds } },
      ],
    },
  });
  await tx.reportCardSnapshot.deleteMany({
    where: {
      OR: [
        { classId: { in: ids.classIds } },
        { academicYearId: { in: ids.academicYearIds } },
        { publishedById: { in: ids.userIds } },
      ],
    },
  });
  await tx.gradeWeight.deleteMany({
    where: {
      OR: [
        { classId: { in: ids.classIds } },
        { subjectId: { in: ids.subjectIds } },
      ],
    },
  });
  await tx.subjectTeacher.deleteMany({
    where: {
      OR: [
        { subjectId: { in: ids.subjectIds } },
        { teacherId: { in: ids.userIds } },
      ],
    },
  });
  await tx.subjectClass.deleteMany({
    where: {
      OR: [
        { subjectId: { in: ids.subjectIds } },
        { classId: { in: ids.classIds } },
      ],
    },
  });
  await tx.subjectMajor.deleteMany({
    where: {
      OR: [
        { subjectId: { in: ids.subjectIds } },
        { majorId: { in: ids.majorIds } },
      ],
    },
  });
  await tx.majorTeacher.deleteMany({
    where: {
      OR: [
        { majorId: { in: ids.majorIds } },
        { teacherId: { in: ids.userIds } },
      ],
    },
  });
  await tx.studentProfile.deleteMany({ where: { userId: { in: ids.userIds } } });
  await tx.teacherProfile.deleteMany({ where: { userId: { in: ids.userIds } } });
  await tx.parentProfile.deleteMany({ where: { userId: { in: ids.userIds } } });
  await tx.passwordResetToken.deleteMany({
    where: { credential: { userId: { in: ids.userIds } } },
  });
  await tx.authCredential.deleteMany({ where: { userId: { in: ids.userIds } } });
  await tx.auditLog.deleteMany({
    where: {
      OR: [
        { actorId: { in: ids.userIds } },
        { entityId: instance.schoolId },
        { entityId: { in: ids.userIds } },
      ],
    },
  });
  await tx.user.deleteMany({ where: { id: { in: ids.userIds } } });
  await tx.class.deleteMany({ where: { id: { in: ids.classIds } } });
  await tx.subject.deleteMany({ where: { id: { in: ids.subjectIds } } });
  await tx.major.deleteMany({ where: { id: { in: ids.majorIds } } });
  await tx.scheduleTemplate.deleteMany({ where: { schoolId: instance.schoolId } });
  await tx.academicYear.deleteMany({
    where: { id: { in: ids.academicYearIds } },
  });
  await tx.schoolProfile.delete({ where: { id: instance.schoolId } });
};

export const pruneExpiredDemoInstances = async (
  now = new Date(),
): Promise<DemoPruneResult> => {
  const expiredInstances = await prisma.demoInstance.findMany({
    where: { expiresAt: { lte: now } },
    select: { id: true, schoolId: true },
    orderBy: { expiresAt: "asc" },
  });

  let deletedCount = 0;
  for (const instance of expiredInstances) {
    await prisma.$transaction(
      (tx) => deleteDemoInstanceGraph(tx, instance),
      { timeout: 60_000 },
    );
    deletedCount += 1;
  }

  return {
    scannedCount: expiredInstances.length,
    deletedCount,
  };
};

