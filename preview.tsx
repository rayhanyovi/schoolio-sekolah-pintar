import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function Icon({ name, className = "h-6 w-6" }) {
  const commonProps = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  const paths = {
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </>
    ),
    barChart: (
      <>
        <path d="M3 3v18h18" />
        <path d="M7 16V9" />
        <path d="M12 16V5" />
        <path d="M17 16v-3" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </>
    ),
    checkCircle: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    clipboard: (
      <>
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="m9 14 2 2 4-5" />
      </>
    ),
    fileText: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    sparkles: (
      <>
        <path d="M12 3 9.7 8.3 4 10.5l5.7 2.2L12 18l2.3-5.3 5.7-2.2-5.7-2.2z" />
        <path d="M5 3v4" />
        <path d="M3 5h4" />
        <path d="M19 17v4" />
        <path d="M17 19h4" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  };

  return <svg {...commonProps}>{paths[name] ?? paths.checkCircle}</svg>;
}

const features = [
  {
    icon: "users",
    title: "Multi-role portals",
    description:
      "Separate experiences for administrators, teachers, students, and parents, with role-based access built in.",
  },
  {
    icon: "calendar",
    title: "Academic scheduling",
    description:
      "Manage classes, subjects, teachers, rooms, schedules, templates, and conflict-aware school timetables.",
  },
  {
    icon: "clipboard",
    title: "Attendance workflows",
    description:
      "Record student attendance, create attendance sessions from schedules, track teacher attendance, and handle substitutes.",
  },
  {
    icon: "fileText",
    title: "Assignments & grading",
    description:
      "Create assignments, collect submissions, review work, provide feedback, manage grade weights, and publish report snapshots.",
  },
  {
    icon: "book",
    title: "Learning materials",
    description:
      "Share class materials, organize question banks, reuse question packages, and support everyday classroom learning.",
  },
  {
    icon: "barChart",
    title: "School analytics",
    description:
      "View role-scoped analytics for attendance, grades, demographics, overview data, and system metrics.",
  },
];

const roles = [
  {
    role: "Administrators",
    label: "School setup",
    text: "Set up school profiles, users, academic years, classes, subjects, schedules, report cards, analytics, settings, parent links, and readiness tracking.",
  },
  {
    role: "Teachers",
    label: "Daily classroom work",
    text: "Manage classes, attendance, assignments, materials, submissions, grading, feedback, discussions, notes, calendar items, and teacher attendance.",
  },
  {
    role: "Students",
    label: "Learning workspace",
    text: "Access schedules, materials, assignments, submissions, grades, report cards, forums, notes, notifications, and calendar events.",
  },
  {
    role: "Parents",
    label: "Linked child view",
    text: "View linked children’s selected grades, attendance, assignments, school updates, and notifications through a restricted parent portal.",
  },
];

const proofPoints = [
  "Multi-tenant school structure",
  "Role-based access control",
  "Parent-student linking",
  "Report card snapshots",
  "In-app notifications",
  "CSRF protection",
  "Self-host and SaaS database modes",
  "Governance readiness tracking",
];

const workflowItems = [
  "Create the school profile and users",
  "Configure academic years, classes, subjects, and majors",
  "Build schedules and class rosters",
  "Run attendance, assignments, materials, and grading",
  "Publish stable report snapshots and keep parents informed",
];

const dashboardStats = [
  ["Attendance", "94%", "5 active sessions"],
  ["Assignments", "28", "9 need review"],
  ["Notifications", "143", "37 unread"],
  ["Classes", "18", "6 scheduled now"],
];

const recentActivity = [
  "Math assignment graded for XI IPA 2",
  "Parent linked to student profile",
  "Report card snapshot published",
];

const navItems = ["Platform", "Roles", "Workflow", "Contact"];

export function runSchoolioLandingPageTests() {
  const featureTitles = features.map((feature) => feature.title);
  const roleTitles = roles.map((role) => role.role);
  const supportedFeatureIcons = features.every((feature) => Boolean(feature.icon));

  console.assert(features.length === 6, "Expected six feature cards.");
  console.assert(roles.length === 4, "Expected four role cards.");
  console.assert(roleTitles.includes("Administrators"), "Expected Administrators role.");
  console.assert(roleTitles.includes("Teachers"), "Expected Teachers role.");
  console.assert(roleTitles.includes("Students"), "Expected Students role.");
  console.assert(roleTitles.includes("Parents"), "Expected Parents role.");
  console.assert(featureTitles.includes("Academic scheduling"), "Expected scheduling feature.");
  console.assert(supportedFeatureIcons, "Expected every feature to define a local icon key.");
  console.assert(dashboardStats.length === 4, "Expected four dashboard stats.");
  console.assert(recentActivity.length === 3, "Expected three recent activity items.");
  console.assert(workflowItems.length === 5, "Expected five workflow items.");
  console.assert(navItems.length === 4, "Expected four navigation items.");

  return true;
}

function SectionHeading({ eyebrow, title, description, maxWidth = "max-w-[10ch]" }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_0.5fr] lg:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#0e6b53]">
          {eyebrow}
        </p>
        <h2
          className={`mt-4 font-sans text-[clamp(2.7rem,5.8vw,5.25rem)] font-bold leading-[0.92] tracking-[-0.05em] text-[#13231f] ${maxWidth}`}
        >
          {title}
        </h2>
      </div>
      <p className="max-w-xl text-base leading-8 text-[#5b685f] sm:text-lg">{description}</p>
    </div>
  );
}

export default function SchoolioLandingPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ea] font-sans text-[#13231f] selection:bg-[#d7a12b]/30">
      <div className="absolute inset-0 -z-50 bg-[radial-gradient(circle_at_8%_10%,rgba(215,161,43,0.16),transparent_26rem),linear-gradient(90deg,rgba(19,35,31,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(19,35,31,0.026)_1px,transparent_1px)] bg-[length:auto,38px_38px,38px_38px]" />

      <header className="sticky top-0 z-50 border-b border-transparent bg-[#f8f4ea]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-[#074838]/25 bg-[#0e6b53] text-[#fffaf0] shadow-sm">
              <div className="h-3.5 w-3.5 rotate-45 border-b-2 border-r-2 border-current" />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-[-0.03em] text-[#13231f]">
                Schoolio / Sekolah Pintar
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm font-medium text-[#13231f]/72 transition hover:text-[#13231f]"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Button
              variant="outline"
              className="h-11 rounded-full border-[#c94932]/30 bg-[#c94932]/8 px-5 font-semibold text-[#8d2f22] hover:bg-[#c94932]/12 hover:text-[#8d2f22]"
            >
              View demo
            </Button>
            <Button className="h-11 rounded-full border border-[#074838] bg-[#074838] px-5 font-semibold text-[#fffaf0] shadow-[0_14px_28px_rgba(7,72,56,0.18)] hover:bg-[#0e6b53]">
              Start now
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#13231f]/10">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-16 lg:grid-cols-[0.9fr_0.95fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="relative z-10"
          >
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-[#0e6b53]/18 bg-[#0e6b53]/8 px-4 py-2 text-sm font-semibold text-[#074838]">
              <span className="h-2 w-2 rounded-full bg-[#0e6b53] shadow-[0_0_0_6px_rgba(14,107,83,0.12)]" />
              Indonesian-first school operations platform
            </div>

            <h1 className="mt-6 max-w-[10ch] font-sans text-[clamp(3.4rem,7vw,6.25rem)] font-bold leading-[0.9] tracking-[-0.055em] text-[#102420]">
              Run school work calmer.
            </h1>

            <p className="mt-6 max-w-2xl text-[clamp(1.02rem,1.3vw,1.2rem)] leading-8 text-[#5b685f]">
              Schoolio, also known as Sekolah Pintar, brings administration,
              classroom activity, communication, reporting, and parent visibility
              into one role-based web application for Indonesian schools.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button className="h-12 rounded-full border border-[#074838] bg-[#074838] px-6 text-base font-semibold text-[#fffaf0] shadow-[0_16px_34px_rgba(7,72,56,0.2)] hover:bg-[#0e6b53]">
                Request a demo
                <Icon name="arrowRight" className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-full border border-[#c94932]/30 bg-[#fffaf0]/70 px-6 text-base font-semibold text-[#8d2f22] hover:bg-[#c94932]/8 hover:text-[#8d2f22]"
              >
                View school workflows
              </Button>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#13231f]/12 bg-[#13231f]/12 sm:grid-cols-3">
              {[
                ["4", "User roles"],
                ["360°", "School view"],
                ["RBAC", "Access model"],
              ].map(([value, label]) => (
                <div key={label} className="bg-[#fffaf0]/78 p-5">
                  <strong className="block text-3xl font-bold tracking-[-0.05em] text-[#13231f] sm:text-4xl">
                    {value}
                  </strong>
                  <span className="mt-2 block text-sm text-[#5b685f]">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-[32px] bg-[#102420]/4 blur-2xl" />
            <div className="rounded-[30px] border border-[#13231f]/10 bg-[#ece7dc] p-4 shadow-[0_28px_80px_rgba(19,35,31,0.14)] sm:p-6">
              <div className="rounded-[24px] border border-[#13231f]/10 bg-[#f6f1e6] p-4 sm:p-5">
                <div className="mb-5 flex items-center justify-between rounded-[16px] bg-[#07553f] px-5 py-4 text-[#fffaf0]">
                  <strong className="text-base font-semibold tracking-[-0.03em]">
                    School overview
                  </strong>
                  <div className="flex gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#d7a12b]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#c94932]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#2a8b93]" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {dashboardStats.map(([label, value, hint]) => (
                    <div
                      key={label}
                      className="rounded-[18px] border border-[#13231f]/10 bg-white/42 p-4 sm:p-5"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#506159]">
                        {label}
                      </p>
                      <p className="mt-3 text-3xl font-bold tracking-[-0.045em] text-[#13231f]">
                        {value}
                      </p>
                      <p className="mt-1 text-sm text-[#5b685f]">{hint}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-[18px] border border-[#13231f]/10 bg-white/42 p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#13231f]">
                    <Icon name="bell" className="h-4 w-4 text-[#0e6b53]" />
                    Recent activity
                  </div>

                  <div className="grid gap-3">
                    {recentActivity.map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm text-[#4d5d55]">
                        <Icon
                          name="checkCircle"
                          className="mt-0.5 h-4 w-4 flex-none text-[#0e6b53]"
                        />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 rounded-[18px] border border-[#13231f]/10 bg-[#fffaf0]/75 p-5 md:grid-cols-[1.05fr_0.95fr]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5b685f]">
                      Designed for real school roles
                    </p>
                    <h3 className="mt-3 max-w-[16ch] text-2xl font-semibold leading-tight tracking-[-0.04em] text-[#13231f]">
                      Structured access without flattening the workflow.
                    </h3>
                  </div>
                  <p className="text-sm leading-7 text-[#5b685f]">
                    Each role gets focused access while school data remains
                    organized by school, class, relationship, and permission.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-6 py-24 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Core platform"
            title="Daily school operations in one system."
            description="From setup to schedules, attendance to report cards, Schoolio keeps school data organized inside one shared application."
          />

          <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className={`rounded-[18px] border-[#13231f]/12 bg-[#fffaf0]/78 shadow-none transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(19,35,31,0.08)] ${
                  index === 0 || index === 3
                    ? "lg:col-span-5"
                    : index === 1 || index === 4
                      ? "lg:col-span-3"
                      : "lg:col-span-4"
                }`}
              >
                <CardContent className="flex h-full flex-col justify-between p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0e6b53] text-[#fffaf0]">
                    <Icon name={feature.icon} className="h-5 w-5" />
                  </div>

                  <div className="mt-8">
                    <h3 className="text-[1.75rem] font-semibold leading-[1.02] tracking-[-0.04em] text-[#13231f]">
                      {feature.title}
                    </h3>
                    <p className="mt-4 leading-7 text-[#5b685f]">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#13231f]/10 bg-[#fffaf0]/55 px-6 py-24 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Built around people"
            title="Four focused experiences."
            description="Each user type gets the tools and information they need, without exposing unrelated workflows or sensitive records."
            maxWidth="max-w-[9ch]"
          />

          <div className="mt-14 grid gap-px overflow-hidden rounded-[20px] border border-[#13231f]/12 bg-[#13231f]/12 sm:grid-cols-2">
            {roles.map((item, index) => (
              <div key={item.role} className="bg-[#f8f4ea] p-7 sm:p-8">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0e6b53] text-sm font-semibold text-[#fffaf0]">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5b685f]">
                    {item.label}
                  </span>
                </div>

                <h3 className="text-3xl font-semibold tracking-[-0.045em] text-[#13231f]">
                  {item.role}
                </h3>
                <p className="mt-4 leading-7 text-[#5b685f]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#0e6b53]">
              Access and governance
            </p>
            <h2 className="mt-4 max-w-[9ch] text-[clamp(2.7rem,5.8vw,5rem)] font-bold leading-[0.92] tracking-[-0.05em] text-[#13231f]">
              Controlled by design.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#5b685f] sm:text-lg">
              Schoolio supports controlled school data through tenant separation,
              role-scoped access, parent-child links, and readiness tracking.
            </p>

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {proofPoints.map((item) => (
                <div key={item} className="grid grid-cols-[28px_1fr] gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0e6b53] text-[#fffaf0]">
                    <Icon name="checkCircle" className="h-4 w-4" />
                  </span>
                  <span className="pt-0.5 font-medium leading-6 text-[#13231f]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden rounded-[22px] border-[#13231f]/14 bg-[#fffaf0] shadow-[0_24px_70px_rgba(19,35,31,0.12)]">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-[#13231f]/12 p-6">
                <strong className="text-2xl font-semibold tracking-[-0.04em] text-[#13231f] sm:text-3xl">
                  Operational flow
                </strong>
                <span className="rounded-full bg-[#0e6b53]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#074838]">
                  Active
                </span>
              </div>

              <div>
                {workflowItems.map((item, index) => (
                  <div
                    key={item}
                    className="grid gap-4 border-b border-[#13231f]/10 p-6 last:border-b-0 sm:grid-cols-[88px_1fr_auto] sm:items-center"
                  >
                    <span className="text-sm font-semibold tracking-[0.14em] text-[#5b685f]">
                      0{index + 1}
                    </span>
                    <p className="font-medium leading-7 text-[#13231f]">{item}</p>
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                        index % 3 === 0
                          ? "bg-[#d7a12b]/18 text-[#7e5812]"
                          : index % 3 === 1
                            ? "bg-[#c94932]/10 text-[#8d2f22]"
                            : "bg-[#0e6b53]/10 text-[#074838]"
                      }`}
                    >
                      Step
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#13231f] px-6 py-24 text-[#fffaf0] lg:px-8 lg:py-28">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,250,240,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(255,250,240,0.04)_1px,transparent_1px)] bg-[length:42px_42px]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_0.42fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d7a12b]">
              Ready for school usability
            </p>
            <h2 className="mt-4 max-w-[10ch] text-[clamp(3rem,6.2vw,5.8rem)] font-bold leading-[0.92] tracking-[-0.05em] text-[#fffaf0]">
              Bring school operations to one screen.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#fffaf0]/72 sm:text-lg">
              Use Schoolio to simplify daily coordination across administrators,
              teachers, students, and parents.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button className="h-12 rounded-full border border-[#fffaf0] bg-[#fffaf0] px-6 text-base font-semibold text-[#13231f] hover:bg-[#f8f4ea]">
              Start with Schoolio
              <Icon name="arrowRight" className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-full border border-[#fffaf0]/25 bg-[#fffaf0]/5 px-6 text-base font-semibold text-[#fffaf0] hover:bg-[#fffaf0]/10 hover:text-[#fffaf0]"
            >
              Talk to the team
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-[#13231f] px-6 pb-10 text-sm text-[#fffaf0]/60 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 border-t border-[#fffaf0]/15 pt-6">
          <span>Schoolio / Sekolah Pintar</span>
          <span>School management for Indonesian schools.</span>
        </div>
      </footer>
    </main>
  );
}