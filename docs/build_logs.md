# Build Logs

Chronological handoff log for AI-implemented work. Append one entry after every implemented task so the next agent can understand what changed, how it was verified, and what remains.

- 2026-04-29: Wired the dashboard sidebar sign-out button to `POST /api/auth/logout` and redirected users back to `/auth`. Archived the leftover governance runtime from the active app by removing the admin menu entry, page, API routes, frontend handlers, tests, and active roadmap references while leaving `docs/archive/` intact as historical reference.

- 2026-04-29: Rebuilt `prisma/seed.ts` into a realistic school demo dataset for SMA Al Hikmah Nusantara. Added login-ready `AuthCredential` rows, teacher/student/parent relationships, schedules, assignments, attendance, forum, notifications, report-card examples, and published [docs/DEMO_CREDENTIALS.md](docs/DEMO_CREDENTIALS.md) with usable demo accounts.

- 2026-04-28: Removed obsolete governance readiness automation now that the old approval plan lives under `docs/archive/`. Deleted legacy governance sync/readiness scripts and CI workflows, cleaned active references from `llms.txt` and `docs/PLANS.md`, and restored archive docs to passive-reference status.

## Entry Template

```md
## YYYY-MM-DD HH:mm TZ - <short task title>

- Agent/tool:
- Goal:
- Changes made:
- Files changed:
- Verification run:
- Follow-ups/blockers:
```

## 2026-04-25 14:44 +07:00 - Add AI entrypoint and build log workflow

- Agent/tool: Codex, `docs-writer` skill.
- Goal: Add a root AI handoff file and a durable workflow log for future AI agents.
- Changes made: Created `llms.txt`, created this build log, updated AI quick-start/workflow rules, and corrected the docs README entrypoint reference.
- Files changed: `llms.txt`, `docs/build_logs.md`, `docs/PLANS.md`, `docs/README.md`.
- Verification run: Confirmed `llms.txt`, `docs/build_logs.md`, `docs/PLANS.md`, and `docs/README.md` exist; searched docs entrypoints for stale root-plan references.
- Follow-ups/blockers: None.

## 2026-04-25 14:55 +07:00 - Invalidate reset tokens after password change

- Agent/tool: Codex.
- Goal: Close P0 auth gap so successful password changes invalidate outstanding password reset links.
- Changes made: Added shared reset-token invalidation helper, called it from authenticated password change and reset-token creation/reset flows, and added focused unit/integration coverage.
- Files changed: `lib/password-reset.ts`, `app/api/auth/change-password/route.ts`, `app/api/auth/forgot-password/route.ts`, `app/api/auth/reset-password/route.ts`, `app/api/users/[id]/reset-password/route.ts`, `tests/unit/password-reset.unit.test.ts`, `tests/integration/auth-change-password.integration.test.ts`, `docs/PLANS.md`, `docs/build_logs.md`.
- Verification run: `npm exec -- vitest run tests/unit/password-reset.unit.test.ts tests/integration/auth-change-password.integration.test.ts`; `npm run lint`; `npm run test`. `npm exec -- tsc --noEmit` still fails on existing repo-wide typing issues unrelated to this task.
- Follow-ups/blockers: Next P0 item is auditing `AUTHZ_MATRIX` against `lib/authz.ts`.

## 2026-04-25 15:01 +07:00 - Harden teacher subject/class authorization

- Agent/tool: Codex, `test-writer` skill.
- Goal: Close P0 AUTHZ matrix gap for teacher-scoped subject/class management.
- Changes made: Made `canTeacherManageSubjectClass` tenant-aware, added subject/class tenant checks, required school context in affected schedule/material/attendance write paths, scoped schedule and attendance detail lookups by class school, and added unit coverage for teacher and parent scope helpers.
- Files changed: `lib/authz.ts`, `app/api/schedules/route.ts`, `app/api/schedules/[id]/route.ts`, `app/api/materials/route.ts`, `app/api/materials/[id]/route.ts`, `app/api/attendance/sessions/route.ts`, `app/api/attendance/sessions/[id]/route.ts`, `tests/unit/authz-policy.unit.test.ts`, `tests/integration/schedule-conflict.integration.test.ts`, `tests/integration/attendance-duplicate.integration.test.ts`, `tests/integration/role-teacher.e2e.test.ts`, `docs/PLANS.md`, `docs/build_logs.md`.
- Verification run: `npm exec -- vitest run tests/unit/authz-policy.unit.test.ts tests/integration/schedule-conflict.integration.test.ts tests/integration/attendance-duplicate.integration.test.ts tests/integration/role-teacher.e2e.test.ts tests/integration/authz-sensitive.integration.test.ts`; `npm run test`; `npm run lint`. `npm exec -- tsc --noEmit` still fails on existing repo-wide route/test typing debt.
- Follow-ups/blockers: Next P0 item is rate limiting `/api/auth/*` and `/api/uploads/*`.

## 2026-04-25 15:05 +07:00 - Add P0 auth and upload rate limiting

- Agent/tool: Codex.
- Goal: Add rate limiting for high-risk auth and upload endpoints before release.
- Changes made: Added dependency-free in-memory token bucket helper with `RateLimit-*`/`Retry-After` headers; wired it into login, register, forgot/reset/change password, upload intent creation, upload content, and upload confirmation; added unit and login-route regression tests.
- Files changed: `lib/rate-limit.ts`, `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`, `app/api/auth/forgot-password/route.ts`, `app/api/auth/reset-password/route.ts`, `app/api/auth/change-password/route.ts`, `app/api/uploads/intents/route.ts`, `app/api/uploads/intents/[id]/content/route.ts`, `app/api/uploads/intents/[id]/confirm/route.ts`, `tests/unit/rate-limit.unit.test.ts`, `tests/integration/auth-login.integration.test.ts`, `tests/integration/upload-intent-validation.integration.test.ts`, `docs/PLANS.md`, `docs/build_logs.md`.
- Verification run: `npm exec -- vitest run tests/unit/rate-limit.unit.test.ts tests/integration/auth-login.integration.test.ts tests/integration/upload-intent-validation.integration.test.ts tests/integration/auth-change-password.integration.test.ts tests/unit/password-reset.unit.test.ts`; `npm run test`; `npm run lint`.
- Follow-ups/blockers: Distributed SaaS/Upstash-backed rate limit storage remains pending; next P0 item is CSRF middleware.

## 2026-04-25 15:11 +07:00 - Add P0 CSRF middleware

- Agent/tool: Codex, `test-writer` skill.
- Goal: Enforce double-submit CSRF protection for unsafe same-origin API requests.
- Changes made: Added CSRF helper utilities, issued readable CSRF cookies from middleware, rejected unsafe `/api/*` requests without matching `schoolio_csrf` cookie and `X-CSRF-Token` header, and taught shared browser request/upload helpers to send the header.
- Files changed: `lib/csrf.ts`, `middleware.ts`, `lib/api-client.ts`, `lib/handlers/uploads.ts`, `tests/unit/csrf.unit.test.ts`, `tests/unit/middleware-onboarding.unit.test.ts`, `docs/PLANS.md`, `llms.txt`, `docs/build_logs.md`.
- Verification run: `npm exec -- vitest run tests/unit/csrf.unit.test.ts tests/unit/middleware-onboarding.unit.test.ts`; `npm run test`; `npm run lint`; `npm run test:release-authz-integrity`.
- Follow-ups/blockers: Review CSRF behavior before introducing Next server actions or non-API unsafe routes; next backlog item is audit logging for sensitive endpoints.

## 2026-04-25 15:52 +07:00 - Restore production build gate

- Agent/tool: Codex.
- Goal: Make the current project compile cleanly under Next 16, React 19, TypeScript, and Prisma generated types so release checks can be trusted.
- Changes made: Migrated dynamic API route params to the async Next route contract, fixed generated type mismatches for Prisma enums and JSON nulls, tightened route search/filter typings, wrapped `useSearchParams` pages in `Suspense`, updated React Day Picker v9 calendar overrides, and corrected UI type mismatches found by the production build.
- Files changed: `app/api/**/[id]*/route.ts`, `app/auth/page.tsx`, `app/onboarding/page.tsx`, `components/**`, `lib/api.ts`, `lib/handlers/attendance.ts`, `lib/handlers/uploads.ts`, `lib/schedule-time.ts`, `scripts/academic-year-rollover.ts`, `docs/PLANS.md`, `docs/build_logs.md`.
- Verification run: `npm run build`; `npm run test`; `npm run lint` (passes with existing warnings); `npm run test:release-authz-integrity`; searched `app/api` for stale sync route params and codemod residue.
- Follow-ups/blockers: Next 16 warns that the `middleware` file convention is deprecated in favor of `proxy`; plan a focused migration after release-critical P1 audit logging.

## 2026-04-25 16:03 +07:00 - Add shared audit writer

- Agent/tool: Codex.
- Goal: Finish Phase 1.3 by centralizing audit writes and covering sensitive mutations with durable `AuditLog` records.
- Changes made: Added `lib/audit.ts`, replaced direct `auditLog.create` calls with `recordAudit`, added audit events for self-service reset password, authenticated change password, school profile updates, and report-card publishing, and tenant-scoped report-card snapshot publishing by school context.
- Files changed: `lib/audit.ts`, sensitive API routes under `app/api/**`, `scripts/academic-year-rollover.ts`, `tests/unit/audit.unit.test.ts`, `tests/integration/auth-change-password.integration.test.ts`, `tests/integration/report-card-snapshot.integration.test.ts`, `docs/PLANS.md`, `docs/build_logs.md`.
- Verification run: `npm exec -- vitest run tests/unit/audit.unit.test.ts tests/integration/auth-change-password.integration.test.ts tests/unit/password-reset.unit.test.ts`; `npm exec -- vitest run tests/integration/report-card-snapshot.integration.test.ts`; `npm run build`; `npm run test`; `npm run lint` (passes with existing warnings); `npm run test:release-authz-integrity`; searched for remaining direct `auditLog.create` calls outside `lib/audit.ts`.
- Follow-ups/blockers: Existing lint warnings remain. Next prioritized backlog item is server-side schedule clash detection.

## 2026-04-25 16:07 +07:00 - Tenant-scope schedule clash detection

- Agent/tool: Codex.
- Goal: Finish Phase 2.7 schedule clash hardening for direct API create/update calls.
- Changes made: Scoped schedule list academic-year resolution to the actor school, validated class and subject ownership before schedule create/update, and constrained class, teacher, and room overlap lookups by `schoolId`.
- Files changed: `app/api/schedules/route.ts`, `app/api/schedules/[id]/route.ts`, `tests/integration/schedule-conflict.integration.test.ts`, `docs/PLANS.md`, `docs/build_logs.md`.
- Verification run: `npm exec -- vitest run tests/integration/schedule-conflict.integration.test.ts`; `npm run build`; `npm run test`; `npm run lint` (passes with existing warnings); `npm run test:release-authz-integrity`.
- Follow-ups/blockers: Existing lint warnings remain. Next prioritized backlog item is server enforcement of locked forum threads.

## 2026-04-25 16:07 +07:00 - Reconcile forum lock backlog

- Agent/tool: Codex.
- Goal: Verify and close the stale P1 forum lock backlog item.
- Changes made: Confirmed locked-thread enforcement already exists for create and edit reply direct API calls, with moderator bypass and integration coverage, then marked the backlog item done.
- Files changed: `docs/PLANS.md`, `docs/build_logs.md`.
- Verification run: Reviewed `app/api/forum/threads/[id]/replies/route.ts`, `app/api/forum/replies/[id]/route.ts`, and `tests/integration/forum-lock.integration.test.ts`; `npm run test`; `npm run test:release-authz-integrity`.
- Follow-ups/blockers: Next prioritized backlog item is validating `AttendanceSession` business uniqueness paths.

## 2026-04-25 16:11 +07:00 - Harden attendance session uniqueness

- Agent/tool: Codex.
- Goal: Verify `AttendanceSession` uniqueness cannot be bypassed by client-supplied fields and tighten tenant scope around attendance session writes.
- Changes made: Scoped attendance session list academic-year resolution to the actor school, validated class and subject ownership before create/update, kept `sessionKey` generated exclusively through `lib/attendance-session-key.ts`, and added regression coverage proving body `sessionKey` is ignored.
- Files changed: `app/api/attendance/sessions/route.ts`, `app/api/attendance/sessions/[id]/route.ts`, `tests/integration/attendance-duplicate.integration.test.ts`, `tests/integration/role-teacher.e2e.test.ts`, `docs/PLANS.md`, `docs/build_logs.md`.
- Verification run: `npm exec -- vitest run tests/integration/attendance-duplicate.integration.test.ts tests/integration/role-teacher.e2e.test.ts`; `npm run build`; `npm run test`; `npm run lint` (passes with existing warnings); `npm run test:release-authz-integrity`.
- Follow-ups/blockers: Existing lint warnings remain. Next prioritized backlog item is email delivery via Resend.

## 2026-04-25 16:14 +07:00 - Wire Resend notification email

- Agent/tool: Codex.
- Goal: Finish Phase 1.5 by delivering notification email through the existing Resend client when configured.
- Changes made: Generalized `lib/resend.ts` to send arbitrary email, added notification email templates, and wired `createInAppNotifications` to send best-effort email while honoring global `emailNotifications` and per-type preferences.
- Files changed: `lib/resend.ts`, `lib/notification-service.ts`, `lib/email-templates/notifications.ts`, `tests/unit/notification-service.unit.test.ts`, `docs/PLANS.md`, `llms.txt`, `docs/build_logs.md`.
- Verification run: `npm exec -- vitest run tests/unit/notification-service.unit.test.ts tests/integration/auth-change-password.integration.test.ts tests/integration/role-teacher.e2e.test.ts`; `npm run build`; `npm run test`; `npm run lint` (passes with existing warnings); `npm run test:release-authz-integrity`.
- Follow-ups/blockers: Email delivery remains synchronous/best-effort until Phase 4 background jobs; production needs `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.

## 2026-04-25 17:12 +07:00 - Defer scanner security backlog

- Agent/tool: Codex, `docs-writer` skill.
- Goal: Reprioritize the roadmap toward getting the app running and usable for schools before deeper security hardening.
- Changes made: Marked upload scanner provider integration and distributed SaaS rate limiting as deferred security hardening instead of near-term release blockers, moved scanner down in the continuous backlog, and updated `llms.txt` so future agents focus on school-usability work.
- Files changed: `docs/PLANS.md`, `llms.txt`, `docs/build_logs.md`.
- Verification run: Documentation-only change; no app build or tests required.
- Follow-ups/blockers: Continue tracking scanner integration for later. Immediate focus should be smoke testing, dashboard/UX readiness, setup docs, and role flows needed by school staff.

## 2026-04-25 17:25 +07:00 - Add standalone landing page concept

- Agent/tool: Codex, `frontend-design` skill.
- Goal: Create a standalone landing page for Schoolio / Sekolah Pintar from product documentation context only, without using the app UI code as a reference.
- Changes made: Added a self-contained `landing-page.html` with inline CSS and JavaScript, an immersive school-operations hero scene, role-based tabs, product module sections, workflow copy, non-routing CTA buttons, and an inline favicon.
- Files changed: `landing-page.html`, `docs/build_logs.md`.
- Verification run: Confirmed `landing-page.html` exists and contains inline style/script plus Schoolio landing-page sections; opened through a temporary local static server in Playwright, checked desktop/mobile screenshots, confirmed no console errors and no mobile horizontal overflow. No app build required for this static HTML concept.
- Follow-ups/blockers: Later work can connect CTA buttons to real app routes, replace the concept scene with product screenshots, or convert the page into a Next.js route if it becomes the production homepage.

## 2026-04-25 17:53 +07:00 - Add business overview document

- Agent/tool: Codex, `docs-writer` skill.
- Goal: Create a non-technical project overview that investors and digital marketing collaborators can read to understand and start positioning Schoolio.
- Changes made: Added `overview.md` with executive summary, pitch, target users, stakeholder value, positioning, differentiators, ideal customer profile, buyer personas, marketing messages, go-to-market angles, revenue model ideas, packaging, demo flow, sales discovery questions, investor notes, roadmap highlights, and honest product boundaries.
- Files changed: `overview.md`, `docs/build_logs.md`.
- Verification run: Confirmed `overview.md` exists, reviewed heading structure, and checked that roadmap-only modules are clearly separated from current capabilities. No app build required for this docs-only change.
- Follow-ups/blockers: Consider making a shorter one-page sales sheet and Bahasa Indonesia version for outreach campaigns.

## 2026-04-25 17:59 +07:00 - Rewrite overview as neutral product inventory

- Agent/tool: Codex, `docs-writer` skill.
- Goal: Remove sales, marketing, pricing, and investor framing from `overview.md` and make it an objective product overview.
- Changes made: Replaced pitch and go-to-market sections with factual descriptions of product category, primary users, core product areas, module status, role workflows, deployment modes, current readiness, partial areas, and planned roadmap modules.
- Files changed: `overview.md`, `docs/build_logs.md`.
- Verification run: Confirmed removed headings/terms such as `Pitch`, `Go-To-Market`, `Revenue`, `Packaging`, `Investor Notes`, and `Suggested Taglines` no longer appear; confirmed the document still separates built, partial, and planned modules. No app build required for this docs-only change.
- Follow-ups/blockers: If this document will be shared with Indonesian-only stakeholders, create a separate Bahasa Indonesia version rather than mixing languages in the neutral overview.
