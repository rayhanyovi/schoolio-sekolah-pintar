# Schoolio / Sekolah Pintar - Product Overview

Last updated: 2026-04-25

## Product Name And Category

**Product name:** Schoolio / Sekolah Pintar

**Product category:** Multi-role school management web application for Indonesian schools.

Schoolio is a school operations system that organizes administrative, academic, classroom, communication, reporting, and parent-facing workflows in one application. It is designed around four main user roles: administrator, teacher, student, and parent.

## What The Product Does

Schoolio provides a shared digital workspace for running school operations. It stores school structure, user accounts, academic years, classes, subjects, majors, schedules, attendance, assignments, submissions, grades, learning materials, notes, forum activity, calendar events, notifications, analytics, and parent-child links.

The product supports both internal school operations and user-facing portals:

- Administrators manage school data, users, academic structure, settings, parent links, reporting, and readiness tracking.
- Teachers manage class activities, schedules, attendance, materials, assignments, submissions, grades, notes, and discussions.
- Students access class schedules, learning materials, assignments, submissions, grades, notes, forums, and calendar events.
- Parents access selected information about linked children, including grades, attendance, assignments, and school updates.

## Primary Users

### Administrator

Administrators manage the school-level setup and operational data. Their scope includes user management, school profile, academic years, classes, subjects, majors, schedules, parent links, grade settings, report cards, analytics, governance readiness, and system settings.

### Teacher

Teachers use Schoolio for daily academic workflows. Their scope includes assigned classes and subjects, class schedules, attendance sessions, learning materials, assignments, student submissions, grading, feedback, notes, forums, calendar events, and teacher attendance.

### Student

Students use Schoolio to follow school activity and complete academic work. Their scope includes schedules, assignments, materials, submissions, grades, report cards, class discussions, notes, notifications, and calendar events.

### Parent

Parents use Schoolio to view information about linked children. Their scope includes child grades, attendance, assignments, notifications, and school updates. Parent access is intentionally limited; parent users do not see raw student submission answers.

## Core Product Areas

### Identity And Access

Schoolio includes authentication, registration, password reset, password change, session management, onboarding, role selection, and role-based access. The product supports administrator, teacher, student, and parent roles.

### School Profile And Tenancy

The product supports school-level data separation. Each school has its own profile and tenant boundary. School-specific records are scoped to that school.

### User And Profile Management

Administrators can manage users and profiles for school staff, teachers, students, and parents. The system also supports parent invite codes and parent-to-student linking.

### Academic Structure

Schoolio includes academic year management, active academic year selection, class management, subject management, major management, class rosters, and mappings between subjects, classes, majors, and teachers.

### Scheduling

The product includes class schedules and schedule templates. Schedule management supports class, subject, teacher, day, time, room, and related academic context. Server-side clash detection is included for schedule conflicts.

### Attendance

Schoolio supports student attendance sessions, attendance records, session seeding from schedules, teacher attendance, attendance overrides, substitute-teacher handling, and attendance history.

### Assignments And Submissions

Teachers and administrators can create assignments, link assignments to classes, attach questions, review submissions, grade student work, and provide feedback. Supported assignment styles include multiple-choice, file upload, essay, and exam-style assignment records.

### Grades And Report Cards

The product includes grade filtering, grade summaries, grade weights, and report card snapshots. Report cards are stored as snapshots so published reporting data can remain stable over time.

### Question Bank

Schoolio includes a question bank and question packages. Teachers and administrators can create, update, group, and reuse questions for assignments or assessment-related workflows.

### Learning Materials And Uploads

Teachers and administrators can create learning materials and attach files. The upload pipeline supports upload intents, upload status polling, resumable content upload, and upload confirmation. Malware scanner provider integration is not complete and is tracked as deferred hardening.

### Forum Discussions

Schoolio includes forum threads, replies, upvotes, pinning, and locking. Administrators, teachers, and students can participate according to role rules. Parent users are blocked from forum participation.

### Notes

Users can create notes. Notes can be private or class-related depending on the workflow. Notes support reading, updating, deleting, and pinning according to access rules.

### Calendar

The product includes calendar events and class-event linkage. Administrators and teachers can manage events within role constraints, and users can view relevant school or class events.

### Notifications

Schoolio includes in-app notifications, read/unread state, read-all actions, notification preferences, and best-effort email notification delivery when email delivery is configured.

### Analytics

The product includes analytics for overview data, attendance, grades, demographics, and system metrics. Analytics access is role-scoped.

### Settings

Schoolio includes settings for school profile and notification preferences. Administrators can manage school-level settings, while users can manage personal notification preferences.

### Parent Portal

The parent portal allows parent users to view selected data for linked children. This includes child grades, attendance, assignments, and related updates. Parent access is controlled through explicit parent-student links.

### Governance And Readiness Tracking

The product includes an admin-only governance and release-readiness tracker. This is used to track approvals, readiness state, and implementation governance inside the application.

## Module Status

### Built Modules

The following modules are currently documented as built:

- Authentication, registration, password reset, password change, and sessions.
- Onboarding, role selection, and parent child-link onboarding.
- User management and user profiles.
- School profile and multi-tenant school structure.
- Parent invite codes and parent-student linking.
- Academic year management and active year selection.
- Class, subject, and major management.
- Subject, class, major, and teacher mappings.
- Class schedules and schedule templates.
- Student attendance sessions and attendance records.
- Teacher attendance.
- Attendance override and substitute-teacher tracking.
- Assignment management.
- Submission review, grading, and feedback.
- Grade weights and report card snapshots.
- Question bank and question packages.
- Learning materials.
- Forum threads, replies, upvotes, pinning, and locking.
- Notes.
- Calendar events and class linkage.
- In-app notifications and notification preferences.
- Analytics for overview, attendance, grades, demographics, and metrics.
- School and notification settings.
- Parent portal for linked child data.
- Governance and release-readiness tracking.
- CSRF protection.
- Email delivery integration for password reset and notifications when configured.

### Partial Or Limited Areas

The following areas exist but are documented as partial, limited, or intentionally deferred:

- Upload pipeline: upload flow exists, but scanner provider integration is deferred.
- Audit logging: audit persistence exists and is wired into many sensitive actions, but the roadmap still tracks audit coverage as an area to keep aligned.
- Rate limiting: in-memory token bucket exists; distributed SaaS rate limiting is deferred.
- Structured logging and metrics: metrics endpoint exists; full structured logging stack is not complete.
- UI test coverage: component-level React Testing Library coverage is not yet in place.
- i18n: the product is Indonesian-first, but the full i18n framework is not yet installed.

### Planned Modules

The following modules are roadmap items and should not be described as currently available:

- Dedicated exam module for formal school exams such as UTS, UAS, US, or USBN.
- Library module for books, copies, loans, returns, and overdue tracking.
- Multi-year student transcripts.
- Certificate and diploma PDF generation.
- e-Rapor / Kemdikbud DAPODIK export.
- Full i18n framework.
- MFA and optional SSO.
- Background job queue for email, exports, report-card publishing, scan dispatch, and overdue-loan processing.
- API versioning.
- Expanded component-level UI tests.

## User Workflows By Role

### Administrator Workflow

An administrator can set up the school profile, create users, assign roles, manage students and teachers, create academic years, activate an academic year, configure classes, manage subjects and majors, assign teachers, manage schedules, link parents to students, review analytics, configure school settings, publish report card snapshots, and track governance readiness.

### Teacher Workflow

A teacher can view assigned classes and subjects, manage relevant schedules, create attendance sessions, record student attendance, upload or manage learning materials, create assignments, review student submissions, grade work, give feedback, participate in forums, create notes, manage class calendar items, and record teacher attendance.

### Student Workflow

A student can view schedule information, access materials, view assignments, submit work, receive grades and feedback, view report card information, participate in allowed forum discussions, manage notes, receive notifications, and view relevant calendar events.

### Parent Workflow

A parent can link to a child through an invite flow, view linked children, check selected child attendance and grade information, view assignments and school updates, and receive notifications. Parent visibility is restricted to linked children.

## Deployment And Operating Modes

Schoolio is documented to support two operating modes:

- **Self-host mode:** uses a school-controlled PostgreSQL database through `DATABASE_URL`.
- **SaaS mode:** uses a SaaS database configuration, with Supabase supported through `SUPABASE_DATABASE_URL`.

The product uses internal credential-based authentication. Future SSO is planned but not currently part of the completed feature set.

## Current Readiness

Schoolio has a broad operational foundation and many core school workflows are implemented. The current release focus is school usability: manual smoke testing, role-specific dashboard improvements, empty states, error boundaries, setup/readiness documentation, and practical flows needed by school staff.

This document is a product overview, not the canonical implementation roadmap. Detailed technical status, backlog, and implementation rules remain in `docs/PLANS.md`.
