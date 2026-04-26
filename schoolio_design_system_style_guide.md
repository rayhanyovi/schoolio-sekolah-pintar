# Schoolio Design System Style Guide

## 1. Purpose

This document is the source of truth for revamping Schoolio’s public landing page and full application UI into a single coherent product experience.

It is written for a coding AI agent working in a React, Tailwind CSS, and shadcn/ui codebase. When implementing or refactoring UI, follow this guide before making local design decisions.

The goal is not to create a generic SaaS interface. The goal is to create a calm, premium, operational school platform that feels trustworthy, organized, warm, and easy for Indonesian school staff, teachers, students, and parents to use.

## 2. Design DNA

### Core personality

Schoolio should feel like:

- A calm command center for school operations.
- A warm paper-based administrative system upgraded into modern software.
- Trustworthy enough for school records, grades, attendance, parent visibility, and operational workflows.
- Human and approachable, not corporate-cold.
- Structured and disciplined, but not rigid or intimidating.

### Keywords

Use these keywords as the north star:

- Calm
- Organized
- Warm
- Institutional
- Human
- Clear
- Reliable
- Focused
- Editorial
- Operational

### Visual metaphor

The visual metaphor is “school operations on warm paper.”

This means the interface should combine:

- Warm paper backgrounds.
- Subtle grid textures that suggest planning sheets, timetables, ledgers, and school administration.
- Deep green as the institutional anchor color.
- Muted accent colors inspired by practical school materials: gold, red, teal, and blue.
- Cards that feel like paper sheets, dashboards, boards, schedules, or organized administrative panels.
- Clear sans-serif typography with strong hierarchy but not overly heavy display weight.

Avoid futuristic glassmorphism, neon gradients, black-box AI aesthetics, generic blue SaaS styling, and overly playful children’s education visuals.

## 3. Product-wide design principles

### Principle 1: Calm first

Every screen should reduce cognitive load. School staff and families should feel that the system makes their work clearer.

Implementation rules:

- Prefer fewer visual levels per screen.
- Use spacious padding and clear section grouping.
- Avoid dense borders everywhere.
- Use muted backgrounds instead of harsh white canvases.
- Keep destructive, warning, and urgent states visible but not alarming unless action is truly critical.

### Principle 2: Operational clarity

Schoolio is a working system. Screens should prioritize completion of school tasks over visual decoration.

Implementation rules:

- Every page should have a clear title, supporting description, and primary action when relevant.
- Data-heavy views must separate summary, filters, table/list, and detail actions clearly.
- Use status chips, metadata rows, and grouped cards to make operations scannable.
- Avoid hiding important workflow actions inside ambiguous menus.

### Principle 3: Warm institution, not generic SaaS

Schoolio should feel appropriate for schools, principals, teachers, administrators, students, and parents.

Implementation rules:

- Use warm surfaces instead of cold gray-white.
- Use deep green as the main brand anchor.
- Use subtle grid or paper texture on marketing/public pages and major empty states.
- Use editorial spacing on landing pages; use compact operational spacing inside the app.
- Do not overuse illustrations, emojis, or childish visuals.

### Principle 4: Same DNA, different density

The landing page and app UI should clearly belong to the same brand, but they must have different density.

Landing page:

- More editorial.
- Larger headings.
- More asymmetry.
- More breathing room.
- More expressive layout.

Application UI:

- More compact.
- More task-oriented.
- More consistent component sizing.
- Stronger navigation patterns.
- Less decorative texture.

## 4. Technology assumptions

The implementation target is:

- React
- Tailwind CSS
- shadcn/ui
- CSS variables for theme tokens
- Light and dark mode support

Preferred implementation approach:

- Define design tokens in global CSS using CSS variables.
- Map those variables into Tailwind and shadcn theme values.
- Prefer reusable layout primitives: `PageShell`, `PageHeader`, `SectionHeader`, `MetricCard`, `DataCard`, `StatusBadge`, `EmptyState`, `AppPanel`, `MarketingSection`.
- Do not hardcode random hex values across components after tokens are established.

## 5. Color system

### Light mode palette

Use this as the base light theme.

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

### Dark mode palette

Dark mode must preserve the warm institutional feeling. It should not become pure black or neon.

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

### shadcn token mapping

Map shadcn variables to Schoolio tokens. Use HSL if the project already uses HSL tokens; otherwise use direct CSS variable values.

Recommended semantic mapping:

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

### Color usage rules

Deep green is the primary action and trust color. Use it for:

- Primary buttons.
- Active navigation states.
- Success states.
- Important icons.
- Primary badges.
- Key dashboard highlights.

Warm paper is the canvas color. Use it for:

- Page backgrounds.
- Marketing sections.
- Empty states.
- Cards that should feel editorial.

Gold is a warm highlight. Use it for:

- Secondary emphasis.
- Warning-adjacent but non-critical states.
- Decorative dots.
- Feature tags.

Red is for:

- Destructive actions.
- Urgent states.
- Attendance absence or problem states.
- Important alert accents.

Teal and blue are supporting colors. Use them for:

- Informational status.
- Analytics accent.
- Secondary role highlights.
- Charts.

Do not use bright saturated blue as the dominant primary color.

## 6. Typography

### Font family

Use sans-serif for all major typography.

Recommended font stack:

```css
font-family: ui-sans-serif, "Inter", "Segoe UI", Candara, "Trebuchet MS", system-ui, sans-serif;
```

If adding a hosted font, prefer:

- Inter
- Geist Sans
- Plus Jakarta Sans
- DM Sans

Do not use serif headings for the final design. Earlier style references used an editorial serif, but the Schoolio final direction should use clean sans-serif headings.

### Typography personality

Headings should be confident but not brutal. Avoid ultra-black, overly compressed, or cartoonish typography.

Use:

- `font-semibold` for card titles and app page titles.
- `font-bold` for marketing hero and section headings.
- `font-medium` for body emphasis and table labels.
- `font-semibold` for buttons and badges.

Avoid:

- `font-black` for primary headings.
- Extreme negative tracking on app UI.
- All-caps long headings.
- Very small body text in data-heavy areas.

### Marketing typography scale

Use this for landing pages and public pages.

Hero heading:

```tsx
className="text-[clamp(3.4rem,7vw,6.25rem)] font-bold leading-[0.9] tracking-[-0.055em]"
```

Section heading:

```tsx
className="text-[clamp(2.7rem,5.8vw,5.25rem)] font-bold leading-[0.92] tracking-[-0.05em]"
```

Card heading:

```tsx
className="text-[1.5rem] sm:text-[1.75rem] font-semibold leading-[1.05] tracking-[-0.04em]"
```

Eyebrow:

```tsx
className="text-sm font-semibold uppercase tracking-[0.22em]"
```

Hero body:

```tsx
className="text-[clamp(1.02rem,1.3vw,1.2rem)] leading-8 text-muted-foreground"
```

### App typography scale

Use this for dashboards and authenticated pages.

App page title:

```tsx
className="text-2xl sm:text-3xl font-semibold tracking-[-0.035em]"
```

App section title:

```tsx
className="text-xl font-semibold tracking-[-0.025em]"
```

Card title:

```tsx
className="text-base sm:text-lg font-semibold tracking-[-0.015em]"
```

Body:

```tsx
className="text-sm sm:text-base leading-6 text-muted-foreground"
```

Metadata label:

```tsx
className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
```

Table text:

```tsx
className="text-sm leading-5"
```

### Typography hierarchy rules

- Every page gets one clear `h1`.
- Avoid more than one giant display heading per viewport.
- Body copy should not compete with headings.
- App UI should use smaller, clearer headings than marketing pages.
- Use uppercase only for short labels, tags, and metadata.
- Do not use `font-black` unless explicitly creating a small numeric/stat emphasis.

## 7. Spacing and layout

### Page width

Marketing pages:

```tsx
className="mx-auto max-w-7xl px-6 lg:px-8"
```

App pages:

```tsx
className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8"
```

Narrow content:

```tsx
className="mx-auto max-w-3xl px-6 lg:px-8"
```

### Section spacing

Marketing sections:

- Mobile vertical padding: `py-20` to `py-24`
- Desktop vertical padding: `lg:py-28` to `lg:py-32`

App pages:

- Page padding top: `pt-6` to `pt-8`
- Section gaps: `gap-6` to `gap-8`
- Card padding: `p-5` to `p-6`

### Grid rhythm

Marketing grids may be expressive:

- Use 12-column layouts for feature cards.
- Mix spans: `lg:col-span-5`, `lg:col-span-3`, `lg:col-span-4`.
- Keep gaps small and precise: `gap-4`.

App grids should be predictable:

- Dashboard metrics: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`.
- Two-column page layout: `lg:grid-cols-[280px_1fr]` or `lg:grid-cols-[1fr_360px]`.
- Forms: max width `max-w-2xl` unless admin-heavy.
- Tables: full width with toolbar above.

### Alignment rules

- Marketing pages may use asymmetry and large visual panels.
- App pages should align to a consistent grid.
- Form labels, controls, and helper text must align predictably.
- Avoid floating panels that overlap critical text.
- Avoid placing readable text over busy textures or visual mockups.

## 8. Shape, radius, border, and shadow

### Radius scale

Use a restrained soft radius.

```txt
Small controls: rounded-lg
Inputs: rounded-xl
Cards: rounded-2xl or rounded-[18px]
Marketing panels: rounded-[24px] to rounded-[30px]
Pills: rounded-full
```

Avoid excessive `rounded-[2rem]` on app UI unless used for a major marketing mockup.

### Borders

Borders are subtle and structural.

Light mode:

```tsx
border border-[#13231f]/10
```

Dark mode:

```tsx
border border-white/10
```

Use borders to define:

- Cards
- Tables
- Panels
- Navigation containers
- Input fields
- Segmented controls

Avoid heavy black borders except for intentional brand moments.

### Shadows

Use shadows sparingly.

Marketing hero panel:

```tsx
shadow-[0_28px_80px_rgba(19,35,31,0.14)]
```

Elevated app card:

```tsx
shadow-[0_18px_40px_rgba(19,35,31,0.08)]
```

Default app cards should usually have no shadow or a very soft shadow. Rely on border and surface difference.

Dark mode shadows should be subtle and not muddy.

## 9. Backgrounds and texture

### Paper background

The default light background is warm paper:

```tsx
bg-[#f8f4ea]
```

Use this for:

- Marketing pages
- Auth layouts
- Empty states
- App shell background, if the app has a warm visual direction

### Grid texture

Use grid texture on:

- Landing hero
- Marketing CTA section
- Large empty states
- Public pages
- Onboarding screens

Do not overuse grid texture inside dense app dashboards.

Recommended light grid:

```tsx
bg-[radial-gradient(circle_at_8%_10%,rgba(215,161,43,0.16),transparent_26rem),linear-gradient(90deg,rgba(19,35,31,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(19,35,31,0.026)_1px,transparent_1px)] bg-[length:auto,38px_38px,38px_38px]
```

Recommended dark grid:

```tsx
bg-[linear-gradient(90deg,rgba(255,250,240,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(255,250,240,0.04)_1px,transparent_1px)] bg-[length:42px_42px]
```

### Surface hierarchy

Light mode:

1. Page: `#f8f4ea`
2. Main card: `#fffaf0`
3. Muted card/panel: `#ece7dc`
4. Elevated paper: `white/42` or `#fffaf0/78`
5. Deep section: `#13231f`

Dark mode:

1. Page: `#101a17`
2. Main card: `#17231f`
3. Muted card/panel: `#1d2b26`
4. Elevated surface: `rgba(255,250,240,0.05)`
5. High-emphasis section: `#fffaf0` text on deep background

## 10. Buttons

Use shadcn `Button` as the base.

### Primary button

Use for the main action on a page.

```tsx
<Button className="h-11 rounded-full border border-[#074838] bg-[#074838] px-5 font-semibold text-[#fffaf0] shadow-[0_14px_28px_rgba(7,72,56,0.18)] hover:bg-[#0e6b53]">
  Start now
</Button>
```

App primary buttons may be slightly less decorative:

```tsx
<Button className="h-10 rounded-xl bg-primary px-4 font-semibold text-primary-foreground">
  Save changes
</Button>
```

### Secondary button

Use for alternate actions.

```tsx
<Button variant="outline" className="h-11 rounded-full border-[#c94932]/30 bg-[#c94932]/[0.08] px-5 font-semibold text-[#8d2f22] hover:bg-[#c94932]/[0.12] hover:text-[#8d2f22]">
  View demo
</Button>
```

### Ghost button

Use for low-emphasis actions in app UI.

```tsx
<Button variant="ghost" className="rounded-xl font-medium text-muted-foreground hover:text-foreground">
  Cancel
</Button>
```

### Destructive button

Use sparingly and always make the consequence clear.

```tsx
<Button variant="destructive" className="rounded-xl font-semibold">
  Delete assignment
</Button>
```

### Button rules

- Marketing buttons use `rounded-full`.
- App buttons use `rounded-xl` unless in a toolbar where pill style is useful.
- Button font weight should usually be `font-semibold`, not `font-black`.
- Button labels should be action-oriented: “Save changes”, “Create class”, “Publish report”, “Review submissions”.
- Do not use vague labels like “Submit” when a more specific verb exists.

## 11. Cards and panels

### Marketing feature card

```tsx
<Card className="rounded-[18px] border-[#13231f]/12 bg-[#fffaf0]/78 shadow-none transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(19,35,31,0.08)]">
  <CardContent className="flex h-full flex-col justify-between p-6">
    ...
  </CardContent>
</Card>
```

### App card

```tsx
<Card className="rounded-2xl border-border bg-card shadow-none">
  <CardHeader className="space-y-1 p-5">
    <CardTitle className="text-lg font-semibold tracking-[-0.02em]">Title</CardTitle>
    <CardDescription>Description text.</CardDescription>
  </CardHeader>
  <CardContent className="p-5 pt-0">
    ...
  </CardContent>
</Card>
```

### Metric card

Use for dashboard numbers.

```tsx
<Card className="rounded-2xl border-border bg-card shadow-none">
  <CardContent className="p-5">
    <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Attendance</p>
    <div className="mt-3 flex items-end justify-between gap-4">
      <p className="text-3xl font-bold tracking-[-0.045em]">94%</p>
      <Badge variant="secondary">Today</Badge>
    </div>
    <p className="mt-2 text-sm text-muted-foreground">5 active sessions</p>
  </CardContent>
</Card>
```

### Panel rules

- Use cards to group related actions and data.
- Do not put every tiny element in a card.
- Prefer one clear primary panel per page.
- Use muted panels for sidebars, filters, and secondary summaries.
- In app UI, avoid decorative rotated cards.

## 12. Navigation

### Public site navigation

Public navigation should be calm and minimal.

Rules:

- Sticky top header is acceptable.
- Background should be translucent warm paper with blur.
- Brand mark should be simple and geometric.
- Navigation labels should be short.
- Use one primary CTA and one secondary CTA maximum.

Recommended structure:

```tsx
<header className="sticky top-0 z-50 border-b border-transparent bg-[#f8f4ea]/80 backdrop-blur-xl">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
    ...
  </div>
</header>
```

### App navigation

The app should use a practical operations layout.

Recommended desktop app shell:

- Left sidebar for primary modules.
- Top bar for school context, search, notifications, profile, and theme toggle.
- Main content area with page header and content grid.

Sidebar style:

- Background: `bg-card` or `bg-[#fffaf0]` in light mode.
- Border right: `border-r border-border`.
- Active item: green-soft background, deep green text.
- Inactive item: muted text, hover foreground.
- Icons: 18px to 20px.
- Labels: 14px, medium weight.

Top bar style:

- Height: 64px to 72px.
- Border bottom.
- Search input rounded-xl.
- Notification/profile controls use ghost buttons.

Mobile app navigation:

- Use a top bar plus sheet/drawer sidebar.
- Bottom navigation may be used for student/parent portals if workflows are simple.

## 13. Forms

Forms must feel clear, calm, and trustworthy.

### Form layout

Use:

- `max-w-2xl` for normal forms.
- `max-w-4xl` for complex admin forms.
- Group related fields into cards or fieldsets.
- Use helper text for school-specific concepts.

### Input styling

```tsx
<Input className="h-11 rounded-xl border-border bg-card px-3 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-[#0e6b53]/30" />
```

### Label styling

```tsx
<FormLabel className="text-sm font-medium text-foreground" />
```

### Helper text

```tsx
<p className="text-sm leading-6 text-muted-foreground">Helper text goes here.</p>
```

### Form rules

- Use clear labels, not placeholder-only inputs.
- Show validation errors directly below fields.
- Use calm explanatory copy for irreversible actions.
- Put destructive actions away from primary save actions.
- Keep submit actions sticky only on long admin forms.

## 14. Tables and data views

Schoolio will contain many operational tables: users, students, classes, subjects, schedules, attendance, assignments, grades, report cards, and parent links.

### Table container

```tsx
<div className="overflow-hidden rounded-2xl border border-border bg-card">
  <Table>...</Table>
</div>
```

### Table toolbar

Include:

- Page-specific search
- Filters
- Date range if relevant
- Primary action
- Export action if relevant

Toolbar style:

```tsx
<div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
  ...
</div>
```

### Table rules

- Use clear row hover states.
- Keep status visible with badges.
- Do not overload rows with too many actions.
- Use row click for details only if it is obvious.
- Put destructive row actions in a menu or confirmation flow.
- Use empty states when filtered results are empty.

## 15. Badges, status, and chips

Badges are important for school workflows.

### Status badge variants

Success:

```tsx
className="rounded-full bg-[#0e6b53]/10 text-[#074838] dark:bg-[#4fb796]/14 dark:text-[#7fd3b9]"
```

Warning:

```tsx
className="rounded-full bg-[#d7a12b]/18 text-[#7e5812] dark:bg-[#e5bd57]/16 dark:text-[#e5bd57]"
```

Danger:

```tsx
className="rounded-full bg-[#c94932]/10 text-[#8d2f22] dark:bg-[#ef7d67]/14 dark:text-[#ef7d67]"
```

Info:

```tsx
className="rounded-full bg-[#2a8b93]/10 text-[#226f76] dark:bg-[#69b8bf]/14 dark:text-[#69b8bf]"
```

Neutral:

```tsx
className="rounded-full bg-muted text-muted-foreground"
```

### Status language examples

Attendance:

- Present
- Late
- Sick
- Excused
- Absent

Assignments:

- Draft
- Published
- Open
- Closed
- Submitted
- Needs review
- Graded

Report cards:

- Draft
- Ready
- Published
- Archived

User accounts:

- Active
- Invited
- Incomplete
- Suspended

## 16. Empty states

Empty states should be useful, not cute.

### Empty state anatomy

- Small icon or simple shape.
- Clear title.
- Helpful explanation.
- Primary action if the user can fix it.
- Secondary documentation link only when useful.

Example:

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

### Empty state rules

- Do not blame the user.
- Do not use “Nothing here!” as the main title.
- Explain what the area is for.
- Offer the next best action.

## 17. Loading, skeletons, and errors

### Loading

Use skeletons that match the final layout.

- Dashboard cards: skeleton blocks.
- Tables: skeleton rows.
- Forms: skeleton field rows.
- Detail pages: skeleton header and sections.

### Error states

Tone should be calm and direct.

Example:

Title: “We could not load attendance records.”
Body: “Try refreshing the page. If this keeps happening, contact your school administrator.”
Actions: “Retry”, “Go back”

### Error design

- Use red only for the accent, not the whole screen.
- Keep the main card warm and readable.
- Include a practical next action.

## 18. Icons

Use simple outline icons.

Recommended source:

- lucide-react, if the project bundles it normally.
- Local inline SVG icon wrapper if CDN import issues exist.

Icon rules:

- Default app icon size: 18px or 20px.
- Marketing feature icon size: 20px to 24px.
- Icons should support text, not replace it.
- Do not use complex filled illustrations for operational screens.
- Keep icon stroke consistent, preferably 2px.

## 19. Motion and interaction

Motion should be subtle and purposeful.

Use motion for:

- Marketing reveal on hero and section cards.
- Hover lift on marketing cards.
- Dialog and drawer transitions.
- Sidebar or tab state transitions.

Avoid motion for:

- Every table row.
- Critical forms.
- Dense admin workflows.
- Anything that delays task completion.

Recommended marketing reveal:

```tsx
initial={{ opacity: 0, y: 22 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.55 }}
```

Hover card:

```tsx
className="transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(19,35,31,0.08)]"
```

Respect reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## 20. Landing page direction

The landing page must share the same design DNA as the app, but it can be more expressive.

### Landing page structure

Recommended order:

1. Sticky navigation.
2. Hero with large calm heading and dashboard mockup.
3. Platform/core features section.
4. Role-based experiences section.
5. Workflow or operations section.
6. Trust/governance/security section.
7. CTA.
8. Footer.

### Hero rules

- Use warm paper background with subtle grid.
- Use a large sans-serif heading, but not `font-black`.
- Use `font-bold`, tight but readable line-height.
- Place the product UI mockup to the right on desktop and below on mobile.
- Do not overlap readable text with mockup cards.
- Keep hero body width under `max-w-2xl`.
- CTA group should include one primary action and one secondary action.

Hero heading style:

```tsx
className="text-[clamp(3.4rem,7vw,6.25rem)] font-bold leading-[0.9] tracking-[-0.055em]"
```

### Landing visual mockups

Mockups should look like simplified Schoolio panels, not actual screenshots.

Use:

- Dashboard cards.
- Schedule rows.
- Attendance summaries.
- Recent activity.
- Role-scoped access note.

Avoid:

- Fake browser chrome that dominates the layout.
- Excessive rotated panels.
- Overlapping note cards that cover important content.
- Tiny unreadable text.

## 21. App UI direction

The app UI must be operational, fast, and easy to scan.

### App shell

Recommended structure:

```tsx
<AppShell>
  <Sidebar />
  <div className="flex min-h-screen flex-1 flex-col">
    <Topbar />
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader />
      <PageContent />
    </main>
  </div>
</AppShell>
```

### Page header

Every major app page should start with:

- Title
- Description
- Optional breadcrumbs
- Optional primary action

Example:

```tsx
<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
  <div>
    <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Academics</p>
    <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Class schedules</h1>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
      Manage class, subject, teacher, room, and time assignments for the active academic year.
    </p>
  </div>
  <Button className="rounded-xl font-semibold">Create schedule</Button>
</div>
```

### Dashboard pages

Dashboard pages should use:

- Greeting/context header.
- 3 to 4 metric cards.
- Main content grid.
- Recent activity or upcoming schedule side panel.
- Role-specific shortcuts.

Do not show every possible module on the dashboard. Show what helps the role act today.

### Detail pages

Detail pages should use:

- Header with status badge.
- Summary card.
- Tabs for related data.
- Timeline/activity when relevant.
- Clear primary action.

## 22. Role-specific UI notes

### Administrator UI

Feel:

- Structured
- Clear
- Powerful
- Governance-aware

Prioritize:

- School setup
- Users
- Academic structure
- Schedules
- Analytics
- Readiness
- Settings

Design notes:

- Use tables and filters heavily.
- Show configuration completeness.
- Use warning badges for incomplete setup.
- Keep destructive actions protected by confirmation.

### Teacher UI

Feel:

- Daily workflow
- Fast access
- Classroom-first

Prioritize:

- Today’s schedule
- Attendance session
- Assignments to review
- Materials
- Grades
- Forum activity

Design notes:

- Show “Today” context clearly.
- Use quick actions.
- Avoid hiding attendance and grading behind too many screens.

### Student UI

Feel:

- Simple
- Motivating
- Clear next steps

Prioritize:

- Upcoming assignments
- Schedule
- Materials
- Grades and feedback
- Notifications

Design notes:

- Use clear due-date badges.
- Make submission state obvious.
- Avoid admin-like density.

### Parent UI

Feel:

- Reassuring
- Limited but useful
- Child-centered

Prioritize:

- Linked children
- Attendance summary
- Grades
- Assignments
- School updates

Design notes:

- Never expose raw student submission answers if product rules prohibit it.
- Always show which child the parent is viewing.
- Use plain-language summaries.

## 23. Copywriting and tone of voice

### Brand voice

Schoolio should sound calm, practical, and trustworthy. It should feel like a reliable operations partner for schools, not a hype-driven SaaS product.

### Voice attributes

Use copy that is:

- Clear
- Calm
- Respectful
- Practical
- Human
- Specific
- Encouraging

Avoid copy that is:

- Overhyped
- Salesy
- Infantilizing
- Too technical for normal users
- Too casual for school administrators
- Fear-based

### Tone by context

Marketing pages:

- Confident and warm.
- Explain the value clearly.
- Use simple benefit-driven statements.
- Avoid exaggerated claims.

App UI:

- Direct and task-focused.
- Tell the user what happened, what is needed, and what to do next.
- Use specific verbs.

Errors:

- Calm and accountable.
- Avoid blaming the user.
- Provide next steps.

Success messages:

- Short and specific.
- Confirm the completed action.

Empty states:

- Helpful and explanatory.
- Point to the next action.

### Copy examples

Good marketing heading:

“Run school work calmer.”

Good section heading:

“Daily school operations in one system.”

Good app page title:

“Class schedules”

Good helper text:

“Create schedules for the active academic year so teachers and students can see the correct class times.”

Good success toast:

“Schedule created.”

Good error message:

“We could not save the attendance session. Check your connection and try again.”

Good empty state:

“No classes yet. Create a class before assigning students, subjects, or schedules.”

Avoid:

“Revolutionize your school with next-gen AI-powered transformation.”

Avoid:

“Oopsie! Nothing here.”

Avoid:

“Submit.”

Prefer:

“Create assignment.”

## 24. Accessibility

Accessibility is required, not optional.

Rules:

- Use semantic headings in order.
- Buttons must be buttons, links must be links.
- Inputs must have labels.
- Icon-only buttons need `aria-label`.
- Color cannot be the only status indicator.
- Maintain strong contrast in light and dark mode.
- Use visible focus rings.
- Support keyboard navigation for menus, tabs, dialogs, and sheets.
- Do not animate critical information in a way that prevents reading.

Focus ring style:

```tsx
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e6b53]/35 focus-visible:ring-offset-2
```

Dark mode focus ring:

```tsx
focus-visible:ring-[#4fb796]/45
```

## 25. Dark mode implementation rules

Dark mode must feel intentional, not inverted.

### Dark mode surfaces

- Main page: deep green-black.
- Cards: slightly lighter deep surface.
- Text: warm paper.
- Muted text: soft warm gray-green.
- Borders: warm paper at low opacity.
- Primary accents: lighter green for visibility.

### Dark mode anti-patterns

Avoid:

- Pure black backgrounds.
- Pure white text everywhere.
- Neon green accents.
- Heavy shadows that disappear.
- Low-contrast muted text.

### Component example

```tsx
<Card className="rounded-2xl border-border bg-card text-card-foreground shadow-none">
  <CardContent className="p-5">
    <h3 className="text-lg font-semibold tracking-[-0.02em]">Attendance</h3>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">Today’s attendance sessions.</p>
  </CardContent>
</Card>
```

Use semantic tokens whenever possible so dark mode works automatically.

## 26. Implementation checklist for coding agents

When revamping a page, follow this checklist.

### Step 1: Identify page type

Classify the page as one of:

- Marketing page
- Auth page
- App dashboard
- App table/list page
- App detail page
- App form page
- Empty/error state

### Step 2: Apply layout shell

Use the correct shell:

- Marketing shell for public pages.
- Auth shell for login/register/reset.
- App shell for authenticated product pages.

### Step 3: Apply typography hierarchy

- One `h1`.
- Use marketing scale for public pages.
- Use app scale for product UI.
- Avoid `font-black` for headings.

### Step 4: Apply surface hierarchy

- Warm paper page background.
- Paper-strong cards.
- Muted panels for secondary content.
- Deep green/dark section only for major CTA or focus areas.

### Step 5: Use shadcn components

Prefer shadcn primitives:

- Button
- Card
- Badge
- Input
- Select
- Tabs
- Dialog
- Sheet
- DropdownMenu
- Table
- Tooltip
- Form

Customize with Schoolio classes and tokens.

### Step 6: Check responsive behavior

Every page must work at:

- 360px mobile
- 768px tablet
- 1024px laptop
- 1440px desktop

### Step 7: Check dark mode

Every page must be visually reviewed in dark mode.

### Step 8: Check copy

Copy must be calm, practical, specific, and action-oriented.

### Step 9: Check accessibility

Verify labels, focus states, headings, keyboard navigation, and contrast.

## 27. Tailwind utility patterns

### Marketing section wrapper

```tsx
<section className="px-6 py-24 lg:px-8 lg:py-28">
  <div className="mx-auto max-w-7xl">...</div>
</section>
```

### App page wrapper

```tsx
<div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
  ...
</div>
```

### Warm card

```tsx
className="rounded-2xl border border-border bg-card text-card-foreground shadow-none"
```

### Marketing card

```tsx
className="rounded-[18px] border-[#13231f]/12 bg-[#fffaf0]/78 shadow-none transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(19,35,31,0.08)]"
```

### Page header layout

```tsx
className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
```

### Metric grid

```tsx
className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
```

### Data grid

```tsx
className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]"
```

## 28. Do and do not list

### Do

- Use warm paper colors.
- Use deep green as the anchor.
- Use clean sans-serif headings.
- Use generous spacing on marketing pages.
- Use compact, consistent spacing in the app.
- Use clear page headers.
- Use role-specific dashboard content.
- Use shadcn primitives.
- Support dark mode with semantic tokens.
- Write calm, specific UI copy.

### Do not

- Do not use `font-black` for major headings.
- Do not use cold generic SaaS blue as the main color.
- Do not overuse gradients.
- Do not make the app feel childish.
- Do not overlap readable text on mockups.
- Do not use tiny low-contrast text.
- Do not make destructive actions visually equal to primary actions.
- Do not create one-off colors without adding a token.
- Do not ignore dark mode.

## 29. Acceptance criteria for revamp work

A revamped page is acceptable when:

- It clearly follows the warm institutional Schoolio visual DNA.
- It uses the defined color tokens or approved utility patterns.
- It uses sans-serif typography with balanced heading weight.
- It supports light and dark mode.
- It works responsively across mobile, tablet, and desktop.
- It uses shadcn components where appropriate.
- It has clear information hierarchy.
- It avoids generic SaaS styling.
- It avoids childish education visuals.
- It uses calm, specific copy.
- It passes accessibility basics.

## 30. Final implementation instruction for coding agents

When implementing any UI in Schoolio, treat this style guide as the design authority. If existing UI conflicts with this guide, refactor toward this guide unless the user explicitly says otherwise.

Prioritize consistency over novelty. A new page should feel like it belongs to the same system as the landing page, the dashboards, the forms, the tables, the parent portal, and the school administration workflows.

The final product should make school operations feel calmer, clearer, and more controlled.
