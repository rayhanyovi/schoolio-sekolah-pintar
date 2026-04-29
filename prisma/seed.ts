import { writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient, Role } from "@prisma/client";
import { resolveDatabaseUrl } from "../lib/database-url";
import { DEMO_CATALOG } from "../lib/demo-catalog";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: resolveDatabaseUrl(),
    },
  },
});

const DEMO_PASSWORD = DEMO_CATALOG.password;
const DEMO_DOC_PATH = path.resolve(process.cwd(), "docs", "DEMO_CREDENTIALS.md");

const SCHOOL = DEMO_CATALOG.templateSchool;

const ACADEMIC_YEARS = [
  {
    year: "2024/2025",
    semester: "ODD" as const,
    startDate: new Date("2024-07-15T00:00:00.000Z"),
    endDate: new Date("2024-12-20T00:00:00.000Z"),
    isActive: false,
  },
  {
    year: "2025/2026",
    semester: "EVEN" as const,
    startDate: new Date("2026-01-06T00:00:00.000Z"),
    endDate: new Date("2026-06-20T00:00:00.000Z"),
    isActive: true,
  },
];

const MAJORS = [
  {
    code: "MIPA",
    name: "Matematika dan Ilmu Pengetahuan Alam",
    description: "Program peminatan sains untuk jenjang SMA.",
  },
  {
    code: "IPS",
    name: "Ilmu Pengetahuan Sosial",
    description: "Program peminatan sosial dan humaniora untuk jenjang SMA.",
  },
];

const SCHEDULE_TEMPLATES = [
  { name: "Jam 1", startTime: "07:00", endTime: "07:45", duration: 45, isBreak: false, position: 1 },
  { name: "Jam 2", startTime: "07:45", endTime: "08:30", duration: 45, isBreak: false, position: 2 },
  { name: "Jam 3", startTime: "08:30", endTime: "09:15", duration: 45, isBreak: false, position: 3 },
  { name: "Istirahat 1", startTime: "09:15", endTime: "09:35", duration: 20, isBreak: true, position: 4 },
  { name: "Jam 4", startTime: "09:35", endTime: "10:20", duration: 45, isBreak: false, position: 5 },
  { name: "Jam 5", startTime: "10:20", endTime: "11:05", duration: 45, isBreak: false, position: 6 },
  { name: "Jam 6", startTime: "11:05", endTime: "11:50", duration: 45, isBreak: false, position: 7 },
  { name: "Istirahat 2", startTime: "11:50", endTime: "12:30", duration: 40, isBreak: true, position: 8 },
  { name: "Jam 7", startTime: "12:30", endTime: "13:15", duration: 45, isBreak: false, position: 9 },
  { name: "Jam 8", startTime: "13:15", endTime: "14:00", duration: 45, isBreak: false, position: 10 },
];

const STAFF = [
  {
    identifier: "admin.sekolah",
    email: "nur.aisyah@alhikmahnusantara.sch.id",
    name: "Nur Aisyah Rahma",
    role: Role.ADMIN,
    phone: "0812-7000-1001",
    address: "Sleman, DI Yogyakarta",
    bio: "Kepala sekolah yang memimpin operasional akademik dan implementasi Schoolio.",
  },
  {
    identifier: "admin.kurikulum",
    email: "hendra.prasetyo@alhikmahnusantara.sch.id",
    name: "Hendra Prasetyo",
    role: Role.ADMIN,
    phone: "0812-7000-1002",
    address: "Mlati, DI Yogyakarta",
    bio: "Wakil kepala sekolah bidang kurikulum dan penjadwalan akademik.",
  },
  {
    identifier: "guru.siska",
    email: "siska.maharani@alhikmahnusantara.sch.id",
    name: "Siska Maharani",
    role: Role.TEACHER,
    phone: "0812-7100-2001",
    address: "Depok, DI Yogyakarta",
    bio: "Guru Bahasa Indonesia dan pembina literasi sekolah.",
    title: "S.Pd.",
  },
  {
    identifier: "guru.yoga",
    email: "yoga.pratama@alhikmahnusantara.sch.id",
    name: "Yoga Pratama",
    role: Role.TEACHER,
    phone: "0812-7100-2002",
    address: "Ngaglik, DI Yogyakarta",
    bio: "Guru Bahasa Inggris dan koordinator English Club.",
    title: "S.Pd.",
  },
  {
    identifier: "guru.ahmad",
    email: "ahmad.fauzan@alhikmahnusantara.sch.id",
    name: "Ahmad Fauzan",
    role: Role.TEACHER,
    phone: "0812-7100-2003",
    address: "Gamping, DI Yogyakarta",
    bio: "Guru Matematika wajib dan pembina olimpiade sains.",
    title: "S.Si.",
  },
  {
    identifier: "guru.hana",
    email: "hana.rosyidah@alhikmahnusantara.sch.id",
    name: "Hana Rosyidah",
    role: Role.TEACHER,
    phone: "0812-7100-2004",
    address: "Kalasan, DI Yogyakarta",
    bio: "Guru Informatika dan pengampu laboratorium komputer.",
    title: "M.Kom.",
  },
  {
    identifier: "guru.deni",
    email: "deni.kurniawan@alhikmahnusantara.sch.id",
    name: "Deni Kurniawan",
    role: Role.TEACHER,
    phone: "0812-7100-2005",
    address: "Seyegan, DI Yogyakarta",
    bio: "Guru Fisika dan wali kelas XI MIPA 1.",
    title: "S.Pd.",
  },
  {
    identifier: "guru.ratih",
    email: "ratih.permatasari@alhikmahnusantara.sch.id",
    name: "Ratih Permatasari",
    role: Role.TEACHER,
    phone: "0812-7100-2006",
    address: "Prambanan, DI Yogyakarta",
    bio: "Guru Biologi dan wali kelas X MIPA 1.",
    title: "S.Pd.",
  },
  {
    identifier: "guru.nanda",
    email: "nanda.putra@alhikmahnusantara.sch.id",
    name: "Nanda Putra",
    role: Role.TEACHER,
    phone: "0812-7100-2007",
    address: "Berbah, DI Yogyakarta",
    bio: "Guru Kimia dan koordinator praktikum MIPA.",
    title: "S.Si.",
  },
  {
    identifier: "guru.rina",
    email: "rina.kartikasari@alhikmahnusantara.sch.id",
    name: "Rina Kartikasari",
    role: Role.TEACHER,
    phone: "0812-7100-2008",
    address: "Kotagede, DI Yogyakarta",
    bio: "Guru Sejarah Indonesia dan wali kelas X IPS 1.",
    title: "S.Pd.",
  },
  {
    identifier: "guru.fitri",
    email: "fitri.amelia@alhikmahnusantara.sch.id",
    name: "Fitri Amelia",
    role: Role.TEACHER,
    phone: "0812-7100-2009",
    address: "Bantul, DI Yogyakarta",
    bio: "Guru Ekonomi dan pembina kewirausahaan siswa.",
    title: "S.E.",
  },
  {
    identifier: "guru.bagas",
    email: "bagas.satya@alhikmahnusantara.sch.id",
    name: "Bagas Satya",
    role: Role.TEACHER,
    phone: "0812-7100-2010",
    address: "Kasihan, DI Yogyakarta",
    bio: "Guru Geografi dan wali kelas XI IPS 1.",
    title: "S.Pd.",
  },
  {
    identifier: "guru.mira",
    email: "mira.lestari@alhikmahnusantara.sch.id",
    name: "Mira Lestari",
    role: Role.TEACHER,
    phone: "0812-7100-2011",
    address: "Piyungan, DI Yogyakarta",
    bio: "Guru Sosiologi dan pembina OSIS bidang advokasi.",
    title: "S.Pd.",
  },
  {
    identifier: "guru.bima",
    email: "bima.ardian@alhikmahnusantara.sch.id",
    name: "Bima Ardian",
    role: Role.TEACHER,
    phone: "0812-7100-2012",
    address: "Ngemplak, DI Yogyakarta",
    bio: "Guru Pendidikan Pancasila dan koordinator projek profil pelajar Pancasila.",
    title: "M.Pd.",
  },
] as const;

type DemoSubject = {
  code: string;
  name: string;
  category: "LANGUAGE" | "SCIENCE" | "SOCIAL";
  color: string;
  hoursPerWeek: number;
  appliesToAllMajors: boolean;
  teacherIdentifiers: readonly string[];
  majorCodes?: readonly ("MIPA" | "IPS")[];
};

const SUBJECTS: readonly DemoSubject[] = [
  {
    code: "BIND",
    name: "Bahasa Indonesia",
    category: "LANGUAGE" as const,
    color: "bg-rose-500",
    hoursPerWeek: 4,
    appliesToAllMajors: true,
    teacherIdentifiers: ["guru.siska"],
  },
  {
    code: "BING",
    name: "Bahasa Inggris",
    category: "LANGUAGE" as const,
    color: "bg-sky-500",
    hoursPerWeek: 4,
    appliesToAllMajors: true,
    teacherIdentifiers: ["guru.yoga"],
  },
  {
    code: "MTKW",
    name: "Matematika",
    category: "SCIENCE" as const,
    color: "bg-emerald-500",
    hoursPerWeek: 5,
    appliesToAllMajors: true,
    teacherIdentifiers: ["guru.ahmad"],
  },
  {
    code: "INFO",
    name: "Informatika",
    category: "SCIENCE" as const,
    color: "bg-indigo-500",
    hoursPerWeek: 3,
    appliesToAllMajors: true,
    teacherIdentifiers: ["guru.hana"],
  },
  {
    code: "PPKN",
    name: "Pendidikan Pancasila",
    category: "SOCIAL" as const,
    color: "bg-amber-500",
    hoursPerWeek: 2,
    appliesToAllMajors: true,
    teacherIdentifiers: ["guru.bima"],
  },
  {
    code: "FIS",
    name: "Fisika",
    category: "SCIENCE" as const,
    color: "bg-cyan-600",
    hoursPerWeek: 4,
    appliesToAllMajors: false,
    majorCodes: ["MIPA"],
    teacherIdentifiers: ["guru.deni"],
  },
  {
    code: "BIO",
    name: "Biologi",
    category: "SCIENCE" as const,
    color: "bg-lime-600",
    hoursPerWeek: 4,
    appliesToAllMajors: false,
    majorCodes: ["MIPA"],
    teacherIdentifiers: ["guru.ratih"],
  },
  {
    code: "KIM",
    name: "Kimia",
    category: "SCIENCE" as const,
    color: "bg-violet-600",
    hoursPerWeek: 4,
    appliesToAllMajors: false,
    majorCodes: ["MIPA"],
    teacherIdentifiers: ["guru.nanda"],
  },
  {
    code: "SEJ",
    name: "Sejarah Indonesia",
    category: "SOCIAL" as const,
    color: "bg-orange-600",
    hoursPerWeek: 3,
    appliesToAllMajors: false,
    majorCodes: ["IPS"],
    teacherIdentifiers: ["guru.rina"],
  },
  {
    code: "EKO",
    name: "Ekonomi",
    category: "SOCIAL" as const,
    color: "bg-yellow-600",
    hoursPerWeek: 4,
    appliesToAllMajors: false,
    majorCodes: ["IPS"],
    teacherIdentifiers: ["guru.fitri"],
  },
  {
    code: "GEO",
    name: "Geografi",
    category: "SOCIAL" as const,
    color: "bg-teal-600",
    hoursPerWeek: 4,
    appliesToAllMajors: false,
    majorCodes: ["IPS"],
    teacherIdentifiers: ["guru.bagas"],
  },
  {
    code: "SOS",
    name: "Sosiologi",
    category: "SOCIAL" as const,
    color: "bg-fuchsia-600",
    hoursPerWeek: 3,
    appliesToAllMajors: false,
    majorCodes: ["IPS"],
    teacherIdentifiers: ["guru.mira"],
  },
] as const;

const CLASSES = [
  {
    key: "xmipa1",
    name: "X MIPA 1",
    grade: 10,
    major: "MIPA",
    section: "1",
    room: "Gedung A - 201",
    homeroomTeacherIdentifier: "guru.ratih",
  },
  {
    key: "xips1",
    name: "X IPS 1",
    grade: 10,
    major: "IPS",
    section: "1",
    room: "Gedung A - 205",
    homeroomTeacherIdentifier: "guru.rina",
  },
  {
    key: "ximipa1",
    name: "XI MIPA 1",
    grade: 11,
    major: "MIPA",
    section: "1",
    room: "Gedung B - 302",
    homeroomTeacherIdentifier: "guru.deni",
  },
  {
    key: "xiips1",
    name: "XI IPS 1",
    grade: 11,
    major: "IPS",
    section: "1",
    room: "Gedung B - 306",
    homeroomTeacherIdentifier: "guru.bagas",
  },
] as const;

const CLASS_ROSTERS = {
  xmipa1: [
    { studentName: "Alya Safitri", parentName: "Budi Safitri" },
    { studentName: "Fikri Maulana", parentName: "Rina Maulana" },
    { studentName: "Nadira Putri", parentName: "Dedi Putra" },
    { studentName: "Rafi Hidayat", parentName: "Maya Hidayat" },
    { studentName: "Salma Khairunnisa", parentName: "Rizal Khairuddin" },
    { studentName: "Tegar Ramadhan", parentName: "Santi Ramadhan" },
  ],
  xips1: [
    { studentName: "Citra Lestari", parentName: "Joko Lestari" },
    { studentName: "Dava Prakoso", parentName: "Murni Prakoso" },
    { studentName: "Intan Permata", parentName: "Heri Permata" },
    { studentName: "Kevin Saputra", parentName: "Lina Saputra" },
    { studentName: "Nabila Zahra", parentName: "Arif Zahra" },
    { studentName: "Reza Firmansyah", parentName: "Tuti Firmansyah" },
  ],
  ximipa1: [
    { studentName: "Anindya Larasati", parentName: "Rudy Larasati" },
    { studentName: "Farrel Akbar", parentName: "Nina Akbar" },
    { studentName: "Ghea Maharani", parentName: "Agus Maharana" },
    { studentName: "Mikail Fadhil", parentName: "Dewi Fadhilah" },
    { studentName: "Putri Azzahra", parentName: "Slamet Azzam" },
    { studentName: "Zidan Pratama", parentName: "Meli Pratama" },
  ],
  xiips1: [
    { studentName: "Bintang Salsabila", parentName: "Hari Salsabila" },
    { studentName: "Dinda Amalia", parentName: "Roni Amalia" },
    { studentName: "Luthfi Alfarizi", parentName: "Indah Alfarizi" },
    { studentName: "Rara Puspaningrum", parentName: "Yanto Puspa" },
    { studentName: "Syifa Aulia", parentName: "Nur Auliawan" },
    { studentName: "Vino Pranata", parentName: "Rika Pranata" },
  ],
} as const;

const MIPA_SCHEDULE = {
  MON: ["BIND", "MTKW", "BING", "FIS", "BIO", "INFO", "KIM", "PPKN"],
  TUE: ["MTKW", "BIND", "BIO", "KIM", "BING", "INFO", "FIS", "PPKN"],
  WED: ["FIS", "MTKW", "BIND", "INFO", "BIO", "BING", "KIM", "PPKN"],
  THU: ["BING", "BIND", "MTKW", "KIM", "FIS", "BIO", "INFO", "PPKN"],
  FRI: ["PPKN", "BIND", "BIO", "MTKW", "BING", "FIS", "INFO", "KIM"],
} as const;

const IPS_SCHEDULE = {
  MON: ["BIND", "MTKW", "BING", "SEJ", "EKO", "GEO", "SOS", "PPKN"],
  TUE: ["MTKW", "BIND", "EKO", "GEO", "BING", "INFO", "SEJ", "PPKN"],
  WED: ["SEJ", "MTKW", "BIND", "INFO", "SOS", "BING", "EKO", "PPKN"],
  THU: ["BING", "BIND", "MTKW", "GEO", "SEJ", "SOS", "INFO", "PPKN"],
  FRI: ["PPKN", "BIND", "EKO", "MTKW", "BING", "SEJ", "INFO", "GEO"],
} as const;

const CORE_ASSIGNMENTS = [
  {
    title: "Refleksi Literasi Pekan Ini",
    subjectCode: "BIND",
    kind: "HOMEWORK" as const,
    gradeComponent: "HOMEWORK" as const,
    deliveryType: "ESSAY" as const,
    allowLateSubmission: true,
    dueDate: new Date("2026-05-07T08:00:00.000Z"),
  },
  {
    title: "Latihan Numerasi Bab 4",
    subjectCode: "MTKW",
    kind: "QUIZ" as const,
    gradeComponent: "QUIZ" as const,
    deliveryType: "MCQ" as const,
    allowLateSubmission: false,
    dueDate: new Date("2026-05-09T03:00:00.000Z"),
  },
] as const;

const SPECIAL_ASSIGNMENTS = {
  MIPA: [
    {
      title: "Laporan Praktikum Difusi",
      subjectCode: "BIO",
      kind: "PROJECT" as const,
      gradeComponent: "PRACTICAL" as const,
      deliveryType: "FILE" as const,
      allowLateSubmission: true,
      dueDate: new Date("2026-05-12T06:00:00.000Z"),
    },
    {
      title: "Analisis Gerak Lurus",
      subjectCode: "FIS",
      kind: "HOMEWORK" as const,
      gradeComponent: "HOMEWORK" as const,
      deliveryType: "ESSAY" as const,
      allowLateSubmission: false,
      dueDate: new Date("2026-05-14T03:00:00.000Z"),
    },
  ],
  IPS: [
    {
      title: "Observasi Pasar Tradisional",
      subjectCode: "EKO",
      kind: "PROJECT" as const,
      gradeComponent: "PRACTICAL" as const,
      deliveryType: "FILE" as const,
      allowLateSubmission: true,
      dueDate: new Date("2026-05-12T06:00:00.000Z"),
    },
    {
      title: "Esai Dinamika Sosial Remaja",
      subjectCode: "SOS",
      kind: "HOMEWORK" as const,
      gradeComponent: "HOMEWORK" as const,
      deliveryType: "ESSAY" as const,
      allowLateSubmission: false,
      dueDate: new Date("2026-05-14T03:00:00.000Z"),
    },
  ],
} as const;

const NOTIFICATION_SEED = [
  {
    recipientIdentifier: "admin.sekolah",
    triggeredByIdentifier: "admin.kurikulum",
    type: "SYSTEM" as const,
    title: "Ringkasan Kesiapan Semester",
    message: "Seluruh kelas aktif, jadwal terbit, dan 24 akun siswa siap digunakan untuk demo.",
  },
  {
    recipientIdentifier: "guru.ratih",
    triggeredByIdentifier: "admin.kurikulum",
    type: "ASSIGNMENT_NEW" as const,
    title: "Tugas baru untuk X MIPA 1",
    message: "Laporan Praktikum Difusi sudah dipublikasikan untuk X MIPA 1 dan XI MIPA 1.",
  },
  {
    recipientIdentifier: "siswa.xmipa1.01",
    triggeredByIdentifier: "guru.ratih",
    type: "ASSIGNMENT_DEADLINE" as const,
    title: "Batas pengumpulan besok",
    message: "Jangan lupa unggah laporan praktikum Biologi sebelum Kamis pukul 13.00 WIB.",
  },
  {
    recipientIdentifier: "ortu.xmipa1.01",
    triggeredByIdentifier: "guru.ratih",
    type: "ATTENDANCE_ALERT" as const,
    title: "Kehadiran anak perlu perhatian",
    message: "Alya Safitri tercatat terlambat hadir pada sesi pertama hari Senin.",
  },
] as const;

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? name,
    lastName: parts.slice(1).join(" ") || null,
  };
};

const truncateTables = async () => {
  const tables = [
    "AttendanceRecord",
    "TeacherAttendance",
    "AttendanceSession",
    "AssignmentSubmission",
    "AssignmentQuestion",
    "AssignmentClass",
    "Assignment",
    "MaterialAttachment",
    "UploadScanJob",
    "UploadIntent",
    "Material",
    "ForumReply",
    "ForumThread",
    "Note",
    "CalendarEventClass",
    "CalendarEvent",
    "ClassSchedule",
    "GradeWeight",
    "SubjectTeacher",
    "SubjectClass",
    "SubjectMajor",
    "Subject",
    "StudentClassEnrollment",
    "StudentProfile",
    "TeacherProfile",
    "ParentProfile",
    "ParentStudent",
    "Class",
    "ReportCardSnapshot",
    "AcademicYear",
    "MajorTeacher",
    "Major",
    "ScheduleTemplate",
    "Notification",
    "NotificationPreference",
    "ParentInvite",
    "QuestionPackageItem",
    "QuestionPackage",
    "Question",
    "PasswordResetToken",
    "AuthCredential",
    "AuditLog",
    "SystemHeartbeat",
    "DemoInstance",
    "User",
    "SchoolProfile",
  ];

  const query = `TRUNCATE TABLE ${tables.map((table) => `"${table}"`).join(", ")} CASCADE;`;
  await prisma.$executeRawUnsafe(query);
};

type CreatedAccount = {
  identifier: string;
  email: string | null;
  name: string;
  role: Role;
  password: string;
  className?: string;
  linkedStudentName?: string;
};

const createdAccounts: CreatedAccount[] = [];

const createUserWithCredential = async ({
  identifier,
  email,
  name,
  role,
  schoolId,
  phone,
  address,
  bio,
  title,
  classId,
  gender,
}: {
  identifier: string;
  email: string | null;
  name: string;
  role: Role;
  schoolId: string;
  phone?: string;
  address?: string;
  bio?: string;
  title?: string;
  classId?: string;
  gender?: "MALE" | "FEMALE";
}) => {
  const { firstName, lastName } = splitName(name);
  const password = DEMO_PASSWORD;
  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      schoolId,
      email,
      name,
      firstName,
      lastName,
      phone: phone ?? null,
      address: address ?? null,
      bio: bio ?? null,
      role,
      onboardingCompletedAt: new Date(),
      roleSelectedAt: new Date(),
    },
  });

  await prisma.authCredential.create({
    data: {
      userId: user.id,
      identifier,
      passwordHash: hashedPassword.passwordHash,
      passwordSalt: hashedPassword.passwordSalt,
      mustChangePassword: false,
      isDefaultPassword: false,
    },
  });

  await prisma.notificationPreference.create({
    data: {
      userId: user.id,
      emailNotifications: true,
      assignmentReminders: true,
      attendanceAlerts: true,
      gradePublished: role !== Role.PARENT,
    },
  });

  if (role === Role.TEACHER) {
    await prisma.teacherProfile.create({
      data: {
        userId: user.id,
        title: title ?? null,
      },
    });
  }

  if (role === Role.STUDENT) {
    await prisma.studentProfile.create({
      data: {
        userId: user.id,
        classId: classId ?? null,
        gender: gender ?? null,
        status: "ACTIVE",
      },
    });
  }

  if (role === Role.PARENT) {
    await prisma.parentProfile.create({
      data: {
        userId: user.id,
      },
    });
  }

  return { ...user, identifier, password };
};

const buildDemoCredentialsMarkdown = () => {
  const admins = createdAccounts.filter((account) => account.role === Role.ADMIN);
  const teachers = createdAccounts.filter((account) => account.role === Role.TEACHER);
  const students = createdAccounts.filter((account) => account.role === Role.STUDENT);
  const parents = createdAccounts.filter((account) => account.role === Role.PARENT);

  const lines = [
    "# Demo Credentials",
    "",
    `Dokumen ini dibuat untuk dataset seed demo **${SCHOOL.name}**.`,
    "",
    "## Ringkasan",
    "",
    `- Sekolah: **${SCHOOL.name}**`,
    `- Kode sekolah: \`${SCHOOL.schoolCode}\``,
    `- Semester aktif: **2025/2026 - Genap**`,
    `- Password semua akun demo: \`${DEMO_PASSWORD}\``,
    "- Semua identifier login menggunakan huruf kecil.",
    "",
    "## Peran Demo Publik",
    "",
    "| Peran | Nama | Identifier | Email | Password |",
    "|---|---|---|---|---|",
    ...DEMO_CATALOG.publicRoles.map(
      (account) =>
        `| ${account.label} | ${account.name} | \`${account.identifier}\` | ${account.email} | \`${DEMO_PASSWORD}\` |`
    ),
    "",
    "## Akun Utama",
    "",
    "| Role | Nama | Identifier | Email | Password |",
    "|---|---|---|---|---|",
    ...[...admins, ...teachers.slice(0, 4), ...students.slice(0, 2), ...parents.slice(0, 2)].map(
      (account) =>
        `| ${account.role} | ${account.name} | \`${account.identifier}\` | ${account.email ?? "-"} | \`${account.password}\` |`
    ),
    "",
    "## Admin",
    "",
    "| Nama | Identifier | Email | Password |",
    "|---|---|---|---|",
    ...admins.map(
      (account) =>
        `| ${account.name} | \`${account.identifier}\` | ${account.email ?? "-"} | \`${account.password}\` |`
    ),
    "",
    "## Guru",
    "",
    "| Nama | Identifier | Email | Password |",
    "|---|---|---|---|",
    ...teachers.map(
      (account) =>
        `| ${account.name} | \`${account.identifier}\` | ${account.email ?? "-"} | \`${account.password}\` |`
    ),
    "",
    "## Siswa dan Orang Tua",
    "",
  ];

  for (const classroom of CLASSES) {
    const classStudents = students.filter((account) => account.className === classroom.name);
    const classParents = parents.filter((account) => account.className === classroom.name);

    lines.push(`### ${classroom.name}`);
    lines.push("");
    lines.push("| Siswa | Identifier Siswa | Orang Tua | Identifier Ortu | Password |");
    lines.push("|---|---|---|---|---|");

    for (let index = 0; index < classStudents.length; index += 1) {
      const student = classStudents[index];
      const parent = classParents[index];
      lines.push(
        `| ${student?.name ?? "-"} | \`${student?.identifier ?? "-"}\` | ${parent?.name ?? "-"} | \`${parent?.identifier ?? "-"}\` | \`${DEMO_PASSWORD}\` |`
      );
    }

    lines.push("");
  }

  lines.push("## Catatan Demo");
  lines.push("");
  lines.push("- Akun siswa dan orang tua sudah saling terhubung.");
  lines.push("- Semua akun sudah melewati onboarding dan siap login.");
  lines.push("- Dataset berisi jadwal kelas, tugas, materi, forum, absensi, notifikasi, dan contoh rapor.");
  lines.push("");

  return `${lines.join("\n")}\n`;
};

async function main() {
  await truncateTables();

  const school = await prisma.schoolProfile.create({
    data: SCHOOL,
  });

  const academicYears = await Promise.all(
    ACADEMIC_YEARS.map((academicYear) =>
      prisma.academicYear.create({
        data: {
          schoolId: school.id,
          ...academicYear,
        },
      })
    )
  );

  const activeAcademicYear = academicYears.find((item) => item.isActive);
  const archivedAcademicYear = academicYears.find((item) => !item.isActive);
  if (!activeAcademicYear || !archivedAcademicYear) {
    throw new Error("Academic year demo tidak lengkap.");
  }

  await prisma.scheduleTemplate.createMany({
    data: SCHEDULE_TEMPLATES.map((slot) => ({
      schoolId: school.id,
      ...slot,
    })),
  });

  const majorMap = new Map<string, { id: string; code: string; name: string }>();
  for (const major of MAJORS) {
    const createdMajor = await prisma.major.create({
      data: {
        schoolId: school.id,
        ...major,
      },
    });
    majorMap.set(major.code, createdMajor);
  }

  const userMap = new Map<string, Awaited<ReturnType<typeof createUserWithCredential>>>();
  for (const staff of STAFF) {
    const user = await createUserWithCredential({
      identifier: staff.identifier,
      email: staff.email,
      name: staff.name,
      role: staff.role,
      schoolId: school.id,
      phone: staff.phone,
      address: staff.address,
      bio: staff.bio,
      title: "title" in staff ? staff.title : undefined,
    });

    userMap.set(staff.identifier, user);
    createdAccounts.push({
      identifier: staff.identifier,
      email: staff.email,
      name: staff.name,
      role: staff.role,
      password: DEMO_PASSWORD,
    });
  }

  const subjectMap = new Map<string, { id: string; code: string; name: string; color: string | null }>();
  const questionPackageMap = new Map<string, string>();

  for (const subject of SUBJECTS) {
    const createdSubject = await prisma.subject.create({
      data: {
        schoolId: school.id,
        name: subject.name,
        code: subject.code,
        category: subject.category,
        description: `${subject.name} untuk pembelajaran semester genap ${activeAcademicYear.year}.`,
        color: subject.color,
        hoursPerWeek: subject.hoursPerWeek,
        appliesToAllMajors: subject.appliesToAllMajors,
      },
    });

    subjectMap.set(subject.code, createdSubject);

    if (!subject.appliesToAllMajors && subject.majorCodes) {
      await prisma.subjectMajor.createMany({
        data: subject.majorCodes.map((majorCode) => ({
          subjectId: createdSubject.id,
          majorId: majorMap.get(majorCode)?.id ?? "",
        })),
      });
    }

    await prisma.subjectTeacher.createMany({
      data: subject.teacherIdentifiers.map((identifier) => ({
        subjectId: createdSubject.id,
        teacherId: userMap.get(identifier)?.id ?? "",
      })),
      skipDuplicates: true,
    });

    const essayQuestion = await prisma.question.create({
      data: {
        type: "ESSAY",
        subjectId: createdSubject.id,
        topic: `Refleksi ${subject.name}`,
        difficulty: "MEDIUM",
        text: `Jelaskan konsep inti yang paling penting dari topik ${subject.name} pada pekan ini.`,
        rubric: "Ketepatan konsep, contoh kontekstual, dan struktur jawaban.",
        points: 20,
      },
    });

    const mcqQuestion = await prisma.question.create({
      data: {
        type: "MCQ",
        subjectId: createdSubject.id,
        topic: `Pemahaman dasar ${subject.name}`,
        difficulty: "EASY",
        text: `Pilih jawaban yang paling tepat terkait materi ${subject.name}.`,
        options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
        correctAnswers: [1],
        points: 10,
      },
    });

    const questionPackage = await prisma.questionPackage.create({
      data: {
        name: `Bank Soal ${subject.name}`,
        description: `Paket soal dasar untuk ${subject.name} semester ${activeAcademicYear.semester}.`,
        subjectId: createdSubject.id,
        usageCount: 0,
      },
    });

    await prisma.questionPackageItem.createMany({
      data: [
        { packageId: questionPackage.id, questionId: essayQuestion.id, position: 1 },
        { packageId: questionPackage.id, questionId: mcqQuestion.id, position: 2 },
      ],
    });

    questionPackageMap.set(subject.code, questionPackage.id);
  }

  for (const subject of SUBJECTS) {
    if (!subject.majorCodes) continue;
    for (const majorCode of subject.majorCodes) {
      const major = majorMap.get(majorCode);
      if (!major) continue;
      for (const teacherIdentifier of subject.teacherIdentifiers) {
        const teacher = userMap.get(teacherIdentifier);
        if (!teacher) continue;
        await prisma.majorTeacher.create({
          data: {
            majorId: major.id,
            teacherId: teacher.id,
          },
        });
      }
    }
  }

  const classMap = new Map<string, { id: string; name: string; major: string; room: string }>();
  for (const classroom of CLASSES) {
    const roster = CLASS_ROSTERS[classroom.key];
    const maleCount = roster.filter((_, index) => index % 2 === 1).length;
    const femaleCount = roster.length - maleCount;
    const homeroomTeacher = userMap.get(classroom.homeroomTeacherIdentifier);

    const createdClass = await prisma.class.create({
      data: {
        schoolId: school.id,
        name: classroom.name,
        grade: classroom.grade,
        major: classroom.major,
        section: classroom.section,
        academicYearId: activeAcademicYear.id,
        homeroomTeacherId: homeroomTeacher?.id ?? null,
        studentCount: roster.length,
        maleCount,
        femaleCount,
      },
    });

    classMap.set(classroom.key, {
      id: createdClass.id,
      name: createdClass.name,
      major: classroom.major,
      room: classroom.room,
    });
  }

  for (const classroom of CLASSES) {
    const currentClass = classMap.get(classroom.key);
    if (!currentClass) continue;

    const applicableSubjects = SUBJECTS.filter(
      (subject) => subject.appliesToAllMajors || subject.majorCodes?.includes(classroom.major)
    );

    await prisma.subjectClass.createMany({
      data: applicableSubjects.map((subject) => ({
        subjectId: subjectMap.get(subject.code)?.id ?? "",
        classId: currentClass.id,
      })),
      skipDuplicates: true,
    });

    await prisma.gradeWeight.createMany({
      data: applicableSubjects.map((subject) => ({
        subjectId: subjectMap.get(subject.code)?.id ?? "",
        classId: currentClass.id,
        semester: activeAcademicYear.semester,
        homeworkWeight: subject.category === "SCIENCE" ? 20 : 30,
        quizWeight: 25,
        examWeight: 30,
        practicalWeight: subject.category === "SCIENCE" ? 25 : 15,
      })),
      skipDuplicates: true,
    });
  }

  for (const classroom of CLASSES) {
    const currentClass = classMap.get(classroom.key);
    if (!currentClass) continue;

    const roster = CLASS_ROSTERS[classroom.key];
    for (let index = 0; index < roster.length; index += 1) {
      const entry = roster[index];
      const sequence = String(index + 1).padStart(2, "0");
      const studentIdentifier = `siswa.${classroom.key}.${sequence}`;
      const parentIdentifier = `ortu.${classroom.key}.${sequence}`;
      const studentEmail = `${studentIdentifier}@demo.schoolio.id`;
      const parentEmail = `${parentIdentifier}@demo.schoolio.id`;
      const gender = index % 2 === 0 ? "FEMALE" : "MALE";

      const student = await createUserWithCredential({
        identifier: studentIdentifier,
        email: studentEmail,
        name: entry.studentName,
        role: Role.STUDENT,
        schoolId: school.id,
        address: `Siswa ${classroom.name}, ${SCHOOL.address}`,
        bio: `Siswa aktif kelas ${classroom.name} semester ${activeAcademicYear.year}.`,
        classId: currentClass.id,
        gender,
      });

      const parent = await createUserWithCredential({
        identifier: parentIdentifier,
        email: parentEmail,
        name: entry.parentName,
        role: Role.PARENT,
        schoolId: school.id,
        phone: `0813-88${classroom.grade}${sequence}90`,
        address: `Orang tua ${entry.studentName}, ${SCHOOL.address}`,
        bio: `Akun orang tua untuk memantau progres ${entry.studentName}.`,
      });

      await prisma.parentStudent.create({
        data: {
          parentId: parent.id,
          studentId: student.id,
        },
      });

      await prisma.studentClassEnrollment.create({
        data: {
          studentId: student.id,
          classId: currentClass.id,
          academicYearId: activeAcademicYear.id,
          startedAt: activeAcademicYear.startDate,
        },
      });

      if (classroom.grade === 11) {
        await prisma.studentClassEnrollment.create({
          data: {
            studentId: student.id,
            classId: currentClass.id,
            academicYearId: archivedAcademicYear.id,
            startedAt: archivedAcademicYear.startDate,
            endedAt: archivedAcademicYear.endDate,
          },
        });
      }

      createdAccounts.push({
        identifier: studentIdentifier,
        email: studentEmail,
        name: entry.studentName,
        role: Role.STUDENT,
        password: DEMO_PASSWORD,
        className: classroom.name,
      });
      createdAccounts.push({
        identifier: parentIdentifier,
        email: parentEmail,
        name: entry.parentName,
        role: Role.PARENT,
        password: DEMO_PASSWORD,
        className: classroom.name,
        linkedStudentName: entry.studentName,
      });

      userMap.set(studentIdentifier, student);
      userMap.set(parentIdentifier, parent);
    }
  }

  for (const classroom of CLASSES) {
    const currentClass = classMap.get(classroom.key);
    if (!currentClass) continue;

    const scheduleMatrix = classroom.major === "MIPA" ? MIPA_SCHEDULE : IPS_SCHEDULE;
    for (const [dayOfWeek, subjectCodes] of Object.entries(scheduleMatrix)) {
      const lessonSlots = SCHEDULE_TEMPLATES.filter((slot) => !slot.isBreak).slice(0, subjectCodes.length);

      for (let index = 0; index < subjectCodes.length; index += 1) {
        const subjectCode = subjectCodes[index];
        const subject = SUBJECTS.find((item) => item.code === subjectCode);
        const subjectRecord = subjectMap.get(subjectCode);
        const slot = lessonSlots[index];
        if (!subject || !subjectRecord || !slot) continue;

        await prisma.classSchedule.create({
          data: {
            classId: currentClass.id,
            subjectId: subjectRecord.id,
            teacherId: userMap.get(subject.teacherIdentifiers[0])?.id ?? null,
            dayOfWeek: dayOfWeek as "MON" | "TUE" | "WED" | "THU" | "FRI",
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: currentClass.room,
            color: subject.color,
          },
        });
      }
    }
  }

  for (const classroom of CLASSES) {
    const currentClass = classMap.get(classroom.key);
    if (!currentClass) continue;

    const assignmentBlueprints = [
      ...CORE_ASSIGNMENTS,
      ...(classroom.major === "MIPA" ? SPECIAL_ASSIGNMENTS.MIPA : SPECIAL_ASSIGNMENTS.IPS),
    ];

    for (const blueprint of assignmentBlueprints) {
      const subject = SUBJECTS.find((item) => item.code === blueprint.subjectCode);
      const subjectRecord = subjectMap.get(blueprint.subjectCode);
      if (!subject || !subjectRecord) continue;

      const assignment = await prisma.assignment.create({
        data: {
          title: `${blueprint.title} - ${currentClass.name}`,
          description: `Tugas ${blueprint.title.toLowerCase()} untuk siswa kelas ${currentClass.name}.`,
          subjectId: subjectRecord.id,
          teacherId: userMap.get(subject.teacherIdentifiers[0])?.id ?? "",
          dueDate: blueprint.dueDate,
          allowLateSubmission: blueprint.allowLateSubmission,
          lateUntil: blueprint.allowLateSubmission
            ? new Date(blueprint.dueDate.getTime() + 2 * 24 * 60 * 60 * 1000)
            : null,
          maxAttempts: blueprint.deliveryType === "MCQ" ? 2 : 1,
          gradingPolicy: blueprint.deliveryType === "MCQ" ? "HIGHEST" : "LATEST",
          gradeComponent: blueprint.gradeComponent,
          kind: blueprint.kind,
          deliveryType: blueprint.deliveryType,
          status: "ACTIVE",
          questionPackageId:
            blueprint.deliveryType === "MCQ" || blueprint.deliveryType === "ESSAY"
              ? questionPackageMap.get(blueprint.subjectCode) ?? null
              : null,
        },
      });

      await prisma.assignmentClass.create({
        data: {
          assignmentId: assignment.id,
          classId: currentClass.id,
        },
      });

      const questionPackageId = questionPackageMap.get(blueprint.subjectCode);
      if (questionPackageId) {
        const packageItems = await prisma.questionPackageItem.findMany({
          where: { packageId: questionPackageId },
          orderBy: { position: "asc" },
        });

        await prisma.assignmentQuestion.createMany({
          data: packageItems.map((item) => ({
            assignmentId: assignment.id,
            questionId: item.questionId,
            position: item.position,
          })),
          skipDuplicates: true,
        });
      }

      const roster = CLASS_ROSTERS[classroom.key];
      for (let index = 0; index < roster.length; index += 1) {
        const sequence = String(index + 1).padStart(2, "0");
        const student = userMap.get(`siswa.${classroom.key}.${sequence}`);
        if (!student) continue;

        const isGraded = index < 4;
        await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignment.id,
            studentId: student.id,
            status: isGraded ? "GRADED" : index === 4 ? "SUBMITTED" : "PENDING",
            attemptCount: blueprint.deliveryType === "MCQ" ? 1 : 0,
            submittedAt: isGraded || index === 4 ? new Date("2026-05-05T02:30:00.000Z") : null,
            grade: isGraded ? 78 + index * 4 : null,
            feedback: isGraded ? "Jawaban cukup baik, tingkatkan ketelitian pada analisis." : null,
            response: isGraded || index === 4
              ? {
                  summary: `Respons demo untuk ${blueprint.title}`,
                  attachment:
                    blueprint.deliveryType === "FILE" ? "laporan-praktikum.pdf" : null,
                }
              : undefined,
          },
        });
      }
    }
  }

  for (const classroom of CLASSES) {
    const currentClass = classMap.get(classroom.key);
    if (!currentClass) continue;

    const materialSubjects = classroom.major === "MIPA" ? ["BIND", "BIO"] : ["BIND", "EKO"];
    for (const subjectCode of materialSubjects) {
      const subject = SUBJECTS.find((item) => item.code === subjectCode);
      const subjectRecord = subjectMap.get(subjectCode);
      if (!subject || !subjectRecord) continue;

      const material = await prisma.material.create({
        data: {
          title: `Modul ${subjectRecord.name} - ${currentClass.name}`,
          description: `Materi ringkas ${subjectRecord.name} untuk kelas ${currentClass.name}.`,
          subjectId: subjectRecord.id,
          classId: currentClass.id,
          teacherId: userMap.get(subject.teacherIdentifiers[0])?.id ?? "",
        },
      });

      await prisma.materialAttachment.create({
        data: {
          materialId: material.id,
          fileName: `${subjectCode.toLowerCase()}-${classroom.key}.pdf`,
          fileType: "application/pdf",
          sizeLabel: "1.2 MB",
          url: `https://cdn.demo.schoolio.id/materials/${subjectCode.toLowerCase()}-${classroom.key}.pdf`,
          scanStatus: "CLEAN",
        },
      });
    }
  }

  for (const classroom of CLASSES) {
    const currentClass = classMap.get(classroom.key);
    if (!currentClass) continue;

    const primarySubjectCode = classroom.major === "MIPA" ? "BIO" : "EKO";
    const primarySubject = SUBJECTS.find((item) => item.code === primarySubjectCode);
    const subjectRecord = subjectMap.get(primarySubjectCode);
    const teacher = primarySubject
      ? userMap.get(primarySubject.teacherIdentifiers[0])
      : null;
    const student = userMap.get(`siswa.${classroom.key}.01`);
    if (!subjectRecord || !teacher || !student) continue;

    const thread = await prisma.forumThread.create({
      data: {
        title: `Diskusi ${subjectRecord.name} Pekan 4 - ${currentClass.name}`,
        content: `Silakan gunakan thread ini untuk berdiskusi tentang materi ${subjectRecord.name} dan tugas terbaru.`,
        subjectId: subjectRecord.id,
        classId: currentClass.id,
        authorId: teacher.id,
        authorRole: Role.TEACHER,
        status: "OPEN",
        isPinned: true,
        replyCount: 2,
        upvotes: 6,
      },
    });

    await prisma.forumReply.createMany({
      data: [
        {
          threadId: thread.id,
          content: "Mohon perhatikan rubrik tugas dan contoh jawaban yang sudah saya unggah.",
          authorId: teacher.id,
          authorRole: Role.TEACHER,
          isAcceptedAnswer: false,
          upvotes: 3,
        },
        {
          threadId: thread.id,
          content: "Baik, Bu. Saya sudah lihat contoh laporan dan akan revisi bagian analisis.",
          authorId: student.id,
          authorRole: Role.STUDENT,
          isAcceptedAnswer: false,
          upvotes: 2,
        },
      ],
    });

    await prisma.note.create({
      data: {
        title: `Catatan belajar ${subjectRecord.name}`,
        content: `Ringkasan belajar mandiri untuk materi ${subjectRecord.name} kelas ${currentClass.name}.`,
        subjectId: subjectRecord.id,
        classId: currentClass.id,
        authorId: student.id,
        visibility: "CLASS",
        isPinned: false,
        color: "bg-slate-500",
        tags: ["ringkasan", "ujian-pekanan"],
      },
    });
  }

  const semesterKickoff = await prisma.calendarEvent.create({
    data: {
      title: "Rapat Koordinasi Tengah Semester",
      description: "Sinkronisasi progres akademik, kedisiplinan, dan tindak lanjut remedial per kelas.",
      date: new Date("2026-05-05T01:00:00.000Z"),
      type: "ACADEMIC",
      isRecurring: false,
      createdById: userMap.get("admin.sekolah")?.id ?? null,
    },
  });

  await prisma.calendarEventClass.createMany({
    data: CLASSES.map((classroom) => ({
      eventId: semesterKickoff.id,
      classId: classMap.get(classroom.key)?.id ?? "",
    })),
    skipDuplicates: true,
  });

  const subjectTeacherByCode = (code: string) => {
    const subject = SUBJECTS.find((item) => item.code === code);
    return subject ? userMap.get(subject.teacherIdentifiers[0]) : null;
  };

  for (const classroom of CLASSES) {
    const currentClass = classMap.get(classroom.key);
    if (!currentClass) continue;

    const attendanceSubjectCode = classroom.major === "MIPA" ? "BIO" : "EKO";
    const subject = subjectMap.get(attendanceSubjectCode);
    const teacher = subjectTeacherByCode(attendanceSubjectCode);
    if (!subject || !teacher) continue;

    const attendanceDates = [
      new Date("2026-04-21T00:00:00.000Z"),
      new Date("2026-04-28T00:00:00.000Z"),
    ];

    for (const date of attendanceDates) {
      const session = await prisma.attendanceSession.create({
        data: {
          sessionKey: `${currentClass.id}:${subject.id}:${date.toISOString().slice(0, 10)}`,
          classId: currentClass.id,
          subjectId: subject.id,
          teacherId: teacher.id,
          takenByTeacherId: teacher.id,
          status: "FINALIZED",
          lockedAt: new Date(date.getTime() + 30 * 60 * 1000),
          finalizedAt: new Date(date.getTime() + 45 * 60 * 1000),
          date,
          startTime: "07:00",
          endTime: "07:45",
        },
      });

      const roster = CLASS_ROSTERS[classroom.key];
      await prisma.attendanceRecord.createMany({
        data: roster.map((_, index) => {
          const sequence = String(index + 1).padStart(2, "0");
          const student = userMap.get(`siswa.${classroom.key}.${sequence}`);
          const status =
            index === 0 && date === attendanceDates[1]
              ? "ABSENT"
              : index === 3
              ? "SICK"
              : "PRESENT";

          return {
            sessionId: session.id,
            studentId: student?.id ?? "",
            status,
            note:
              status === "ABSENT"
                ? "Tidak hadir, menunggu konfirmasi wali."
                : status === "SICK"
                ? "Sakit dengan surat dari orang tua."
                : null,
          };
        }),
      });

      await prisma.teacherAttendance.create({
        data: {
          teacherId: teacher.id,
          sessionId: session.id,
          date,
          status: "PRESENT",
          note: "Mengajar sesuai jadwal.",
          isAllDay: false,
        },
      });
    }
  }

  for (const notification of NOTIFICATION_SEED) {
    await prisma.notification.create({
      data: {
        recipientId: userMap.get(notification.recipientIdentifier)?.id ?? "",
        triggeredById: userMap.get(notification.triggeredByIdentifier)?.id ?? null,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: {
          source: "demo-seed",
        },
      },
    });
  }

  for (const classroom of CLASSES.filter((item) => item.grade === 11)) {
    const currentClass = classMap.get(classroom.key);
    if (!currentClass) continue;

    const roster = CLASS_ROSTERS[classroom.key];
    const reportItems = roster.map((entry, index) => ({
      studentName: entry.studentName,
      averageScore: 82 + index,
      attendanceRate: index === 0 ? 95 : 97 + (index % 2),
      note:
        index % 2 === 0
          ? "Aktif berdiskusi dan konsisten menyelesaikan tugas tepat waktu."
          : "Perlu peningkatan kerapian dalam pengumpulan dokumen praktik.",
    }));

    await prisma.reportCardSnapshot.create({
      data: {
        classId: currentClass.id,
        academicYearId: archivedAcademicYear.id,
        semester: archivedAcademicYear.semester,
        publishedById: userMap.get("admin.kurikulum")?.id ?? "",
        publishedAt: new Date("2026-01-04T02:00:00.000Z"),
        snapshot: {
          className: currentClass.name,
          homeroomTeacher: STAFF.find(
            (staff) => staff.identifier === CLASSES.find((item) => item.key === classroom.key)?.homeroomTeacherIdentifier
          )?.name,
          summaries: reportItems,
        },
      },
    });
  }

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: userMap.get("admin.sekolah")?.id ?? null,
        actorRole: Role.ADMIN,
        action: "SCHOOL_PROFILE_UPDATED",
        entityType: "SchoolProfile",
        entityId: school.id,
        afterData: {
          website: SCHOOL.website,
          principalName: SCHOOL.principalName,
        },
        reason: "Initial demo seed bootstrap",
      },
      {
        actorId: userMap.get("admin.kurikulum")?.id ?? null,
        actorRole: Role.ADMIN,
        action: "REPORT_CARD_PUBLISHED",
        entityType: "ReportCardSnapshot",
        reason: "Demo data publishing flow",
      },
    ],
  });

  writeFileSync(DEMO_DOC_PATH, buildDemoCredentialsMarkdown(), "utf8");

  console.log(`Seed demo selesai untuk ${SCHOOL.name}.`);
  console.log(`Akun demo: ${createdAccounts.length} user`);
  console.log(`Dokumen kredensial demo ditulis ke ${DEMO_DOC_PATH}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
