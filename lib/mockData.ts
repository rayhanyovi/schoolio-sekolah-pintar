import {
  EventType,
  SubjectCategory,
  ThreadStatus,
  NoteVisibility,
  Semester,
} from "./constants";

// Class types and mock data
export interface ClassData {
  id: string;
  name: string;
  grade: 10 | 11 | 12;
  major?: string;
  section: string;
  homeroomTeacher: string;
  homeroomTeacherId: string;
  academicYear: string;
  studentCount: number;
  maleCount: number;
  femaleCount: number;
}

export const mockClasses: ClassData[] = [
  {
    id: "1",
    name: "X-A",
    grade: 10,
    section: "A",
    homeroomTeacher: "Ibu Sri Wahyuni",
    homeroomTeacherId: "t1",
    academicYear: "2024/2025",
    studentCount: 32,
    maleCount: 15,
    femaleCount: 17,
  },
  {
    id: "2",
    name: "X-B",
    grade: 10,
    section: "B",
    homeroomTeacher: "Bapak Ahmad Hidayat",
    homeroomTeacherId: "t2",
    academicYear: "2024/2025",
    studentCount: 30,
    maleCount: 14,
    femaleCount: 16,
  },
  {
    id: "3",
    name: "X-C",
    grade: 10,
    section: "C",
    homeroomTeacher: "Ibu Dewi Lestari",
    homeroomTeacherId: "t3",
    academicYear: "2024/2025",
    studentCount: 31,
    maleCount: 16,
    femaleCount: 15,
  },
  {
    id: "4",
    name: "XI-A",
    grade: 11,
    section: "A",
    homeroomTeacher: "Bapak Budi Santoso",
    homeroomTeacherId: "t4",
    academicYear: "2024/2025",
    studentCount: 28,
    maleCount: 12,
    femaleCount: 16,
  },
  {
    id: "5",
    name: "XI-B",
    grade: 11,
    section: "B",
    homeroomTeacher: "Ibu Ratna Sari",
    homeroomTeacherId: "t5",
    academicYear: "2024/2025",
    studentCount: 29,
    maleCount: 14,
    femaleCount: 15,
  },
  {
    id: "6",
    name: "XII-A",
    grade: 12,
    section: "A",
    homeroomTeacher: "Bapak Hendra Wijaya",
    homeroomTeacherId: "t6",
    academicYear: "2024/2025",
    studentCount: 27,
    maleCount: 13,
    femaleCount: 14,
  },
  {
    id: "7",
    name: "XII-B",
    grade: 12,
    section: "B",
    homeroomTeacher: "Ibu Maya Putri",
    homeroomTeacherId: "t7",
    academicYear: "2024/2025",
    studentCount: 26,
    maleCount: 12,
    femaleCount: 14,
  },
];

export interface MajorData {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export const mockMajors: MajorData[] = [
  { id: "m1", code: "RPL", name: "Rekayasa Perangkat Lunak" },
  { id: "m2", code: "IPA", name: "Ilmu Pengetahuan Alam" },
  { id: "m3", code: "IPS", name: "Ilmu Pengetahuan Sosial" },
];

export const mockMajorTeachers: Record<string, string[]> = {
  m1: ["t1", "t4", "t6"],
  m2: ["t2", "t3", "t5"],
  m3: ["t7", "t8", "t9"],
};

// Subject types and mock data
export interface SubjectData {
  id: string;
  name: string;
  code: string;
  category: SubjectCategory;
  description: string;
  teachers: { id: string; name: string }[];
  classIds: string[];
  color: string;
  hoursPerWeek: number;
}

export const mockSubjects: SubjectData[] = [
  {
    id: "s1",
    name: "Matematika",
    code: "MTK",
    category: "SCIENCE",
    description: "Pelajaran matematika dasar dan lanjutan",
    teachers: [{ id: "t1", name: "Ibu Sri Wahyuni" }],
    classIds: ["1", "2", "3", "4", "5", "6", "7"],
    color: "bg-primary",
    hoursPerWeek: 4,
  },
  {
    id: "s2",
    name: "Fisika",
    code: "FIS",
    category: "SCIENCE",
    description: "Ilmu tentang alam dan fenomena fisik",
    teachers: [{ id: "t2", name: "Bapak Ahmad Hidayat" }],
    classIds: ["4", "5", "6", "7"],
    color: "bg-secondary",
    hoursPerWeek: 3,
  },
  {
    id: "s3",
    name: "Kimia",
    code: "KIM",
    category: "SCIENCE",
    description: "Ilmu tentang zat dan reaksinya",
    teachers: [{ id: "t3", name: "Ibu Dewi Lestari" }],
    classIds: ["4", "5", "6", "7"],
    color: "bg-info",
    hoursPerWeek: 3,
  },
  {
    id: "s4",
    name: "Biologi",
    code: "BIO",
    category: "SCIENCE",
    description: "Ilmu tentang makhluk hidup",
    teachers: [{ id: "t4", name: "Bapak Budi Santoso" }],
    classIds: ["4", "5", "6", "7"],
    color: "bg-success",
    hoursPerWeek: 3,
  },
  {
    id: "s5",
    name: "Bahasa Indonesia",
    code: "BIND",
    category: "LANGUAGE",
    description: "Bahasa dan sastra Indonesia",
    teachers: [{ id: "t5", name: "Ibu Ratna Sari" }],
    classIds: ["1", "2", "3", "4", "5", "6", "7"],
    color: "bg-warning",
    hoursPerWeek: 4,
  },
  {
    id: "s6",
    name: "Bahasa Inggris",
    code: "BING",
    category: "LANGUAGE",
    description: "English language learning",
    teachers: [{ id: "t6", name: "Bapak Hendra Wijaya" }],
    classIds: ["1", "2", "3", "4", "5", "6", "7"],
    color: "bg-primary",
    hoursPerWeek: 4,
  },
  {
    id: "s7",
    name: "Sejarah",
    code: "SEJ",
    category: "SOCIAL",
    description: "Sejarah Indonesia dan dunia",
    teachers: [{ id: "t7", name: "Ibu Maya Putri" }],
    classIds: ["1", "2", "3", "4", "5", "6", "7"],
    color: "bg-secondary",
    hoursPerWeek: 2,
  },
  {
    id: "s8",
    name: "PJOK",
    code: "PJOK",
    category: "SPORTS",
    description: "Pendidikan jasmani olahraga dan kesehatan",
    teachers: [{ id: "t8", name: "Bapak Rudi Hartono" }],
    classIds: ["1", "2", "3", "4", "5", "6", "7"],
    color: "bg-success",
    hoursPerWeek: 2,
  },
  {
    id: "s9",
    name: "Seni Budaya",
    code: "SENBUD",
    category: "ART",
    description: "Seni rupa, musik, dan tari",
    teachers: [{ id: "t9", name: "Ibu Linda Kusuma" }],
    classIds: ["1", "2", "3", "4", "5", "6", "7"],
    color: "bg-info",
    hoursPerWeek: 2,
  },
];

// Calendar event types and mock data
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  type: EventType;
  classIds?: string[];
  isRecurring: boolean;
  createdBy: string;
}

export const mockEvents: CalendarEvent[] = [
  {
    id: "e1",
    title: "Ujian Tengah Semester",
    description: "UTS Semester Ganjil 2024/2025",
    date: new Date(2025, 0, 20),
    endDate: new Date(2025, 0, 25),
    type: "ACADEMIC",
    isRecurring: false,
    createdBy: "admin",
  },
  {
    id: "e2",
    title: "Libur Tahun Baru Imlek",
    description: "Tahun Baru Imlek 2576",
    date: new Date(2025, 0, 29),
    type: "HOLIDAY",
    isRecurring: false,
    createdBy: "admin",
  },
  {
    id: "e3",
    title: "Upacara Bendera",
    description: "Upacara rutin hari Senin",
    date: new Date(2025, 0, 6),
    type: "ACTIVITY",
    isRecurring: true,
    createdBy: "admin",
  },
  {
    id: "e4",
    title: "Deadline Tugas Matematika",
    description: "Bab Integral - Kelas XI",
    date: new Date(2025, 0, 15),
    type: "DEADLINE",
    classIds: ["4", "5"],
    isRecurring: false,
    createdBy: "t1",
  },
  {
    id: "e5",
    title: "Ujian Akhir Semester",
    description: "UAS Semester Ganjil 2024/2025",
    date: new Date(2025, 5, 2),
    endDate: new Date(2025, 5, 14),
    type: "ACADEMIC",
    isRecurring: false,
    createdBy: "admin",
  },
  {
    id: "e6",
    title: "Libur Hari Raya Idul Fitri",
    description: "Hari Raya Idul Fitri 1446 H",
    date: new Date(2025, 2, 30),
    endDate: new Date(2025, 3, 7),
    type: "HOLIDAY",
    isRecurring: false,
    createdBy: "admin",
  },
  {
    id: "e7",
    title: "Study Tour Kelas XII",
    description: "Kunjungan industri ke Bandung",
    date: new Date(2025, 1, 15),
    endDate: new Date(2025, 1, 17),
    type: "ACTIVITY",
    classIds: ["6", "7"],
    isRecurring: false,
    createdBy: "admin",
  },
  {
    id: "e8",
    title: "Deadline Essay Bahasa Indonesia",
    description: "Essay tentang sastra klasik",
    date: new Date(2025, 0, 10),
    type: "DEADLINE",
    classIds: ["1", "2", "3"],
    isRecurring: false,
    createdBy: "t5",
  },
];

// Forum types and mock data
export interface ForumThread {
  id: string;
  title: string;
  content: string;
  subjectId: string;
  subjectName: string;
  classId?: string;
  authorId: string;
  authorName: string;
  authorRole: "TEACHER" | "STUDENT";
  status: ThreadStatus;
  isPinned: boolean;
  replyCount: number;
  upvotes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumReply {
  id: string;
  threadId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: "TEACHER" | "STUDENT";
  isAcceptedAnswer: boolean;
  upvotes: number;
  createdAt: Date;
}

export const mockThreads: ForumThread[] = [
  {
    id: "th1",
    title: "Cara menghitung integral substitusi?",
    content:
      "Saya masih bingung dengan metode substitusi pada integral. Bisa tolong jelaskan langkah-langkahnya?",
    subjectId: "s1",
    subjectName: "Matematika",
    authorId: "st1",
    authorName: "Budi Pratama",
    authorRole: "STUDENT",
    status: "RESOLVED",
    isPinned: false,
    replyCount: 5,
    upvotes: 12,
    createdAt: new Date(2025, 0, 2),
    updatedAt: new Date(2025, 0, 3),
  },
  {
    id: "th2",
    title: "Pengumuman: Materi Ulangan Fisika",
    content:
      "Untuk persiapan UTS, materi yang diujikan meliputi Bab 1-4 tentang Kinematika dan Dinamika.",
    subjectId: "s2",
    subjectName: "Fisika",
    authorId: "t2",
    authorName: "Bapak Ahmad Hidayat",
    authorRole: "TEACHER",
    status: "LOCKED",
    isPinned: true,
    replyCount: 2,
    upvotes: 25,
    createdAt: new Date(2025, 0, 1),
    updatedAt: new Date(2025, 0, 1),
  },
  {
    id: "th3",
    title: "Rekomendasi buku untuk belajar Kimia Organik",
    content:
      "Ada yang punya rekomendasi buku atau sumber belajar yang bagus untuk kimia organik?",
    subjectId: "s3",
    subjectName: "Kimia",
    authorId: "st2",
    authorName: "Siti Aminah",
    authorRole: "STUDENT",
    status: "OPEN",
    isPinned: false,
    replyCount: 8,
    upvotes: 7,
    createdAt: new Date(2025, 0, 4),
    updatedAt: new Date(2025, 0, 5),
  },
  {
    id: "th4",
    title: "Diskusi: Pengaruh Teknologi terhadap Bahasa",
    content:
      "Mari diskusikan bagaimana teknologi mempengaruhi perkembangan bahasa Indonesia modern.",
    subjectId: "s5",
    subjectName: "Bahasa Indonesia",
    authorId: "t5",
    authorName: "Ibu Ratna Sari",
    authorRole: "TEACHER",
    status: "OPEN",
    isPinned: true,
    replyCount: 15,
    upvotes: 18,
    createdAt: new Date(2025, 0, 3),
    updatedAt: new Date(2025, 0, 6),
  },
  {
    id: "th5",
    title: "Tips mengerjakan soal reading TOEFL",
    content:
      "Bagaimana strategi efektif untuk mengerjakan bagian reading dalam tes TOEFL?",
    subjectId: "s6",
    subjectName: "Bahasa Inggris",
    authorId: "st3",
    authorName: "Andi Wijaya",
    authorRole: "STUDENT",
    status: "RESOLVED",
    isPinned: false,
    replyCount: 6,
    upvotes: 22,
    createdAt: new Date(2024, 11, 28),
    updatedAt: new Date(2025, 0, 2),
  },
];

export const mockReplies: ForumReply[] = [
  {
    id: "r1",
    threadId: "th1",
    content:
      "Untuk integral substitusi, langkah pertama adalah identifikasi bagian yang bisa di-substitusi dengan u. Biasanya bagian dalam fungsi komposit.",
    authorId: "t1",
    authorName: "Ibu Sri Wahyuni",
    authorRole: "TEACHER",
    isAcceptedAnswer: true,
    upvotes: 8,
    createdAt: new Date(2025, 0, 2),
  },
  {
    id: "r2",
    threadId: "th1",
    content: "Terima kasih bu, sekarang saya sudah lebih paham!",
    authorId: "st1",
    authorName: "Budi Pratama",
    authorRole: "STUDENT",
    isAcceptedAnswer: false,
    upvotes: 2,
    createdAt: new Date(2025, 0, 3),
  },
  {
    id: "r3",
    threadId: "th3",
    content:
      "Saya rekomendasikan buku 'Organic Chemistry' karya Paula Bruice. Sangat lengkap dan ada banyak latihan soal.",
    authorId: "st4",
    authorName: "Dewi Safitri",
    authorRole: "STUDENT",
    isAcceptedAnswer: false,
    upvotes: 5,
    createdAt: new Date(2025, 0, 4),
  },
];

// Notes types and mock data
export interface Note {
  id: string;
  title: string;
  content: string;
  subjectId?: string;
  subjectName?: string;
  classId?: string;
  className?: string;
  authorId: string;
  authorName: string;
  visibility: NoteVisibility;
  isPinned: boolean;
  color: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const mockNotes: Note[] = [
  {
    id: "n1",
    title: "Rumus-rumus Integral",
    content:
      "## Integral Dasar\n\n- ∫x^n dx = (x^(n+1))/(n+1) + C\n- ∫e^x dx = e^x + C\n- ∫sin(x) dx = -cos(x) + C",
    subjectId: "s1",
    subjectName: "Matematika",
    authorId: "st1",
    authorName: "Budi Pratama",
    visibility: "PRIVATE",
    isPinned: true,
    color: "bg-blue-100",
    tags: ["rumus", "integral"],
    createdAt: new Date(2025, 0, 1),
    updatedAt: new Date(2025, 0, 5),
  },
  {
    id: "n2",
    title: "Catatan Hukum Newton",
    content:
      "**Hukum I Newton**: Benda cenderung mempertahankan keadaannya\n\n**Hukum II Newton**: F = m × a\n\n**Hukum III Newton**: Aksi = Reaksi",
    subjectId: "s2",
    subjectName: "Fisika",
    classId: "4",
    className: "XI-A",
    authorId: "t2",
    authorName: "Bapak Ahmad Hidayat",
    visibility: "CLASS",
    isPinned: true,
    color: "bg-green-100",
    tags: ["fisika", "newton"],
    createdAt: new Date(2025, 0, 2),
    updatedAt: new Date(2025, 0, 2),
  },
  {
    id: "n3",
    title: "Vocabulary List - Week 1",
    content:
      "1. Endeavor (n) - usaha\n2. Resilience (n) - ketahanan\n3. Meticulous (adj) - teliti\n4. Ambiguous (adj) - ambigu",
    subjectId: "s6",
    subjectName: "Bahasa Inggris",
    authorId: "st2",
    authorName: "Siti Aminah",
    visibility: "PRIVATE",
    isPinned: false,
    color: "bg-yellow-100",
    tags: ["vocabulary", "english"],
    createdAt: new Date(2025, 0, 3),
    updatedAt: new Date(2025, 0, 3),
  },
  {
    id: "n4",
    title: "Rangkuman Sejarah Kemerdekaan",
    content:
      "## Proklamasi Kemerdekaan\n\nTanggal: 17 Agustus 1945\nTokoh: Soekarno, Hatta\n\n## Peristiwa Penting\n- Rapat PPKI\n- Perumusan teks proklamasi",
    subjectId: "s7",
    subjectName: "Sejarah",
    classId: "1",
    className: "X-A",
    authorId: "t7",
    authorName: "Ibu Maya Putri",
    visibility: "CLASS",
    isPinned: false,
    color: "bg-red-100",
    tags: ["sejarah", "kemerdekaan"],
    createdAt: new Date(2025, 0, 4),
    updatedAt: new Date(2025, 0, 4),
  },
];

// Settings mock data
export interface SchoolProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  principalName: string;
  logo?: string;
}

export interface AcademicYear {
  id: string;
  year: string;
  semester: Semester;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface ClassScheduleTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  isBreak: boolean;
}

export const mockSchoolProfile: SchoolProfile = {
  name: "SMA Negeri 1 Schoolio",
  address: "Jl. Pendidikan No. 123, Jakarta Selatan",
  phone: "(021) 1234567",
  email: "info@sman1schoolio.sch.id",
  website: "www.sman1schoolio.sch.id",
  principalName: "Dr. H. Susanto, M.Pd",
};

export const mockAcademicYears: AcademicYear[] = [
  {
    id: "ay1",
    year: "2024/2025",
    semester: "ODD",
    startDate: new Date(2024, 6, 15),
    endDate: new Date(2024, 11, 20),
    isActive: true,
  },
  {
    id: "ay2",
    year: "2024/2025",
    semester: "EVEN",
    startDate: new Date(2025, 0, 6),
    endDate: new Date(2025, 5, 30),
    isActive: false,
  },
  {
    id: "ay3",
    year: "2023/2024",
    semester: "ODD",
    startDate: new Date(2023, 6, 17),
    endDate: new Date(2023, 11, 22),
    isActive: false,
  },
  {
    id: "ay4",
    year: "2023/2024",
    semester: "EVEN",
    startDate: new Date(2024, 0, 8),
    endDate: new Date(2024, 5, 28),
    isActive: false,
  },
];

export const mockScheduleTemplate: ClassScheduleTemplate[] = [
  {
    id: "cs1",
    name: "Jam 1",
    startTime: "07:00",
    endTime: "07:45",
    duration: 45,
    isBreak: false,
  },
  {
    id: "cs2",
    name: "Jam 2",
    startTime: "07:45",
    endTime: "08:30",
    duration: 45,
    isBreak: false,
  },
  {
    id: "cs3",
    name: "Jam 3",
    startTime: "08:30",
    endTime: "09:15",
    duration: 45,
    isBreak: false,
  },
  {
    id: "cs4",
    name: "Istirahat 1",
    startTime: "09:15",
    endTime: "09:30",
    duration: 15,
    isBreak: true,
  },
  {
    id: "cs5",
    name: "Jam 4",
    startTime: "09:30",
    endTime: "10:15",
    duration: 45,
    isBreak: false,
  },
  {
    id: "cs6",
    name: "Jam 5",
    startTime: "10:15",
    endTime: "11:00",
    duration: 45,
    isBreak: false,
  },
  {
    id: "cs7",
    name: "Jam 6",
    startTime: "11:00",
    endTime: "11:45",
    duration: 45,
    isBreak: false,
  },
  {
    id: "cs8",
    name: "Istirahat 2",
    startTime: "11:45",
    endTime: "12:30",
    duration: 45,
    isBreak: true,
  },
  {
    id: "cs9",
    name: "Jam 7",
    startTime: "12:30",
    endTime: "13:15",
    duration: 45,
    isBreak: false,
  },
  {
    id: "cs10",
    name: "Jam 8",
    startTime: "13:15",
    endTime: "14:00",
    duration: 45,
    isBreak: false,
  },
];

// Mock teachers for selection
export const mockTeachers = [
  { id: "t1", name: "Ibu Sri Wahyuni" },
  { id: "t2", name: "Bapak Ahmad Hidayat" },
  { id: "t3", name: "Ibu Dewi Lestari" },
  { id: "t4", name: "Bapak Budi Santoso" },
  { id: "t5", name: "Ibu Ratna Sari" },
  { id: "t6", name: "Bapak Hendra Wijaya" },
  { id: "t7", name: "Ibu Maya Putri" },
  { id: "t8", name: "Bapak Rudi Hartono" },
  { id: "t9", name: "Ibu Linda Kusuma" },
];

// Mock students for class assignment
export const mockStudents = [
  { id: "st1", name: "Budi Pratama", gender: "L", classId: "1" },
  { id: "st2", name: "Siti Aminah", gender: "P", classId: "1" },
  { id: "st3", name: "Andi Wijaya", gender: "L", classId: "2" },
  { id: "st4", name: "Dewi Safitri", gender: "P", classId: "2" },
  { id: "st5", name: "Rizky Ramadhan", gender: "L", classId: "3" },
  { id: "st6", name: "Putri Handayani", gender: "P", classId: "4" },
  { id: "st7", name: "Fajar Nugroho", gender: "L", classId: "4" },
  { id: "st8", name: "Anisa Rahmawati", gender: "P", classId: "5" },
  { id: "st9", name: "Dimas Prasetyo", gender: "L", classId: "6" },
  { id: "st10", name: "Larasati Putrixxx", gender: "P", classId: "7" },
];

// Assignment types and mock data
export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  classIds: string[];
  dueDate: Date;
  createdAt: Date;
  type: "HOMEWORK" | "PROJECT" | "QUIZ" | "EXAM";
  status: "ACTIVE" | "CLOSED";
}

export const mockAssignments: Assignment[] = [
  {
    id: "a1",
    title: "Latihan Soal Integral Substitusi",
    description: "Kerjakan latihan soal hal 45-47",
    subjectId: "s1",
    subjectName: "Matematika",
    teacherId: "t4",
    teacherName: "Pak Budi Santoso",
    classIds: ["4", "5"],
    dueDate: new Date(2025, 0, 10),
    createdAt: new Date(2025, 0, 3),
    type: "HOMEWORK",
    status: "ACTIVE",
  },
  {
    id: "a2",
    title: "Essay: Hukum Newton dalam Kehidupan",
    description: "Tulis essay minimal 500 kata tentang penerapan hukum Newton",
    subjectId: "s2",
    subjectName: "Fisika",
    teacherId: "t2",
    teacherName: "Pak Ahmad Wijaya",
    classIds: ["4", "5", "6", "7"],
    dueDate: new Date(2025, 0, 12),
    createdAt: new Date(2025, 0, 5),
    type: "PROJECT",
    status: "ACTIVE",
  },
  {
    id: "a3",
    title: "Praktikum Reaksi Kimia",
    description: "Laporan praktikum reaksi asam-basa",
    subjectId: "s3",
    subjectName: "Kimia",
    teacherId: "t3",
    teacherName: "Bu Dewi Lestari",
    classIds: ["4", "5"],
    dueDate: new Date(2025, 0, 8),
    createdAt: new Date(2025, 0, 1),
    type: "PROJECT",
    status: "ACTIVE",
  },
  {
    id: "a4",
    title: "Klasifikasi Makhluk Hidup",
    description: "Buat mind map klasifikasi kingdom",
    subjectId: "s4",
    subjectName: "Biologi",
    teacherId: "t5",
    teacherName: "Bu Ratna",
    classIds: ["4", "5", "6", "7"],
    dueDate: new Date(2025, 0, 15),
    createdAt: new Date(2025, 0, 6),
    type: "HOMEWORK",
    status: "ACTIVE",
  },
  {
    id: "a5",
    title: "Analisis Puisi Chairil Anwar",
    description: "Analisis struktur dan makna puisi 'Aku'",
    subjectId: "s5",
    subjectName: "Bahasa Indonesia",
    teacherId: "t5",
    teacherName: "Bu Sari Dewi",
    classIds: ["1", "2", "3"],
    dueDate: new Date(2025, 0, 9),
    createdAt: new Date(2025, 0, 2),
    type: "HOMEWORK",
    status: "ACTIVE",
  },
  {
    id: "a6",
    title: "Reading Comprehension Exercise",
    description: "Complete reading exercise chapter 3",
    subjectId: "s6",
    subjectName: "Bahasa Inggris",
    teacherId: "t6",
    teacherName: "Bu Dewi Lestari",
    classIds: ["1", "2", "3", "4", "5"],
    dueDate: new Date(2025, 0, 11),
    createdAt: new Date(2025, 0, 4),
    type: "HOMEWORK",
    status: "ACTIVE",
  },
  {
    id: "a7",
    title: "Kronologi Perang Kemerdekaan",
    description: "Buat timeline peristiwa penting",
    subjectId: "s7",
    subjectName: "Sejarah",
    teacherId: "t7",
    teacherName: "Pak Joko",
    classIds: ["1", "2", "3"],
    dueDate: new Date(2025, 0, 14),
    createdAt: new Date(2025, 0, 7),
    type: "PROJECT",
    status: "ACTIVE",
  },
];
