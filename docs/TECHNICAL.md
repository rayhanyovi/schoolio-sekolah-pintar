# Technical Architecture and Reference

> Pure engineering reference for Schoolio / Sekolah Pintar. Architecture, data models, API surface, auth, RBAC, and conventions. For product direction see `PRODUCT.md`. For design see `DESIGN.md`.

Last updated: 2026-05-05

---

## 1. Tech Stack

| Category | Library | Version | Notes |
|----------|---------|---------|-------|
| Framework | Next.js | 16.1.1 | App Router, server components default |
| UI runtime | React + ReactDOM | 19.2.3 | React 19 hooks |
| Language | TypeScript | ^5 | strict mode |
| ORM | Prisma | ^5.17 | client + CLI |
| DB | PostgreSQL | 16 (alpine via docker-compose) | dual-mode resolver |
| Styling | Tailwind CSS | 3.4.17 | HSL CSS variables |
| Animation | tailwindcss-animate | ^1.0.7 | |
| Component lib | Radix UI primitives | ^1.x | 28 primitives |
| Component wrapper | shadcn/ui | vendored under `components/ui/` | do not replace |
| Class merging | clsx + tailwind-merge + CVA | latest | `lib/utils.ts cn()` |
| Form | react-hook-form + @hookform/resolvers + Zod | 7.61 / 3.10 / 3.25 | |
| Server state | @tanstack/react-query | 5.83 | |
| Date | date-fns | 3.6 | locale `id` required |
| Charts | Recharts | 2.15 | wrapper in `components/ui/chart.tsx` |
| Icons | lucide-react | 0.462 | |
| Toast | Sonner | 1.7 | |
| Drawer | vaul | 1.1 | mobile only |
| Theme | next-themes | 0.4 | class strategy |
| OTP input | input-otp | 1.4 | |
| Calendar pick | react-day-picker | 9.13 | |
| Carousel | embla-carousel-react | 8.6 | |
| Resizable | react-resizable-panels | 2.1 | |
| YAML | yaml | 2.8 | governance docs |
| Tests | Vitest | 4.0 | Node env |
| Lint | ESLint + eslint-config-next | 9 / 16.1.1 | no Prettier |
| Email | Resend (`lib/resend.ts`) | — | password reset + notification delivery |
| i18n (planned) | next-intl | NOT YET INSTALLED | Phase 2 |

**Library restrictions:** Do not add alternative UI libraries (MUI, Chakra, Mantine, Ant, NextUI).

---

## 2. Architecture and Layering

### Request Lifecycle

```
Browser → middleware.ts → app/api/.../route.ts → lib/handlers/<feature>.ts → Prisma → PostgreSQL
```

### Middleware Pipeline (`middleware.ts`)

1. Correlation ID injection (`x-correlation-id`)
2. Auth gating (redirect unauthenticated to `/auth`)
3. Onboarding gating (redirect incomplete to `/onboarding`)
4. Must-change-password gating (redirect to `/change-password`)
5. CSRF enforcement (double-submit cookie/header for unsafe methods)

### Layer Responsibilities

| Layer | Files | Responsibility |
|-------|-------|----------------|
| Route handler | `app/api/**/route.ts` | Orchestration only: auth → role → school context → ownership → validate → handler → respond |
| Business logic | `lib/handlers/<feature>.ts` | Domain logic, Prisma queries, policy enforcement |
| Authorization | `lib/authz.ts` | RBAC checks, ownership verification |
| Validation | `lib/schemas.ts` | Zod schemas (never inline) |
| API utilities | `lib/api.ts` | `requireAuth`, `requireRole`, `requireSchoolContext`, `parseJsonBody`, `jsonOk`, `jsonError` |
| Frontend | `components/pages/<Feature>.tsx` | Page-level React components |
| UI primitives | `components/ui/*` | Vendored shadcn/Radix components |

---

## 3. Multi-Tenancy and Deployment Modes

### Tenant Boundary

Every school is isolated by `SchoolProfile.id`. All Prisma queries MUST be scoped by `schoolId` directly or through a tenant-scoped parent relation.

### Deployment Modes

| Mode | Env var | Database |
|------|---------|----------|
| `self_host` | `APP_MODE=self_host` | School-controlled PostgreSQL via `DATABASE_URL` |
| `saas` | `APP_MODE=saas` | Supabase via `SUPABASE_DATABASE_URL` |

Resolution logic in `lib/database-url.ts`.

---

## 4. Domain Model Reference

Source of truth: `prisma/schema.prisma` (47 models).

### 4.1 Identity

| Model | Key fields |
|-------|-----------|
| `User` | id, email, name, role (ADMIN/TEACHER/STUDENT/PARENT), gender, schoolId, avatarUrl, onboardingCompletedAt, mustChangePassword, isDefaultPassword |
| `AuthCredential` | userId (unique), passwordHash, passwordSalt |
| `PasswordResetToken` | id, credentialId, tokenHash, expiresAt, usedAt |
| `StudentProfile` | userId (unique), nisn, nis, enrollmentDate, lifecycleStatus, guardianName/Phone |
| `TeacherProfile` | userId (unique), nip, certification, specialization |
| `ParentProfile` | userId (unique), occupation, phone |

### 4.2 Tenancy

| Model | Key fields |
|-------|-----------|
| `SchoolProfile` | id, name, code, address, principalName, logoUrl |
| `AcademicYear` | id, schoolId, name, startDate, endDate, semester, isActive |
| `WaitlistEntry` | id, email, schoolName, role, createdAt |
| `DemoInstance` | id, schoolId, visitorId, expiresAt, createdAt |
| `SystemHeartbeat` | id, timestamp, status |

### 4.3 Academic Structure

| Model | Key fields | Notes |
|-------|-----------|-------|
| `Class` | id, schoolId, name, grade, section, academicYearId, homeroomTeacherId, majorId | |
| `StudentClassEnrollment` | id, studentId, classId, academicYearId, enrolledAt | unique (studentId, classId) |
| `Subject` | id, schoolId, name, code, category, description | |
| `Major` | id, schoolId, name, code, description | |
| `SubjectTeacher` | subjectId, teacherId | composite PK |
| `SubjectClass` | subjectId, classId | composite PK |
| `SubjectMajor` | subjectId, majorId | composite PK; cascade delete |
| `MajorTeacher` | majorId, teacherId | composite PK |
| `ParentStudent` | parentId, studentId | composite PK |
| `ParentInvite` | id, schoolId, codeHash, studentId, createdById, expiresAt, redeemedAt | TTL 7d |

### 4.4 Schedule

| Model | Key fields |
|-------|-----------|
| `ClassSchedule` | id, classId, subjectId, teacherId, dayOfWeek (MON…SAT), startTime, endTime, room, color |
| `ScheduleTemplate` | id, schoolId, name, startTime, endTime, duration, isBreak, position |

### 4.5 Attendance

| Model | Key fields | Uniqueness |
|-------|-----------|-----------|
| `AttendanceSession` | id, sessionKey (unique), classId, subjectId, status (OPEN/LOCKED/FINALIZED), teacherId, takenByTeacherId, overriddenById, overrideReason, date, startTime, endTime | sessionKey unique |
| `AttendanceRecord` | id, sessionId, studentId, status (PRESENT/ABSENT/SICK/PERMIT), note | unique (sessionId, studentId) |
| `TeacherAttendance` | id, teacherId, sessionId, date, status, note, isAllDay | |

Always generate `sessionKey` via `lib/attendance-session-key.ts` before inserting `AttendanceSession`.

### 4.6 Assignments and Grading

| Model | Key fields | Uniqueness |
|-------|-----------|-----------|
| `Assignment` | id, title, subjectId, teacherId, dueDate, allowLateSubmission, lateUntil, maxAttempts, gradingPolicy (LATEST/HIGHEST/MANUAL), gradeComponent (HOMEWORK/QUIZ/EXAM/PRACTICAL), kind (HOMEWORK/PROJECT/QUIZ/EXAM), deliveryType (MCQ/FILE/ESSAY), status (ACTIVE/CLOSED), questionPackageId | |
| `AssignmentClass` | assignmentId, classId | composite PK |
| `AssignmentQuestion` | assignmentId, questionId, position | composite PK |
| `AssignmentSubmission` | id, assignmentId, studentId, status (PENDING/SUBMITTED/GRADED), attemptCount, submittedAt, grade, feedback, response (JSON) | unique (assignmentId, studentId) |
| `GradeWeight` | id, subjectId, classId, semester, homeworkWeight, quizWeight, examWeight, practicalWeight (default 25 each) | unique (subjectId, classId, semester) |

### 4.7 Question Bank

| Model | Key fields |
|-------|-----------|
| `Question` | id, type (MCQ/FILE/ESSAY), subjectId, subjectText, topic, difficulty (EASY/MEDIUM/HARD), text, options[], correctAnswers (Int[]), rubric, allowedFormats[], points, usageCount |
| `QuestionPackage` | id, name, description, subjectId, subjectText, lastUsedAt, usageCount |
| `QuestionPackageItem` | packageId, questionId, position | composite PK |

### 4.8 Materials and Uploads

| Model | Key fields |
|-------|-----------|
| `Material` | id, title, description, subjectId, classId, teacherId |
| `MaterialAttachment` | id, materialId, fileName, fileType, sizeLabel, url, storageKey, checksumSha256, etag, scanStatus, uploadIntentId (unique) |
| `UploadIntent` | id, materialId, uploadedById, confirmedById, fileName, fileType, sizeBytes, checksumSha256, storageKey, uploadTokenHash, status (PENDING/UPLOADED/CONFIRMED/EXPIRED), scanStatus (PENDING/CLEAN/INFECTED/FAILED), expiresAt |
| `UploadScanJob` | id, intentId (unique), status, provider, result, queuedAt, completedAt |

Scanner provider integration is deferred.

### 4.9 Communication

| Model | Key fields |
|-------|-----------|
| `ForumThread` | id, title, content, subjectId, classId, authorId, authorRole, status (OPEN/RESOLVED/LOCKED), isPinned, replyCount, upvotes |
| `ForumReply` | id, threadId, content, authorId, authorRole, isAcceptedAnswer, upvotes |
| `Note` | id, title, content, subjectId, classId, authorId, visibility (PRIVATE/CLASS), isPinned, color, tags[] |
| `CalendarEvent` | id, title, description, date, endDate, type (ACADEMIC/HOLIDAY/ACTIVITY/DEADLINE), isRecurring, createdById |
| `CalendarEventClass` | eventId, classId | composite PK |

### 4.10 Notifications

| Model | Key fields |
|-------|-----------|
| `Notification` | id, recipientId, type (ASSIGNMENT_NEW/ASSIGNMENT_DEADLINE/GRADE_PUBLISHED/ATTENDANCE_ALERT/SYSTEM), title, message, data (JSON), isRead, readAt, triggeredById |
| `NotificationPreference` | userId (unique), emailNotifications, assignmentReminders, attendanceAlerts, gradePublished |

### 4.11 Reporting and Audit

| Model | Key fields |
|-------|-----------|
| `ReportCardSnapshot` | id, classId, academicYearId, semester, publishedById, publishedAt, snapshot (JSON) |
| `AuditLog` | id, actorId, actorRole, action, entityType, entityId, beforeData (JSON), afterData (JSON), metadata (JSON), reason |

### 4.12 Enums

```
Role                     ADMIN | TEACHER | STUDENT | PARENT
Gender                   MALE | FEMALE
StudentLifecycleStatus   ACTIVE | INACTIVE | GRADUATED | TRANSFERRED_OUT
SubjectCategory          SCIENCE | SOCIAL | LANGUAGE | ART | SPORTS | OTHER
EventType                ACADEMIC | HOLIDAY | ACTIVITY | DEADLINE
ThreadStatus             OPEN | RESOLVED | LOCKED
NoteVisibility           PRIVATE | CLASS
Semester                 ODD | EVEN
DayOfWeek                MON | TUE | WED | THU | FRI | SAT
AttendanceStatus         PRESENT | ABSENT | SICK | PERMIT
AttendanceSessionStatus  OPEN | LOCKED | FINALIZED
AssignmentKind           HOMEWORK | PROJECT | QUIZ | EXAM
AssignmentDeliveryType   MCQ | FILE | ESSAY
AssignmentStatus         ACTIVE | CLOSED
GradingPolicy            LATEST | HIGHEST | MANUAL
GradeComponent           HOMEWORK | QUIZ | EXAM | PRACTICAL
SubmissionStatus         PENDING | SUBMITTED | GRADED
DifficultyLevel          EASY | MEDIUM | HARD
NotificationType         ASSIGNMENT_NEW | ASSIGNMENT_DEADLINE | GRADE_PUBLISHED | ATTENDANCE_ALERT | SYSTEM
UploadIntentStatus       PENDING | UPLOADED | CONFIRMED | EXPIRED
UploadScanStatus         PENDING | CLEAN | INFECTED | FAILED
```

---

## 5. API Surface

### Conventions

```
Success: 200 { "data": ... }                      via jsonOk(data)
Error:   4xx/5xx { "error": { "code": "...", "message": "..." } }  via jsonError(code, msg, status)
Headers: x-correlation-id propagated end-to-end (set in middleware.ts)
Auth:    cookie schoolio_session (HMAC-SHA256, 8h TTL)
Validation: parseJsonBody(req, ZodSchema)
Pagination: cursor-based — ?limit=&cursor= where applicable
Error codes: AUTH_REQUIRED | FORBIDDEN | NOT_FOUND | VALIDATION_FAILED | CONFLICT | RATE_LIMITED | INTERNAL
```

### 5.1 Auth (Public + Authenticated)

| Method | Path | Purpose | Roles |
|--------|------|---------|-------|
| POST | `/api/auth/login` | Credential login → session cookie | Public |
| POST | `/api/auth/register` | New user registration | Public |
| POST | `/api/auth/forgot-password` | Initiate password reset | Public |
| POST | `/api/auth/reset-password` | Complete reset via token | Public |
| POST | `/api/auth/change-password` | Change own password | Authenticated |
| GET | `/api/auth/session` | Verify current session | Authenticated |
| POST | `/api/auth/logout` | Clear session | Authenticated |
| GET/POST | `/api/auth/onboarding` | Onboarding state | Authenticated |
| POST | `/api/auth/onboarding/select-role` | Select initial role | Authenticated |
| POST | `/api/auth/onboarding/complete` | Mark onboarding complete | Authenticated |
| POST | `/api/auth/onboarding/link-child` | Parent link child via invite | PARENT |

### 5.2 Users / Students / Teachers / Parents

| Method | Path | Purpose | Roles |
|--------|------|---------|-------|
| GET, POST | `/api/users` | List/create users | ADMIN |
| GET, PATCH, DELETE | `/api/users/[id]` | CRUD user | ADMIN |
| GET, PATCH | `/api/users/[id]/profile` | Profile (actor-scoped) | ADMIN, self |
| POST | `/api/users/[id]/reset-password` | Admin password reset | ADMIN |
| GET | `/api/students` | List students | ADMIN, TEACHER |
| GET | `/api/students/[id]/enrollments` | Student class history | ADMIN, TEACHER, self, linked PARENT |
| GET | `/api/teachers` | List teachers | ADMIN, TEACHER |
| GET | `/api/parents` | List parents | ADMIN, TEACHER, self |
| GET | `/api/parents/me/children` | Linked children | PARENT (self) |
| GET, POST, DELETE | `/api/parent-links` | Parent-student link | ADMIN |
| GET, POST | `/api/parent-invites` | Parent invite codes (TTL 7d) | ADMIN |

### 5.3 Academic Structure

| Method | Path | Purpose | Roles |
|--------|------|---------|-------|
| GET, POST | `/api/academic-years` | List/create | ADMIN (write), all (read) |
| GET, PATCH, DELETE | `/api/academic-years/[id]` | CRUD | ADMIN |
| POST | `/api/academic-years/[id]/activate` | Mark active | ADMIN |
| GET, POST | `/api/classes` | List/create | ADMIN |
| GET, PATCH, DELETE | `/api/classes/[id]` | CRUD | ADMIN |
| GET, POST, DELETE | `/api/classes/[id]/students` | Roster | ADMIN, TEACHER (read) |
| GET, POST, DELETE | `/api/classes/[id]/subjects` | Class-subject map | ADMIN |
| GET, POST | `/api/subjects` | List/create | ADMIN (write); all (read) |
| GET, PATCH, DELETE | `/api/subjects/[id]` | CRUD | ADMIN |
| GET, POST, DELETE | `/api/subjects/[id]/teachers` | Subject-teacher map | ADMIN |
| GET, POST, DELETE | `/api/subjects/[id]/classes` | Subject-class map | ADMIN |
| GET, POST | `/api/majors` | List/create | ADMIN (write); ADMIN+TEACHER (read) |
| GET, PATCH, DELETE | `/api/majors/[id]` | CRUD | ADMIN |
| GET, POST, DELETE | `/api/majors/[id]/teachers` | Major-teacher map | ADMIN |

### 5.4 Schedule

| Method | Path | Purpose | Roles |
|--------|------|---------|-------|
| GET, POST | `/api/schedules` | List/create | ADMIN, TEACHER (own subject-class) |
| GET, PATCH, DELETE | `/api/schedules/[id]` | CRUD | same |
| GET, POST, PATCH | `/api/schedule-templates` | School period template | ADMIN |

### 5.5 Attendance

| Method | Path | Purpose | Roles |
|--------|------|---------|-------|
| GET, POST | `/api/attendance/sessions` | List/create sessions | ADMIN, TEACHER (own scope) |
| GET, PATCH, DELETE | `/api/attendance/sessions/[id]` | CRUD session | same |
| POST | `/api/attendance/sessions/seed` | Seed from schedule | ADMIN, TEACHER |
| GET, POST | `/api/attendance/sessions/[id]/records` | Bulk upsert per session | ADMIN, TEACHER (session scope) |
| GET | `/api/attendance/records` | List records (filtered) | role-scoped |
| PATCH, DELETE | `/api/attendance/records/[id]` | Modify single | ADMIN, TEACHER |
| GET, POST | `/api/teacher-attendance` | Teacher attendance | ADMIN, self TEACHER |

### 5.6 Assignments

| Method | Path | Purpose | Roles |
|--------|------|---------|-------|
| GET, POST | `/api/assignments` | List/create | ADMIN, TEACHER (own subject-class) |
| GET, PATCH, DELETE | `/api/assignments/[id]` | CRUD | ADMIN, TEACHER (owner) |
| GET, POST, DELETE | `/api/assignments/[id]/classes` | Class linkage | ADMIN, TEACHER owner |
| GET, POST, DELETE | `/api/assignments/[id]/questions` | Question linkage | ADMIN, TEACHER owner |
| GET | `/api/assignments/[id]/submissions` | List submissions | ADMIN, TEACHER owner |
| GET, PATCH | `/api/submissions/[id]` | Get/grade submission | TEACHER owner / self STUDENT |

### 5.7 Grades

| Method | Path | Purpose | Roles |
|--------|------|---------|-------|
| GET | `/api/grades` | Filter grades | role-scoped |
| GET | `/api/grades/summary` | Summaries | ADMIN, TEACHER (owner scope) |
| GET, POST, PATCH | `/api/grades/weights` | Grade weights | ADMIN, TEACHER (owner subject-class) |
| GET, POST | `/api/grades/report-cards` | Report card snapshot | ADMIN |

### 5.8 Question Bank

| Method | Path | Roles |
|--------|------|-------|
| GET, POST | `/api/questions` | ADMIN, TEACHER |
| GET, PATCH, DELETE | `/api/questions/[id]` | ADMIN, TEACHER |
| GET, POST | `/api/question-packages` | ADMIN, TEACHER |
| GET, PATCH, DELETE | `/api/question-packages/[id]` | ADMIN, TEACHER |
| GET, POST, DELETE | `/api/question-packages/[id]/questions` | ADMIN, TEACHER |

### 5.9 Materials and Uploads

| Method | Path | Roles |
|--------|------|-------|
| GET, POST | `/api/materials` | ADMIN, TEACHER |
| GET, PATCH, DELETE | `/api/materials/[id]` | ADMIN, TEACHER (owner) |
| GET, POST | `/api/materials/[id]/attachments` | ADMIN, TEACHER (owner) |
| DELETE | `/api/materials/[id]/attachments/[attachmentId]` | ADMIN, TEACHER (owner) |
| POST | `/api/uploads/intents` | ADMIN, TEACHER |
| GET | `/api/uploads/intents/[id]` | ADMIN, TEACHER (owner) |
| PUT | `/api/uploads/intents/[id]/content` | ADMIN, TEACHER (owner) |
| POST | `/api/uploads/intents/[id]/confirm` | ADMIN, TEACHER (owner) |

### 5.10 Forum

| Method | Path | Roles |
|--------|------|-------|
| GET, POST | `/api/forum/threads` | ADMIN, TEACHER, STUDENT (PARENT blocked) |
| GET, PATCH, DELETE | `/api/forum/threads/[id]` | author/admin/teacher |
| GET, POST | `/api/forum/threads/[id]/replies` | same (lock enforced) |
| POST | `/api/forum/threads/[id]/pin` | ADMIN, TEACHER |
| POST | `/api/forum/threads/[id]/lock` | ADMIN, TEACHER |
| POST | `/api/forum/threads/[id]/upvote` | authenticated non-PARENT |
| GET, PATCH, DELETE | `/api/forum/replies/[id]` | author/admin/teacher |
| POST | `/api/forum/replies/[id]/upvote` | non-PARENT |

### 5.11 Notes

| Method | Path | Roles |
|--------|------|-------|
| GET, POST | `/api/notes` | all roles (author from session) |
| GET, PATCH, DELETE | `/api/notes/[id]` | author or ADMIN |
| POST | `/api/notes/[id]/pin` | author or ADMIN |

### 5.12 Calendar

| Method | Path | Roles |
|--------|------|-------|
| GET, POST | `/api/calendar/events` | read all; write ADMIN+TEACHER |
| GET, PATCH, DELETE | `/api/calendar/events/[id]` | same |
| GET, POST, DELETE | `/api/calendar/events/[id]/classes` | ADMIN, TEACHER owner |

### 5.13 Notifications and Settings

| Method | Path | Roles |
|--------|------|-------|
| GET | `/api/notifications` | self |
| PATCH | `/api/notifications/[id]/read` | self |
| PATCH | `/api/notifications/read-all` | self |
| GET, PATCH | `/api/settings/notifications` | self |
| GET, PATCH | `/api/settings/school-profile` | read all; write ADMIN |

### 5.14 Analytics

| Method | Path | Roles |
|--------|------|-------|
| GET | `/api/analytics/overview` | all (auth) |
| GET | `/api/analytics/attendance` | ADMIN, TEACHER (scoped) |
| GET | `/api/analytics/grades` | ADMIN, TEACHER (scoped) |
| GET | `/api/analytics/demographics` | ADMIN |
| GET | `/api/metrics` | ADMIN |

### 5.15 Planned (Not Yet Built)

| Path | Module | Phase |
|------|--------|-------|
| `/api/exams/*` | Dedicated Exam | 3 |
| `/api/library/books`, `/api/library/loans` | Library | 3 |
| `/api/students/[id]/transcript` | Transcripts | 3 |
| `/api/certificates/*` | Certificates | 3 |
| `/api/grades/erapor/export` | e-Rapor | 3 |
| `/api/v1/*` | API versioning | 4 |

---

## 6. RBAC and Authorization

### Roles

`ADMIN`, `TEACHER`, `STUDENT`, `PARENT`

### Authorization Helpers (`lib/authz.ts`)

- `hasAnyRole(actor, roles[])`
- `canAccessOwnUser(actor, userId)` — ADMIN or self
- `canViewStudent(actor, studentId)` — ADMIN/TEACHER (school scope), self STUDENT, linked PARENT
- `canViewParent(actor, parentId)` — ADMIN/TEACHER (school), self PARENT
- `listLinkedStudentIds(parentId)` — children of parent
- `listLinkedClassIdsForParent(parentId)` — classes containing linked children
- `getStudentClassId(studentId)` — current class id
- `isTeacherAssignedToSubject(teacherId, subjectId)`
- `isSubjectLinkedToClass(subjectId, classId)`
- `canTeacherManageSubjectClass(teacherId, subjectId, classId?)`

### Endpoint Checklist

Every new endpoint MUST:
1. `requireAuth(req)` → actor
2. `requireRole(actor, [...allowedRoles])` if applicable
3. `requireSchoolContext(actor)`
4. Ownership check via authz helper
5. `parseJsonBody(req, schema)` for write methods
6. Prisma queries scoped by `schoolId`
7. `recordAudit(...)` for sensitive writes

### Resource × Action Matrix

| Resource | Action | Allowed Roles | Ownership Constraint |
|----------|--------|---------------|---------------------|
| Users | List/create/CRUD | ADMIN | Full school scope |
| User Profile | Read/update | ADMIN, self | Non-admin only self |
| Students | Read | ADMIN, TEACHER, STUDENT, PARENT | STUDENT=self; PARENT=linked; TEACHER=school |
| Parents | Read | ADMIN, TEACHER, PARENT | PARENT=self |
| Teachers | Read | ADMIN, TEACHER | TEACHER=self for write |
| Parent Links | Link/unlink | ADMIN | — |
| Parent Invites | Create/redeem | ADMIN (create), authenticated (redeem) | TTL 7d |
| Classes | Read | all | STUDENT=own; PARENT=linked |
| Classes | Write | ADMIN | — |
| Subjects | Read/Write | all (read); ADMIN (write) | — |
| Majors | Read/Write | ADMIN+TEACHER (read); ADMIN (write) | — |
| Academic Years | Read/Write | all (read); ADMIN (write+activate) | — |
| Schedules | Read | all | TEACHER=own; STUDENT=own class; PARENT=linked |
| Schedules | Write | ADMIN, TEACHER | TEACHER=own subject-class |
| Attendance Sessions | Read | all | TEACHER=own; STUDENT=own; PARENT=linked |
| Attendance Sessions | Write | ADMIN, TEACHER | TEACHER=own subject-class |
| Attendance Records | Write | ADMIN, TEACHER | TEACHER session scope |
| Materials | Read | all | class scope |
| Materials | Write | ADMIN, TEACHER | TEACHER=own subject-class |
| Assignments | Read | all | class scope |
| Assignments | Write | ADMIN, TEACHER | TEACHER=own subject-class |
| Submissions | Read | all | STUDENT=self; PARENT=linked; TEACHER=owner |
| Submissions | Write (submit) | STUDENT | self only |
| Submissions | Grade | ADMIN, TEACHER | TEACHER=owner |
| Grades | Read | all | STUDENT=self; PARENT=linked |
| Report Cards | Read/publish | ADMIN | — |
| Forum | Read/create | ADMIN, TEACHER, STUDENT | PARENT blocked |
| Forum Lock/Pin | Mod action | ADMIN, TEACHER | — |
| Notes | Read/create | all | author from session |
| Calendar Events | Read | all | class+global scope |
| Calendar Events | Write | ADMIN, TEACHER | TEACHER=own events |
| Analytics | Read | all (overview); ADMIN+TEACHER (detailed) | TEACHER scoped |
| Questions/Packages | Read/write | ADMIN, TEACHER | — |
| Notifications | Read/mark | self | — |
| School Profile | Read/write | all (read); ADMIN (write) | — |

**Parent submission visibility:** Status + grade only; raw `response` masked server-side (TP-DEC-002 approved).

### Sensitive Actions (require audit log)

- Grade write/change
- Attendance override
- Role/profile change
- Parent link create/delete
- Password reset (admin and self)
- School profile change
- Academic year activation
- Report card publish

---

## 7. Auth Flow Reference

### Login

1. `POST /api/auth/login` with `{ identifier, password }`
2. Verify against `AuthCredential`
3. Compose payload: `{ userId, name, role, canUseDebugPanel, onboardingCompleted, schoolId, mustChangePassword, iat, exp }`
4. Sign HMAC-SHA256 with `SESSION_SECRET` (Web Crypto)
5. Set cookie `schoolio_session` (httpOnly, secure in prod, SameSite=Lax, maxAge 8h)

### Register → Onboarding

1. `POST /api/auth/register` → User + AuthCredential created
2. Redirect to `/onboarding`
3. `POST /api/auth/onboarding/select-role` → create role profile
4. (Parent) `POST /api/auth/onboarding/link-child` with invite code
5. `POST /api/auth/onboarding/complete` → set `onboardingCompletedAt`

### Forgot/Reset Password

1. `POST /api/auth/forgot-password` → generate token, hash+store, email via Resend
2. `POST /api/auth/reset-password` → validate hash+expiry, update password, invalidate all tokens for this credential

### Must-Change-Password Gate

Set on user creation with default password. Middleware redirects to `/change-password` until cleared.

### Demo Mode

`admin/admin`, `teacher/teacher`, `student/student`, `parent/parent` enabled when `NODE_ENV !== 'production'`.

### Known Auth Gaps

- Rate limiting: in-memory token bucket; distributed SaaS backend deferred
- CSRF: enabled via double-submit; server-action coverage needs review
- No MFA (Phase 4)
- No SSO (Phase 4)

---

## 8. Code Conventions

| Topic | Rule |
|-------|------|
| File naming | `lib/*` kebab-case; `components/*` PascalCase; route handler always `route.ts` |
| Imports | Alias `@/*` → repo root (tsconfig) |
| Zod schemas | Live in `lib/schemas.ts` only. Export by name. Never inline. |
| Handlers | One file per feature: `lib/handlers/<feature>.ts`. Named exports. |
| Route handlers | Orchestration only: auth → role → school → ownership → validate → handler → respond |
| Errors | Throw from handlers (`new ApiError("CODE", "msg", status)`). Route catches → `jsonError`. |
| Tests | `tests/integration/<feature>-<scenario>.integration.test.ts`. Mock Prisma via `vi.mock("@/lib/prisma")`. |
| Commits | Indonesian conventional: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:` |
| Branches | `feat/<short>`, `fix/<short>`, `chore/<short>` |
| API shape | Never break public response shape without migration path |
| Actor identity | Never accept authorId/studentId/teacherId/userId from request body. Derive from actor. |
| Multi-tenant | Never bypass `requireSchoolContext`. Every Prisma query scoped by schoolId. |
| Comments | Default to none. Only when WHY is non-obvious. |
| New deps | Discuss before adding. UI lib alternatives forbidden. |

---

## 9. Critical Files to Reuse

### Auth and Session

- `lib/server-auth.ts` — createSession, verifySession, cookie helpers
- `lib/api.ts` — requireAuth, requireRole, requireSchoolContext, parseJsonBody, jsonOk, jsonError
- `lib/authz.ts` — RBAC + ownership helpers
- `lib/auth-credential.ts` — credential helpers
- `lib/password.ts` — hash/verify
- `lib/password-reset.ts` — reset token lifecycle
- `lib/default-password.ts` — default password generator
- `lib/parent-invite-code.ts` — invite code hash + verify

### Validation

- `lib/schemas.ts` — single Zod schemas file

### Database

- `lib/prisma.ts` — singleton Prisma client
- `lib/database-url.ts` — multi-mode resolver

### Domain Helpers

- `lib/academic-year-scope.ts` — active-year filter resolution
- `lib/attendance-session-key.ts` — unique sessionKey (anti-duplicate)
- `lib/attendance-policy.ts`, `lib/attendance-seeding-policy.ts` — attendance rules
- `lib/assignment-policy.ts` — grading + late submission policy
- `lib/school-code.ts` — school code generator

### File Upload

- `lib/upload-intent.ts` — upload initiation + token
- `lib/upload-scan.ts` — scan orchestration (provider deferred)
- `lib/object-storage.ts` — storage URL builder

### Communication

- `lib/notification-service.ts` — in-app notification creation
- `lib/resend.ts` — email delivery

### Config

- `lib/constants.ts` — roles, days, statuses, categories, event types
- `lib/app-mode.ts` — APP_MODE detection
- `lib/error-monitoring.ts` — error severity classification

### Frontend Infrastructure

- `hooks/useRoleContext.tsx` — role context provider
- `hooks/use-toast.ts` — toast hook
- `hooks/use-mobile.tsx` — breakpoint hook
- `components/layout/DashboardLayout.tsx` — main shell
- `components/ui/*` — vendored shadcn components (never replace)
- `lib/api-client.ts` — fetch wrapper with auto-parse

### Handlers (`lib/handlers/`)

Extend these, don't bypass:
- `auth.ts`, `users.ts`, `students.ts`, `teachers.ts`, `parents.ts`
- `classes.ts`, `subjects.ts`, `majors.ts`, `academic-years.ts`
- `schedules.ts`, `schedule-templates.ts`
- `attendance.ts`, `teacher-attendance.ts`
- `assignments.ts`, `submissions.ts`, `grades.ts`
- `questions.ts`, `question-packages.ts`
- `materials.ts`, `uploads.ts`
- `forum.ts`, `notes.ts`, `calendar.ts`
- `notifications.ts`, `settings.ts`, `analytics.ts`

---

## 10. Operational Playbooks

Detailed procedures in `docs/archive/`:

- [DB Backup & Restore](archive/OPS_DB_BACKUP_RESTORE_SOP.md)
- [Academic Year Rollover](archive/OPS_ACADEMIC_YEAR_ROLLOVER_SOP.md)
- [File Malware Incident](archive/OPS_FILE_MALWARE_INCIDENT_SOP.md)
- [Fallback Playbook](archive/OPS_FALLBACK_PLAYBOOK.md)
- [Upload Pipeline Design](archive/UPLOAD_PIPELINE_DESIGN.md)
- [Attendance Event Policy](archive/ATTENDANCE_EVENT_POLICY.md)

---

## 11. Known Technical Debt

- Upload scanner provider integration not complete (ClamAV/Cloudmersive deferred)
- In-memory rate limiting only; needs Upstash for SaaS distributed enforcement
- No structured logging (pino planned Phase 4)
- No background job queue (pg-boss planned Phase 4)
- Zero React Testing Library coverage on UI components
- Some TypeScript strict-mode type errors remain in repo (non-blocking)
- `middleware.ts` convention deprecated in Next 16; proxy migration tracked

---

## 12. Verification Procedures

After any significant change:

1. `npm run lint` — clean
2. `npm run test` — all green
3. `npm run build` — clean production build
4. `npm run test:release-authz-integrity` — authz gate
5. `npm run dev` → login as each role → exercise dashboard happy paths
6. Cross-check API routes exist: `git ls-files 'app/api/**/route.ts'`
7. Cross-check models: grep `prisma/schema.prisma` for referenced models
