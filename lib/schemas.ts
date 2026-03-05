import { z } from "zod";

const emptyString = z.string().nullish().transform((value) => value ?? "");
const zeroNumber = z.number().nullish().transform((value) => value ?? 0);
const stringArray = z
  .array(z.string())
  .nullish()
  .transform((value) => value ?? []);
const numberArray = z
  .array(z.number())
  .nullish()
  .transform((value) => value ?? []);
const toDate = (value: unknown) => {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed;
  }
  return value;
};
const dateSchema = z.preprocess(toDate, z.date());
const dateOptionalSchema = z.preprocess(toDate, z.date().optional());
const dateNullableSchema = z.preprocess(toDate, z.date().nullable().optional());

export const teacherOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type TeacherOption = z.infer<typeof teacherOptionSchema>;

export const userSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().nullish(),
    role: z.string().nullish(),
    firstName: z.string().nullish(),
    lastName: z.string().nullish(),
    phone: z.string().nullish(),
    address: z.string().nullish(),
    bio: z.string().nullish(),
    avatarUrl: z.string().nullish(),
    birthDate: dateNullableSchema,
    studentProfile: z
      .object({
        classId: z.string().nullish(),
        gender: z.string().nullish(),
        status: z.string().nullish(),
      })
      .passthrough()
      .nullish(),
    parentLinks: z
      .array(
        z.object({
          parentId: z.string(),
          studentId: z.string(),
        })
      )
      .nullish()
      .transform((value) => value ?? []),
    childLinks: z
      .array(
        z.object({
          parentId: z.string(),
          studentId: z.string(),
        })
      )
      .nullish()
      .transform((value) => value ?? []),
  })
  .passthrough();
export const userListSchema = z.array(userSchema);
export type UserSummary = z.infer<typeof userSchema>;

export const authSessionSchema = z.object({
  userId: z.string(),
  name: z.string(),
  role: z.string(),
  canUseDebugPanel: z.boolean().default(false),
  onboardingCompleted: z.boolean().default(true),
  schoolId: z.string().nullable().default(null),
});
export type AuthSessionSummary = z.infer<typeof authSessionSchema>;

export const authLoginResultSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
  }),
  canUseDebugPanel: z.boolean().default(false),
  onboardingCompleted: z.boolean().default(true),
  roleSelectionRequired: z.boolean().default(false),
  schoolId: z.string().nullable().default(null),
});
export type AuthLoginResult = z.infer<typeof authLoginResultSchema>;

export const onboardingStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  required: z.boolean(),
  completed: z.boolean(),
});
export type OnboardingStep = z.infer<typeof onboardingStepSchema>;

export const onboardingReminderSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  href: z.string(),
});
export type OnboardingReminder = z.infer<typeof onboardingReminderSchema>;

export const onboardingStatusSchema = z.object({
  role: z.string(),
  selectedRole: z.string().nullable().default(null),
  roleSelectionRequired: z.boolean().default(false),
  availableRoles: z.array(z.string()).default([]),
  onboardingCompleted: z.boolean().default(true),
  schoolCode: z.string().nullable(),
  steps: z.array(onboardingStepSchema).default([]),
  reminders: z.array(onboardingReminderSchema).default([]),
});
export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;

export const onboardingLinkChildResultSchema = z.object({
  linked: z.boolean(),
  child: z.object({
    id: z.string(),
    name: z.string(),
  }),
});
export type OnboardingLinkChildResult = z.infer<
  typeof onboardingLinkChildResultSchema
>;

export const onboardingCompleteResultSchema = z.object({
  success: z.boolean(),
  redirectTo: z.string(),
});
export type OnboardingCompleteResult = z.infer<
  typeof onboardingCompleteResultSchema
>;

export const parentInviteResultSchema = z.object({
  inviteId: z.string(),
  code: z.string(),
  expiresAt: z.string(),
  student: z.object({
    id: z.string(),
    name: z.string(),
  }),
});
export type ParentInviteResult = z.infer<typeof parentInviteResultSchema>;

export const userProfileSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().nullish(),
    role: z.string().nullish(),
    firstName: emptyString,
    lastName: emptyString,
    phone: emptyString,
    address: emptyString,
    bio: emptyString,
    avatarUrl: z.string().nullish(),
    birthDate: dateNullableSchema,
    studentProfile: z
      .object({
        classId: z.string().nullish(),
        gender: z.string().nullish(),
        status: z.string().nullish(),
      })
      .nullish(),
    teacherProfile: z
      .object({
        title: z.string().nullish(),
      })
      .nullish(),
    parentProfile: z
      .object({})
      .passthrough()
      .nullish(),
  })
  .passthrough();
export type UserProfileSummary = z.infer<typeof userProfileSchema>;

export const classSchema = z.object({
  id: z.string(),
  name: z.string(),
  grade: z.number(),
  major: emptyString,
  section: z.string(),
  homeroomTeacher: emptyString,
  homeroomTeacherId: emptyString,
  academicYear: emptyString,
  studentCount: zeroNumber,
  maleCount: zeroNumber,
  femaleCount: zeroNumber,
});
export const classListSchema = z.array(classSchema);
export type ClassSummary = z.infer<typeof classSchema>;

export const classFormSchema = z.object({
  name: z.string(),
  grade: z.number(),
  major: emptyString,
  section: z.string(),
  homeroomTeacherId: emptyString,
  academicYear: emptyString,
});
export type ClassFormValues = z.infer<typeof classFormSchema>;

export const majorSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: emptyString,
  description: emptyString,
});
export const majorListSchema = z.array(majorSchema);
export type MajorSummary = z.infer<typeof majorSchema>;

export const subjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  category: z.string(),
  description: emptyString,
  color: emptyString,
  teachers: z
    .array(teacherOptionSchema)
    .nullish()
    .transform((value) => value ?? []),
  classIds: stringArray,
  hoursPerWeek: zeroNumber,
});
export const subjectListSchema = z.array(subjectSchema);
export type SubjectSummary = z.infer<typeof subjectSchema>;

export const subjectTeacherSetPayloadSchema = z.object({
  teacherIds: z.array(z.string()),
});
export const subjectTeacherSetResultSchema = z.object({
  id: z.string(),
  teacherIds: stringArray,
});
export type SubjectTeacherSetPayload = z.infer<typeof subjectTeacherSetPayloadSchema>;
export type SubjectTeacherSetResult = z.infer<typeof subjectTeacherSetResultSchema>;

export const subjectClassSetPayloadSchema = z.object({
  classIds: z.array(z.string()),
});
export const subjectClassSetResultSchema = z.object({
  id: z.string(),
  classIds: stringArray,
});
export type SubjectClassSetPayload = z.infer<typeof subjectClassSetPayloadSchema>;
export type SubjectClassSetResult = z.infer<typeof subjectClassSetResultSchema>;

export const subjectFormSchema = z.object({
  name: z.string(),
  code: z.string(),
  category: z.string(),
  description: emptyString,
  color: emptyString,
  hoursPerWeek: z.number(),
});
export type SubjectFormValues = z.infer<typeof subjectFormSchema>;

export const studentSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullish(),
  gender: z.string().nullish(),
  lifecycleStatus: z.string().nullish(),
  classId: z.string().nullish(),
  className: emptyString,
});
export const classStudentListSchema = z.array(studentSummarySchema);
export type StudentSummary = z.infer<typeof studentSummarySchema>;

export const studentClassEnrollmentSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  classId: z.string(),
  className: z.string(),
  academicYearId: z.string().nullish(),
  academicYear: z.string().nullish(),
  startedAt: dateSchema,
  endedAt: dateNullableSchema,
  isActive: z.boolean().default(false),
});
export const studentClassEnrollmentListSchema = z.array(
  studentClassEnrollmentSchema
);
export type StudentClassEnrollmentSummary = z.infer<
  typeof studentClassEnrollmentSchema
>;

export const classSubjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  category: z.string(),
  description: emptyString,
  hoursPerWeek: zeroNumber,
});
export const classSubjectListSchema = z.array(classSubjectSchema);
export type ClassSubjectSummary = z.infer<typeof classSubjectSchema>;

export const classSubjectSetPayloadSchema = z.object({
  subjectIds: z.array(z.string()),
});
export const classSubjectSetResultSchema = z.object({
  id: z.string(),
  subjectIds: stringArray,
});
export type ClassSubjectSetPayload = z.infer<typeof classSubjectSetPayloadSchema>;
export type ClassSubjectSetResult = z.infer<typeof classSubjectSetResultSchema>;

export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: emptyString,
  date: dateSchema,
  endDate: dateOptionalSchema,
  type: z.string(),
  classIds: stringArray,
  isRecurring: z.boolean().default(false),
  createdBy: emptyString,
});
export const calendarEventListSchema = z.array(calendarEventSchema);
export type CalendarEventSummary = z.infer<typeof calendarEventSchema>;

export const forumThreadSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  subjectId: z.string(),
  subjectName: emptyString,
  classId: z.string().nullish(),
  authorId: z.string(),
  authorName: z.string(),
  authorRole: z.string(),
  status: z.string(),
  isPinned: z.boolean().default(false),
  replyCount: zeroNumber,
  upvotes: zeroNumber,
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export const forumThreadListSchema = z.array(forumThreadSchema);
export type ForumThreadSummary = z.infer<typeof forumThreadSchema>;

export const forumReplySchema = z.object({
  id: z.string(),
  threadId: z.string(),
  content: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorRole: z.string(),
  isAcceptedAnswer: z.boolean().default(false),
  upvotes: zeroNumber,
  createdAt: dateSchema,
});
export const forumReplyListSchema = z.array(forumReplySchema);
export type ForumReplySummary = z.infer<typeof forumReplySchema>;

export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  subjectId: z.string().nullish(),
  subjectName: emptyString,
  classId: z.string().nullish(),
  className: emptyString,
  authorId: z.string(),
  authorName: z.string(),
  visibility: z.string(),
  isPinned: z.boolean().default(false),
  color: emptyString,
  tags: stringArray,
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export const noteListSchema = z.array(noteSchema);
export type NoteSummary = z.infer<typeof noteSchema>;

export const questionSchema = z.object({
  id: z.string(),
  type: z.string(),
  subject: emptyString,
  topic: z.string(),
  difficulty: z.string(),
  text: z.string(),
  options: stringArray,
  correctAnswers: numberArray,
  rubric: z.string().nullish(),
  allowedFormats: stringArray,
  points: z.number(),
  createdAt: dateSchema,
  usageCount: zeroNumber,
});
export const questionListSchema = z.array(questionSchema);
export type QuestionSummary = z.infer<typeof questionSchema>;

export const questionPackageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: emptyString,
  subject: emptyString,
  questionIds: stringArray,
  createdAt: dateSchema,
  lastUsedAt: dateOptionalSchema,
  usageCount: zeroNumber,
});
export const questionPackageListSchema = z.array(questionPackageSchema);
export type QuestionPackageSummary = z.infer<typeof questionPackageSchema>;

export const scheduleSchema = z.object({
  id: z.string(),
  classId: z.string(),
  className: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  subjectCode: emptyString,
  teacherId: z.string().nullish(),
  teacherName: emptyString,
  dayOfWeek: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  room: emptyString,
  color: emptyString,
});
export const scheduleListSchema = z.array(scheduleSchema);
export type ScheduleSummary = z.infer<typeof scheduleSchema>;

export const attendanceSessionSchema = z.object({
  id: z.string(),
  classId: z.string(),
  className: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  teacherId: z.string().nullish(),
  teacherName: emptyString,
  takenByTeacherId: z.string().nullish(),
  takenByTeacherName: emptyString,
  scheduleId: z.string().nullish(),
  date: dateSchema,
  startTime: emptyString,
  endTime: emptyString,
});
export const attendanceSessionListSchema = z.array(attendanceSessionSchema);
export type AttendanceSessionSummary = z.infer<typeof attendanceSessionSchema>;

export const attendanceRecordSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  status: z.string(),
  note: emptyString,
  recordedAt: dateSchema,
  date: dateSchema,
  classId: z.string(),
  className: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
});
export const attendanceRecordListSchema = z.array(attendanceRecordSchema);
export type AttendanceRecordSummary = z.infer<typeof attendanceRecordSchema>;

export const teacherAttendanceSchema = z.object({
  id: z.string(),
  teacherId: z.string(),
  teacherName: emptyString,
  sessionId: z.string().nullish(),
  date: dateSchema,
  status: z.string(),
  note: emptyString,
  isAllDay: z.boolean().default(false),
});
export const teacherAttendanceListSchema = z.array(teacherAttendanceSchema);
export type TeacherAttendanceSummary = z.infer<typeof teacherAttendanceSchema>;

export const gradeSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  assignmentTitle: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  status: z.string(),
  grade: z.number().nullish(),
  gradeComponent: z.string().default("HOMEWORK"),
  submittedAt: dateOptionalSchema,
  createdAt: dateSchema,
});
export const gradeListSchema = z.array(gradeSchema);
export type GradeSummary = z.infer<typeof gradeSchema>;

export const gradeSummarySchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  average: z.number(),
  assignments: zeroNumber,
  componentAverages: z.object({
    HOMEWORK: z.number().nullable(),
    QUIZ: z.number().nullable(),
    EXAM: z.number().nullable(),
    PRACTICAL: z.number().nullable(),
  }),
  weights: z.object({
    HOMEWORK: z.number(),
    QUIZ: z.number(),
    EXAM: z.number(),
    PRACTICAL: z.number(),
  }),
  semester: z.string().nullable().optional(),
});
export const gradeSummaryListSchema = z.array(gradeSummarySchema);
export type GradeSummaryRow = z.infer<typeof gradeSummarySchema>;

export const gradeWeightSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  classId: z.string(),
  className: z.string(),
  semester: z.string(),
  homeworkWeight: z.number(),
  quizWeight: z.number(),
  examWeight: z.number(),
  practicalWeight: z.number(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export const gradeWeightListSchema = z.array(gradeWeightSchema);
export type GradeWeightSummary = z.infer<typeof gradeWeightSchema>;

const componentScoreSchema = z.object({
  HOMEWORK: z.number().nullable(),
  QUIZ: z.number().nullable(),
  EXAM: z.number().nullable(),
  PRACTICAL: z.number().nullable(),
});

const componentWeightSchema = z.object({
  HOMEWORK: z.number(),
  QUIZ: z.number(),
  EXAM: z.number(),
  PRACTICAL: z.number(),
});

export const reportCardSubjectSnapshotSchema = z.object({
  subjectId: z.string(),
  subjectName: z.string(),
  assignments: z.number(),
  finalGrade: z.number(),
  componentAverages: componentScoreSchema,
  weights: componentWeightSchema,
});

export const reportCardStudentSnapshotSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  overallAverage: z.number(),
  subjects: z.array(reportCardSubjectSnapshotSchema),
});

export const reportCardSnapshotSchema = z.object({
  id: z.string(),
  classId: z.string(),
  academicYearId: z.string(),
  semester: z.string(),
  publishedById: z.string(),
  publishedAt: dateSchema,
  studentCount: z.number(),
  snapshot: z
    .object({
      generatedAt: z.string(),
      classId: z.string(),
      academicYearId: z.string(),
      semester: z.string(),
      students: z.array(reportCardStudentSnapshotSchema),
    })
    .passthrough(),
});
export const reportCardSnapshotListSchema = z.array(
  reportCardSnapshotSchema
);
export type ReportCardSnapshotSummary = z.infer<
  typeof reportCardSnapshotSchema
>;

export const materialAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: emptyString,
  type: z.string(),
  url: z.string().nullish(),
  storageKey: z.string().nullish(),
  checksumSha256: z.string().nullish(),
  etag: z.string().nullish(),
  scanStatus: z.string().nullish(),
});
export const materialSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: emptyString,
  subject: z.string(),
  subjectId: z.string(),
  className: emptyString,
  classId: z.string().nullish(),
  teacher: z.string(),
  teacherId: z.string(),
  createdAt: dateSchema,
  attachments: z
    .array(materialAttachmentSchema)
    .nullish()
    .transform((value) => value ?? []),
});
export const materialListSchema = z.array(materialSchema);
export type MaterialSummary = z.infer<typeof materialSchema>;

export const uploadIntentSchema = z.object({
  id: z.string(),
  materialId: z.string(),
  fileName: z.string(),
  fileType: z.string(),
  sizeBytes: z.number(),
  checksumSha256: z.string(),
  storageKey: z.string(),
  status: z.string(),
  method: z.string(),
  uploadUrl: z.string(),
  expiresAt: dateSchema,
  createdAt: dateSchema,
});
export type UploadIntentSummary = z.infer<typeof uploadIntentSchema>;

export const uploadConfirmResultSchema = z.object({
  id: z.string(),
  status: z.string(),
  scanStatus: z.string().nullish(),
  scanResult: z.string().nullish(),
  attachment: z
    .object({
      id: z.string(),
      materialId: z.string(),
      fileName: z.string(),
      fileType: z.string(),
      sizeLabel: z.string().nullish(),
      url: z.string().nullish(),
      storageKey: z.string().nullish(),
      checksumSha256: z.string().nullish(),
      etag: z.string().nullish(),
      scanStatus: z.string().nullish(),
      uploadIntentId: z.string().nullish(),
    })
    .passthrough(),
});
export type UploadConfirmResult = z.infer<typeof uploadConfirmResultSchema>;

export const assignmentSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: emptyString,
  subjectId: z.string(),
  subjectName: z.string(),
  teacherId: z.string(),
  teacherName: z.string(),
  classIds: stringArray,
  dueDate: dateSchema,
  allowLateSubmission: z.boolean().default(false),
  lateUntil: dateOptionalSchema,
  maxAttempts: z.number().int().positive().nullish(),
  gradingPolicy: z.string().default("LATEST"),
  gradeComponent: z.string().default("HOMEWORK"),
  createdAt: dateSchema,
  kind: z.string().nullish(),
  deliveryType: z.string().nullish(),
  type: z.string().nullish(),
  status: z.string(),
});
export const assignmentListSchema = z.array(assignmentSchema);
export type AssignmentSummary = z.infer<typeof assignmentSchema>;

export const assignmentSubmissionSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  status: z.string(),
  submittedAt: dateOptionalSchema,
  grade: z.number().nullish(),
  feedback: emptyString,
  response: z.any().nullish(),
  createdAt: dateSchema,
});
export const assignmentSubmissionListSchema = z.array(
  assignmentSubmissionSchema
);
export type AssignmentSubmissionSummary = z.infer<
  typeof assignmentSubmissionSchema
>;

export const schoolProfileSchema = z.object({
  schoolCode: z.string().nullish(),
  name: z.string(),
  address: z.string(),
  phone: emptyString,
  email: z.string(),
  website: emptyString,
  principalName: emptyString,
  logoUrl: z.string().nullish(),
});
export type SchoolProfileSummary = z.infer<typeof schoolProfileSchema>;

export const academicYearSchema = z.object({
  id: z.string(),
  year: z.string(),
  semester: z.string(),
  startDate: dateSchema,
  endDate: dateSchema,
  isActive: z.boolean().default(false),
});
export const academicYearListSchema = z.array(academicYearSchema);
export type AcademicYearSummary = z.infer<typeof academicYearSchema>;

export const scheduleTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number(),
  isBreak: z.boolean().default(false),
});
export const scheduleTemplateListSchema = z.array(scheduleTemplateSchema);
export type ScheduleTemplateSummary = z.infer<typeof scheduleTemplateSchema>;

export const notificationPreferenceSchema = z.object({
  emailNotifications: z.boolean().default(true),
  assignmentReminders: z.boolean().default(true),
  attendanceAlerts: z.boolean().default(true),
  gradePublished: z.boolean().default(true),
});
export type NotificationPreferenceSummary = z.infer<
  typeof notificationPreferenceSchema
>;

export const notificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean().default(false),
  readAt: dateOptionalSchema,
  createdAt: dateSchema,
  data: z.any().nullish(),
});
export const notificationListSchema = z.array(notificationSchema);
export type NotificationSummary = z.infer<typeof notificationSchema>;

export const analyticsOverviewSchema = z.object({
  totalStudents: zeroNumber,
  totalTeachers: zeroNumber,
  totalParents: zeroNumber,
  totalClasses: zeroNumber,
});
export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>;

export const analyticsAttendanceSchema = z.object({
  from: z.string().nullish(),
  to: z.string().nullish(),
  counts: z
    .object({
      PRESENT: zeroNumber,
      ABSENT: zeroNumber,
      SICK: zeroNumber,
      PERMIT: zeroNumber,
    })
    .passthrough(),
});
export type AnalyticsAttendance = z.infer<typeof analyticsAttendanceSchema>;

export const analyticsGradesSchema = z.object({
  from: z.string().nullish(),
  to: z.string().nullish(),
  data: z
    .array(
      z.object({
        subjectId: z.string(),
        subjectName: z.string(),
        average: z.number(),
        submissions: zeroNumber,
      })
    )
    .nullish()
    .transform((value) => value ?? []),
});
export type AnalyticsGrades = z.infer<typeof analyticsGradesSchema>;

export const analyticsDemographicsSchema = z.object({
  gender: z.object({
    MALE: zeroNumber,
    FEMALE: zeroNumber,
    UNKNOWN: zeroNumber,
  }),
});
export type AnalyticsDemographics = z.infer<typeof analyticsDemographicsSchema>;

export const uploadScanQueueAlertSchema = z.object({
  code: z.string(),
  level: z.enum(["WARNING", "CRITICAL"]),
  message: z.string(),
  value: z.number(),
  threshold: z.number(),
});
export type UploadScanQueueAlert = z.infer<typeof uploadScanQueueAlertSchema>;

export const uploadScanQueueMetricsSchema = z.object({
  totalJobs: z.number(),
  pendingJobs: z.number(),
  failedJobs: z.number(),
  infectedJobs: z.number(),
  cleanJobs: z.number(),
  oldestPendingMinutes: z.number().nullable(),
  alertState: z.enum(["NORMAL", "WARNING", "CRITICAL"]),
  alerts: z
    .array(uploadScanQueueAlertSchema)
    .nullish()
    .transform((value) => value ?? []),
});
export type UploadScanQueueMetricsSummary = z.infer<
  typeof uploadScanQueueMetricsSchema
>;

export const systemMetricsSchema = z.object({
  status: z.string(),
  timestamp: dateSchema,
  uptimeSeconds: z.number(),
  database: z.string(),
  uploadScanQueue: uploadScanQueueMetricsSchema,
});
export type SystemMetricsSummary = z.infer<typeof systemMetricsSchema>;

export const governanceReadinessSectionSchema = z.object({
  ready: z.boolean(),
  blockers: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
});
export const governanceReadinessSnapshotSchema = z.object({
  generatedAt: dateSchema,
  overallReady: z.boolean(),
  rel001: governanceReadinessSectionSchema,
  rel005: governanceReadinessSectionSchema,
  decisionGate: governanceReadinessSectionSchema,
});
export type GovernanceReadinessSnapshot = z.infer<
  typeof governanceReadinessSnapshotSchema
>;

export const governanceTrackerTaskPacketSchema = z.enum([
  "AUTHZ",
  "OPS",
  "DECISION",
]);
export type GovernanceTrackerTaskPacket = z.infer<
  typeof governanceTrackerTaskPacketSchema
>;

export const governanceTrackerTaskSchema = z.object({
  id: z.string(),
  packet: governanceTrackerTaskPacketSchema,
  target: z.string(),
  owner: z.string(),
  decision: z.string(),
  decisionDate: z.string().nullable(),
  dueDate: z.string().nullable(),
  note: z.string().nullable(),
  isApproved: z.boolean(),
  isOverdue: z.boolean(),
});
export type GovernanceTrackerTaskSummary = z.infer<
  typeof governanceTrackerTaskSchema
>;

export const governanceTrackerPendingByPicSchema = z.object({
  pic: z.string(),
  pending: z.number(),
  overdue: z.number(),
  targets: z.array(z.string()).default([]),
});
export type GovernanceTrackerPendingByPicSummary = z.infer<
  typeof governanceTrackerPendingByPicSchema
>;

export const governanceTrackerHistoryEntrySchema = z.object({
  date: z.string().nullable(),
  packet: z.string(),
  target: z.string(),
  decision: z.string(),
  actor: z.string().nullable(),
  note: z.string().nullable(),
});
export type GovernanceTrackerHistoryEntrySummary = z.infer<
  typeof governanceTrackerHistoryEntrySchema
>;

export const governanceTrackerSnapshotSchema = z.object({
  generatedAt: dateSchema,
  totals: z.object({
    total: z.number(),
    approved: z.number(),
    pending: z.number(),
    overdue: z.number(),
  }),
  tasks: z.array(governanceTrackerTaskSchema).default([]),
  overdueTasks: z.array(governanceTrackerTaskSchema).default([]),
  pendingByPic: z.array(governanceTrackerPendingByPicSchema).default([]),
  recentHistory: z.array(governanceTrackerHistoryEntrySchema).default([]),
});
export type GovernanceTrackerSnapshot = z.infer<
  typeof governanceTrackerSnapshotSchema
>;

export const governanceApprovalDecisionSchema = z.enum([
  "Approved",
  "Pending",
  "Deferred",
  "Rejected",
]);
export type GovernanceApprovalDecision = z.infer<
  typeof governanceApprovalDecisionSchema
>;
export const governanceApprovalPacketSchema = z.enum([
  "authz",
  "ops",
  "decision",
]);
export type GovernanceApprovalPacket = z.infer<
  typeof governanceApprovalPacketSchema
>;
export const governanceApprovalMutationPayloadSchema = z.object({
  packet: governanceApprovalPacketSchema,
  subject: z.string().optional(),
  id: z.string().optional(),
  decision: governanceApprovalDecisionSchema,
  name: z.string().optional(),
  note: z.string().optional(),
  owner: z.string().optional(),
  dueDate: z.string().optional(),
  date: z.string().optional(),
  actor: z.string().optional(),
});
export type GovernanceApprovalMutationPayload = z.infer<
  typeof governanceApprovalMutationPayloadSchema
>;

export const governanceApprovalMutationResultSchema = z.object({
  changed: z.boolean(),
  packet: governanceApprovalPacketSchema,
  target: z.string(),
  decision: governanceApprovalDecisionSchema,
  date: z.string(),
  snapshot: governanceReadinessSnapshotSchema,
});
export type GovernanceApprovalMutationResult = z.infer<
  typeof governanceApprovalMutationResultSchema
>;
