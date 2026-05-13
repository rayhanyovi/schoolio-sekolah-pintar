# Product Strategy and Direction

> Opinionated product positioning, roadmap, and priorities for Schoolio / Sekolah Pintar. This document answers "what are we building, for whom, and why." For technical details see `TECHNICAL.md`. For design direction see `DESIGN.md`.

Last updated: 2026-05-05

---

## 1. Product Identity

**Name:** Schoolio / Sekolah Pintar

**One-liner:** A calm, modern school operations platform for Indonesian schools.

**Category:** Multi-role school management web application.

**What it is:** Schoolio is a digital operations platform that organizes the daily administrative, academic, classroom, communication, and reporting workflows of a school into one coherent system. It serves four roles — administrator, teacher, student, and parent — each with purpose-built interfaces.

**What it is NOT:**
- Not a children's education app
- Not an LMS focused on course content delivery
- Not a generic SaaS dashboard with school labels slapped on
- Not a finance/billing/payment system
- Not a mobile-first social app

---

## 2. Problem Statement

Indonesian schools operate with fragmented, manual, paper-heavy processes. Attendance is taken on paper. Grades are tracked in Excel. Schedules are posted on whiteboards. Parents call the school office for updates. Report cards are hand-assembled. There is no single system that connects the daily operational reality of running a school.

Existing solutions are either:
- Expensive enterprise systems designed for university-scale institutions
- Cheap, ugly, poorly maintained government-mandated tools
- Generic LMS platforms (Google Classroom, Moodle) that cover only the teaching layer
- Mobile apps focused on parent communication, not school operations

**Schoolio fills the gap:** a complete school operations system that is affordable, modern, Indonesian-first, and covers all four roles (admin, teacher, student, parent) in one coherent product.

---

## 3. Target Users

### Administrator (Kepala Sekolah, TU, Wakil Kepala)

**Job:** Set up and maintain all school data. Ensure operational readiness. Monitor school health.

**Pain points solved:**
- No more maintaining separate spreadsheets for students, classes, schedules
- One place to see school readiness status
- Instant parent-linking without paperwork
- Audit trail for sensitive operations

### Teacher (Guru Mapel, Wali Kelas)

**Job:** Manage daily classroom operations efficiently. Focus on teaching, not administration.

**Pain points solved:**
- Quick attendance taking per class session
- Assignment creation with multiple formats (MCQ, essay, file upload)
- Centralized grade book with automatic weight calculations
- Materials sharing without email chains
- Forum for student questions

### Student (Siswa SMP/SMA/SMK)

**Job:** Know what to do today. Submit work. Track progress.

**Pain points solved:**
- Clear schedule view
- Know exactly which assignments are due
- Submit work digitally
- See grades and feedback in one place
- Get notified about deadlines

### Parent (Orang Tua/Wali Murid)

**Job:** Stay informed about their child's school life without being intrusive.

**Pain points solved:**
- See child's attendance without calling the school
- View grades as they are published
- Know about upcoming deadlines and events
- Peace of mind through transparency

---

## 4. Product Philosophy

### Calm Operations
Every screen should reduce cognitive load. School staff deal with enough chaos in person — the software should make their digital work feel ordered, predictable, and efficient.

### Warm Institution
Schoolio should feel like the best version of a well-run school office — professional and trustworthy, but also human and welcoming. Not corporate-cold, not childish.

### Operational Completeness
We build the full loop. If a teacher takes attendance, the parent sees it. If a teacher grades work, the student gets notified. If an admin publishes report cards, parents can view them. No dead ends.

### Indonesian-First
UI language, date formats, naming conventions, and workflow assumptions are Indonesian by default. This is not a translated global product — it is built for Indonesian schools from the ground up.

### Role Clarity
Each role sees exactly what they need — no more, no less. Students should never see admin complexity. Parents should never see raw submission data. Teachers should never deal with school-wide configuration.

---

## 5. What Makes This Different

1. **Four-role coherence** — Not just a teacher tool or parent app. All four roles work in one system.
2. **Indonesian context** — Built for Indonesian school structure (Jurusan, Mapel, Tahun Ajaran, Rapor, etc.)
3. **Operational depth** — Covers attendance, scheduling, grading, report cards, materials, forum, calendar, notifications
4. **Premium feel** — Calm, warm, professional design — not a government utility or cheap edtech startup
5. **Self-host OR SaaS** — Schools can run their own instance or use hosted version
6. **AI-agent maintainable** — Documentation and architecture designed for continuous AI-assisted development

---

## 6. Current Status (What Is Built)

### Fully Built Modules

| Module | Scope |
|--------|-------|
| Authentication | Login, register, forgot/reset/change password, session, onboarding |
| User Management | CRUD, profiles, role assignment |
| Multi-Tenancy | School profile, tenant isolation |
| Parent System | Invite codes, parent-student linking, child data access |
| Academic Structure | Academic years, classes, subjects, majors, mappings |
| Scheduling | Class schedules, templates, server-side clash detection |
| Attendance | Sessions, records, overrides, substitutes, teacher attendance |
| Assignments | CRUD, MCQ/file/essay delivery, class linkage, question linkage |
| Submissions & Grading | Submit, grade, feedback, grading policies, grade weights |
| Question Bank | Questions, packages, difficulty levels |
| Materials | CRUD, file attachments, upload pipeline |
| Forum | Threads, replies, upvotes, pin, lock |
| Notes | Private/class, pin, color |
| Calendar | Events, class linkage, types |
| Notifications | In-app, preferences, email delivery (Resend) |
| Analytics | Overview, attendance, grades, demographics |
| Settings | School profile, notification preferences |
| Report Cards | Snapshot publish |
| Security | CSRF, rate limiting, audit logging, token invalidation |

### Partially Built

| Area | Status |
|------|--------|
| Upload scanner | Pipeline works; malware scanner provider not integrated |
| Audit logging | Wired into most sensitive endpoints; coverage still expanding |
| Rate limiting | In-memory token bucket; distributed SaaS backend deferred |
| Structured logging | Metrics endpoint exists; no pino/Prometheus |

### Not Yet Built

| Module | Phase |
|--------|-------|
| Dedicated Exam (UTS/UAS/US/USBN) | Phase 3 |
| Library (books, loans) | Phase 3 |
| Multi-year Transcripts | Phase 3 |
| Certificate/Diploma PDF | Phase 3 |
| e-Rapor DAPODIK Export | Phase 3 |
| i18n Framework | Phase 2 |
| MFA/SSO | Phase 4 |
| Background Job Queue | Phase 4 |
| API Versioning | Phase 4 |

---

## 7. Product Roadmap

### Phase 1 — Production Hardening (DONE)

All P0 security and stability items completed:
- Rate limiting on auth + uploads
- CSRF protection
- Audit log writer
- Password reset token invalidation
- Email delivery via Resend
- Production build gate restored
- Schedule clash detection
- Attendance session uniqueness
- Forum lock enforcement

### Phase 2 — UX Polish and School Usability (CURRENT FOCUS)

| Priority | Feature | Acceptance Criteria |
|----------|---------|-------------------|
| P0 | Role-scoped dashboard | ADMIN sees school metrics; TEACHER sees today's classes/sessions; STUDENT sees schedule+due+grades; PARENT sees children rollup. Dashboard never shows irrelevant data. |
| P0 | EmptyState component | Every list page shows a helpful empty state with title, explanation, and CTA. Never a blank screen. Works on mobile and desktop. |
| P0 | Error boundaries | Every `app/dashboard/**` route has `error.tsx`. Errors show calm message + retry action. Never a white screen of death. |
| P1 | i18n framework (next-intl) | All hardcoded Indonesian strings extracted to `messages/id.json`. Framework installed and routing configured. Ship Indonesian only for v1. |
| P1 | Bulk operations | Multi-select + bulk apply for Users (role/deactivate), Students (assign class), Classes (archive). Checkbox column + sticky action bar pattern. |
| P2 | Profile cleanup | Remove list-fallback path in Profile page. Rely on actor-scoped endpoint. |

### Phase 3 — New Modules

| Priority | Feature | Acceptance Criteria |
|----------|---------|-------------------|
| P2 | Dedicated Exam module | Create/manage formal exams (UTS/UAS/US). Schedule with room+invigilator. Clash detection. Teacher sees invigilator schedule. Student sees exam schedule. Admin manages all. |
| P2 | Library module | Book catalog with ISBN, copies, location. Loan checkout/return flow. Student "My Loans" view. Overdue marking. |
| P3 | Multi-year Transcripts | Aggregation of ReportCardSnapshot across years. Student profile "Transkrip" tab. GPA calculation. |
| P3 | Certificate PDF | Template-based PDF generation via @react-pdf/renderer. Types: graduation, achievement, participation. Admin-only generation. |
| P3 | e-Rapor Export | Kemdikbud DAPODIK-format CSV/JSON export. Admin wizard in Settings. Long-running via background job. |

### Phase 4 — Scale and Observability

| Priority | Feature | Acceptance Criteria |
|----------|---------|-------------------|
| P3 | Background job queue (pg-boss) | Jobs for: email send, scan dispatch, report-card publish, e-Rapor export, overdue-loan check. |
| P3 | Structured logging (pino) | All API routes emit structured logs with correlation ID. Log sink configurable. |
| P4 | MFA (TOTP) | Admin opt-in first. New UserMfaSecret model. Setup flow with QR code. |
| P4 | SSO (OIDC) | Google + Microsoft via OIDC discovery. SaaS tier only. |
| P4 | API versioning | `/api/v1/*` prefix. Current routes become v1 alias with deprecation header. |

### Phase 5 — Quality and DX

| Priority | Feature |
|----------|---------|
| P4 | React Testing Library component tests |
| P4 | Bundle analyzer + lazy-load heavy components |
| P5 | Auto-generated API docs from Zod (zod-to-openapi) |
| P5 | Storybook for UI components |

---

## 8. Implementation Priority Order (What To Build Next)

When picking up work, follow this sequence:

1. **EmptyState component** — Create `components/ui/empty-state.tsx`. Replace inline empty handlers across all list pages. High impact, low risk.
2. **Error boundaries** — Add `error.tsx` to every `app/dashboard/**` route group. Create shared `components/error-fallback.tsx`.
3. **Role-scoped dashboard widgets** — Replace generic Dashboard with role-aware content using `useRoleContext()`.
4. **i18n framework setup** — Install next-intl, create `messages/id.json`, extract hardcoded strings.
5. **Bulk operations UI** — Multi-select pattern for Users, Students, Classes.
6. **Exam module** — New models, routes, handlers, UI.
7. **Library module** — New models, routes, handlers, UI.

---

## 9. Out of Scope

These will NOT be built in the current roadmap. Do not propose them:

- Finance / billing / SPP / payment gateway (Midtrans/Xendit)
- Direct messaging 1:1 (use Forum + Notifications instead)
- Mobile native apps (iOS/Android) — web responsive only
- Public marketing site (separate project)
- AI tutoring / generative features (auto-grading, chatbot)
- Live video classes (link Google Meet/Zoom in Calendar if needed)
- Blockchain credentials / NFT diploma
- Built-in payroll

---

## 10. Open Product Decisions

| ID | Question | Status | Tentative Direction |
|----|----------|--------|-------------------|
| TP-DEC-001 | Final auth model: internal / SSO / hybrid? | Pending | Hybrid (internal + future SSO) |
| TP-DEC-002 | Parent visibility on child submissions | **Approved** | Status + grade only; raw response masked |
| TP-DEC-003 | Co-teaching / substitute grading authority | Pending | Owner + delegated with audit trail |
| TP-DEC-004 | Late submission / remedial policy | Pending | Configurable late window default |
| TP-DEC-005 | Academic year rollover policy | Pending | Freeze + clone classes (no auto promotion) |
| TP-DEC-006 | Data retention + export compliance | Pending | Regulatory tiered retention |

If a task depends on a pending decision, flag it with `[BLOCKED-ON: TP-DEC-XXX]`.

---

## 11. Glossary (Indonesian ↔ Technical)

| Indonesian | Technical / Model |
|-----------|------------------|
| Sekolah | `SchoolProfile` |
| Tahun Ajaran | `AcademicYear` (semester ODD/EVEN) |
| Jurusan / Program | `Major` |
| Kelas | `Class` |
| Mata Pelajaran / Mapel | `Subject` |
| Jadwal | `ClassSchedule` |
| Template Jadwal | `ScheduleTemplate` |
| Sesi Absensi | `AttendanceSession` |
| Catatan Absensi | `AttendanceRecord` |
| Tugas | `Assignment` |
| Pengumpulan Tugas | `AssignmentSubmission` |
| Bobot Nilai | `GradeWeight` |
| Bank Soal | `Question` + `QuestionPackage` |
| Materi | `Material` + `MaterialAttachment` |
| Nilai | derived from submission grade × GradeWeight |
| Rapor | `ReportCardSnapshot` |
| Wali Kelas | `Class.homeroomTeacherId` |
| Wali Murid / Orang Tua | User role PARENT + `ParentStudent` |
| Undangan Orang Tua | `ParentInvite` |
| Forum Diskusi | `ForumThread` + `ForumReply` |
| Catatan | `Note` (visibility PRIVATE/CLASS) |
| Kalender Akademik | `CalendarEvent` |
| Notifikasi | `Notification` |
| Audit Log | `AuditLog` |
| e-Rapor | Kemdikbud DAPODIK export (planned) |
| Transkrip | multi-year ReportCardSnapshot aggregation (planned) |
| Sertifikat | PDF generation (planned) |
| Ujian (UTS/UAS/US/USBN) | `Exam` + `ExamSubject` (planned) |
