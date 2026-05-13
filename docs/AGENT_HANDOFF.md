# AI Agent Handoff Guide

> The definitive "start here" for any AI coding agent working on Schoolio / Sekolah Pintar. Follow this protocol exactly.

Last updated: 2026-05-05

---

## 1. Reading Order

Before starting any task, read these files in order:

1. **This file** (`docs/AGENT_HANDOFF.md`) — workflow protocol
2. **`docs/BUILD_LOGS.md`** — recent work history (read the latest 3-5 entries to understand current state)
3. **`docs/PRODUCT.md`** — product direction, roadmap, what to build and why
4. **`docs/TECHNICAL.md`** — architecture, models, API routes, auth, RBAC, conventions
5. **`docs/DESIGN.md`** — visual direction, tokens, components, illustration style
6. **`prisma/schema.prisma`** — domain model source of truth
7. **`lib/api.ts`** — `requireAuth`, `requireRole`, `requireSchoolContext`, `parseJsonBody`, `jsonOk`, `jsonError`
8. **`lib/authz.ts`** — RBAC + ownership helpers
9. **`lib/schemas.ts`** — all Zod schemas (add new ones here, never inline)
10. **`middleware.ts`** — auth gating, onboarding gating, CSRF enforcement

For feature-specific work, also read:
- `app/api/<feature>/route.ts` — route handler
- `lib/handlers/<feature>.ts` — business logic
- `components/pages/<Feature>.tsx` — UI component

---

## 2. Understanding the Project (5-Minute Orientation)

**What:** Indonesian-first multi-tenant school management web app.

**Stack:** Next.js 16 App Router + React 19 + TypeScript + Prisma + PostgreSQL + Tailwind + shadcn/ui.

**Scope:** 47 database models, 95 API routes, 19 dashboard pages, 4 roles (ADMIN, TEACHER, STUDENT, PARENT).

**Tenant boundary:** `SchoolProfile.id` — every Prisma query must be scoped by `schoolId`.

**Current focus:** UX polish (empty states, error boundaries, role dashboards) before adding new modules.

**Deployment:** Self-host (PostgreSQL) and SaaS (Supabase) modes via `APP_MODE` env var.

---

## 3. Mandatory Engineering Rules

These are non-negotiable. Violating any of these is a bug.

1. **Never accept userId/authorId/studentId/teacherId from request body.** Always derive from the authenticated `actor`.
2. **Every protected route starts with `requireAuth(request)`.** No exceptions.
3. **Never bypass `requireSchoolContext(actor)`.** All queries scoped by schoolId.
4. **Zod schemas go in `lib/schemas.ts` only.** Export by name. Never inline validation.
5. **Business logic goes in `lib/handlers/<feature>.ts`.** Route handlers are orchestration only.
6. **Return responses with `jsonOk(data)` or `jsonError(code, message, status)`.** No raw Response constructors.
7. **Use existing shadcn/Radix UI components.** Never add alternative UI libraries (MUI, Chakra, Mantine, Ant).
8. **Use Indonesian conventional commits:** `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`.
9. **After every task, append to `docs/BUILD_LOGS.md`.** Include staging instructions and commit message.
10. **Do NOT run `git add` or `git commit`.** Document what to stage and commit — the human decides.

---

## 4. Common Commands

```bash
npm run dev                       # Next.js dev server
npm run build                     # Production build (includes prisma generate)
npm run lint                      # ESLint
npm run test                      # Vitest run all tests
npm run test:watch                # Vitest watch mode
npm run prisma:generate           # Regenerate Prisma client
npm run prisma:migrate            # Run database migrations
npm run prisma:studio             # GUI database inspector
npm run academic-year:rollover    # End-of-year processing script
npm run test:release-authz-integrity  # Authorization validation gate
```

---

## 5. Current Release Focus

**Phase 2 — UX Polish and School Usability**

Priority order:
1. EmptyState component across all list pages
2. Error boundaries on every dashboard route
3. Role-scoped dashboard widgets
4. i18n framework (next-intl)
5. Bulk operations UI

See `docs/PRODUCT.md` Section 7 for full roadmap with acceptance criteria.

---

## 6. Before Starting Any Task

Checklist:

- [ ] Read the latest BUILD_LOGS entries — is there ongoing work that affects your task?
- [ ] Check if the task relates to a pending product decision (TP-DEC-001 through 006 in PRODUCT.md)
- [ ] Identify which files you will need to modify
- [ ] Check if existing patterns/components already solve part of the problem
- [ ] Verify you understand the RBAC rules for the affected resources (TECHNICAL.md Section 6)
- [ ] If the task involves UI: read DESIGN.md first, check existing component patterns

---

## 7. During Implementation

### Adding a New API Endpoint

1. Create route handler: `app/api/<feature>/route.ts`
2. Route handler structure (every time):
   ```typescript
   const actor = await requireAuth(request)
   requireRole(actor, [ALLOWED_ROLES])
   const { schoolId } = await requireSchoolContext(actor)
   // ownership check via lib/authz.ts helper
   const body = await parseJsonBody(request, mySchema)
   const result = await myHandler(body, schoolId, actor)
   return jsonOk(result)
   ```
3. Add business logic: `lib/handlers/<feature>.ts`
4. Add Zod schema: `lib/schemas.ts`
5. Add test: `tests/integration/<feature>-<scenario>.integration.test.ts`
6. If sensitive write: add `recordAudit(...)` call

### Adding a New UI Page

1. Read `docs/DESIGN.md` — understand typography, spacing, component patterns
2. Create page: `app/dashboard/<feature>/page.tsx`
3. Add error boundary: `app/dashboard/<feature>/error.tsx`
4. Use existing layout: `components/layout/DashboardLayout.tsx`
5. Follow page header pattern (see DESIGN.md Section 8)
6. Include empty state for lists
7. Include loading skeleton
8. Support dark mode via semantic tokens
9. Test at 360px, 768px, 1024px, 1440px

### Modifying Existing Features

1. Read the existing route handler, handler, and page/component
2. Don't restructure architecture unless the task specifically requires it
3. Preserve existing API response shapes (breaking change = migration required)
4. Run affected tests after changes
5. Verify with `npm run build` (catches type errors)

---

## 8. After Completing a Task

**You MUST do all of the following:**

1. **Run verification:**
   ```bash
   npm run lint
   npm run test
   npm run build
   ```

2. **Append an entry to `docs/BUILD_LOGS.md`** using the exact template format (see BUILD_LOGS.md for template). This entry MUST include:
   - What you did
   - Which files changed
   - Exact `git add` command with file paths
   - Suggested commit message
   - Verification results
   - Any follow-ups or blockers

3. **Do NOT run git commands.** The human will review your BUILD_LOGS entry and decide whether to commit.

---

## 9. How to Update Documentation

| What changed | Which doc to update |
|-------------|-------------------|
| New feature shipped / status changed | `docs/PRODUCT.md` Section 6 (status) |
| New API endpoint added | `docs/TECHNICAL.md` Section 5 |
| New database model added | `docs/TECHNICAL.md` Section 4 |
| New authorization rule | `docs/TECHNICAL.md` Section 6 |
| Product decision approved | `docs/PRODUCT.md` Section 10 |
| Design token or component pattern changed | `docs/DESIGN.md` |
| New critical file to reuse | `docs/TECHNICAL.md` Section 9 |
| Any task completed | `docs/BUILD_LOGS.md` (append entry) |

---

## 10. Common Mistakes to Avoid

1. **Accepting IDs from request body** — Always derive user identity from authenticated session actor. Never trust client-sent userId, teacherId, studentId.

2. **Missing school scope** — Every single Prisma query must filter by `schoolId`. If you write `prisma.class.findMany({})` without schoolId, that's a multi-tenant data leak.

3. **Inline Zod schemas** — Even for "simple" validations. Always put them in `lib/schemas.ts`.

4. **Hardcoding hex colors** — Use semantic tokens from the design system. `bg-primary`, not `bg-[#074838]` (except in marketing-specific spots documented in DESIGN.md).

5. **Introducing new UI libraries** — The ecosystem is locked: shadcn/ui + Radix + Tailwind + Recharts + Sonner + lucide-react. Nothing else.

6. **Forgetting empty states** — Every list view MUST show a helpful empty state. Never a blank page.

7. **Skipping BUILD_LOGS** — Even if the change seems small, document it. The next agent depends on this history.

8. **Running git commit** — You document; the human commits. Always.

9. **Breaking API response shapes** — Adding fields is fine. Removing or renaming fields breaks clients.

10. **Putting logic in route handlers** — Route handlers are thin orchestration. Business logic belongs in `lib/handlers/`.

---

## 11. Demo Credentials

For smoke testing, see `docs/DEMO_CREDENTIALS.md`.

Quick reference (non-production only):
- Admin: `admin/admin`
- Teacher: `teacher/teacher`
- Student: `student/student`
- Parent: `parent/parent`

Full demo dataset: SMA Al Hikmah Nusantara with 12 teachers, 12 students, 12 parents, schedules, assignments, attendance, forum, and notifications.

---

## 12. Decision-Making Guide

### Is this feature done?

A feature is "done" when:
- API endpoint exists and handles auth/role/school/ownership correctly
- UI exists with loading, empty, error, and success states
- Tests exist (at least integration test for handler)
- It appears in PRODUCT.md feature matrix as BUILT
- It's documented in BUILD_LOGS

### Should I build this?

Check PRODUCT.md Section 7 (roadmap) and Section 9 (out of scope). If it's not in the roadmap and not explicitly requested by the user, ask before building.

### Should I refactor this?

Only if:
- The task specifically requires it
- It's blocking the current work
- It's a direct improvement with no behavior change

Don't refactor for aesthetics. Don't introduce abstractions beyond what the task requires.

---

## 13. Document Relationships

```
docs/AGENT_HANDOFF.md  ← YOU ARE HERE (workflow protocol)
  ├── docs/PRODUCT.md      (what to build, why, priorities)
  ├── docs/TECHNICAL.md    (how the system works)
  ├── docs/DESIGN.md       (how it should look)
  ├── docs/BUILD_LOGS.md   (what was done recently)
  └── docs/DEMO_CREDENTIALS.md  (test accounts)

Supporting source-of-truth files:
  ├── prisma/schema.prisma   (data model)
  ├── lib/api.ts             (API helpers)
  ├── lib/authz.ts           (RBAC)
  ├── lib/schemas.ts         (validation)
  └── middleware.ts          (request pipeline)

Historical reference (read-only):
  └── docs/archive/          (22 files — governance, SOPs, audits)
```
