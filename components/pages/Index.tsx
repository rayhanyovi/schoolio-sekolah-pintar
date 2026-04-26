"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  LockKeyhole,
  MessageSquareText,
  UploadCloud,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Platform", href: "#platform" },
  { label: "Workflows", href: "#workflows" },
  { label: "Trust", href: "#trust" },
];

const sellPoints = [
  {
    icon: CalendarDays,
    title: "Academic structure",
    text: "Classes, subjects, majors, rooms, schedules, and teacher mappings stay organized from the start.",
  },
  {
    icon: ClipboardCheck,
    title: "Daily classroom flow",
    text: "Teachers can manage attendance, materials, assignments, submissions, grading, and feedback in one place.",
  },
  {
    icon: UsersRound,
    title: "Role-specific portals",
    text: "Admins, teachers, students, and parents each get the right level of access without unnecessary clutter.",
  },
  {
    icon: FileCheck2,
    title: "Reliable records",
    text: "Grades, attendance, submissions, reports, and activity history stay connected for review and reporting.",
  },
];

const workflows = [
  [
    "01",
    "Set the school structure",
    "Configure classes, subjects, majors, rooms, schedules, teacher assignments, and academic relationships.",
  ],
  [
    "02",
    "Run the school day",
    "Handle attendance, lessons, materials, assignments, submissions, discussions, grading, and feedback.",
  ],
  [
    "03",
    "Close the loop",
    "Turn daily activity into records, reports, analytics, snapshots, and parent visibility.",
  ],
];

const roleShowcases = [
  {
    eyebrow: "untuk admin",
    title: "Control the school structure from one operating view.",
    body: "Administrators get the clearest path to configure academic data, user access, parent links, and readiness without switching contexts.",
    previewLabel: "Administrator workspace",
    reverse: false,
    features: [
      {
        title: "School setup",
        text: "Manage users, classes, subjects, majors, rooms, academic years, and school profile data.",
      },
      {
        title: "Parent links",
        text: "Create parent-child relationships and keep family visibility intentionally scoped.",
      },
      {
        title: "Readiness tracking",
        text: "Monitor governance, reporting, and operational setup before the school day starts.",
      },
    ],
  },
  {
    eyebrow: "untuk guru",
    title: "Move through daily classroom work without losing the class context.",
    body: "Teachers can start from today’s schedule, record attendance, distribute materials, review submissions, and give feedback in one flow.",
    previewLabel: "Teacher workspace",
    reverse: true,
    features: [
      {
        title: "Attendance sessions",
        text: "Create or open sessions from the schedule and record student presence clearly.",
      },
      {
        title: "Assignments and feedback",
        text: "Publish work, review submissions, grade responses, and return feedback to students.",
      },
      {
        title: "Class materials",
        text: "Keep lesson files, notes, calendar items, and discussions connected to the class.",
      },
    ],
  },
  {
    eyebrow: "untuk siswa",
    title: "Give students one place to see what matters next.",
    body: "Students get a focused view of schedules, materials, assignments, submissions, grades, notes, and class updates.",
    previewLabel: "Student workspace",
    reverse: false,
    features: [
      {
        title: "Today’s work",
        text: "See upcoming classes, assignments, materials, and deadlines in a calmer view.",
      },
      {
        title: "Submission status",
        text: "Track submitted work, pending tasks, grades, and teacher feedback.",
      },
      {
        title: "Class updates",
        text: "Follow relevant notes, discussions, notifications, and calendar events.",
      },
    ],
  },
  {
    eyebrow: "untuk orang tua",
    title: "Keep parents informed without exposing the wrong school data.",
    body: "Parents see selected information for linked children, including attendance, grades, assignments, notifications, and school updates.",
    previewLabel: "Parent workspace",
    reverse: true,
    features: [
      {
        title: "Linked child view",
        text: "Switch between linked children and keep each child’s context separate.",
      },
      {
        title: "Attendance and grades",
        text: "Review attendance summaries, selected grade information, and report updates.",
      },
      {
        title: "School updates",
        text: "Receive relevant assignment, notification, and school activity updates.",
      },
    ],
  },
];

const trustItems = [
  "School-level tenant boundaries",
  "Role-based access control",
  "Parent-child account linking",
  "Report cards stored as snapshots",
  "CSRF protection",
  "Controlled upload flow",
  "Audit persistence for sensitive actions",
  "Self-host and SaaS database modes",
];

const floatingCards = [
  {
    className: "lg:-left-[6.5rem] lg:top-[15.5rem] ",
    icon: ClipboardCheck,
    label: "Attendance",
    value: "Session ready",
    tone: "bg-[#0e6b53]/10 text-[#074838] dark:bg-[#4fb796]/14 dark:text-[#7fd3b9]",
  },
  {
    className: "lg:-right-8 lg:top-52",
    icon: UploadCloud,
    label: "Materials",
    value: "Upload flow",
    tone: "bg-[#2a8b93]/10 text-[#226f76] dark:bg-[#69b8bf]/14 dark:text-[#69b8bf]",
  },
  {
    className: "lg:-left-12 lg:bottom-24",
    icon: Bell,
    label: "Notifications",
    value: "37 unread",
    tone: "bg-[#d7a12b]/18 text-[#7e5812] dark:bg-[#e5bd57]/16 dark:text-[#e5bd57]",
  },
  {
    className: "lg:-right-36 lg:bottom-16",
    icon: MessageSquareText,
    label: "Forum",
    value: "Pinned thread",
    tone: "bg-[#c94932]/10 text-[#8d2f22] dark:bg-[#ef7d67]/14 dark:text-[#ef7d67]",
  },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#074838]/25 bg-[#0e6b53] text-[#fffaf0] shadow-[0_10px_24px_rgba(7,72,56,0.18)] dark:border-[#7fd3b9]/20 dark:bg-[#4fb796] dark:text-[#101a17]">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-base font-bold tracking-[-0.035em] text-[#13231f] dark:text-[#fffaf0]">
          Schoolio
        </p>
        <p className="text-xs font-medium text-[#5b685f] dark:text-[#b9c0b7]">
          Sekolah Pintar
        </p>
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#0e6b53] dark:text-[#4fb796]">
      {children}
    </p>
  );
}

function FloatingFeature({
  icon: Icon,
  label,
  value,
  tone,
  className,
}: {
  icon: typeof ClipboardCheck;
  label: string;
  value: string;
  tone: string;
  className: string;
}) {
  return (
    <div
      className={`rounded-[18px] border border-[#13231f]/14 bg-[#fffaf0] p-4 shadow-[0_18px_46px_rgba(19,35,31,0.14)] transition duration-300 hover:-translate-y-1 hover:border-[#0e6b53]/24 hover:shadow-[0_24px_58px_rgba(19,35,31,0.16)] dark:border-[#fffaf0]/10 dark:bg-[#17231f] lg:absolute lg:w-44 ${className}`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full ${tone}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#5b685f] dark:text-[#b9c0b7]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-[-0.035em] text-[#13231f] dark:text-[#fffaf0]">
        {value}
      </p>
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[16px] border border-[#13231f]/12 bg-[#fffaf0] p-4 shadow-[0_10px_28px_rgba(19,35,31,0.06)] dark:border-[#fffaf0]/10 dark:bg-[#fffaf0]/5">
      <p className="text-3xl font-semibold tracking-[-0.045em] text-[#13231f] dark:text-[#fffaf0]">
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-[#46554e] dark:text-[#b9c0b7]">
        {label}
      </p>
    </div>
  );
}

function ScheduleRow({
  time,
  room,
  subject,
}: {
  time: string;
  room: string;
  subject: string;
}) {
  return (
    <div className="grid grid-cols-[56px_1fr] gap-3 rounded-xl border border-[#13231f]/8 bg-[#f8f4ea] p-3 text-sm dark:border-[#fffaf0]/8 dark:bg-[#101a17]">
      <span className="font-semibold text-[#0e6b53] dark:text-[#4fb796]">
        {time}
      </span>
      <span className="text-[#46554e] dark:text-[#b9c0b7]">
        <strong className="font-semibold text-[#13231f] dark:text-[#fffaf0]">
          {room}
        </strong>{" "}
        {subject}
      </span>
    </div>
  );
}

function HeroMockup() {
  const schedule = [
    ["07.15", "XI Science 1", "Mathematics"],
    ["09.00", "X Social 2", "Economics"],
    ["10.45", "X Science 3", "Attendance"],
  ];

  return (
    <div className="relative mx-auto w-full max-w-[700px] py-6 lg:py-14">
      <div className="absolute inset-x-2 top-12 h-[360px] rounded-[48px] bg-[radial-gradient(circle_at_50%_42%,rgba(14,107,83,0.14),rgba(215,161,43,0.08)_42%,transparent_72%)] blur-2xl dark:bg-[radial-gradient(circle_at_50%_42%,rgba(79,183,150,0.14),rgba(229,189,87,0.06)_42%,transparent_72%)]" />
      <div className="absolute left-1/2 top-1/2 h-[470px] w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#13231f]/10 dark:border-[#fffaf0]/10" />
      <div className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#0e6b53]/18 dark:border-[#4fb796]/18" />

      <div className="relative mx-auto max-w-[590px] rotate-[-0.7deg] rounded-[32px] border border-[#13231f]/14 bg-[#ece7dc] p-4 shadow-[0_38px_100px_rgba(19,35,31,0.2)] dark:border-[#fffaf0]/10 dark:bg-[#1d2b26] sm:p-5">
        <div className="rotate-[0.7deg] overflow-hidden rounded-[25px] border border-[#13231f]/12 bg-[#fffaf0]/95 dark:border-[#fffaf0]/10 dark:bg-[#17231f]">
          <div className="flex items-center justify-between gap-4 border-b border-[#13231f]/10 bg-[#f8f4ea]/75 px-5 py-3 dark:border-[#fffaf0]/10 dark:bg-[#101a17]/70">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#0e6b53]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#d7a12b]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#c94932]" />
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="rounded-[20px] bg-[#074838] p-5 text-[#fffaf0] shadow-[inset_0_1px_0_rgba(255,250,240,0.14),0_16px_38px_rgba(7,72,56,0.22)] dark:bg-[#0f3b31]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#d7a12b]">Today</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#fffaf0]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
                    Admin view
                  </span>
                  <span className="rounded-full bg-[#fffaf0]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
                    4 roles connected
                  </span>
                </div>
              </div>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">
                School operations view
              </h3>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#fffaf0]/10 px-3 py-1 text-xs font-medium text-[#fffaf0]/82">
                  Admin
                </span>
                <span className="rounded-full bg-[#fffaf0]/10 px-3 py-1 text-xs font-medium text-[#fffaf0]/82">
                  Teacher
                </span>
                <span className="rounded-full bg-[#fffaf0]/10 px-3 py-1 text-xs font-medium text-[#fffaf0]/82">
                  Student
                </span>
                <span className="rounded-full bg-[#fffaf0]/10 px-3 py-1 text-xs font-medium text-[#fffaf0]/82">
                  Parent
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MetricCard value="94%" label="Attendance" />
              <MetricCard value="18" label="Active classes" />
              <MetricCard value="9" label="Need review" />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.82fr]">
              <div className="rounded-[18px] border border-[#13231f]/12 bg-[#fffaf0] p-5 shadow-[0_10px_28px_rgba(19,35,31,0.06)] dark:border-[#fffaf0]/10 dark:bg-[#fffaf0]/5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="font-semibold tracking-[-0.02em] text-[#13231f] dark:text-[#fffaf0]">
                    Running schedule
                  </p>
                  <CalendarDays className="h-5 w-5 text-[#0e6b53] dark:text-[#4fb796]" />
                </div>
                <div className="space-y-3">
                  {schedule.map(([time, room, subject]) => (
                    <ScheduleRow
                      key={`${time}-${room}`}
                      time={time}
                      room={room}
                      subject={subject}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[18px] border border-[#13231f]/12 bg-[#fffaf0] p-5 shadow-[0_10px_28px_rgba(19,35,31,0.06)] dark:border-[#fffaf0]/10 dark:bg-[#101a17]">
                  <div className="mb-4 flex items-center gap-2">
                    <LockKeyhole className="h-5 w-5 text-[#0e6b53] dark:text-[#4fb796]" />
                    <p className="font-semibold tracking-[-0.02em] text-[#13231f] dark:text-[#fffaf0]">
                      Scoped access
                    </p>
                  </div>
                  <div className="space-y-3 text-sm leading-6 text-[#46554e] dark:text-[#b9c0b7]">
                    <p>Teachers see assigned classes.</p>
                    <p>Students see their work.</p>
                    <p>Parents see linked children.</p>
                  </div>
                </div>
                <div className="rounded-[18px] border border-[#0e6b53]/14 bg-[#0e6b53]/7 p-4 dark:border-[#4fb796]/16 dark:bg-[#4fb796]/10">
                  <p className="text-sm font-semibold tracking-[-0.01em] text-[#074838] dark:text-[#7fd3b9]">
                    Records ready
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#46554e] dark:text-[#b9c0b7]">
                    Daily activity synced for reporting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {floatingCards.map((card) => (
        <FloatingFeature
          key={card.label}
          {...card}
          className={`hidden lg:block ${card.className}`}
        />
      ))}
    </div>
  );
}

function RoleShowcase({
  role,
}: {
  role: (typeof roleShowcases)[number];
}) {
  const [selectedFeature, setSelectedFeature] = useState(0);
  const activeFeature = role.features[selectedFeature];

  const copy = (
    <div>
      <p className="text-sm font-semibold tracking-[0.16em] text-[#0e6b53] dark:text-[#4fb796]">
        {role.eyebrow}
      </p>
      <h3 className="mt-4 max-w-[12ch] text-[clamp(2.1rem,4vw,3.55rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-[#13231f] dark:text-[#fffaf0]">
        {role.title}
      </h3>
      <p className="mt-5 max-w-xl text-base leading-8 text-[#46554e] dark:text-[#b9c0b7]">
        {role.body}
      </p>

      <div className="mt-8 space-y-3">
        {role.features.map((feature, index) => {
          const isActive = selectedFeature === index;

          return (
            <button
              key={feature.title}
              type="button"
              onClick={() => setSelectedFeature(index)}
              className={`grid w-full grid-cols-[34px_1fr] gap-3 rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 ${
                isActive
                  ? "border-[#0e6b53]/26 bg-[#0e6b53]/8 shadow-[0_14px_34px_rgba(19,35,31,0.08)] dark:border-[#4fb796]/24 dark:bg-[#4fb796]/12"
                  : "border-transparent bg-transparent hover:border-[#13231f]/12 hover:bg-[#fffaf0]/68 dark:hover:border-[#fffaf0]/10 dark:hover:bg-[#fffaf0]/5"
              }`}
            >
              <span
                className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border ${
                  isActive
                    ? "border-[#0e6b53] bg-[#0e6b53] text-[#fffaf0] dark:border-[#4fb796] dark:bg-[#4fb796] dark:text-[#101a17]"
                    : "border-[#13231f]/24 text-[#0e6b53] dark:border-[#fffaf0]/24 dark:text-[#4fb796]"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-base font-semibold tracking-[-0.015em] text-[#13231f] dark:text-[#fffaf0]">
                  {feature.title}
                </span>
                <span className="mt-1 block text-sm leading-6 text-[#5b685f] dark:text-[#b9c0b7]">
                  {feature.text}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const preview = (
    <div className="rounded-[28px] border border-[#13231f]/12 bg-[#ece7dc]/72 p-4 shadow-[0_22px_58px_rgba(19,35,31,0.09)] dark:border-[#fffaf0]/10 dark:bg-[#1d2b26]">
      <div className="overflow-hidden rounded-[22px] border border-[#13231f]/10 bg-[#fffaf0] dark:border-[#fffaf0]/10 dark:bg-[#17231f]">
        <div className="flex items-center justify-between border-b border-[#13231f]/10 bg-[#f8f4ea]/80 px-4 py-3 dark:border-[#fffaf0]/10 dark:bg-[#101a17]/70">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0e6b53]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#d7a12b]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#c94932]" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5b685f] dark:text-[#b9c0b7]">
            Placeholder
          </span>
        </div>

        <div className="p-5">
          <div className="rounded-[18px] bg-[#074838] p-5 text-[#fffaf0]">
            <p className="text-sm font-semibold text-[#d7a12b]">{role.previewLabel}</p>
            <h4 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
              {activeFeature.title}
            </h4>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#fffaf0]/76">
              {activeFeature.text}
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {["Scope", "Records", "Today"].map((label, index) => (
              <div
                key={label}
                className="rounded-2xl border border-[#13231f]/10 bg-[#f8f4ea] p-4 dark:border-[#fffaf0]/10 dark:bg-[#101a17]"
              >
                <p className="text-xl font-semibold tracking-[-0.035em] text-[#13231f] dark:text-[#fffaf0]">
                  0{index + 1}
                </p>
                <p className="mt-1 text-sm text-[#5b685f] dark:text-[#b9c0b7]">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[18px] border border-[#13231f]/10 bg-[#f8f4ea] p-5 dark:border-[#fffaf0]/10 dark:bg-[#101a17]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="font-semibold tracking-[-0.02em] text-[#13231f] dark:text-[#fffaf0]">
                Preview surface
              </p>
              <span className="rounded-full bg-[#0e6b53]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#074838] dark:bg-[#4fb796]/14 dark:text-[#7fd3b9]">
                Active
              </span>
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-11 rounded-xl border border-[#13231f]/8 bg-[#fffaf0] dark:border-[#fffaf0]/8 dark:bg-[#17231f]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
      {role.reverse ? (
        <>
          <div className="order-2 lg:order-1">{preview}</div>
          <div className="order-1 lg:order-2">{copy}</div>
        </>
      ) : (
        <>
          <div>{copy}</div>
          <div>{preview}</div>
        </>
      )}
    </div>
  );
}

export default function Index() {
  return (
    <main className="min-h-screen bg-[#f8f4ea] text-[#13231f] selection:bg-[#d7a12b]/30 dark:bg-[#101a17] dark:text-[#fffaf0]">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_8%_10%,rgba(215,161,43,0.16),transparent_26rem),linear-gradient(90deg,rgba(19,35,31,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(19,35,31,0.026)_1px,transparent_1px)] bg-[length:auto,38px_38px,38px_38px] dark:bg-[linear-gradient(90deg,rgba(255,250,240,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(255,250,240,0.04)_1px,transparent_1px)] dark:bg-[length:42px_42px]" />

      <header className="sticky top-0 z-50 border-b border-[#13231f]/10 bg-[#f8f4ea]/86 backdrop-blur-xl dark:border-[#fffaf0]/10 dark:bg-[#101a17]/86">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-4 lg:px-8">
          <BrandMark />

          <nav
            className="hidden items-center rounded-full border border-[#13231f]/8 bg-[#fffaf0]/62 px-2 py-1 lg:flex dark:border-[#fffaf0]/10 dark:bg-[#fffaf0]/5"
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-[#5b685f] transition hover:bg-[#0e6b53]/8 hover:text-[#13231f] dark:text-[#b9c0b7] dark:hover:bg-[#4fb796]/10 dark:hover:text-[#fffaf0]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              className="rounded-full px-4 font-semibold text-[#263a34] hover:bg-[#0e6b53]/10 hover:text-[#074838] dark:text-[#ebe3d2] dark:hover:bg-[#4fb796]/12 dark:hover:text-[#7fd3b9]"
              asChild
            >
              <Link href="/auth">Sign in</Link>
            </Button>
            <Button
              className="h-11 rounded-full border border-[#074838] bg-[#074838] px-5 font-semibold text-[#fffaf0] shadow-[0_14px_28px_rgba(7,72,56,0.18)] hover:bg-[#0e6b53] dark:border-[#7fd3b9]/20 dark:bg-[#4fb796] dark:text-[#101a17] dark:hover:bg-[#7fd3b9]"
              asChild
            >
              <Link href="/auth">
                Start
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#13231f]/10 dark:border-[#fffaf0]/10">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-16 lg:grid-cols-[0.86fr_1.02fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-20">
          <div>
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-[#0e6b53]/18 bg-[#0e6b53]/10 px-4 py-2 text-sm font-semibold text-[#074838] dark:border-[#4fb796]/25 dark:bg-[#4fb796]/14 dark:text-[#7fd3b9]">
              <span className="h-2 w-2 rounded-full bg-[#0e6b53] shadow-[0_0_0_6px_rgba(14,107,83,0.12)] dark:bg-[#4fb796]" />
              School operations, not just school software
            </div>

            <h1 className="mt-6 max-w-[10ch] text-[clamp(3.15rem,6.4vw,5.8rem)] font-semibold leading-[0.92] tracking-[-0.052em] text-[#13231f] dark:text-[#fffaf0]">
              The operating layer for modern schools.
            </h1>

            <p className="mt-6 max-w-2xl text-[clamp(1.02rem,1.3vw,1.18rem)] leading-8 text-[#46554e] dark:text-[#b9c0b7]">
              Schoolio connects structure, classroom work, records, and parent
              visibility into one calm system for daily school operations.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                className="h-12 rounded-full border border-[#074838] bg-[#074838] px-6 text-base font-semibold text-[#fffaf0] shadow-[0_16px_34px_rgba(7,72,56,0.2)] hover:bg-[#0e6b53] dark:border-[#7fd3b9]/20 dark:bg-[#4fb796] dark:text-[#101a17] dark:hover:bg-[#7fd3b9]"
                asChild
              >
                <Link href="/auth">
                  Open Schoolio
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-full border-[#c94932]/30 bg-[#fffaf0]/70 px-6 text-base font-semibold text-[#8d2f22] hover:bg-[#c94932]/10 hover:text-[#8d2f22] dark:border-[#ef7d67]/25 dark:bg-[#ef7d67]/10 dark:text-[#ef7d67] dark:hover:bg-[#ef7d67]/16"
                asChild
              >
                <Link href="#platform">See the platform</Link>
              </Button>
            </div>

            {/* <div className="mt-10 grid max-w-2xl grid-cols-1 gap-px overflow-hidden rounded-[22px] border border-[#13231f]/12 bg-[#13231f]/10 shadow-[0_14px_36px_rgba(19,35,31,0.055)] dark:border-[#fffaf0]/10 dark:bg-[#fffaf0]/10 sm:grid-cols-3">
              {[
                ["4 portals", "Admin, teacher, student, parent"],
                ["One backbone", "School data stays connected"],
                ["Daily records", "Ready for review"],
              ].map(([value, label]) => (
                <div
                  key={value}
                  className="bg-[#fffaf0]/88 p-5 dark:bg-[#17231f]/86"
                >
                  <strong className="block text-xl font-semibold tracking-[-0.035em] text-[#13231f] dark:text-[#fffaf0]">
                    {value}
                  </strong>
                  <span className="mt-2 block text-sm leading-6 text-[#5b685f] dark:text-[#b9c0b7]">
                    {label}
                  </span>
                </div>
              ))}
            </div> */}
          </div>

          <HeroMockup />
        </div>
      </section>

      <section id="platform" className="px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <Eyebrow>Daily work, connected</Eyebrow>
            <h2 className="mt-4 text-[clamp(2.45rem,5vw,4.7rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-[#13231f] dark:text-[#fffaf0]">
              One system for the work schools repeat every day.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#46554e] dark:text-[#b9c0b7] sm:text-lg">
              From academic structure to classroom activity and reporting,
              Schoolio keeps the daily rhythm of school work connected.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
            {sellPoints.map((item, index) => (
              <article
                key={item.title}
                className={`rounded-[22px] border border-[#13231f]/14 bg-[#fffaf0]/88 p-7 shadow-none transition duration-200 hover:-translate-y-1 hover:border-[#0e6b53]/24 hover:shadow-[0_20px_48px_rgba(19,35,31,0.1)] dark:border-[#fffaf0]/10 dark:bg-[#17231f] ${
                  index === 0 ? "shadow-[0_20px_48px_rgba(19,35,31,0.08)]" : ""
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0e6b53]/10 text-[#0e6b53] ring-1 ring-[#0e6b53]/12 dark:bg-[#4fb796]/14 dark:text-[#7fd3b9] dark:ring-[#4fb796]/16">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-8 text-[1.45rem] font-semibold leading-[1.08] tracking-[-0.035em] text-[#13231f] dark:text-[#fffaf0]">
                  {item.title}
                </h3>
                <p className="mt-4 max-w-xl leading-7 text-[#46554e] dark:text-[#b9c0b7]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="workflows"
        className="border-y border-[#13231f]/10 bg-[#fffaf0]/55 px-6 py-20 dark:border-[#fffaf0]/10 dark:bg-[#17231f]/70 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <Eyebrow>Workflow framing</Eyebrow>
            <h2 className="mt-4 text-[clamp(2.45rem,5vw,4.7rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-[#13231f] dark:text-[#fffaf0]">
              From setup to school day to report-ready records.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#46554e] dark:text-[#b9c0b7] sm:text-lg">
              Schoolio follows the way schools actually operate: configure the
              structure, run the day, then close the loop with records.
            </p>
          </div>

          <div className="relative mt-16 grid gap-8 lg:grid-cols-3 lg:gap-5">
            <div className="absolute left-[12%] right-[12%] top-8 hidden h-px bg-gradient-to-r from-transparent via-[#0e6b53]/30 to-transparent lg:block" />
            {workflows.map(([number, title, text]) => (
              <article
                key={number}
                className="relative rounded-[24px] border border-[#13231f]/14 bg-[#f2eee3]/88 p-7 pt-10 shadow-[0_14px_36px_rgba(19,35,31,0.055)] transition duration-200 before:absolute before:bottom-7 before:left-0 before:top-20 before:w-1 before:rounded-r-full before:bg-[#0e6b53]/18 hover:-translate-y-1 hover:border-[#0e6b53]/24 hover:shadow-[0_20px_48px_rgba(19,35,31,0.09)] dark:border-[#fffaf0]/10 dark:bg-[#101a17] dark:before:bg-[#4fb796]/18"
              >
                <div className="absolute -top-8 left-7 flex h-16 w-16 items-center justify-center rounded-full border border-[#0e6b53]/22 bg-[#fffaf0] text-sm font-semibold tracking-[0.12em] text-[#074838] shadow-[0_12px_30px_rgba(19,35,31,0.1)] dark:border-[#4fb796]/20 dark:bg-[#17231f] dark:text-[#7fd3b9]">
                  {number}
                </div>
                <div className="absolute right-7 top-7 h-3 w-3 rounded-full bg-[#d7a12b] shadow-[0_0_0_7px_rgba(215,161,43,0.14)]" />
                <h3 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-[#13231f] dark:text-[#fffaf0]">
                  {title}
                </h3>
                <p className="mt-4 leading-7 text-[#46554e] dark:text-[#b9c0b7]">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <Eyebrow>Role-specific by default</Eyebrow>
            <h2 className="mt-4 text-[clamp(2.45rem,5vw,4.7rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-[#13231f] dark:text-[#fffaf0]">
              One school system. Different views for every role.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#46554e] dark:text-[#b9c0b7] sm:text-lg">
              Each portal is intentionally scoped so every person can act
              clearly without seeing work that does not belong to them.
            </p>
          </div>

          <div className="mt-16 space-y-24 lg:space-y-32">
            {roleShowcases.map((role) => (
              <RoleShowcase key={role.eyebrow} role={role} />
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="px-6 pb-20 lg:px-8 lg:pb-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1fr] lg:items-center">
          <div>
            <Eyebrow>Trust layer</Eyebrow>
            <h2 className="mt-4 max-w-[11ch] text-[clamp(2.55rem,5.4vw,4.8rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-[#13231f] dark:text-[#fffaf0]">
              Built for records that schools need to rely on.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#46554e] dark:text-[#b9c0b7] sm:text-lg">
              School operations need more than convenience. They need
              boundaries, permissions, stable records, and governance-ready
              workflows.
            </p>
          </div>

          <div className="grid gap-3 rounded-[24px] border border-[#13231f]/12 bg-[#ece7dc]/55 p-3 shadow-[0_16px_40px_rgba(19,35,31,0.055)] dark:border-[#fffaf0]/10 dark:bg-[#1d2b26]/70 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div
                key={item}
                className="grid min-h-[84px] grid-cols-[38px_1fr] items-center gap-4 rounded-[18px] border border-[#13231f]/12 bg-[#fffaf0]/92 p-5 shadow-[0_8px_22px_rgba(19,35,31,0.035)] transition duration-200 hover:border-[#0e6b53]/22 dark:border-[#fffaf0]/10 dark:bg-[#17231f]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0e6b53]/10 text-[#0e6b53] ring-1 ring-[#0e6b53]/12 dark:bg-[#4fb796]/14 dark:text-[#7fd3b9]">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className="font-semibold leading-6 text-[#13231f] dark:text-[#fffaf0]">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 lg:px-8 lg:pb-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 rounded-[26px] border border-[#13231f]/16 bg-[linear-gradient(135deg,#fffaf0_0%,#f3ecdc_100%)] p-8 shadow-[0_22px_58px_rgba(19,35,31,0.1)] dark:border-[#fffaf0]/10 dark:bg-none dark:bg-[#17231f] sm:p-9 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#13231f] dark:text-[#fffaf0] sm:text-3xl">
              Ready to connect your school operations?
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-[#46554e] dark:text-[#b9c0b7]">
              Start with the structure your school already uses, then bring
              daily work and records into one place.
            </p>
          </div>
          <Button
            className="h-12 rounded-full border border-[#074838] bg-[#074838] px-6 font-semibold text-[#fffaf0] shadow-[0_14px_28px_rgba(7,72,56,0.18)] hover:bg-[#0e6b53] dark:border-[#7fd3b9]/20 dark:bg-[#4fb796] dark:text-[#101a17] dark:hover:bg-[#7fd3b9] sm:w-fit"
            asChild
          >
            <Link href="#platform">
              Explore the platform
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#13231f] px-6 py-24 text-[#fffaf0] dark:bg-[#fffaf0] dark:text-[#13231f] lg:px-8 lg:py-28">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,250,240,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(255,250,240,0.04)_1px,transparent_1px)] bg-[length:42px_42px] dark:bg-[linear-gradient(90deg,rgba(19,35,31,0.055)_1px,transparent_1px),linear-gradient(0deg,rgba(19,35,31,0.04)_1px,transparent_1px)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_0.42fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d7a12b] dark:text-[#8d6418]">
              Start with daily work
            </p>
            <h2 className="mt-4 max-w-[10ch] text-[clamp(3rem,6vw,5.6rem)] font-bold leading-[0.92] tracking-[-0.05em]">
              Give every school role a calmer way to work.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#fffaf0]/72 dark:text-[#263a34] sm:text-lg">
              Start with the operational core: structure, schedules, attendance,
              assignments, grades, reporting, and visibility.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button
              className="h-12 rounded-full border border-[#fffaf0] bg-[#fffaf0] px-6 text-base font-semibold text-[#13231f] hover:bg-[#f8f4ea] dark:border-[#074838] dark:bg-[#074838] dark:text-[#fffaf0] dark:hover:bg-[#0e6b53]"
              asChild
            >
              <Link href="/auth">
                Start now
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-full border border-[#fffaf0]/25 bg-[#fffaf0]/5 px-6 text-base font-semibold text-[#fffaf0] hover:bg-[#fffaf0]/10 hover:text-[#fffaf0] dark:border-[#13231f]/20 dark:bg-[#13231f]/5 dark:text-[#13231f] dark:hover:bg-[#13231f]/10"
              asChild
            >
              <Link href="/dashboard">View dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-[#13231f] px-6 pb-10 text-sm text-[#fffaf0]/62 dark:bg-[#fffaf0] dark:text-[#13231f]/65 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-[#fffaf0]/15 pt-6 dark:border-[#13231f]/15 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark />
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span>Schoolio / Sekolah Pintar</span>
            <span>Operational school management in one system.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
