# Design Direction and System

> Complete visual reference for Schoolio / Sekolah Pintar. Everything a coding agent needs to produce consistent UI. This is the design authority — if existing UI conflicts with this guide, refactor toward this guide unless explicitly told otherwise.

Last updated: 2026-05-05

---

## Quick Reference

| Property | Value |
|----------|-------|
| Font | Plus Jakarta Sans (400/500/600/700/800), fallback: Inter, system sans-serif |
| Primary color | Deep green `#074838` |
| Background | Warm paper `#f8f4ea` |
| Card surface | Cream `#fffaf0` |
| Border radius | Cards: `rounded-2xl`; Inputs: `rounded-xl`; Marketing: `rounded-[18px]`; Pills: `rounded-full` |
| Shadows | Warm tan-based; never cool gray |
| Component lib | shadcn/ui (vendored `components/ui/`); never replace |
| Icons | lucide-react only |
| Dark mode | Class strategy via next-themes; warm deep green-black, not pure black |

---

## 1. Design DNA and Personality

### What Schoolio Should Feel Like

- A calm command center for school operations
- A warm paper-based administrative system upgraded into modern software
- Trustworthy enough for school records, grades, attendance, and parent visibility
- Human and approachable, not corporate-cold
- Structured and disciplined, but not rigid or intimidating

### Keywords (North Star)

Calm · Organized · Warm · Institutional · Human · Clear · Reliable · Focused · Editorial · Operational

### Visual Metaphor

"School operations on warm paper." The interface combines warm paper backgrounds, subtle grid textures (suggesting planning sheets, timetables, ledgers), deep green as the institutional anchor, and cards that feel like paper documents.

### What To Avoid

- Futuristic glassmorphism
- Neon gradients
- Black-box AI aesthetics
- Generic blue SaaS styling
- Overly playful children's education visuals
- Bright saturated blue as dominant primary color
- `font-black` for major headings
- Stock education clipart

---

## 2. Design Principles

### Principle 1: Calm First

Every screen should reduce cognitive load.

- Fewer visual levels per screen
- Spacious padding and clear section grouping
- Avoid dense borders everywhere
- Muted backgrounds instead of harsh white
- Warnings visible but not alarming unless truly critical

### Principle 2: Operational Clarity

Screens prioritize task completion over visual decoration.

- Every page: clear title, supporting description, primary action
- Data-heavy views: separate summary, filters, table/list, detail actions
- Status chips, metadata rows, grouped cards for scannability
- Don't hide important workflow actions in ambiguous menus

### Principle 3: Warm Institution, Not Generic SaaS

- Warm surfaces instead of cold gray-white
- Deep green as main brand anchor
- Subtle grid/paper texture on marketing pages and empty states
- Editorial spacing on landing pages; compact operational spacing in app
- Don't overuse illustrations, emojis, or childish visuals

### Principle 4: Same DNA, Different Density

Landing page and app UI share brand DNA but differ in density:

**Landing page:** More editorial, larger headings, more asymmetry, more breathing room, more expressive layout.

**App UI:** More compact, more task-oriented, consistent component sizing, stronger navigation patterns, less decorative texture.

---

## 3. Color System

### Light Mode Palette

```css
:root {
  --schoolio-paper: #f8f4ea;
  --schoolio-paper-strong: #fffaf0;
  --schoolio-paper-muted: #ece7dc;

  --schoolio-ink: #13231f;
  --schoolio-ink-soft: #263a34;
  --schoolio-muted: #5b685f;
  --schoolio-muted-soft: #7a857d;

  --schoolio-line: rgba(19, 35, 31, 0.12);
  --schoolio-line-strong: rgba(19, 35, 31, 0.18);

  --schoolio-green: #0e6b53;
  --schoolio-green-deep: #074838;
  --schoolio-green-soft: rgba(14, 107, 83, 0.10);

  --schoolio-teal: #2a8b93;
  --schoolio-red: #c94932;
  --schoolio-gold: #d7a12b;
  --schoolio-blue: #3e6a99;

  --schoolio-success: #0e6b53;
  --schoolio-warning: #d7a12b;
  --schoolio-danger: #c94932;
  --schoolio-info: #2a8b93;
}
```

### Dark Mode Palette

```css
.dark {
  --schoolio-paper: #101a17;
  --schoolio-paper-strong: #17231f;
  --schoolio-paper-muted: #1d2b26;

  --schoolio-ink: #fffaf0;
  --schoolio-ink-soft: #ebe3d2;
  --schoolio-muted: #b9c0b7;
  --schoolio-muted-soft: #8f9a91;

  --schoolio-line: rgba(255, 250, 240, 0.12);
  --schoolio-line-strong: rgba(255, 250, 240, 0.18);

  --schoolio-green: #4fb796;
  --schoolio-green-deep: #7fd3b9;
  --schoolio-green-soft: rgba(79, 183, 150, 0.14);

  --schoolio-teal: #69b8bf;
  --schoolio-red: #ef7d67;
  --schoolio-gold: #e5bd57;
  --schoolio-blue: #7ca2cc;

  --schoolio-success: #4fb796;
  --schoolio-warning: #e5bd57;
  --schoolio-danger: #ef7d67;
  --schoolio-info: #69b8bf;
}
```

### shadcn Token Mapping

```css
:root {
  --background: var(--schoolio-paper);
  --foreground: var(--schoolio-ink);
  --card: var(--schoolio-paper-strong);
  --card-foreground: var(--schoolio-ink);
  --popover: var(--schoolio-paper-strong);
  --popover-foreground: var(--schoolio-ink);
  --primary: var(--schoolio-green-deep);
  --primary-foreground: var(--schoolio-paper-strong);
  --secondary: var(--schoolio-green-soft);
  --secondary-foreground: var(--schoolio-green-deep);
  --muted: var(--schoolio-paper-muted);
  --muted-foreground: var(--schoolio-muted);
  --accent: rgba(215, 161, 43, 0.16);
  --accent-foreground: var(--schoolio-ink);
  --destructive: var(--schoolio-red);
  --destructive-foreground: var(--schoolio-paper-strong);
  --border: var(--schoolio-line);
  --input: var(--schoolio-line-strong);
  --ring: var(--schoolio-green);
  --radius: 1rem;
}
```

### Color Usage Rules

| Color | Use For |
|-------|---------|
| Deep green (`#074838`) | Primary buttons, active nav, success states, important icons, primary badges |
| Warm paper (`#f8f4ea`) | Page backgrounds, marketing sections, empty states, editorial cards |
| Gold (`#d7a12b`) | Secondary emphasis, warnings (non-critical), decorative dots, feature tags |
| Red (`#c94932`) | Destructive actions, urgent states, absence/problem states, alert accents |
| Teal (`#2a8b93`) | Informational status, analytics accent, secondary role highlights, charts |
| Blue (`#3e6a99`) | Supporting color only — never as dominant primary |

### Role Colors

| Role | Color | Use |
|------|-------|-----|
| Admin | Purple `hsl(262 83% 58%)` | RoleBadge, role-aware UI |
| Teacher | Blue `hsl(221 83% 53%)` | RoleBadge |
| Student | Green `hsl(142 76% 36%)` | RoleBadge |
| Parent | Orange `hsl(38 92% 50%)` | RoleBadge |

### Implementation Note

The current `app/globals.css` uses blue-primary HSL tokens (the older design). The design direction above (warm paper + deep green) is the target. When implementing new UI, use the warm paper direction. When touching existing UI, migrate toward it.

---

## 4. Typography

### Font

```css
font-family: "Plus Jakarta Sans", ui-sans-serif, "Inter", "Segoe UI", system-ui, sans-serif;
```

Weights used: 400 (normal), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold — sparingly).

### App Typography Scale

| Element | Class |
|---------|-------|
| Page title | `text-2xl sm:text-3xl font-semibold tracking-[-0.035em]` |
| Section title | `text-xl font-semibold tracking-[-0.025em]` |
| Card title | `text-base sm:text-lg font-semibold tracking-[-0.015em]` |
| Body | `text-sm sm:text-base leading-6 text-muted-foreground` |
| Metadata label | `text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground` |
| Table text | `text-sm leading-5` |

### Marketing Typography Scale

| Element | Class |
|---------|-------|
| Hero heading | `text-[clamp(3.4rem,7vw,6.25rem)] font-bold leading-[0.9] tracking-[-0.055em]` |
| Section heading | `text-[clamp(2.7rem,5.8vw,5.25rem)] font-bold leading-[0.92] tracking-[-0.05em]` |
| Card heading | `text-[1.5rem] sm:text-[1.75rem] font-semibold leading-[1.05] tracking-[-0.04em]` |
| Eyebrow | `text-sm font-semibold uppercase tracking-[0.22em]` |
| Hero body | `text-[clamp(1.02rem,1.3vw,1.2rem)] leading-8 text-muted-foreground` |

### Typography Rules

- Every page gets one clear `h1`
- Use `font-semibold` for card titles and page titles
- Use `font-bold` for marketing headings only
- Never use `font-black` for primary headings
- Uppercase only for short labels, tags, and metadata
- App UI uses smaller, clearer headings than marketing

---

## 5. Spacing and Layout

### Page Width

| Context | Class |
|---------|-------|
| Marketing pages | `mx-auto max-w-7xl px-6 lg:px-8` |
| App pages | `mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8` |
| Narrow content | `mx-auto max-w-3xl px-6 lg:px-8` |

### Section Spacing

| Context | Value |
|---------|-------|
| Marketing vertical | `py-20` to `py-24` mobile; `lg:py-28` to `lg:py-32` desktop |
| App page top | `pt-6` to `pt-8` |
| App section gaps | `gap-6` to `gap-8` |
| App card padding | `p-5` to `p-6` |

### Grid Patterns

| Context | Class |
|---------|-------|
| Dashboard metrics | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` |
| Two-column layout | `lg:grid-cols-[280px_1fr]` or `lg:grid-cols-[1fr_360px]` |
| Forms | `max-w-2xl` unless admin-heavy |
| Tables | Full width with toolbar above |

### Spacing Scale (Tailwind)

Use the 4-unit scale: `4 / 8 / 12 / 16 / 24 / 32 / 48`. Avoid arbitrary values.

---

## 6. Shape, Radius, Border, and Shadow

### Radius

| Element | Value |
|---------|-------|
| Small controls | `rounded-lg` |
| Inputs | `rounded-xl` |
| Cards (app) | `rounded-2xl` |
| Marketing panels | `rounded-[18px]` to `rounded-[24px]` |
| Pills/buttons (marketing) | `rounded-full` |

### Borders

Light mode: `border border-[#13231f]/10`
Dark mode: `border border-white/10`

### Shadows

| Context | Value |
|---------|-------|
| Marketing hero panel | `shadow-[0_28px_80px_rgba(19,35,31,0.14)]` |
| Elevated app card | `shadow-[0_18px_40px_rgba(19,35,31,0.08)]` |
| Default app cards | No shadow or very soft — rely on border and surface difference |

Shadows are always warm (tan-based). Never cool gray.

---

## 7. Component Patterns

### Buttons

**Primary (marketing):**
```tsx
<Button className="h-11 rounded-full border border-[#074838] bg-[#074838] px-5 font-semibold text-[#fffaf0] shadow-[0_14px_28px_rgba(7,72,56,0.18)] hover:bg-[#0e6b53]">
  Start now
</Button>
```

**Primary (app):**
```tsx
<Button className="h-10 rounded-xl bg-primary px-4 font-semibold text-primary-foreground">
  Save changes
</Button>
```

**Ghost (app):**
```tsx
<Button variant="ghost" className="rounded-xl font-medium text-muted-foreground hover:text-foreground">
  Cancel
</Button>
```

**Button rules:**
- Marketing: `rounded-full`. App: `rounded-xl`.
- Font weight: `font-semibold` (never `font-black`)
- Labels must be action-oriented: "Save changes", "Create class", "Publish report"
- Never use vague labels like "Submit" when a specific verb exists

### Cards

**App card:**
```tsx
<Card className="rounded-2xl border-border bg-card shadow-none">
  <CardHeader className="space-y-1 p-5">
    <CardTitle className="text-lg font-semibold tracking-[-0.02em]">Title</CardTitle>
    <CardDescription>Description text.</CardDescription>
  </CardHeader>
  <CardContent className="p-5 pt-0">...</CardContent>
</Card>
```

**Metric card:**
```tsx
<Card className="rounded-2xl border-border bg-card shadow-none">
  <CardContent className="p-5">
    <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Attendance</p>
    <div className="mt-3 flex items-end justify-between gap-4">
      <p className="text-3xl font-bold tracking-[-0.045em]">94%</p>
      <Badge variant="secondary">Today</Badge>
    </div>
  </CardContent>
</Card>
```

### Forms

- Layout: `max-w-2xl` normal; `max-w-4xl` complex admin
- Input: `h-11 rounded-xl border-border bg-card px-3 text-sm`
- Always use labels (not placeholder-only)
- Show validation errors below fields
- Put destructive actions away from save actions

### Tables

```tsx
<div className="overflow-hidden rounded-2xl border border-border bg-card">
  <Table>...</Table>
</div>
```

Toolbar: search + filters + primary action + optional export.

Rules:
- Clear row hover states
- Status badges visible
- Don't overload rows with actions
- Empty state when filtered results are empty

### Badges and Status

| Variant | Class |
|---------|-------|
| Success | `rounded-full bg-[#0e6b53]/10 text-[#074838]` |
| Warning | `rounded-full bg-[#d7a12b]/18 text-[#7e5812]` |
| Danger | `rounded-full bg-[#c94932]/10 text-[#8d2f22]` |
| Info | `rounded-full bg-[#2a8b93]/10 text-[#226f76]` |
| Neutral | `rounded-full bg-muted text-muted-foreground` |

### Empty States

```tsx
<div className="rounded-2xl border border-dashed border-border bg-card/70 p-8 text-center">
  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0e6b53]/10 text-[#0e6b53]">
    <Icon name="calendar" className="h-5 w-5" />
  </div>
  <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em]">No schedules yet</h3>
  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
    Create a schedule to help teachers, students, and parents see the school day clearly.
  </p>
  <Button className="mt-5 rounded-xl">Create schedule</Button>
</div>
```

Rules:
- Don't blame the user
- Don't use "Nothing here!" as title
- Explain what the area is for
- Offer the next action

### Loading States

Use skeletons matching final layout:
- Dashboard cards: skeleton blocks
- Tables: skeleton rows
- Forms: skeleton field rows
- Detail pages: skeleton header + sections

Never use full-page spinners.

### Error States

Tone: calm and direct.
- Title: "We could not load attendance records."
- Body: "Try refreshing. If this keeps happening, contact your school administrator."
- Actions: "Retry", "Go back"
- Red only for accent, not the whole screen

---

## 8. Navigation

### App Navigation (Desktop)

- Left sidebar: primary modules
- Top bar: school context, search, notifications, profile, theme toggle
- Main content: page header + content grid

Sidebar style: `bg-card`, `border-r border-border`, active item green-soft bg with deep green text, icons 18-20px.

### App Navigation (Mobile)

- Top bar + sheet/drawer sidebar
- Bottom nav acceptable for student/parent if workflows are simple

### Page Header Pattern

```tsx
<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
  <div>
    <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Academics</p>
    <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Class schedules</h1>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
      Manage schedules for the active academic year.
    </p>
  </div>
  <Button className="rounded-xl font-semibold">Create schedule</Button>
</div>
```

---

## 9. Role-Specific UI

### Administrator
- Feel: Structured, clear, powerful, governance-aware
- Prioritize: School setup, users, academic structure, schedules, analytics, settings
- Use tables and filters heavily. Show configuration completeness. Warning badges for incomplete setup.

### Teacher
- Feel: Daily workflow, fast access, classroom-first
- Prioritize: Today's schedule, attendance session, assignments to review, materials, grades
- Show "Today" context. Use quick actions. Don't hide attendance/grading behind too many screens.

### Student
- Feel: Simple, motivating, clear next steps
- Prioritize: Upcoming assignments, schedule, materials, grades/feedback, notifications
- Clear due-date badges. Obvious submission state. Avoid admin-like density.

### Parent
- Feel: Reassuring, limited but useful, child-centered
- Prioritize: Linked children, attendance summary, grades, assignments, school updates
- Always show which child. Plain-language summaries. Never expose raw submission answers.

---

## 10. Dark Mode

Dark mode must feel intentional, not inverted.

- Main page: deep green-black (not pure black)
- Cards: slightly lighter deep surface
- Text: warm paper color
- Muted text: soft warm gray-green
- Borders: warm paper at low opacity
- Primary accents: lighter green for visibility

Anti-patterns: Pure black backgrounds, pure white text everywhere, neon green accents, heavy shadows that disappear, low-contrast muted text.

---

## 11. Motion and Interaction

Motion is subtle and purposeful.

**Use for:** Marketing reveal, hover lift on cards, dialog/drawer transitions, tab state transitions.

**Avoid for:** Every table row, critical forms, dense admin workflows, anything that delays task completion.

Marketing reveal: `initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}`

Hover card: `transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(19,35,31,0.08)]`

Respect `prefers-reduced-motion`.

---

## 12. Copywriting and Tone

### Voice Attributes

Use: Clear, calm, respectful, practical, human, specific, encouraging.
Avoid: Overhyped, salesy, infantilizing, too technical, too casual, fear-based.

### Context-Specific Tone

| Context | Tone |
|---------|------|
| Marketing | Confident and warm. Simple benefit statements. No exaggerated claims. |
| App UI | Direct and task-focused. What happened, what's needed, what to do next. |
| Errors | Calm and accountable. Don't blame the user. Provide next steps. |
| Success | Short and specific. Confirm the action: "Schedule created." |
| Empty states | Helpful and explanatory. Point to next action. |

### Copy Examples

Good: "Run school work calmer."
Good: "No classes yet. Create a class before assigning students, subjects, or schedules."
Good: "Create assignment" (instead of "Submit")

Bad: "Revolutionize your school with next-gen AI-powered transformation."
Bad: "Oopsie! Nothing here."
Bad: "Submit" (when "Create assignment" is more specific)

---

## 13. Indonesian Locale Formatting

| Format | Implementation |
|--------|---------------|
| Date | `format(date, "d MMMM yyyy", { locale: idLocale })` → "21 Februari 2026" |
| Currency | `new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n)` |
| Number | `new Intl.NumberFormat('id-ID').format(n)` |
| Time | `HH:mm` 24-hour |
| Day of week | Use helper in `lib/constants.ts` |

Always import: `import { id as idLocale } from "date-fns/locale"`

---

## 14. Accessibility

Required, not optional:

- Semantic headings in order
- Buttons are `<button>`, links are `<a>`
- Inputs must have labels
- Icon-only buttons need `aria-label`
- Color cannot be the only status indicator
- Strong contrast in both modes
- Visible focus rings: `focus-visible:ring-2 focus-visible:ring-[#0e6b53]/35 focus-visible:ring-offset-2`
- Keyboard navigation for menus, tabs, dialogs, sheets
- Don't animate critical information

---

## 15. Illustration Style (AI Image Generation)

### Modular Paper System

All illustrations use the **Modular Paper System** — school operations rendered as beautiful, layered physical document cards from a bird's-eye view.

### Visual Elements

| Element | Rules |
|---------|-------|
| Cards | Cream surface `#fffaf0`, color-coded header bar, ink borders, rounded corners (4-6px), placeholder text rows |
| Layering | Max 3 layers. Primary card largest/frontmost. Secondary rotated 1-3°. Each card 30%+ visible. |
| Paper texture | Subtle linen grain on all surfaces. Consistent direction. |
| Stamps/seals | Gold seal = approved. Green stamp = system status. Red tag = alert (max 1). |
| Human figures | Simple geometric (circle head + rectangle body). No face. Max 1 per image. Optional. |
| Connectors | Thin leader lines (0.5-0.75pt ink green). Right-angle bends. Max 2-3. |

### Color Palette for Illustrations

| Role | Hex |
|------|-----|
| Background/desk | `#f8f4ea` (warm paper) |
| Card surface | `#fffaf0` (cream) |
| Text/borders/figures | `#13231f` (ink green) |
| Setup headers | `#074838` (deep green) |
| Operations headers | `#0e6b53` (operational green) |
| Records headers | `#2a8b93` (teal) |
| Approved/verified | `#d7a12b` (accent gold) |
| Alert/overdue | `#c94932` (alert red) |

### Strict Rules

**Always:** Warm paper ground, rounded card corners, warm-toned shadows, paper grain texture, color-coded headers, primary card dominant.

**Never:** Scrapbook/collage, handwriting fonts, photographic textures, more than 3 stacked cards, more than 1 figure, more than 1 red element, cool gray shadows, glossy/reflective surfaces, dark backgrounds, gradients/glows, cartoon characters, children as subjects.

### Forbidden Colors in Illustrations

Purple, blue SaaS gradient, neon, cool gray shadows, pure white background.

---

## 16. Implementation Checklist

When implementing or revamping any UI:

1. **Identify page type** — Marketing, auth, dashboard, table/list, detail, form, empty/error
2. **Apply correct layout shell** — Marketing shell, auth shell, or app shell
3. **Apply typography** — One h1, correct scale for context
4. **Apply surface hierarchy** — Paper bg → paper-strong cards → muted panels
5. **Use shadcn components** — Button, Card, Badge, Input, Select, Tabs, Dialog, Sheet, Table, Form
6. **Customize with Schoolio tokens** — Not hardcoded hex
7. **Check responsive** — 360px, 768px, 1024px, 1440px
8. **Check dark mode** — Review visually in dark mode
9. **Check copy** — Calm, practical, specific, action-oriented
10. **Check accessibility** — Labels, focus, headings, keyboard, contrast

---

## 17. Acceptance Criteria for Design Work

A page is acceptable when:

- It follows the warm institutional Schoolio visual DNA
- It uses defined color tokens or approved utility patterns
- It uses sans-serif typography with balanced heading weight
- It supports light and dark mode
- It works responsively (mobile through desktop)
- It uses shadcn components where appropriate
- It has clear information hierarchy
- It avoids generic SaaS styling and childish visuals
- It uses calm, specific copy
- It passes accessibility basics
