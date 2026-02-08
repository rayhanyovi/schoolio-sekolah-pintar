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
  classId: z.string().nullish(),
  className: emptyString,
});
export const classStudentListSchema = z.array(studentSummarySchema);
export type StudentSummary = z.infer<typeof studentSummarySchema>;

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
});
export const gradeSummaryListSchema = z.array(gradeSummarySchema);
export type GradeSummaryRow = z.infer<typeof gradeSummarySchema>;

export const materialAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: emptyString,
  type: z.string(),
  url: z.string().nullish(),
  storageKey: z.string().nullish(),
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
