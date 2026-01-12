import { AssignmentType, DifficultyLevel, Subject } from "./constants";

export interface Question {
  id: string;
  type: AssignmentType;
  subject: Subject | string;
  topic: string;
  difficulty: DifficultyLevel;
  text: string;
  options?: string[];
  correctAnswers?: number[];
  rubric?: string;
  allowedFormats?: string[];
  points: number;
  createdAt: Date;
  usageCount: number;
}

export interface QuestionPackage {
  id: string;
  name: string;
  description: string;
  subject: Subject | string;
  questionIds: string[];
  questions?: Question[];
  createdAt: Date;
  lastUsedAt?: Date;
  usageCount: number;
}

// Mock data for questions
export const mockQuestions: Question[] = [
  {
    id: "q1",
    type: "MCQ",
    subject: "Matematika",
    topic: "Aljabar",
    difficulty: "EASY",
    text: "Jika x + 5 = 12, maka nilai x adalah...",
    options: ["5", "6", "7", "8"],
    correctAnswers: [2],
    points: 10,
    createdAt: new Date("2025-01-01"),
    usageCount: 15,
  },
  {
    id: "q2",
    type: "MCQ",
    subject: "Matematika",
    topic: "Aljabar",
    difficulty: "MEDIUM",
    text: "Persamaan kuadrat x² - 5x + 6 = 0 memiliki akar-akar...",
    options: ["x = 1 dan x = 6", "x = 2 dan x = 3", "x = -2 dan x = -3", "x = 1 dan x = 5"],
    correctAnswers: [1],
    points: 15,
    createdAt: new Date("2025-01-02"),
    usageCount: 8,
  },
  {
    id: "q3",
    type: "ESSAY",
    subject: "Fisika",
    topic: "Mekanika",
    difficulty: "HARD",
    text: "Jelaskan Hukum Newton I, II, dan III beserta contoh penerapannya dalam kehidupan sehari-hari!",
    rubric: "Skor 30: Menjelaskan ketiga hukum dengan benar dan contoh relevan\nSkor 20: Menjelaskan 2 hukum dengan benar\nSkor 10: Menjelaskan 1 hukum dengan benar\nSkor 0: Jawaban tidak relevan",
    points: 30,
    createdAt: new Date("2025-01-03"),
    usageCount: 5,
  },
  {
    id: "q4",
    type: "FILE",
    subject: "Bahasa Indonesia",
    topic: "Karya Tulis",
    difficulty: "MEDIUM",
    text: "Buatlah esai argumentatif tentang pentingnya menjaga lingkungan hidup (minimal 500 kata)",
    allowedFormats: ["pdf", "docx", "doc"],
    points: 25,
    createdAt: new Date("2025-01-04"),
    usageCount: 12,
  },
  {
    id: "q5",
    type: "MCQ",
    subject: "Biologi",
    topic: "Sel",
    difficulty: "EASY",
    text: "Organel sel yang berfungsi sebagai pusat pengendali aktivitas sel adalah...",
    options: ["Mitokondria", "Ribosom", "Nukleus", "Lisosom"],
    correctAnswers: [2],
    points: 10,
    createdAt: new Date("2025-01-05"),
    usageCount: 20,
  },
  {
    id: "q6",
    type: "MCQ",
    subject: "Kimia",
    topic: "Ikatan Kimia",
    difficulty: "MEDIUM",
    text: "Senyawa NaCl terbentuk melalui ikatan...",
    options: ["Kovalen polar", "Kovalen non-polar", "Ion", "Logam"],
    correctAnswers: [2],
    points: 10,
    createdAt: new Date("2025-01-06"),
    usageCount: 18,
  },
  {
    id: "q7",
    type: "ESSAY",
    subject: "Sejarah",
    topic: "Kemerdekaan Indonesia",
    difficulty: "MEDIUM",
    text: "Jelaskan peristiwa-peristiwa penting yang terjadi menjelang proklamasi kemerdekaan Indonesia!",
    rubric: "Skor 25: Menyebutkan minimal 5 peristiwa dengan kronologi yang benar\nSkor 15: Menyebutkan 3-4 peristiwa\nSkor 5: Menyebutkan 1-2 peristiwa",
    points: 25,
    createdAt: new Date("2025-01-07"),
    usageCount: 7,
  },
  {
    id: "q8",
    type: "FILE",
    subject: "Seni Budaya",
    topic: "Seni Rupa",
    difficulty: "EASY",
    text: "Buatlah sketsa pemandangan alam menggunakan teknik arsir dan upload hasil karyamu!",
    allowedFormats: ["jpg", "jpeg", "png", "pdf"],
    points: 20,
    createdAt: new Date("2025-01-08"),
    usageCount: 10,
  },
];

// Mock data for packages
export const mockPackages: QuestionPackage[] = [
  {
    id: "pkg1",
    name: "UTS Matematika Kelas 10",
    description: "Paket soal untuk Ujian Tengah Semester Matematika kelas 10 mencakup materi aljabar dan geometri",
    subject: "Matematika",
    questionIds: ["q1", "q2"],
    createdAt: new Date("2025-01-10"),
    lastUsedAt: new Date("2025-01-15"),
    usageCount: 3,
  },
  {
    id: "pkg2",
    name: "Quiz Fisika Bab Mekanika",
    description: "Kumpulan soal untuk quiz harian materi mekanika Newton",
    subject: "Fisika",
    questionIds: ["q3"],
    createdAt: new Date("2025-01-11"),
    lastUsedAt: new Date("2025-01-14"),
    usageCount: 2,
  },
  {
    id: "pkg3",
    name: "Tugas Biologi - Sel",
    description: "Soal-soal tentang struktur dan fungsi sel untuk tugas mandiri",
    subject: "Biologi",
    questionIds: ["q5"],
    createdAt: new Date("2025-01-12"),
    usageCount: 0,
  },
  {
    id: "pkg4",
    name: "UAS Bahasa Indonesia",
    description: "Paket soal Ujian Akhir Semester Bahasa Indonesia",
    subject: "Bahasa Indonesia",
    questionIds: ["q4"],
    createdAt: new Date("2025-01-13"),
    lastUsedAt: new Date("2025-01-16"),
    usageCount: 1,
  },
];

// Helper to get questions for a package
export const getPackageQuestions = (pkg: QuestionPackage): Question[] => {
  return pkg.questionIds
    .map((id) => mockQuestions.find((q) => q.id === id))
    .filter((q): q is Question => q !== undefined);
};
