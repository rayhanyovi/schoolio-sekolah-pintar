# API Endpoint Plan

Scope: Minimal planning doc for `/api` endpoints based on current UI, mock data, and Prisma schema.

## Conventions
- Base path: `/api`
- Content type: JSON
- Dates: ISO 8601 strings
- IDs: string
- Error shape:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": {} } }
```
- List response:
```json
{ "data": [...], "meta": { "page": 1, "pageSize": 20, "total": 123 } }
```

## Users & Profiles
Endpoints
- ☑ `GET /api/users?role&classId&q&page&pageSize`
- ☑ `GET /api/users/:id`
- ☑ `POST /api/users`
- ☑ `PATCH /api/users/:id`
- ☑ `DELETE /api/users/:id`
- ☑ `GET /api/users/:id/profile`
- ☑ `PATCH /api/users/:id/profile`
- ☑ `POST /api/parent-links { parentId, studentId }`
- ☑ `DELETE /api/parent-links { parentId, studentId }`
- ☑ `GET /api/students`
- ☑ `GET /api/teachers`
- ☑ `GET /api/parents`

Contract checklist
- ☐ Request validation for role and email.
- ☐ Parent-student link is unique.
- ☐ Role-based access control (admin/teacher/parent/student).

## Classes
Endpoints
- ☑ `GET /api/classes?grade&academicYearId&q`
- ☑ `GET /api/classes/:id`
- ☑ `POST /api/classes`
- ☑ `PATCH /api/classes/:id`
- ☑ `DELETE /api/classes/:id`
- ☑ `GET /api/classes/:id/students`
- ☑ `GET /api/classes/:id/subjects`
- ☑ `PUT /api/classes/:id/subjects { subjectIds: [] }`

Contract checklist
- ☐ Grade must be 10/11/12.
- ☐ Optional homeroom teacher.
- ☐ Subject/class link is unique.

## Academic Years
Endpoints
- ☑ `GET /api/academic-years`
- ☑ `POST /api/academic-years`
- ☑ `PATCH /api/academic-years/:id`
- ☑ `POST /api/academic-years/:id/activate`
- ☑ `DELETE /api/academic-years/:id`

Contract checklist
- ☐ Only one active year at a time.
- ☐ Semester in {ODD, EVEN}.

## Subjects
Endpoints
- ☑ `GET /api/subjects?category&q`
- ☑ `GET /api/subjects/:id`
- ☑ `POST /api/subjects`
- ☑ `PATCH /api/subjects/:id`
- ☑ `DELETE /api/subjects/:id`
- ☑ `PUT /api/subjects/:id/teachers { teacherIds: [] }`
- ☑ `PUT /api/subjects/:id/classes { classIds: [] }`

Contract checklist
- ☐ Code is unique.
- ☐ Subject/teacher and subject/class links are unique.

## Schedules (Timetable)
Endpoints
- ☑ `GET /api/schedules?classId&teacherId&dayOfWeek`
- ☑ `POST /api/schedules`
- ☑ `PATCH /api/schedules/:id`
- ☑ `DELETE /api/schedules/:id`

Contract checklist
- ☐ DayOfWeek in {MON..SAT}.
- ☐ Time format `HH:mm`.

## Attendance
Endpoints
- ☑ `GET /api/attendance/sessions?classId&date`
- ☑ `GET /api/attendance/sessions/:id`
- ☑ `POST /api/attendance/sessions`
- ☑ `PATCH /api/attendance/sessions/:id`
- ☑ `DELETE /api/attendance/sessions/:id`
- ☑ `GET /api/attendance/records?studentId&dateFrom&dateTo&subjectId`
- ☑ `POST /api/attendance/sessions/:id/records { records: [{ studentId, status, note? }] }`
- ☑ `PATCH /api/attendance/records/:id`

Contract checklist
- ☐ One record per student per session.
- ☐ Status in {PRESENT, ABSENT, SICK, PERMIT}.

## Assignments
Endpoints
- ☑ `GET /api/assignments?classId&subjectId&teacherId&status`
- ☑ `GET /api/assignments/:id`
- ☑ `POST /api/assignments`
- ☑ `PATCH /api/assignments/:id`
- ☑ `DELETE /api/assignments/:id`
- ☑ `PUT /api/assignments/:id/classes { classIds: [] }`
- ☑ `PUT /api/assignments/:id/questions { questionIds: [], questionPackageId? }`
- ☑ `GET /api/assignments/:id/submissions`
- ☑ `POST /api/assignments/:id/submissions`
- ☑ `PATCH /api/submissions/:id { status, grade?, feedback?, response? }`

Contract checklist
- ☐ Due date required.
- ☐ Status in {ACTIVE, CLOSED}.
- ☐ Submission is unique per student per assignment.

## Question Bank
Endpoints
- ☑ `GET /api/questions?subjectId&type&difficulty&q`
- ☑ `GET /api/questions/:id`
- ☑ `POST /api/questions`
- ☑ `PATCH /api/questions/:id`
- ☑ `DELETE /api/questions/:id`
- ☑ `GET /api/question-packages?subjectId&q`
- ☑ `GET /api/question-packages/:id`
- ☑ `POST /api/question-packages`
- ☑ `PATCH /api/question-packages/:id`
- ☑ `DELETE /api/question-packages/:id`
- ☑ `PUT /api/question-packages/:id/questions { questionIds: [] }`

Contract checklist
- ☐ Question types in {MCQ, FILE, ESSAY}.
- ☐ Package items unique; ordered by position.

## Materials
Endpoints
- ☑ `GET /api/materials?classId&subjectId&teacherId&q`
- ☑ `GET /api/materials/:id`
- ☑ `POST /api/materials`
- ☑ `PATCH /api/materials/:id`
- ☑ `DELETE /api/materials/:id`
- ☑ `POST /api/materials/:id/attachments`
- ☑ `DELETE /api/materials/:id/attachments/:attachmentId`

Contract checklist
- ☐ Attachments stored with url or storageKey.

## Forum
Endpoints
- ☑ `GET /api/forum/threads?subjectId&status&q`
- ☑ `GET /api/forum/threads/:id`
- ☑ `POST /api/forum/threads`
- ☑ `PATCH /api/forum/threads/:id`
- ☑ `DELETE /api/forum/threads/:id`
- ☑ `GET /api/forum/threads/:id/replies`
- ☑ `POST /api/forum/threads/:id/replies`
- ☑ `PATCH /api/forum/replies/:id`
- ☑ `POST /api/forum/threads/:id/pin`
- ☑ `POST /api/forum/threads/:id/lock`
- ☑ `POST /api/forum/threads/:id/upvote`
- ☑ `POST /api/forum/replies/:id/upvote`

Contract checklist
- ☐ Reply count sync strategy (transaction or trigger).
- ☐ Lock prevents new replies.

## Notes
Endpoints
- ☑ `GET /api/notes?visibility&subjectId&q`
- ☑ `GET /api/notes/:id`
- ☑ `POST /api/notes`
- ☑ `PATCH /api/notes/:id`
- ☑ `DELETE /api/notes/:id`
- ☑ `POST /api/notes/:id/pin`

Contract checklist
- ☐ Visibility in {PRIVATE, CLASS}.

## Calendar
Endpoints
- ☑ `GET /api/calendar/events?dateFrom&dateTo&type&classId`
- ☑ `GET /api/calendar/events/:id`
- ☑ `POST /api/calendar/events`
- ☑ `PATCH /api/calendar/events/:id`
- ☑ `DELETE /api/calendar/events/:id`
- ☑ `PUT /api/calendar/events/:id/classes { classIds: [] }`

Contract checklist
- ☐ End date optional.
- ☐ Recurring events strategy.

## Grades
Endpoints
- ☑ `GET /api/grades?classId&subjectId&studentId&termId`
- ☑ `GET /api/grades/summary?classId&subjectId`

Contract checklist
- ☐ Source of truth is submissions; no dedicated grade table yet.

## Analytics
Endpoints
- ☑ `GET /api/analytics/overview`
- ☑ `GET /api/analytics/attendance?from&to`
- ☑ `GET /api/analytics/grades?from&to`
- ☑ `GET /api/analytics/demographics`

Contract checklist
- ☐ Aggregation definitions (to be finalized).

## Settings
Endpoints
- ☑ `GET /api/settings/school-profile`
- ☑ `PATCH /api/settings/school-profile`
- ☑ `GET /api/schedule-templates`
- ☑ `PATCH /api/schedule-templates` (bulk update)

Contract checklist
- ☐ Single school profile row.
- ☐ Schedule template order via `position`.

## Auth (placeholder)
Endpoints
- ☐ `GET /api/auth/session`
- ☐ `POST /api/auth/login`
- ☐ `POST /api/auth/logout`

Contract checklist
- ☐ Replace with better-auth endpoints later.

## Gaps / Not planned yet
- Notifications settings data model.
- File upload pipeline (signed URLs / storage).
- Analytics materialization strategy.
- Role-based access control per route.
