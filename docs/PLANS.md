# PLANS.md — Schoolio (Sekolah Pintar) Single Source of Truth

> Dokumen ini adalah **roadmap kanonis** untuk seluruh proyek. Semua AI agent maupun kontributor manusia harus mulai dari sini. Detail historis ada di `docs/archive/`.

---

## Section 0 — Header

|              |                                                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Project      | Schoolio / Sekolah Pintar                                                                                               |
| Repo         | `C:\Projects\schoolio-sekolah-pintar`                                                                                   |
| Type         | Web app (Next.js App Router), multi-tenant School management                                                            |
| Status       | Active development — core school operations shipped; current focus is production hardening, dashboard polish, dan rollout readiness |
| Last updated | 2026-04-25                                                                                                              |
| Maintainer   | rayhanyovi                                                                                                              |
| Audience     | AI coding agents + maintainers                                                                                          |

**TL;DR.** Indonesian-first multi-tenant school management web app untuk sekolah. Next.js 16 App Router + Prisma + PostgreSQL. Self-host dan SaaS (Supabase) keduanya didukung. **44 model**, **86 API route**, **19 dashboard page**, role-based UI untuk `ADMIN` / `TEACHER` / `STUDENT` / `PARENT`. Foundation sudah lengkap — fokus berikutnya: production hardening, dedicated Exam module, Library, Transcripts, Certificates, e-Rapor export, dan i18n framework.

---

## Section 1 — Quick Start for AI Agents

Sebelum mulai task apa pun, baca file-file ini dulu (urutan):

1. **`llms.txt`** — fast AI handoff; ringkasan aturan dan link ke dokumen kanonis.
2. **`docs/PLANS.md`** — roadmap kanonis, arsitektur, backlog, open decisions.
3. **`docs/build_logs.md`** — histori kerja AI; baca sebelum lanjut dan append setelah task selesai.
4. **`prisma/schema.prisma`** — domain model & enum (sumber kebenaran data).
5. **`lib/api.ts`** — `requireAuth`, `requireRole`, `requireSchoolContext`, `parseJsonBody`, `jsonOk`, `jsonError`.
6. **`lib/authz.ts`** — RBAC + ownership helpers.
7. **`lib/schemas.ts`** — semua Zod schema (jangan inline; tambah di sini).
8. **`middleware.ts`** — auth gating, onboarding gating, must-change-password gating, CSRF enforcement, correlation-id.
9. Untuk fitur tertentu: `app/api/<feature>/route.ts` + `lib/handlers/<feature>.ts` + `components/pages/<Feature>.tsx`.

**Commands:**

```bash
npm run dev                       # next dev
npm run build                     # next build
npm run lint                      # eslint
npm run test                      # vitest run
npm run test:watch                # vitest watch
npm run prisma:migrate            # prisma migrate dev
npm run prisma:studio             # GUI inspect DB
npm run academic-year:rollover    # tsx scripts/academic-year-rollover.ts
```

**Konvensi mutlak:**

- Zod schema **selalu** di `lib/schemas.ts` (export by name).
- Business logic di `lib/handlers/<feature>.ts` — route handler hanya orkestrasi.
- Response: `jsonOk(data)` / `jsonError(code, message, status)`.
- Auth: `actor = await requireAuth(req)` di awal **setiap** protected route.
- **Jangan pernah** terima `authorId / studentId / teacherId / userId` dari request body — derive dari `actor`.
- **Jangan pernah** bypass `requireSchoolContext(actor)` — semua query Prisma scoped by `schoolId`.
- Setelah setiap task yang diimplementasikan AI, append ringkasan singkat ke `docs/build_logs.md`.
- Indonesian conventional commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`.

---

## Section 2 — Tech Stack (Canonical Versions)

| Kategori          | Library                                     | Versi                           | Catatan                               |
| ----------------- | ------------------------------------------- | ------------------------------- | ------------------------------------- |
| Framework         | Next.js                                     | 16.1.1                          | App Router, server components default |
| UI runtime        | React + ReactDOM                            | 19.2.3                          | React 19 hooks                        |
| Bahasa            | TypeScript                                  | ^5                              | strict mode                           |
| ORM               | Prisma                                      | ^5.17                           | client + CLI                          |
| DB                | PostgreSQL                                  | 16 (alpine via docker-compose)  | dual-mode resolver                    |
| Styling           | Tailwind CSS                                | 3.4.17                          | HSL CSS variables                     |
| Animasi tailwind  | tailwindcss-animate                         | ^1.0.7                          |                                       |
| Component lib     | Radix UI primitives                         | ^1.x                            | 28 primitives                         |
| Component wrapper | shadcn/ui                                   | vendored under `components/ui/` | jangan ganti library                  |
| Class merging     | clsx + tailwind-merge + CVA                 | latest                          | `lib/utils.ts cn()`                   |
| Form              | react-hook-form + @hookform/resolvers + Zod | 7.61 / 3.10 / 3.25              |                                       |
| Server state      | @tanstack/react-query                       | 5.83                            |                                       |
| Date              | date-fns                                    | 3.6                             | locale `id` wajib                     |
| Charts            | Recharts                                    | 2.15                            | wrapper di `components/ui/chart.tsx`  |
| Icons             | lucide-react                                | 0.462                           |                                       |
| Toast             | Sonner                                      | 1.7                             |                                       |
| Drawer            | vaul                                        | 1.1                             | mobile only                           |
| Theme             | next-themes                                 | 0.4                             | class strategy                        |
| OTP input         | input-otp                                   | 1.4                             |                                       |
| Calendar pick     | react-day-picker                            | 9.13                            |                                       |
| Carousel          | embla-carousel-react                        | 8.6                             |                                       |
| Resizable         | react-resizable-panels                      | 2.1                             |                                       |
| YAML              | yaml                                        | 2.8                             | governance docs                       |
| Tests             | Vitest                                      | 4.0                             | Node env                              |
| Lint              | ESLint + eslint-config-next                 | 9 / 16.1.1                      | **tidak pakai Prettier**              |
| Email             | Resend (`lib/resend.ts`)                    | password reset + notification delivery | requires `RESEND_API_KEY` + `RESEND_FROM_EMAIL` |
| i18n (planned)    | next-intl                                   | NOT YET INSTALLED               | tambah di Phase 2                     |

> NOTE: Jangan tambahkan library UI alternatif (MUI, Chakra, Mantine, Ant). Ekosistem sudah dipilih dan konsisten.

---

## Section 3 — Architecture & Layering

```
User ──▶ middleware.ts (auth + onboarding + mustChangePassword gating + CSRF + correlation-id)
         ├─▶ /app/dashboard/*       (server components → components/pages/<Feature>.tsx)
         └─▶ /app/api/*/route.ts    (parseJsonBody+Zod → lib/handlers/* → Prisma → jsonOk/jsonError)

Helpers (lib/):
  server-auth.ts        HMAC-SHA256 session token (Web Crypto), cookie schoolio_session, 8h TTL
  api.ts                requireAuth / requireRole / requireSchoolContext / parseJsonBody / jsonOk / jsonError
  authz.ts              RBAC + ownership helpers (canViewStudent, listLinkedStudentIds, etc.)
  schemas.ts            Zod schemas (request bodies + response shapes)
  prisma.ts             Prisma client singleton
  database-url.ts       Multi-mode resolver (self_host vs saas via APP_MODE)
  notification-service  In-app notification creation
  upload-intent / upload-scan / object-storage   File upload pipeline
  audit (planned)       Audit log writer
  csrf.ts              Double-submit CSRF cookie/header helpers
  rate-limit.ts        Token bucket rate limiter
```

**Request lifecycle (mandatory order in every protected route):**

1. `middleware.ts` validates session → injects `x-correlation-id`.
2. `route.ts` → `const actor = await requireAuth(req)` (returns `ActorContext` or `NextResponse` 401).
3. `requireRole(actor, [ROLES.X])` if endpoint role-gated.
4. `requireSchoolContext(actor)` for any tenant-scoped data.
5. Ownership check via `lib/authz.ts` helper (e.g., `canViewStudent(actor, studentId)`).
6. `const body = await parseJsonBody(req, ZodSchemaName)` (throws `VALIDATION_FAILED`).
7. Delegate to `lib/handlers/<feature>.ts` named function.
8. Handler runs Prisma query **scoped by `schoolId`**.
9. Return `jsonOk(data)` or `jsonError(code, message, status)`.

> NOTE: Jika rute melakukan write yang sensitif (grade, attendance override, role/profile change, password reset), **wajib panggil** `recordAudit(actor, action, before, after, metadata)` dari `lib/audit.ts` (Phase 1).

---

## Section 4 — Multi-Tenancy & Deployment Modes

|                       | Self-host                                     | SaaS                                              |
| --------------------- | --------------------------------------------- | ------------------------------------------------- |
| `APP_MODE`            | `self_host`                                   | `saas`                                            |
| DB URL                | `DATABASE_URL` (local PG)                     | `SUPABASE_DATABASE_URL` (fallback `DATABASE_URL`) |
| Resolver              | `lib/database-url.ts`                         | `lib/database-url.ts`                             |
| Rate limiter          | in-memory                                     | Upstash (deferred hardening)                      |
| Default password flow | aktif (admin set default → user wajib change) | nonaktif default                                  |
| File scanner          | ClamAV (deferred hardening)                   | hosted scanner (deferred hardening)               |
| Auth provider         | internal credential                           | internal credential (+ optional SSO Phase 4)      |
| Background jobs       | pg-boss (Phase 4)                             | pg-boss (Phase 4)                                 |

**Tenancy invariant:** boundary adalah `SchoolProfile.id`. Setiap domain table memiliki `schoolId` (langsung atau via parent). **Setiap** API route MUST:

- panggil `requireSchoolContext(actor)`,
- include `where: { schoolId: actor.schoolId }` (atau equivalent via parent relation).

**Self-host specifics:**

- Default password + must-change-password (sudah shipped — lihat commits `4cb6fa1`, `38743f3`, `377673b`).
- Admin reset via `POST /api/users/[id]/reset-password`.
- User reset via token `POST /api/auth/reset-password`.
- Forced change gate via middleware → redirect ke `/change-password`.

**SaaS specifics:**

- Sesi tetap pakai HMAC cookie (bukan Supabase Auth) — Supabase hanya storage layer.
- SSO (Google/Microsoft OIDC) optional di Phase 4.

---

## Section 5 — Domain Model Reference

**44 model** total. Detail lengkap di `prisma/schema.prisma` (~928 baris). Ringkasan grouped by domain:

### 5.1 Identity

| Model                | Key fields                                                                                | Uniqueness                      | Catatan                          |
| -------------------- | ----------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------- |
| `User`               | id, authUserId, email, schoolId, name, role, onboardingCompletedAt, roleSelectedAt        | email unique, authUserId unique | Central user; semua role di sini |
| `AuthCredential`     | id, userId, identifier, passwordHash, passwordSalt, mustChangePassword, isDefaultPassword | userId/identifier unique        | Cascade delete on User           |
| `PasswordResetToken` | id, credentialId, tokenHash, expiresAt, usedAt                                            | tokenHash unique                | Cascade on credential            |
| `StudentProfile`     | userId, classId, gender, status (ACTIVE/INACTIVE/GRADUATED/TRANSFERRED_OUT)               | userId unique                   |                                  |
| `TeacherProfile`     | userId, title                                                                             | userId unique                   |                                  |
| `ParentProfile`      | userId                                                                                    | userId unique                   | Marker only                      |
| `ParentStudent`      | parentId, studentId                                                                       | composite PK                    | Many-to-many                     |
| `ParentInvite`       | schoolId, studentId, createdByUserId, codeHash, expiresAt, redeemedAt, redeemedByUserId   | codeHash unique                 | TTL 7 hari                       |

### 5.2 Tenancy

| Model           | Key fields                                                                   | Uniqueness          |
| --------------- | ---------------------------------------------------------------------------- | ------------------- |
| `SchoolProfile` | id, schoolCode, name, address, phone, email, website, principalName, logoUrl | schoolCode unique   |
| `AcademicYear`  | id, schoolId, year, semester (ODD/EVEN), startDate, endDate, isActive        | indexed on schoolId |

### 5.3 Academic Structure

| Model                    | Key fields                                                                                                         | Uniqueness                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `Class`                  | id, schoolId, name, grade, major, section, academicYearId, homeroomTeacherId, studentCount, maleCount, femaleCount | indexed schoolId                                |
| `StudentClassEnrollment` | studentId, classId, academicYearId, startedAt, endedAt                                                             | indexed studentId/startedAt + studentId/endedAt |
| `Subject`                | id, schoolId, name, code, category, description, color, hoursPerWeek, appliesToAllMajors                           | unique (schoolId, code)                         |
| `Major`                  | id, schoolId, code, name, description                                                                              | unique (schoolId, code)                         |
| `SubjectTeacher`         | subjectId, teacherId                                                                                               | composite PK                                    |
| `SubjectClass`           | subjectId, classId                                                                                                 | composite PK                                    |
| `SubjectMajor`           | subjectId, majorId                                                                                                 | composite PK; **cascade delete both sides**     |
| `MajorTeacher`           | majorId, teacherId                                                                                                 | composite PK; index teacherId                   |

### 5.4 Schedule

| Model              | Key fields                                                                              |
| ------------------ | --------------------------------------------------------------------------------------- |
| `ClassSchedule`    | id, classId, subjectId, teacherId, dayOfWeek (MON…SAT), startTime, endTime, room, color |
| `ScheduleTemplate` | id, schoolId, name, startTime, endTime, duration, isBreak, position                     |

### 5.5 Attendance

| Model               | Key fields                                                                                                                                                                                                              | Uniqueness                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `AttendanceSession` | id, **sessionKey** (unique), classId, subjectId, status (OPEN/LOCKED/FINALIZED), teacherId, takenByTeacherId, overriddenById, overrideReason, overriddenAt, lockedAt, finalizedAt, scheduleId, date, startTime, endTime | sessionKey unique             |
| `AttendanceRecord`  | id, sessionId, studentId, status (PRESENT/ABSENT/SICK/PERMIT), note, recordedAt                                                                                                                                         | unique (sessionId, studentId) |
| `TeacherAttendance` | id, teacherId, sessionId, date, status, note, isAllDay                                                                                                                                                                  |                               |

> NOTE: **Selalu** generate `sessionKey` via `lib/attendance-session-key.ts` sebelum insert `AttendanceSession`. Itulah penjaga deduplikasi (class+subject+date+slot).

### 5.6 Assignments & Grading

| Model                  | Key fields                                                                                                                                                                                                                                                                               | Uniqueness                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `Assignment`           | id, title, subjectId, teacherId, dueDate, allowLateSubmission, lateUntil, maxAttempts, gradingPolicy (LATEST/HIGHEST/MANUAL), gradeComponent (HOMEWORK/QUIZ/EXAM/PRACTICAL), kind (HOMEWORK/PROJECT/QUIZ/EXAM), deliveryType (MCQ/FILE/ESSAY), status (ACTIVE/CLOSED), questionPackageId |                                       |
| `AssignmentClass`      | assignmentId, classId                                                                                                                                                                                                                                                                    | composite PK                          |
| `AssignmentQuestion`   | assignmentId, questionId, position                                                                                                                                                                                                                                                       | composite PK                          |
| `AssignmentSubmission` | id, assignmentId, studentId, status (PENDING/SUBMITTED/GRADED), attemptCount, submittedAt, grade, feedback, response (JSON)                                                                                                                                                              | unique (assignmentId, studentId)      |
| `GradeWeight`          | id, subjectId, classId, semester, homeworkWeight, quizWeight, examWeight, practicalWeight (default 25 each)                                                                                                                                                                              | unique (subjectId, classId, semester) |

### 5.7 Question Bank

| Model                 | Key fields                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Question`            | id, type (MCQ/FILE/ESSAY), subjectId, subjectText, topic, difficulty (EASY/MEDIUM/HARD), text, options[], correctAnswers (Int[]), rubric, allowedFormats[], points, usageCount |
| `QuestionPackage`     | id, name, description, subjectId, subjectText, lastUsedAt, usageCount                                                                                                          |
| `QuestionPackageItem` | packageId, questionId, position (composite PK)                                                                                                                                 |

### 5.8 Materials & Uploads

| Model                | Key fields                                                                                                                                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Material`           | id, title, description, subjectId, classId, teacherId                                                                                                                                                                                                                  |
| `MaterialAttachment` | id, materialId, fileName, fileType, sizeLabel, url, storageKey, checksumSha256, etag, scanStatus, uploadIntentId (unique)                                                                                                                                              |
| `UploadIntent`       | id, materialId, uploadedById, confirmedById, fileName, fileType, sizeBytes, checksumSha256, storageKey, uploadTokenHash, uploadedSizeBytes, uploadedChecksumSha256, status (PENDING/UPLOADED/CONFIRMED/EXPIRED), scanStatus (PENDING/CLEAN/INFECTED/FAILED), expiresAt |
| `UploadScanJob`      | id, intentId (unique), status, provider, result, queuedAt, completedAt                                                                                                                                                                                                 |

### 5.9 Communication

| Model                | Key fields                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `ForumThread`        | id, title, content, subjectId, classId, authorId, authorRole, status (OPEN/RESOLVED/LOCKED), isPinned, replyCount, upvotes |
| `ForumReply`         | id, threadId, content, authorId, authorRole, isAcceptedAnswer, upvotes                                                     |
| `Note`               | id, title, content, subjectId, classId, authorId, visibility (PRIVATE/CLASS), isPinned, color, tags[]                      |
| `CalendarEvent`      | id, title, description, date, endDate, type (ACADEMIC/HOLIDAY/ACTIVITY/DEADLINE), isRecurring, createdById                 |
| `CalendarEventClass` | eventId, classId (composite PK)                                                                                            |

### 5.10 Notifications

| Model                    | Key fields                                                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Notification`           | id, recipientId, type (ASSIGNMENT_NEW/ASSIGNMENT_DEADLINE/GRADE_PUBLISHED/ATTENDANCE_ALERT/SYSTEM), title, message, data (JSON), isRead, readAt, triggeredById |
| `NotificationPreference` | userId (unique), emailNotifications, assignmentReminders, attendanceAlerts, gradePublished                                                                     |

### 5.11 Reporting & Audit

| Model                | Key fields                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `ReportCardSnapshot` | id, classId, academicYearId, semester, publishedById, publishedAt, snapshot (JSON)                                 |
| `AuditLog`           | id, actorId, actorRole, action, entityType, entityId, beforeData (JSON), afterData (JSON), metadata (JSON), reason |

### 5.12 Enums (exact values)

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

> Cross-reference `prisma/schema.prisma` untuk truth field-by-field. PLANS.md hanya peta high-signal.

---

## Section 6 — API Surface (Canonical Index)

**Conventions block (universal):**

```
Success: 200 { "data": ... }                                       via jsonOk(data)
Error:   4xx/5xx { "error": { "code": "...", "message": "..." } }  via jsonError(code, msg, status)
Headers: x-correlation-id propagated end-to-end (set in middleware.ts)
Auth:    cookie schoolio_session (HMAC-SHA256, 8h TTL)
Validation: parseJsonBody(req, ZodSchema) — never trust raw input
Pagination: cursor-based — ?limit=&cursor= where applicable
Error codes: AUTH_REQUIRED | FORBIDDEN | NOT_FOUND | VALIDATION_FAILED | CONFLICT | RATE_LIMITED | INTERNAL
```

### 6.1 Auth (Public + Authenticated)

| Method   | Path                               | Purpose                                | Roles                                | Status |
| -------- | ---------------------------------- | -------------------------------------- | ------------------------------------ | ------ |
| POST     | `/api/auth/login`                  | Credential login → session cookie      | Public                               | BUILT  |
| POST     | `/api/auth/register`               | New user registration                  | Public                               | BUILT  |
| POST     | `/api/auth/forgot-password`        | Initiate password reset (email token)  | Public                               | BUILT  |
| POST     | `/api/auth/reset-password`         | Complete reset via token               | Public                               | BUILT  |
| POST     | `/api/auth/change-password`        | Authenticated user change own password | Authenticated                        | BUILT  |
| GET      | `/api/auth/session`                | Verify and fetch current session       | Authenticated                        | BUILT  |
| POST     | `/api/auth/logout`                 | Clear session                          | Authenticated                        | BUILT  |
| GET/POST | `/api/auth/onboarding`             | Onboarding state                       | Authenticated                        | BUILT  |
| POST     | `/api/auth/onboarding/select-role` | Select initial role                    | Authenticated, incomplete onboarding | BUILT  |
| POST     | `/api/auth/onboarding/complete`    | Mark onboarding complete               | Authenticated                        | BUILT  |
| POST     | `/api/auth/onboarding/link-child`  | Parent link child via invite code      | Authenticated PARENT                 | BUILT  |

### 6.2 Users / Students / Teachers / Parents

| Method             | Path                             | Purpose                               | Roles & Ownership                           | Status |
| ------------------ | -------------------------------- | ------------------------------------- | ------------------------------------------- | ------ |
| GET, POST          | `/api/users`                     | List/create users                     | ADMIN                                       | BUILT  |
| GET, PATCH, DELETE | `/api/users/[id]`                | CRUD user                             | ADMIN                                       | BUILT  |
| GET, PATCH         | `/api/users/[id]/profile`        | Profile (actor-scoped)                | ADMIN, self                                 | BUILT  |
| POST               | `/api/users/[id]/reset-password` | Admin-initiated password reset        | ADMIN                                       | BUILT  |
| GET                | `/api/students`                  | List students                         | ADMIN, TEACHER                              | BUILT  |
| GET                | `/api/students/[id]/enrollments` | Student class history                 | ADMIN, TEACHER, self STUDENT, linked PARENT | BUILT  |
| GET                | `/api/teachers`                  | List teachers                         | ADMIN, TEACHER                              | BUILT  |
| GET                | `/api/parents`                   | List parents                          | ADMIN, TEACHER, self PARENT                 | BUILT  |
| GET                | `/api/parents/me/children`       | Linked children                       | PARENT (self only)                          | BUILT  |
| GET, POST, DELETE  | `/api/parent-links`              | Parent ↔ student link                 | ADMIN                                       | BUILT  |
| GET, POST          | `/api/parent-invites`            | Generate parent invite codes (TTL 7d) | ADMIN                                       | BUILT  |

### 6.3 Academic Structure

| Method             | Path                                | Purpose             | Roles                             | Status |
| ------------------ | ----------------------------------- | ------------------- | --------------------------------- | ------ |
| GET, POST          | `/api/academic-years`               | List/create         | ADMIN (write), all (read)         | BUILT  |
| GET, PATCH, DELETE | `/api/academic-years/[id]`          | CRUD                | ADMIN                             | BUILT  |
| POST               | `/api/academic-years/[id]/activate` | Mark active         | ADMIN                             | BUILT  |
| GET, POST          | `/api/classes`                      | List/create         | ADMIN                             | BUILT  |
| GET, PATCH, DELETE | `/api/classes/[id]`                 | CRUD                | ADMIN                             | BUILT  |
| GET, POST, DELETE  | `/api/classes/[id]/students`        | Roster mgmt         | ADMIN, TEACHER (read)             | BUILT  |
| GET, POST, DELETE  | `/api/classes/[id]/subjects`        | Class-subject map   | ADMIN                             | BUILT  |
| GET, POST          | `/api/subjects`                     | List/create         | ADMIN (write); read all           | BUILT  |
| GET, PATCH, DELETE | `/api/subjects/[id]`                | CRUD                | ADMIN                             | BUILT  |
| GET, POST, DELETE  | `/api/subjects/[id]/teachers`       | Subject-teacher map | ADMIN                             | BUILT  |
| GET, POST, DELETE  | `/api/subjects/[id]/classes`        | Subject-class map   | ADMIN                             | BUILT  |
| GET, POST          | `/api/majors`                       | List/create         | ADMIN (write); ADMIN+TEACHER read | BUILT  |
| GET, PATCH, DELETE | `/api/majors/[id]`                  | CRUD                | ADMIN                             | BUILT  |
| GET, POST, DELETE  | `/api/majors/[id]/teachers`         | Major-teacher map   | ADMIN                             | BUILT  |

### 6.4 Schedule

| Method             | Path                      | Purpose                | Roles                                   | Status |
| ------------------ | ------------------------- | ---------------------- | --------------------------------------- | ------ |
| GET, POST          | `/api/schedules`          | List/create            | ADMIN, TEACHER (only own subject-class) | BUILT  |
| GET, PATCH, DELETE | `/api/schedules/[id]`     | CRUD                   | same                                    | BUILT  |
| GET, POST, PATCH   | `/api/schedule-templates` | School period template | ADMIN                                   | BUILT  |

### 6.5 Attendance

| Method             | Path                                    | Purpose                     | Roles & Ownership              | Status |
| ------------------ | --------------------------------------- | --------------------------- | ------------------------------ | ------ |
| GET, POST          | `/api/attendance/sessions`              | List/create sessions        | ADMIN, TEACHER (own scope)     | BUILT  |
| GET, PATCH, DELETE | `/api/attendance/sessions/[id]`         | CRUD session                | same                           | BUILT  |
| POST               | `/api/attendance/sessions/seed`         | Seed sessions from schedule | ADMIN, TEACHER                 | BUILT  |
| GET, POST          | `/api/attendance/sessions/[id]/records` | Bulk upsert per session     | ADMIN, TEACHER (session scope) | BUILT  |
| GET                | `/api/attendance/records`               | List records (filtered)     | role-scoped                    | BUILT  |
| PATCH, DELETE      | `/api/attendance/records/[id]`          | Modify single               | ADMIN, TEACHER                 | BUILT  |
| GET, POST          | `/api/teacher-attendance`               | Teacher own attendance      | ADMIN, self TEACHER            | BUILT  |

### 6.6 Assignments

| Method             | Path                                | Purpose                | Roles & Ownership                  | Status |
| ------------------ | ----------------------------------- | ---------------------- | ---------------------------------- | ------ |
| GET, POST          | `/api/assignments`                  | List/create            | ADMIN, TEACHER (own subject-class) | BUILT  |
| GET, PATCH, DELETE | `/api/assignments/[id]`             | CRUD                   | ADMIN, TEACHER (owner)             | BUILT  |
| GET, POST, DELETE  | `/api/assignments/[id]/classes`     | Class linkage          | ADMIN, TEACHER owner               | BUILT  |
| GET, POST, DELETE  | `/api/assignments/[id]/questions`   | Question linkage       | ADMIN, TEACHER owner               | BUILT  |
| GET                | `/api/assignments/[id]/submissions` | List submissions       | ADMIN, TEACHER owner               | BUILT  |
| GET, PATCH         | `/api/submissions/[id]`             | Get / grade submission | TEACHER owner / self STUDENT       | BUILT  |

### 6.7 Grades

| Method           | Path                       | Purpose              | Roles                                | Status |
| ---------------- | -------------------------- | -------------------- | ------------------------------------ | ------ |
| GET              | `/api/grades`              | Filter grades        | role-scoped                          | BUILT  |
| GET              | `/api/grades/summary`      | Summaries            | ADMIN, TEACHER (owner scope)         | BUILT  |
| GET, POST, PATCH | `/api/grades/weights`      | Grade weights        | ADMIN, TEACHER (owner subject-class) | BUILT  |
| GET, POST        | `/api/grades/report-cards` | Report card snapshot | ADMIN                                | BUILT  |

### 6.8 Question Bank

| Method             | Path                                    | Roles          | Status |
| ------------------ | --------------------------------------- | -------------- | ------ |
| GET, POST          | `/api/questions`                        | ADMIN, TEACHER | BUILT  |
| GET, PATCH, DELETE | `/api/questions/[id]`                   | ADMIN, TEACHER | BUILT  |
| GET, POST          | `/api/question-packages`                | ADMIN, TEACHER | BUILT  |
| GET, PATCH, DELETE | `/api/question-packages/[id]`           | ADMIN, TEACHER | BUILT  |
| GET, POST, DELETE  | `/api/question-packages/[id]/questions` | ADMIN, TEACHER | BUILT  |

### 6.9 Materials & Uploads

| Method             | Path                                             | Roles                    | Status                 |
| ------------------ | ------------------------------------------------ | ------------------------ | ---------------------- | ----- |
| GET, POST          | `/api/materials`                                 | ADMIN, TEACHER           | BUILT                  |
| GET, PATCH, DELETE | `/api/materials/[id]`                            | ADMIN, TEACHER (owner)   | BUILT                  |
| GET, POST          | `/api/materials/[id]/attachments`                | ADMIN, TEACHER (owner)   | BUILT                  |
| DELETE             | `/api/materials/[id]/attachments/[attachmentId]` | ADMIN, TEACHER (owner)   | BUILT                  |
| POST               | `/api/uploads/intents`                           | initiate upload          | ADMIN, TEACHER         | BUILT |
| GET                | `/api/uploads/intents/[id]`                      | poll status              | ADMIN, TEACHER (owner) | BUILT |
| PUT                | `/api/uploads/intents/[id]/content`              | resumable content upload | ADMIN, TEACHER (owner) | BUILT |
| POST               | `/api/uploads/intents/[id]/confirm`              | confirm complete         | ADMIN, TEACHER (owner) | BUILT |

> NOTE: scanner provider integration belum lengkap dan sengaja ditunda sampai setelah rilis school-usability.

### 6.10 Forum

| Method             | Path                              | Roles                                     | Status |
| ------------------ | --------------------------------- | ----------------------------------------- | ------ |
| GET, POST          | `/api/forum/threads`              | ADMIN, TEACHER, STUDENT (PARENT diblokir) | BUILT  |
| GET, PATCH, DELETE | `/api/forum/threads/[id]`         | author/admin/teacher                      | BUILT  |
| GET, POST          | `/api/forum/threads/[id]/replies` | sama (lock-thread enforced)               | BUILT  |
| POST               | `/api/forum/threads/[id]/pin`     | ADMIN, TEACHER                            | BUILT  |
| POST               | `/api/forum/threads/[id]/lock`    | ADMIN, TEACHER                            | BUILT  |
| POST               | `/api/forum/threads/[id]/upvote`  | authenticated non-PARENT                  | BUILT  |
| GET, PATCH, DELETE | `/api/forum/replies/[id]`         | author/admin/teacher                      | BUILT  |
| POST               | `/api/forum/replies/[id]/upvote`  | non-PARENT                                | BUILT  |

### 6.11 Notes

| Method             | Path                  | Roles                           | Status |
| ------------------ | --------------------- | ------------------------------- | ------ |
| GET, POST          | `/api/notes`          | all roles (author from session) | BUILT  |
| GET, PATCH, DELETE | `/api/notes/[id]`     | author or ADMIN                 | BUILT  |
| POST               | `/api/notes/[id]/pin` | author or ADMIN                 | BUILT  |

### 6.12 Calendar

| Method             | Path                                | Roles                               | Status |
| ------------------ | ----------------------------------- | ----------------------------------- | ------ |
| GET, POST          | `/api/calendar/events`              | read all; write ADMIN+TEACHER (own) | BUILT  |
| GET, PATCH, DELETE | `/api/calendar/events/[id]`         | same                                | BUILT  |
| GET, POST, DELETE  | `/api/calendar/events/[id]/classes` | ADMIN, TEACHER owner                | BUILT  |

### 6.13 Notifications & Settings

| Method     | Path                           | Roles                 | Status |
| ---------- | ------------------------------ | --------------------- | ------ |
| GET        | `/api/notifications`           | self                  | BUILT  |
| PATCH      | `/api/notifications/[id]/read` | self                  | BUILT  |
| PATCH      | `/api/notifications/read-all`  | self                  | BUILT  |
| GET, PATCH | `/api/settings/notifications`  | self                  | BUILT  |
| GET, PATCH | `/api/settings/school-profile` | read all; write ADMIN | BUILT  |

### 6.14 Analytics

| Method | Path                          | Roles                   | Status |
| ------ | ----------------------------- | ----------------------- | ------ |
| GET    | `/api/analytics/overview`     | all (auth)              | BUILT  |
| GET    | `/api/analytics/attendance`   | ADMIN, TEACHER (scoped) | BUILT  |
| GET    | `/api/analytics/grades`       | ADMIN, TEACHER (scoped) | BUILT  |
| GET    | `/api/analytics/demographics` | ADMIN                   | BUILT  |
| GET    | `/api/metrics`                | ADMIN                   | BUILT  |

### 6.15 Governance (admin-only)

| Method    | Path                        | Status |
| --------- | --------------------------- | ------ |
| GET       | `/api/governance/readiness` | BUILT  |
| GET, POST | `/api/governance/approvals` | BUILT  |
| GET       | `/api/governance/tracker`   | BUILT  |

### 6.16 PLANNED (not yet built)

| Path                                       | Module         | Roadmap |
| ------------------------------------------ | -------------- | ------- |
| `/api/exams/*`                             | Dedicated Exam | Phase 3 |
| `/api/library/books`, `/api/library/loans` | Library        | Phase 3 |
| `/api/students/[id]/transcript`            | Transcripts    | Phase 3 |
| `/api/certificates/*`                      | Certificates   | Phase 3 |
| `/api/grades/erapor/export`                | e-Rapor        | Phase 3 |
| `/api/v1/*`                                | API versioning | Phase 4 |

---

## Section 7 — RBAC & Authorization Matrix

**Roles:** `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`.

**Helpers in `lib/authz.ts`:**

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

**Mandatory checklist for every new endpoint:**

1. `requireAuth(req)` → actor.
2. `requireRole(actor, [...allowedRoles])` if applicable.
3. `requireSchoolContext(actor)`.
4. Ownership check via authz helper.
5. `parseJsonBody(req, schema)` for write methods.
6. Prisma queries scoped by `schoolId` (and additional ownership filters).
7. `recordAudit(...)` for sensitive writes (Phase 1).

### 7.1 Resource × Action Matrix (Canonical)

| Resource                            | Action              | Allowed Roles                          | Ownership / Constraint                                   |
| ----------------------------------- | ------------------- | -------------------------------------- | -------------------------------------------------------- |
| Users                               | List/create/CRUD    | ADMIN                                  | Full school scope                                        |
| User Profile                        | Read/update         | ADMIN, self                            | Non-admin only self                                      |
| Students                            | Read                | ADMIN, TEACHER, STUDENT, PARENT        | STUDENT=self; PARENT=linked child; TEACHER=school scope  |
| Parents                             | Read                | ADMIN, TEACHER, PARENT                 | PARENT=self                                              |
| Teachers                            | Read                | ADMIN, TEACHER                         | TEACHER=self for write                                   |
| Parent Links                        | Link/unlink         | ADMIN                                  | —                                                        |
| Parent Invites                      | Create/redeem       | ADMIN (create), authenticated (redeem) | TTL 7d, codeHash                                         |
| Classes                             | Read                | ADMIN, TEACHER, STUDENT, PARENT        | STUDENT=own; PARENT=linked classes                       |
| Classes                             | Write               | ADMIN                                  | —                                                        |
| Class Students                      | Read roster         | ADMIN, TEACHER                         | Full                                                     |
| Class Subjects                      | Read map            | all                                    | scoped                                                   |
| Class Subjects                      | Set map             | ADMIN                                  | —                                                        |
| Subjects                            | Read                | all                                    | —                                                        |
| Subjects                            | Write               | ADMIN                                  | —                                                        |
| Subject Teachers / Classes / Majors | Set map             | ADMIN                                  | —                                                        |
| Majors                              | Read                | ADMIN, TEACHER                         | —                                                        |
| Majors                              | Write               | ADMIN                                  | —                                                        |
| Major Teachers                      | Set map             | ADMIN                                  | —                                                        |
| Academic Years                      | Read                | all                                    | —                                                        |
| Academic Years                      | Write/activate      | ADMIN                                  | —                                                        |
| Schedules                           | Read                | all                                    | TEACHER=own/managed; STUDENT=own class; PARENT=linked    |
| Schedules                           | Write               | ADMIN, TEACHER                         | TEACHER limited to own subject-class                     |
| Schedule Templates                  | Read/write          | ADMIN                                  | —                                                        |
| Attendance Sessions                 | Read                | all                                    | TEACHER=own/taken-by/managed; STUDENT=own; PARENT=linked |
| Attendance Sessions                 | Write               | ADMIN, TEACHER                         | TEACHER limited to own subject-class                     |
| Attendance Records                  | Read                | all                                    | STUDENT=self; PARENT=linked child                        |
| Attendance Records                  | Write (single/bulk) | ADMIN, TEACHER                         | TEACHER session scope                                    |
| Teacher Attendance                  | Read/create         | ADMIN, TEACHER                         | TEACHER=self                                             |
| Materials                           | Read                | all                                    | TEACHER=own; STUDENT/PARENT class scope                  |
| Materials                           | Write               | ADMIN, TEACHER                         | TEACHER own subject-class                                |
| Material Attachments                | Add/delete          | ADMIN, TEACHER                         | TEACHER on own materials                                 |
| Assignments                         | Read                | all                                    | TEACHER=own; STUDENT/PARENT class scope                  |
| Assignments                         | Write               | ADMIN, TEACHER                         | TEACHER own subject-class                                |
| Assignment Classes/Questions        | Set                 | ADMIN, TEACHER                         | TEACHER own assignments                                  |
| Submissions                         | Read                | all                                    | STUDENT=self; PARENT=linked; TEACHER=owner assignment    |
| Submission                          | Write (submit)      | STUDENT                                | self only                                                |
| Submission                          | Grade               | ADMIN, TEACHER                         | TEACHER=owner (or delegated — TP-DEC-003 pending)        |
| Grades                              | Read                | all                                    | STUDENT=self; PARENT=linked                              |
| Grade Summary                       | Read                | ADMIN, TEACHER                         | TEACHER scoped to own assignments                        |
| Grade Weights                       | Read/write          | ADMIN, TEACHER                         | TEACHER own subject-class                                |
| Report Cards                        | Read/publish        | ADMIN                                  | —                                                        |
| Forum Threads / Replies             | Read/create/update  | ADMIN, TEACHER, STUDENT                | **PARENT diblokir**                                      |
| Forum Lock/Pin                      | Mod action          | ADMIN, TEACHER                         | Server enforces lock on reply                            |
| Notes                               | Read/create         | all                                    | author from session                                      |
| Notes                               | Update/delete/pin   | all                                    | non-admin only author                                    |
| Calendar Events                     | Read                | all                                    | STUDENT/PARENT scoped class+global                       |
| Calendar Events                     | Write               | ADMIN, TEACHER                         | TEACHER own events                                       |
| Analytics Overview                  | Read                | all                                    | auth required                                            |
| Analytics Attendance/Grades         | Read                | ADMIN, TEACHER                         | TEACHER scoped                                           |
| Analytics Demographics              | Read                | ADMIN                                  | —                                                        |
| School Profile                      | Read                | all                                    | —                                                        |
| School Profile                      | Write               | ADMIN                                  | —                                                        |
| Questions / Packages                | Read/write          | ADMIN, TEACHER                         | —                                                        |
| Notifications                       | Read/mark           | self                                   | —                                                        |
| Governance                          | Read/write          | ADMIN                                  | —                                                        |

> NOTE: Parent visibility on submission `response` (raw answers) MUST be **masked server-side** per TP-DEC-002 (approved). Parent sees status, submittedAt, grade, feedback only.

### 7.2 Privileged Sensitive Actions (require audit log — Phase 1)

- Grade write/change (`PATCH /api/submissions/[id]`)
- Attendance override (`overriddenById` set on session)
- Role/profile change (`PATCH /api/users/[id]`)
- Parent link (un)create (`POST/DELETE /api/parent-links`)
- Password reset (admin-initiated and self)
- School profile change
- Academic year activation
- Report card publish

---

## Section 8 — Auth Flow Reference

### 8.1 Login

1. `POST /api/auth/login` with `{ identifier, password }`.
2. Verify against `AuthCredential` (or demo accounts in non-production).
3. Compose payload `{ userId, name, role, canUseDebugPanel, onboardingCompleted, schoolId, mustChangePassword, iat, exp }`.
4. Sign HMAC-SHA256 with `SESSION_SECRET` (Web Crypto).
5. Set cookie `schoolio_session` (httpOnly, secure in prod, SameSite=Lax, maxAge 8h).
6. Response: `{ user, onboardingCompleted, mustChangePassword }`.

### 8.2 Register → Onboarding

1. `POST /api/auth/register` → User + AuthCredential created.
2. Redirect to `/onboarding`.
3. `POST /api/auth/onboarding/select-role` → create `StudentProfile` / `TeacherProfile` / `ParentProfile`.
4. (Parent) `POST /api/auth/onboarding/link-child` with parent invite code → resolves `ParentInvite.codeHash`, creates `ParentStudent`.
5. `POST /api/auth/onboarding/complete` → set `onboardingCompletedAt`.

### 8.3 Forgot/Reset Password

1. `POST /api/auth/forgot-password` `{ identifier }` → generate `PasswordResetToken` (random), hash + store, send token via email (`lib/resend.ts` when configured).
2. `POST /api/auth/reset-password` `{ token, newPassword }` → validate hash, expiry, `usedAt=null`. Update `passwordHash/Salt`, mark `usedAt=now`, **invalidate all other tokens for this credentialId** (Phase 1 hardening).
3. Set `mustChangePassword=false`, `isDefaultPassword=false`.

### 8.4 Must-Change-Password Gate

- Set on user creation if admin used default password.
- Middleware redirects to `/change-password` until cleared via `POST /api/auth/change-password`.

### 8.5 Demo Mode

- `admin/admin`, `teacher/teacher`, `student/student`, `parent/parent` enabled when `process.env.NODE_ENV !== 'production'`.
- Sets `canUseDebugPanel=true` → impersonation panel in `DashboardLayout`.

### 8.6 Known gaps (addressed in roadmap)

- **Rate limiting partial** on credential auth + upload endpoints via in-memory token bucket; distributed SaaS backend is deferred hardening.
- **CSRF tokens enabled** via double-submit cookie/header middleware; server-action coverage still needs review before adding server actions.
- **No MFA** → Phase 4.
- **No SSO** → Phase 4.
- **Reset-token invalidation enabled** after password change/reset; Resend email delivery is wired when configured.

---

## Section 9 — UI / Design System (Canonical)

### 9.1 Foundation (LOCKED — do not change without architectural review)

- **Component library**: shadcn/ui (vendored under `components/ui/`) + Radix primitives.
- **Tidak boleh tambah** library UI alternatif (MUI, Mantine, Chakra, Ant, NextUI, dll).
- **Styling**: Tailwind 3.4 + HSL CSS variables di `app/globals.css`. Selalu pakai Tailwind class yang merefer `var(--token)`. **Jangan hardcode hex.**
- **Font**: **Plus Jakarta Sans** (weights 400/500/600/700/800). Ada `@import` yang dikomentari di top `app/globals.css` — re-enable atau migrasi ke `next/font/google` untuk performance (planned in Phase 2).
- **Icons**: lucide-react saja.
- **Toasts**: Sonner saja.
- **Charts**: Recharts via wrapper `components/ui/chart.tsx`.
- **Dark mode**: class strategy via next-themes — setiap komponen baru WAJIB support keduanya via tokens.
- **Border radius default**: `--radius: 0.75rem` (`rounded-lg` Tailwind alias).

### 9.2 Design Tokens (exact values from `app/globals.css`)

| Token                                | Light HSL                               | Dark HSL                                | Use                        |
| ------------------------------------ | --------------------------------------- | --------------------------------------- | -------------------------- |
| `--background`                       | 210 20% 98%                             | 222 47% 6%                              | page bg                    |
| `--foreground`                       | 222 47% 11%                             | 210 40% 98%                             | base text                  |
| `--card` / `--card-foreground`       | 0 0% 100% / 222 47% 11%                 | 222 47% 8% / 210 40% 98%                | card surface               |
| `--popover` / `--popover-foreground` | 0 0% 100% / 222 47% 11%                 | 222 47% 8% / 210 40% 98%                | popovers/menus             |
| `--primary`                          | 221 83% 53%                             | 221 83% 60%                             | primary buttons, links     |
| `--primary-foreground`               | 210 40% 98%                             | 222 47% 6%                              | text on primary            |
| `--secondary`                        | 172 66% 50%                             | 172 66% 40%                             | teal accents               |
| `--accent`                           | 38 92% 50%                              | 38 92% 50%                              | highlights/warnings        |
| `--destructive`                      | 0 84% 60%                               | 0 63% 31%                               | destructive buttons/errors |
| `--success`                          | 142 76% 36%                             | (same)                                  | success states             |
| `--warning`                          | 38 92% 50%                              | (same)                                  | warnings                   |
| `--info`                             | 199 89% 48%                             | (same)                                  | info banners               |
| `--muted` / `--muted-foreground`     | 210 40% 96% / 215 16% 47%               | 217 33% 17% / 215 20% 65%               | secondary surfaces         |
| `--border` / `--input` / `--ring`    | 214 32% 91% / 214 32% 91% / 221 83% 53% | 217 33% 17% / 217 33% 17% / 221 83% 60% | borders + focus ring       |
| `--radius`                           | 0.75rem                                 | (same)                                  | rounded-lg default         |
| **Role colors**                      |                                         |                                         |                            |
| `--role-admin`                       | 262 83% 58% (purple)                    | (same)                                  | RoleBadge, role-aware UI   |
| `--role-teacher`                     | 221 83% 53% (blue)                      | (same)                                  | RoleBadge                  |
| `--role-student`                     | 142 76% 36% (green)                     | (same)                                  | RoleBadge                  |
| `--role-parent`                      | 38 92% 50% (orange)                     | (same)                                  | RoleBadge                  |
| **Gradients**                        |                                         |                                         |                            |
| `--gradient-primary`                 | blue → cyan                             |                                         | hero/card                  |
| `--gradient-hero`                    | blue → purple                           |                                         | landing/empty hero         |
| `--gradient-card`                    | white → off-white                       |                                         | card surfaces              |
| **Shadows**                          |                                         |                                         |                            |
| `--shadow-sm/md/lg/xl/glow`          | HSL-based                               |                                         | progressive elevation      |
| **Sidebar**                          | separate token group                    | separate dark scheme                    | DashboardLayout sidebar    |

### 9.3 Component Patterns

| Pattern          | How                                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Forms            | `react-hook-form` + Zod resolver + `components/ui/form.tsx`. Inline validation messages.                                          |
| Dialogs          | `Dialog` (short flows), `Sheet` (side panel detail), `Drawer` (vaul, mobile only), `AlertDialog` (destructive confirm).           |
| Tables           | `components/ui/table.tsx`. >100 rows → server pagination (cursor). **Tidak pakai virtualization library** sekarang.               |
| Empty states     | Setiap list view WAJIB `EmptyState` (title + 1-line copy + primary CTA). Bila belum ada `components/ui/empty-state.tsx`, ekstrak. |
| Loading          | Skeleton via `components/ui/skeleton.tsx`. **Tidak pakai full-page spinner.**                                                     |
| Error boundaries | Setiap dashboard route WAJIB error boundary (Phase 2).                                                                            |
| Spacing          | Tailwind 4-spacing scale: `4 / 8 / 12 / 16 / 24 / 32 / 48`. Hindari arbitrary values.                                             |
| Typography       | Page title `text-3xl font-bold`, section `text-xl font-semibold`, body `text-base`. `prose` hanya di content body.                |
| Mobile           | Mobile-first; `useIsMobile` hook (`hooks/use-mobile.tsx`) untuk breakpoint logic.                                                 |
| Color usage      | Always semantic via tokens — `bg-primary text-primary-foreground`, `text-destructive`, `border-border`.                           |

### 9.4 Indonesian Locale Rules

- Date format: `date-fns` dengan import `import { id as idLocale } from "date-fns/locale"`.
  - Contoh: `format(date, "d MMMM yyyy", { locale: idLocale })` → `21 Februari 2026`.
- Currency: `new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n)`.
- Number: `new Intl.NumberFormat('id-ID').format(n)`.
- Time: `HH:mm` 24-hour.
- DayOfWeek display: gunakan helper di `lib/constants.ts`.

### 9.5 i18n (Phase 2)

- Library: **next-intl**.
- Locale dir: `messages/id.json` (default), `messages/en.json` (future).
- Migration: ekstrak hardcoded Indonesian strings ke `messages/id.json`, pakai `useTranslations("Namespace")` di client / `getTranslations()` di server.
- Routing: optional locale prefix; v1 ship `id` saja.
- Validation messages: pakai Zod with custom Indonesian messages mapped via `lib/i18n-error-map.ts`.

---

## Section 10 — Feature Status Matrix

Status: `BUILT` (production-quality) | `PARTIAL` (works but gaps) | `MISSING` (not implemented).

| Module                                                   | Status  | API              | UI      | Tests   | Notes                                |
| -------------------------------------------------------- | ------- | ---------------- | ------- | ------- | ------------------------------------ |
| Auth (login/register/forgot/reset/change/session)        | BUILT   | ✓                | ✓       | ✓       | recent commits 4cb6fa1…2b3654a       |
| Onboarding (role select + link child)                    | BUILT   | ✓                | ✓       | ✓       |                                      |
| User management (CRUD + profile)                         | BUILT   | ✓                | ✓       | ✓       |                                      |
| School profile / multi-tenancy                           | BUILT   | ✓                | ✓       | ✓       | tenant boundary = `SchoolProfile.id` |
| Parent invite codes (TTL 7d)                             | BUILT   | ✓                | ✓       | ✓       |                                      |
| Parent ↔ student linking                                 | BUILT   | ✓                | ✓       | ✓       |                                      |
| Academic year + activation + rollover script             | BUILT   | ✓                | ✓       | partial | `npm run academic-year:rollover`     |
| Classes / Subjects / Majors CRUD                         | BUILT   | ✓                | ✓       | ✓       |                                      |
| Subject ↔ Major curriculum mapping                       | BUILT   | ✓                | ✓       | partial | recent migration `20260307121000`    |
| Class schedule + templates                               | BUILT   | ✓                | ✓       | ✓       | server-side clash detection          |
| Attendance — student sessions/records                    | BUILT   | ✓                | ✓       | ✓       | sessionKey unique                    |
| Attendance — teacher attendance                          | BUILT   | ✓                | ✓       | ✓       |                                      |
| Attendance override / substitute                         | BUILT   | ✓                | ✓       | ✓       | overriddenById trail                 |
| Assignments (CRUD + delivery types MCQ/FILE/ESSAY)       | BUILT   | ✓                | ✓       | ✓       |                                      |
| Submissions + grading + feedback                         | BUILT   | ✓                | ✓       | ✓       |                                      |
| Grade weights + report cards (snapshot)                  | BUILT   | ✓                | ✓       | ✓       | snapshot stored as JSON              |
| Question bank + packages                                 | BUILT   | ✓                | ✓       | partial |                                      |
| Materials CRUD                                           | BUILT   | ✓                | ✓       | partial |                                      |
| Upload pipeline (intent + scan)                          | PARTIAL | ✓                | partial | partial | scanner provider integration TODO    |
| Forum threads/replies/upvote/pin/lock                    | BUILT   | ✓                | ✓       | ✓       | parent blocked                       |
| Notes (private/class)                                    | BUILT   | ✓                | ✓       | partial |                                      |
| Calendar events + class linkage                          | BUILT   | ✓                | ✓       | partial |                                      |
| Notifications (in-app) + preferences                     | BUILT   | ✓                | ✓       | partial | Resend delivery honors preferences   |
| Analytics (overview/attendance/grades/demographics)      | BUILT   | ✓                | ✓       | partial |                                      |
| Settings (school/template/notifications)                 | BUILT   | ✓                | ✓       | partial |                                      |
| Governance / release-readiness tracker                   | BUILT   | ✓                | ✓       | ✓       | admin only                           |
| Parent portal (read child grades/attendance/assignments) | BUILT   | ✓                | ✓       | ✓       | response masking enforced            |
| Audit log persistence                                    | PARTIAL | model            | –       | –       | **not wired everywhere**             |
| **Dedicated Exam module**                                | MISSING | –                | –       | –       | only `AssignmentKind.EXAM` enum      |
| **Library**                                              | MISSING | –                | –       | –       |                                      |
| **Transcripts (multi-year)**                             | MISSING | –                | –       | –       |                                      |
| **Certificates / diploma**                               | MISSING | –                | –       | –       |                                      |
| **e-Rapor / Kemdikbud DAPODIK export**                   | MISSING | –                | –       | –       |                                      |
| **i18n framework (next-intl)**                           | MISSING | –                | –       | –       | Indonesian hardcoded                 |
| **Rate limiting**                                        | PARTIAL | ✓                | –       | ✓       | in-memory token bucket; Upstash deferred |
| **CSRF tokens**                                          | BUILT   | ✓                | –       | ✓       | double-submit cookie/header middleware |
| **MFA / SSO**                                            | MISSING | –                | –       | –       | Phase 4                              |
| **Background job queue**                                 | MISSING | –                | –       | –       | Phase 4 (pg-boss)                    |
| **Email delivery (Resend wired in)**                     | BUILT   | fetch client     | –       | ✓       | best-effort notification email       |
| **Structured logging / metrics**                         | PARTIAL | metrics endpoint | –       | –       | no pino/Prometheus                   |
| **API versioning**                                       | MISSING | –                | –       | –       | introduce `/api/v1/*` Phase 4        |
| **Component tests (RTL)**                                | MISSING | –                | –       | –       | zero coverage on UI                  |

---

## Section 11 — Roadmap (Phased Continuous Development)

### Phase 0 — Archived Governance Track

Governance packets, readiness reports, dan approval automation lama sudah dipindahkan ke `docs/archive/` sebagai referensi historis. Mereka bukan lagi gate aktif untuk development harian dan tidak lagi di-drive oleh npm/CI automation.

### Phase 1 — Production Hardening (Core Done; Some Deferred)

| #   | Task                           | Files / Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | **Rate limiter**               | **DONE 2026-04-25.** `lib/rate-limit.ts` in-memory token bucket wraps credential auth and upload endpoints. Distributed Upstash backend is deferred hardening. |
| 1.2 | **CSRF protection**            | Double-submit cookie middleware in `middleware.ts`. Exempt safe methods (GET/HEAD/OPTIONS). Token in cookie + matching header `X-CSRF-Token`. Helper in `lib/csrf.ts`.                                                                                                                                                                                                                                                                                                                                            |
| 1.3 | **Audit log writer**           | **DONE 2026-04-25.** New `lib/audit.ts`: `recordAudit(actor, event, client?)`. Wired into submission grading/status changes, attendance overrides, user/profile/password changes, parent links, school profile updates, academic-year activation/rollover, and report-card publishing. |
| 1.4 | **Reset token hardening**      | In `/api/auth/reset-password` and `/api/auth/change-password`: after success, run `prisma.passwordResetToken.updateMany({ where: { credentialId, usedAt: null }, data: { usedAt: new Date() } })`. Update `lib/password-reset.ts`.                                                                                                                                                                                                                                                                                |
| 1.5 | **Email delivery**             | **DONE 2026-04-25.** `lib/resend.ts` sends password reset and notification email. `lib/notification-service.ts` sends best-effort notification email when Resend is configured and honors `NotificationPreference.emailNotifications` plus per-type preferences. Templates live under `lib/email-templates/`. |
| 1.6 | **Upload scanner integration** | **DEFERRED 2026-04-25.** Keep as security hardening backlog, but not a short-term release blocker. Current release target prioritizes making the app usable by schools first. Self-host target: ClamAV via clamd TCP. SaaS target: hosted scanner (Cloudmersive or similar). Update `lib/upload-scan.ts` to dispatch to provider per `APP_MODE`; persist to `UploadScanJob.provider` and `result`. |

**Verification per task:** integration test added under `tests/integration/`; manual smoke via `npm run dev`; `npm run test:release-authz-integrity`.

### Phase 2 — UX Polish & Refinement

| #   | Task                                       | Files / Notes                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | **Role-scoped dashboard**                  | Replace generic aggregates in `components/pages/Dashboard.tsx` with per-role widgets. Use `useRoleContext()` to branch. ADMIN → school metrics; TEACHER → my classes/today's sessions; STUDENT → today schedule + due assignments + recent grades; PARENT → linked children rollup. |
| 2.2 | **i18n framework**                         | `npm i next-intl`. Setup `i18n.ts`, `messages/id.json`. Extract all hardcoded ID strings under `app/`, `components/`. Wrap in `next-intl/middleware`. v1 ship Indonesian only.                                                                                                      |
| 2.3 | **EmptyState component**                   | Create `components/ui/empty-state.tsx` (title, description, icon, primary action). Replace inline empty handlers in: Users, Classes, Subjects, Majors, Schedules, Materials, Assignments, Grades, Forum, Notes, Calendar.                                                           |
| 2.4 | **Error boundaries**                       | Add `error.tsx` to every `app/dashboard/**` route group. Use shared `components/error-fallback.tsx`.                                                                                                                                                                                |
| 2.5 | **Bulk operations**                        | Multi-select + bulk apply for Users (role, school, deactivate), Students (assign to class), Classes (archive). Pattern: checkbox column + sticky action bar.                                                                                                                        |
| 2.6 | **Profile cleanup**                        | `components/pages/Profile.tsx` — remove any list-fallback path; rely on actor-scoped `/api/users/[id]/profile`.                                                                                                                                                                     |
| 2.7 | **Schedule clash detection (server-side)** | Add validation in `lib/handlers/schedules.ts` create/update: same `(classId, dayOfWeek, time-overlap)` or same `(teacherId, dayOfWeek, time-overlap)` → throw `CONFLICT`.                                                                                                           |

### Phase 3 — New Modules

#### 3.1 Dedicated Exam module

**Why:** assessment cycle tahunan butuh struktur formal (UTS/UAS, US, USBN), bukan sekadar `AssignmentKind.EXAM`.

**New models** (in `prisma/schema.prisma`):

```prisma
enum ExamStatus { DRAFT | SCHEDULED | ONGOING | COMPLETED | CANCELLED }

model Exam {
  id             String   @id @default(cuid())
  schoolId       String
  academicYearId String
  semester       Semester
  name           String        // "UTS Ganjil 2026"
  description    String?
  startsAt       DateTime
  endsAt         DateTime
  status         ExamStatus @default(DRAFT)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  // relations to school, year, examSubjects
  @@index([schoolId, academicYearId])
}

model ExamSubject {
  id           String   @id @default(cuid())
  examId       String
  subjectId    String
  classId      String
  invigilatorId String?
  room         String?
  startsAt     DateTime
  endsAt       DateTime
  durationMinutes Int
  // relations
  @@unique([examId, subjectId, classId])
}
```

- Reuse `AssignmentSubmission` for online proctored exams (link via `Assignment` row with `kind=EXAM` referencing `ExamSubject.id` in metadata, OR new `ExamResult` if cleaner).
- **Clash detection**: room+time, invigilator+time, class+time.
- Routes: `/api/exams`, `/api/exams/[id]`, `/api/exams/[id]/subjects`, `/api/exams/[id]/clashes`.
- UI: `/dashboard/exams` (admin manage), role views (teacher invigilator schedule, student exam schedule).

#### 3.2 Library

**Why:** sekolah Indonesia umumnya wajib punya catalog perpustakaan; permendikbud akreditasi.

**New models:**

```prisma
enum LoanStatus { ACTIVE | RETURNED | LOST | OVERDUE }
enum CopyStatus { AVAILABLE | LOANED | RESERVED | LOST | DAMAGED }

model Book {
  id        String   @id @default(cuid())
  schoolId  String
  isbn      String?
  title     String
  author    String
  publisher String?
  year      Int?
  category  String?
  location  String?
  totalCopies Int    @default(0)
  // relations
  @@index([schoolId])
}

model BookCopy {
  id     String     @id @default(cuid())
  bookId String
  code   String     // barcode
  status CopyStatus @default(AVAILABLE)
  @@unique([bookId, code])
}

model Loan {
  id          String     @id @default(cuid())
  copyId      String
  borrowerId  String     // User
  checkedOutAt DateTime  @default(now())
  dueAt       DateTime
  returnedAt  DateTime?
  status      LoanStatus @default(ACTIVE)
  @@index([borrowerId, status])
}
```

- Routes: `/api/library/books`, `/api/library/books/[id]/copies`, `/api/library/loans`, `/api/library/loans/[id]/return`.
- UI: `/dashboard/library` (admin/staff), student view "Pinjaman Saya".
- Background job: daily overdue marking (Phase 4 queue).

#### 3.3 Transcripts (multi-year)

- Aggregator over `ReportCardSnapshot` rows across academic years for one student.
- Endpoint: `GET /api/students/[id]/transcript` — returns `{ student, years: [{ year, semester, subjects: [{ name, score, predicate }], gpa }], cumulativeGPA }`.
- Authz: ADMIN, self STUDENT, linked PARENT.
- UI: student profile page → "Transkrip" tab.

#### 3.4 Certificates / diploma

- Library: `@react-pdf/renderer` (server component PDF).
- Templates per school in `lib/certificates/templates/`.
- Routes: `POST /api/certificates/generate` `{ studentId, type: "GRADUATION" | "ACHIEVEMENT" | "PARTICIPATION", payload }` → PDF stream.
- Authz: ADMIN only.
- UI: `/dashboard/certificates` (admin).

#### 3.5 e-Rapor / Kemdikbud export

- Research current Kemdikbud DAPODIK CSV/JSON specification for e-Rapor Sekolah (versi 2026).
- Endpoint: `GET /api/grades/erapor/export?academicYearId=&classId=&format=csv|json`.
- Implementation in `lib/handlers/erapor-export.ts`.
- Long-running → run via background job (Phase 4 queue) and email link when ready.
- Authz: ADMIN.
- UI: Settings → "Ekspor e-Rapor" wizard.

### Phase 4 — Scale & Observability

| #   | Task                           | Notes                                                                                                                                                   |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | **Background job queue**       | `pg-boss` (Postgres-backed; no extra infra). Jobs: email send, scan dispatch, report-card publish, e-Rapor export, overdue-loan check. New `lib/jobs/`. |
| 4.2 | **Structured logging**         | `pino` + correlation-id passthrough. Log sink: stdout (dev), Logtail/Papertrail (saas).                                                                 |
| 4.3 | **Metrics endpoint expansion** | Extend `/api/metrics`: sessions/day, uploads/day, scan failures, queue depth, P95 latency. Optional Prometheus exposition.                              |
| 4.4 | **Distributed tracing**        | OpenTelemetry — optional.                                                                                                                               |
| 4.5 | **API versioning**             | Introduce `/api/v1/*`; `app/api/*` becomes alias for v1 with deprecation header. New routes ship under v1.                                              |
| 4.6 | **MFA (TOTP)**                 | `otplib`. Admin opt-in first. New model `UserMfaSecret`.                                                                                                |
| 4.7 | **SSO (OIDC)**                 | Google + Microsoft Workspace via OIDC discovery. SaaS tier only.                                                                                        |

### Phase 5 — Quality & DX

| #   | Task                         | Notes                                                                                                                                                                       |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | **Component tests (RTL)**    | Start with `components/ui/*`, then `components/pages/Auth.tsx`, `Onboarding.tsx`, `Dashboard.tsx`, `Profile.tsx`. Switch Vitest env to `jsdom` per-suite via inline pragma. |
| 5.2 | **Storybook**                | Optional. `components/ui/*` only initially.                                                                                                                                 |
| 5.3 | **Coverage**                 | Vitest coverage report; gate `lib/handlers/` ≥70%.                                                                                                                          |
| 5.4 | **Lighthouse + axe-core CI** | Run on `/dashboard/*` routes via Playwright.                                                                                                                                |
| 5.5 | **Bundle analyzer**          | `@next/bundle-analyzer`. Lazy-load Recharts, EmblaCarousel, ReactDayPicker, @react-pdf/renderer.                                                                            |
| 5.6 | **DX docs**                  | Auto-generate API docs from Zod schemas (e.g., `zod-to-openapi`). Output to `docs/api.html`.                                                                                |

---

## Section 12 — Continuous Backlog (Prioritized)

Format: `- [Priority][Domain] Task — file/area`. Pull from this list during idle cycles.

- [DONE][AUTH] Invalidate outstanding `PasswordResetToken` on successful password change — `lib/password-reset.ts`.
- [DONE][AUTHZ] Audit AUTHZ_MATRIX vs `lib/authz.ts` actuals; closed teacher subject/class tenant-scope gap — `tests/unit/authz-policy.unit.test.ts`.
- [DONE][SEC] Rate limit credential auth endpoints and `/api/uploads/*` — Phase 1.1 (`lib/rate-limit.ts`, in-memory backend; Upstash deferred).
- [DONE][SEC] CSRF middleware — Phase 1.2 (`lib/csrf.ts`, `middleware.ts`, client `X-CSRF-Token` header).
- [DONE][BUILD] Restore production build gate after Next 16/React 19/TypeScript compatibility fixes — `npm run build`.
- [DONE][AUDIT] Wire `recordAudit` into sensitive endpoints — Phase 1.3 (`lib/audit.ts`).
- [DONE][SCHED] Server-side schedule clash detection — Phase 2.7 (`app/api/schedules/*`, tenant-scoped class/teacher/room conflicts).
- [DONE][FORUM] Server enforcement of thread `LOCKED` status on reply create/edit — `app/api/forum/threads/[id]/replies/route.ts`, `app/api/forum/replies/[id]/route.ts`.
- [DONE][ATTEND] Validate `AttendanceSession` business uniqueness via server-generated `sessionKey` only; client-supplied path cannot bypass.
- [DONE][NOTIF] Wire email delivery via Resend — Phase 1.5 (`lib/resend.ts`, `lib/notification-service.ts`).
- [P2][UI] Standardize EmptyState component across all list pages — Phase 2.3.
- [P2][UI] Error boundary on every dashboard route — Phase 2.4.
- [P2][UI] Role-scoped dashboard widgets — Phase 2.1.
- [P2][I18N] Install next-intl + extract hardcoded strings — Phase 2.2.
- [P2][PROFILE] Remove list-fallback path in `components/pages/Profile.tsx`.
- [P4][SEC] ClamAV + hosted scanner integration — Phase 1.6, deferred until after school-usability release.
- [P3][EXAM] New Exam module — Phase 3.1.
- [P3][LIB] Library module — Phase 3.2.
- [P3][REPORT] Multi-year transcripts — Phase 3.3.
- [P3][REPORT] Certificate PDF generator — Phase 3.4.
- [P3][REPORT] e-Rapor DAPODIK export — Phase 3.5.
- [P4][OBS] pg-boss queue — Phase 4.1.
- [P4][OBS] pino structured logging — Phase 4.2.
- [P4][API] `/api/v1/*` versioning — Phase 4.5.
- [P4][SEC] MFA TOTP — Phase 4.6.
- [P4][SEC] SSO OIDC (Google, Microsoft) — Phase 4.7.
- [P5][TEST] React Testing Library setup + first component tests — Phase 5.1.
- [P5][PERF] Lazy-load heavy components — Phase 5.5.
- [P5][DX] Auto-generate API docs from Zod — Phase 5.6.

---

## Section 13 — Code Conventions Cheat Sheet

| Topic          | Rule                                                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| File naming    | `lib/*` kebab-case (`grade-weight.ts`); `components/*` PascalCase (`SubjectCard.tsx`); route handler always `route.ts`.           |
| Imports        | Alias `@/*` → repo root (per tsconfig).                                                                                           |
| Zod schemas    | Live in `lib/schemas.ts` only. Export by name. **Never inline.**                                                                  |
| Handlers       | One file per feature: `lib/handlers/<feature>.ts`. Named exports.                                                                 |
| Route handlers | Orchestration only: auth → role → school context → ownership → validate → handler → respond. **No business logic in `route.ts`.** |
| Errors         | Throw typed errors from handlers (`new ApiError("CODE", "msg", status)`). Route catches → `jsonError`.                            |
| Tests          | `tests/integration/<feature>-<scenario>.integration.test.ts`. Mock Prisma via `vi.mock("@/lib/prisma")`.                          |
| Commits        | Indonesian conventional: `feat: …`, `fix: …`, `test: …`, `refactor: …`, `docs: …`, `chore: …`.                                    |
| Branches       | `feat/<short>`, `fix/<short>`, `chore/<short>`.                                                                                   |
| API shape      | Never break public response shape without migration path.                                                                         |
| Actor identity | Never accept `authorId/studentId/teacherId/userId` from request body. Always derive from `actor`.                                 |
| Multi-tenant   | Never bypass `requireSchoolContext`. Every Prisma query scoped by `schoolId` (direct or via parent).                              |
| Comments       | Default to none. Only when WHY is non-obvious. Never explain WHAT.                                                                |
| New deps       | Discuss before adding. UI lib alternatives forbidden.                                                                             |

---

## Section 14 — Critical Files to Reuse (with paths)

**Auth / session:**

- `lib/server-auth.ts` — `createSession`, `verifySession`, cookie helpers.
- `lib/api.ts` — `requireAuth`, `requireRole`, `requireSchoolContext`, `parseJsonBody`, `jsonOk`, `jsonError`.
- `lib/authz.ts` — RBAC + ownership helpers (full list in §7).
- `lib/auth-credential.ts` — credential helpers.
- `lib/password.ts` — hash/verify.
- `lib/password-reset.ts` — reset token lifecycle.
- `lib/default-password.ts` — default password generator (self-host).
- `lib/parent-invite-code.ts` — invite code hash + verify.

**Validation / schemas:**

- `lib/schemas.ts` — single Zod schemas file (~29KB).

**DB:**

- `lib/prisma.ts` — singleton Prisma client.
- `lib/database-url.ts` — multi-mode resolver.

**Domain helpers:**

- `lib/academic-year-scope.ts` — active-year filter resolution.
- `lib/attendance-session-key.ts` — generate unique sessionKey (anti-duplicate).
- `lib/attendance-policy.ts`, `lib/attendance-seeding-policy.ts` — attendance rules.
- `lib/assignment-policy.ts` — grading + late submission policy.
- `lib/school-code.ts` — school code generator.

**File upload:**

- `lib/upload-intent.ts` — upload initiation + token.
- `lib/upload-scan.ts` — scan orchestration (provider TODO).
- `lib/object-storage.ts` — storage URL builder.

**Communication:**

- `lib/notification-service.ts` — in-app notification creation.
- `lib/resend.ts` — email service (delivery wiring TODO).

**Governance:**

- `lib/governance-tracker.ts`, `lib/governance-readiness.ts`, `lib/governance-decision-presets.ts`.

**Config:**

- `lib/constants.ts` — roles, days, statuses, categories, event types.
- `lib/app-mode.ts` — `APP_MODE` detection.
- `lib/error-monitoring.ts` — error severity classification.

**Frontend infra:**

- `hooks/useRoleContext.tsx` — role context provider (used in `DashboardLayout`).
- `hooks/use-toast.ts` — toast hook.
- `hooks/use-mobile.tsx` — breakpoint hook.
- `components/layout/DashboardLayout.tsx` — main shell.
- `components/ui/*` — vendored shadcn components — **never replace**.
- `lib/api-client.ts` — fetch wrapper that auto-parses `data`/`error`.

**Handlers (lib/handlers/) — extend these, don't bypass:**

- `auth.ts`, `users.ts`, `students.ts`, `teachers.ts`, `parents.ts`, `parent-invites.ts`
- `classes.ts`, `subjects.ts`, `majors.ts`, `academic-years.ts`
- `schedules.ts`, `schedule-templates.ts`
- `attendance.ts`, `teacher-attendance.ts`
- `assignments.ts`, `submissions.ts`, `grades.ts`
- `questions.ts`, `question-packages.ts`
- `materials.ts`, `uploads.ts`
- `forum.ts`, `notes.ts`, `calendar.ts`
- `notifications.ts`, `settings.ts`, `analytics.ts`
- `governance.ts`

---

## Section 15 — Operational Playbooks (links)

Detail prosedur operasional disimpan di `docs/archive/`. Jangan duplikat di sini — link saja:

- [DB Backup & Restore](docs/archive/OPS_DB_BACKUP_RESTORE_SOP.md)
- [Academic Year Rollover](docs/archive/OPS_ACADEMIC_YEAR_ROLLOVER_SOP.md)
- [File Malware Incident](docs/archive/OPS_FILE_MALWARE_INCIDENT_SOP.md)
- [Fallback Playbook](docs/archive/OPS_FALLBACK_PLAYBOOK.md)
- [Sign-off Packet](docs/archive/OPS_SIGNOFF_PACKET.md)
- [Upload Pipeline Design](docs/archive/UPLOAD_PIPELINE_DESIGN.md)
- [Attendance Event Policy](docs/archive/ATTENDANCE_EVENT_POLICY.md)
- [Governance Automation](docs/archive/GOVERNANCE_AUTOMATION.md)
- [Governance Status API](docs/archive/GOVERNANCE_STATUS_API.md)
- [Governance Approval History](docs/archive/GOVERNANCE_APPROVAL_HISTORY.md)
- [Release Readiness Status](docs/archive/RELEASE_READINESS_STATUS.md)
- [Product Decision Packet](docs/archive/PRODUCT_DECISION_PACKET.md)
- [AUTHZ Approval Packet](docs/archive/AUTHZ_APPROVAL_PACKET.md)
- [AUTHZ Matrix (source)](docs/archive/AUTHZ_MATRIX.md)
- [Audit Report](docs/archive/AUDIT_REPORT.md)
- [Schoolie Gap Analysis](docs/archive/schoolie-gap-analysis.md)
- [Tech Plan (full)](docs/archive/techplan.md)
- [Overview (BRD/PRD/TRD)](docs/archive/overview.md)
- [Endpoint Plans](docs/archive/endpoint_plans.md)
- [Role Feature Matrix](docs/archive/ROLE_FEATURE_MATRIX.md)
- [Role Feature TODO](docs/archive/ROLE_FEATURE_TODO.md)
- [Instructions Page Modal Coverage](docs/archive/INSTRUCTIONS_PAGE_MODAL_COVERAGE.md)

---

## Section 16 — Out of Scope (Explicit)

**Tidak akan dibangun** dalam roadmap ini. Jangan propose; arahkan stakeholder ke alternatif:

- **Finance / billing / SPP / payment gateway** (Midtrans/Xendit). Bisa dibahas ulang di v2 sebagai modul terpisah.
- **Direct messaging 1:1** — komunikasi tetap di Forum + Notifications. Parent-teacher message via thread "konsultasi".
- **Mobile native apps** (iOS/Android). Web responsive saja.
- **Public marketing site** — proyek terpisah.
- **AI tutoring / generative features** (auto-grading essay, chatbot tutor).
- **Live video classes** — out of scope; integrasi Google Meet/Zoom kalau dibutuhkan = link saja di Calendar.
- **Blockchain credentials / NFT diploma**.
- **Custom video conferencing**.
- **Built-in payroll**.

---

## Section 17 — Open Questions (Deferred Decisions)

Surface unresolved product decisions inline so agents flag them early. Source: `docs/archive/PRODUCT_DECISION_PACKET.md`.

| ID         | Pertanyaan                                       | Status       | Direction (tentative)                                                         |
| ---------- | ------------------------------------------------ | ------------ | ----------------------------------------------------------------------------- |
| TP-DEC-001 | Final auth model: internal / SSO / hybrid?       | Pending      | Hybrid (internal + future SSO)                                                |
| TP-DEC-002 | Parent visibility submission anak                | **Approved** | Status + grade only; raw `response` masked server-side                        |
| TP-DEC-003 | Co-teaching / substitute grading authority       | Pending      | Owner + delegated dengan audit trail                                          |
| TP-DEC-004 | Late submission / remedial / resubmission policy | Pending      | Configurable late window default                                              |
| TP-DEC-005 | Academic year rollover policy                    | Pending      | Freeze + clone classes (no auto promotion)                                    |
| TP-DEC-006 | Data retention + export compliance               | Pending      | Regulatory tiered (operasional pendek, akademik final panjang, audit minimal) |

> Jika sebuah task bergantung pada decision Pending, **flag di PR description** dengan tag `[BLOCKED-ON: TP-DEC-XXX]`.

---

## Section 18 — Glossary (Indonesian ↔ Technical)

| Indonesian              | Technical / Model                                                  |
| ----------------------- | ------------------------------------------------------------------ |
| Sekolah                 | `SchoolProfile`                                                    |
| Tahun Ajaran            | `AcademicYear` (semester ODD/EVEN)                                 |
| Jurusan / Program       | `Major`                                                            |
| Kelas                   | `Class`                                                            |
| Mata Pelajaran / Mapel  | `Subject`                                                          |
| Jadwal                  | `ClassSchedule`                                                    |
| Template Jadwal         | `ScheduleTemplate`                                                 |
| Sesi Absensi            | `AttendanceSession`                                                |
| Catatan Absensi         | `AttendanceRecord`                                                 |
| Tugas                   | `Assignment`                                                       |
| Pengumpulan Tugas       | `AssignmentSubmission`                                             |
| Bobot Nilai             | `GradeWeight`                                                      |
| Bank Soal               | `Question` + `QuestionPackage`                                     |
| Materi                  | `Material` + `MaterialAttachment`                                  |
| Nilai                   | derived from `AssignmentSubmission.grade` × `GradeWeight`          |
| Rapor                   | `ReportCardSnapshot`                                               |
| Wali Kelas              | `Class.homeroomTeacherId` (User TEACHER)                           |
| Wali Murid / Orang Tua  | User role PARENT + `ParentStudent`                                 |
| Undangan Orang Tua      | `ParentInvite`                                                     |
| Forum Diskusi           | `ForumThread` + `ForumReply`                                       |
| Catatan                 | `Note` (visibility PRIVATE/CLASS)                                  |
| Kalender Akademik       | `CalendarEvent`                                                    |
| Notifikasi              | `Notification` + `NotificationPreference`                          |
| Audit Log               | `AuditLog`                                                         |
| e-Rapor                 | Kemdikbud DAPODIK export (planned Phase 3.5)                       |
| Transkrip               | multi-year aggregation of `ReportCardSnapshot` (planned Phase 3.3) |
| Sertifikat              | PDF via `@react-pdf/renderer` (planned Phase 3.4)                  |
| Ujian (UTS/UAS/US/USBN) | `Exam` + `ExamSubject` (planned Phase 3.1)                         |

---

## Section 19 — Verification (How to Sanity-Check the Docs & Project)

After any update to PLANS.md or refactor that affects roadmap state:

1. **Markdown anchors**: open PLANS.md in VS Code preview — no broken internal/external links.
2. **`docs/archive/` integrity**: every link in §15 resolves. Run `git log --follow docs/archive/overview.md` — history should include the original `docs/overview.md` line.
3. **API surface accuracy**: spot-check 5 random rows in §6 — each route exists in `app/api/**/route.ts`. Use:
   ```bash
   git ls-files 'app/api/**/route.ts' | wc -l   # expect ~86
   ```
4. **Schema accuracy**: every model in §5 exists in `prisma/schema.prisma` (confirm with grep).
5. **Lint**: `npm run lint` — clean.
6. **Tests**: `npm run test` — all green.
7. **Build**: `npm run build` — clean.
8. **Authz integrity gate**: `npm run test:release-authz-integrity`.
9. **Smoke**: `npm run dev`, login as each role (admin/teacher/student/parent), exercise dashboard happy paths.

---

## Section 20 — How to Update PLANS.md

When state changes (feature shipped, decision approved, dependency upgraded):

1. Update **Section 10 Feature Status Matrix** row.
2. Update **Section 12 Continuous Backlog** — strike done items.
3. Update **Section 17 Open Questions** if a decision is finalized.
4. Append a concise entry to **`docs/build_logs.md`** for every AI-implemented task, including verification and follow-ups.
5. Bump **Section 0 Last updated** date.
6. Commit with `docs: update PLANS.md — <what changed>`.

> NOTE: Jangan biarkan PLANS.md basi. Ini adalah file paling-berharga buat AI agent berikutnya. Out-of-date single-source-of-truth lebih buruk dari tidak ada single-source-of-truth.

---

_End of PLANS.md — for deep dives, see `docs/archive/`._

