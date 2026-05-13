# Build Logs

Chronological handoff log for AI-implemented work. Every AI agent MUST append one entry after completing a task. The human maintainer uses this log to decide what to commit.

---

## Rules

1. **Append an entry after every completed task** — even documentation-only changes.
2. **Do NOT run `git add` or `git commit`** — you only document what should be staged and committed.
3. **Use the exact template below** — the human and the next agent depend on consistent formatting.
4. **Newest entries go at the top** (below this rules section).
5. **Existing entries below the template are historical** — do not modify them.

---

## Entry Template

Copy this template for each new entry:

```md
## YYYY-MM-DD HH:mm TZ - <short task title>

**Agent:** <model/tool used>
**Goal:** <1-2 sentence description of what was accomplished>

### Changes Made
- <bullet list of what was done>

### Files Changed
- `path/to/file1.ts` — <brief description of change>
- `path/to/file2.ts` — <brief description of change>

### Git Instructions

**Stage these files:**
\```bash
git add path/to/file1.ts path/to/file2.ts
\```

**Suggested commit message:**
\```
feat: <concise description in Indonesian conventional commit style>

<optional body with context>
\```

### Verification
- <commands run and their results>

### Follow-ups
- <anything remaining or blocked>
```

---

## 2026-05-05 — Documentation restructuring

**Agent:** Claude Opus 4.6
**Goal:** Audit, consolidate, and restructure all project documentation into 6 clear source-of-truth documents for future AI agent continuity.

### Changes Made
- Created `docs/PRODUCT.md` — product strategy, roadmap, positioning, acceptance criteria
- Created `docs/DESIGN.md` — merged design system (style guide + illustration + image lock + PLANS.md tokens)
- Created `docs/TECHNICAL.md` — architecture, 47 models, 95 API routes, RBAC, auth, conventions
- Created `docs/AGENT_HANDOFF.md` — explicit AI agent workflow protocol
- Rewrote `docs/build_logs.md` — enhanced format with staging/commit instructions
- Rewrote `llms.txt` — updated to point to new doc structure
- Old files to be deleted (content absorbed into new docs)

### Files Changed
- `docs/PRODUCT.md` — new file (product strategy and direction)
- `docs/DESIGN.md` — new file (complete design system reference)
- `docs/TECHNICAL.md` — new file (technical architecture reference)
- `docs/AGENT_HANDOFF.md` — new file (AI agent workflow protocol)
- `docs/build_logs.md` — rewritten with new format + preserved history
- `llms.txt` — rewritten to point to new structure
- `docs/PLANS.md` — to be deleted (content distributed to new docs)
- `docs/README.md` — to be deleted (replaced by AGENT_HANDOFF.md)
- `docs/ILLUSTRATION_GUIDE.md` — to be deleted (absorbed into DESIGN.md)
- `docs/IMAGE_STYLE_LOCK.yaml` — to be deleted (absorbed into DESIGN.md)
- `overview.md` — to be deleted (absorbed into PRODUCT.md)
- `schoolio_design_system_style_guide.md` — to be deleted (absorbed into DESIGN.md)

### Git Instructions

**Stage the new/modified files:**
```bash
git add docs/PRODUCT.md docs/DESIGN.md docs/TECHNICAL.md docs/AGENT_HANDOFF.md docs/build_logs.md llms.txt
```

**Then remove the old files:**
```bash
git rm docs/PLANS.md docs/README.md docs/ILLUSTRATION_GUIDE.md docs/IMAGE_STYLE_LOCK.yaml overview.md schoolio_design_system_style_guide.md
```

**Suggested commit message:**
```
docs: restructure documentation into 6 source-of-truth documents

Decomposed monolithic PLANS.md into focused documents:
- PRODUCT.md (strategy, roadmap, priorities)
- DESIGN.md (merged design system + illustration + image style)
- TECHNICAL.md (architecture, models, API, RBAC, auth)
- AGENT_HANDOFF.md (AI agent workflow protocol)
- build_logs.md (enhanced format with staging/commit guidance)

Deleted redundant files whose content was absorbed.
```

### Verification
- All content from PLANS.md accounted for in new documents
- Design system fully merged from 3 source files
- No duplicate content across new documents
- BUILD_LOGS template includes explicit git staging instructions

### Follow-ups
- Align `app/globals.css` tokens with DESIGN.md warm-paper direction (current uses blue-primary)
- First implementation task: EmptyState component (see PRODUCT.md Phase 2)

---

## Historical Entries

- 2026-04-29: Wired the dashboard sidebar sign-out button to `POST /api/auth/logout` and redirected users back to `/auth`. Archived the leftover governance runtime from the active app by removing the admin menu entry, page, API routes, frontend handlers, tests, and active roadmap references while leaving `docs/archive/` intact as historical reference.

- 2026-04-29: Rebuilt `prisma/seed.ts` into a realistic school demo dataset for SMA Al Hikmah Nusantara. Added login-ready `AuthCredential` rows, teacher/student/parent relationships, schedules, assignments, attendance, forum, notifications, report-card examples, and published [docs/DEMO_CREDENTIALS.md](docs/DEMO_CREDENTIALS.md) with usable demo accounts.

- 2026-04-28: Removed obsolete governance readiness automation now that the old approval plan lives under `docs/archive/`. Deleted legacy governance sync/readiness scripts and CI workflows, cleaned active references from `llms.txt` and `docs/PLANS.md`, and restored archive docs to passive-reference status.

## 2026-04-25 14:44 +07:00 - Add AI entrypoint and build log workflow

- Agent/tool: Codex, `docs-writer` skill.
- Goal: Add a root AI handoff file and a durable workflow log for future AI agents.
- Changes made: Created `llms.txt`, created this build log, updated AI quick-start/workflow rules.
- Files changed: `llms.txt`, `docs/build_logs.md`, `docs/PLANS.md`, `docs/README.md`.
- Verification run: Confirmed files exist and references updated.

## 2026-04-25 14:55 +07:00 - Invalidate reset tokens after password change

- Agent/tool: Codex.
- Goal: Close P0 auth gap so password changes invalidate outstanding reset links.
- Changes made: Added shared reset-token invalidation helper, wired into change/reset flows, added tests.
- Files changed: `lib/password-reset.ts`, auth route files, related tests.
- Verification run: `npm run test`; `npm run lint`.

## 2026-04-25 15:01 +07:00 - Harden teacher subject/class authorization

- Agent/tool: Codex.
- Goal: Close P0 AUTHZ matrix gap for teacher-scoped subject/class management.
- Changes made: Made `canTeacherManageSubjectClass` tenant-aware, added tenant checks.
- Files changed: `lib/authz.ts`, schedule/material/attendance routes, related tests.
- Verification run: `npm run test`; `npm run lint`.

## 2026-04-25 15:05 +07:00 - Add P0 auth and upload rate limiting

- Agent/tool: Codex.
- Goal: Add rate limiting for high-risk endpoints.
- Changes made: Added in-memory token bucket, wired into auth and upload endpoints.
- Files changed: `lib/rate-limit.ts`, auth/upload route files, related tests.
- Verification run: `npm run test`; `npm run lint`.

## 2026-04-25 15:11 +07:00 - Add P0 CSRF middleware

- Agent/tool: Codex.
- Goal: Enforce double-submit CSRF protection.
- Changes made: Added CSRF utilities, middleware enforcement, client header sending.
- Files changed: `lib/csrf.ts`, `middleware.ts`, `lib/api-client.ts`, related tests.
- Verification run: `npm run test`; `npm run lint`.

## 2026-04-25 15:52 +07:00 - Restore production build gate

- Agent/tool: Codex.
- Goal: Make project compile cleanly under Next 16 + React 19 + TypeScript.
- Changes made: Migrated route params, fixed type mismatches, wrapped pages in Suspense.
- Files changed: Multiple route/component/lib files.
- Verification run: `npm run build`; `npm run test`.

## 2026-04-25 16:03 +07:00 - Add shared audit writer

- Agent/tool: Codex.
- Goal: Centralize audit writes for sensitive mutations.
- Changes made: Added `lib/audit.ts`, wired `recordAudit` into sensitive endpoints.
- Files changed: `lib/audit.ts`, sensitive API routes, related tests.
- Verification run: `npm run build`; `npm run test`.

## 2026-04-25 16:07 +07:00 - Tenant-scope schedule clash detection

- Agent/tool: Codex.
- Goal: Scope schedule clash validation by school.
- Changes made: Scoped academic-year resolution and overlap lookups by schoolId.
- Files changed: Schedule route files, related tests.
- Verification run: `npm run build`; `npm run test`.

## 2026-04-25 16:11 +07:00 - Harden attendance session uniqueness

- Agent/tool: Codex.
- Goal: Verify sessionKey cannot be client-bypassed.
- Changes made: Kept sessionKey server-generated only, scoped writes by school.
- Files changed: Attendance session routes, related tests.
- Verification run: `npm run build`; `npm run test`.

## 2026-04-25 16:14 +07:00 - Wire Resend notification email

- Agent/tool: Codex.
- Goal: Deliver notification email through Resend when configured.
- Changes made: Generalized Resend client, added notification templates, wired into notification service.
- Files changed: `lib/resend.ts`, `lib/notification-service.ts`, `lib/email-templates/notifications.ts`, tests.
- Verification run: `npm run build`; `npm run test`.

## 2026-04-25 17:12 +07:00 - Defer scanner security backlog

- Agent/tool: Codex.
- Goal: Reprioritize toward school usability over deeper security hardening.
- Changes made: Marked scanner and distributed rate limiting as deferred.
- Files changed: Documentation only.

## 2026-04-25 17:25 +07:00 - Add standalone landing page concept

- Agent/tool: Codex.
- Goal: Create standalone landing page HTML concept.
- Changes made: Added `landing-page.html`.
- Files changed: `landing-page.html`.

## 2026-04-25 17:53 +07:00 - Add and rewrite overview document

- Agent/tool: Codex.
- Goal: Create neutral product overview for stakeholders.
- Changes made: Added then rewrote `overview.md` to be factual product inventory.
- Files changed: `overview.md`.
