export const APP_NAME = "Schoolio";
export const APP_DESCRIPTION = "Sistem Manajemen Pembelajaran Sekolah";
export const ICON = "😹";

export const ROLES = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  TEACHER: "Guru",
  STUDENT: "Siswa",
  PARENT: "Orang Tua",
};

export const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "bg-role-admin text-white",
  TEACHER: "bg-role-teacher text-white",
  STUDENT: "bg-success text-success-foreground",
  PARENT: "bg-role-parent text-warning-foreground",
};

export const DAYS_OF_WEEK = {
  MON: "Senin",
  TUE: "Selasa",
  WED: "Rabu",
  THU: "Kamis",
  FRI: "Jumat",
  SAT: "Sabtu",
} as const;

export type DayOfWeek = keyof typeof DAYS_OF_WEEK;

export const ATTENDANCE_STATUS = {
  PRESENT: "Hadir",
  ABSENT: "Tidak Hadir",
  SICK: "Sakit",
  PERMIT: "Izin",
} as const;

export type AttendanceStatus = keyof typeof ATTENDANCE_STATUS;

export const ASSIGNMENT_TYPES = {
  MCQ: "Pilihan Ganda",
  FILE: "Upload File",
  ESSAY: "Esai",
} as const;

export type AssignmentType = keyof typeof ASSIGNMENT_TYPES;

export const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type Grade = (typeof GRADES)[number];

export const DIFFICULTY_LEVELS = {
  EASY: "Mudah",
  MEDIUM: "Sedang",
  HARD: "Sulit",
} as const;

export type DifficultyLevel = keyof typeof DIFFICULTY_LEVELS;

export const SUBJECTS = [
  "Matematika",
  "Fisika",
  "Kimia",
  "Biologi",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Sejarah",
  "Geografi",
  "Ekonomi",
  "Sosiologi",
  "PKN",
  "Seni Budaya",
  "PJOK",
  "TIK",
] as const;

export type Subject = (typeof SUBJECTS)[number];

// Event types for calendar
export const EVENT_TYPES = {
  ACADEMIC: "Akademik",
  HOLIDAY: "Libur",
  ACTIVITY: "Kegiatan",
  DEADLINE: "Deadline",
} as const;

export type EventType = keyof typeof EVENT_TYPES;

export const EVENT_COLORS: Record<EventType, string> = {
  ACADEMIC: "bg-primary text-primary-foreground",
  HOLIDAY: "bg-destructive text-destructive-foreground",
  ACTIVITY: "bg-secondary text-secondary-foreground",
  DEADLINE: "bg-warning text-warning-foreground",
};

// Subject categories
export const SUBJECT_CATEGORIES = {
  SCIENCE: "Sains",
  SOCIAL: "Sosial",
  LANGUAGE: "Bahasa",
  ART: "Seni",
  SPORTS: "Olahraga",
  OTHER: "Lainnya",
} as const;

export type SubjectCategory = keyof typeof SUBJECT_CATEGORIES;

export const SUBJECT_CATEGORY_COLORS: Record<SubjectCategory, string> = {
  SCIENCE: "bg-info text-info-foreground",
  SOCIAL: "bg-warning text-warning-foreground",
  LANGUAGE: "bg-primary text-primary-foreground",
  ART: "bg-role-admin text-white",
  SPORTS: "bg-success text-success-foreground",
  OTHER: "bg-muted text-muted-foreground",
};

// Thread status for forum
export const THREAD_STATUS = {
  OPEN: "Terbuka",
  RESOLVED: "Terjawab",
  LOCKED: "Dikunci",
} as const;

export type ThreadStatus = keyof typeof THREAD_STATUS;

export const THREAD_STATUS_COLORS: Record<ThreadStatus, string> = {
  OPEN: "bg-info text-info-foreground",
  RESOLVED: "bg-success text-success-foreground",
  LOCKED: "bg-muted text-muted-foreground",
};

// Note visibility
export const NOTE_VISIBILITY = {
  PRIVATE: "Pribadi",
  CLASS: "Kelas",
} as const;

export type NoteVisibility = keyof typeof NOTE_VISIBILITY;

// Academic years
export const SEMESTERS = {
  ODD: "Ganjil",
  EVEN: "Genap",
} as const;

export type Semester = keyof typeof SEMESTERS;
