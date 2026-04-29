export const DEMO_CATALOG = {
  password: "DemoSekolah2026!",
  templateSchool: {
    schoolCode: "SCH-ALHIKMAH",
    name: "SMA Al Hikmah Nusantara",
    address: "Jl. KH. Ahmad Dahlan No. 18, Sleman, DI Yogyakarta",
    phone: "(0274) 555120",
    email: "info@alhikmahnusantara.sch.id",
    website: "https://alhikmahnusantara.sch.id",
    principalName: "Dr. Hj. Nur Aisyah Rahma, M.Pd.",
  },
  publicRoles: [
    {
      key: "admin",
      role: "ADMIN",
      label: "Admin",
      title: "Admin Sekolah",
      name: "Nur Aisyah Rahma",
      identifier: "admin.sekolah",
      email: "nur.aisyah@alhikmahnusantara.sch.id",
      seedIdentifier: "admin.sekolah",
      description:
        "Kelola struktur sekolah, data pengguna, kelas, mapel, dan pengaturan operasional.",
    },
    {
      key: "teacher",
      role: "TEACHER",
      label: "Guru",
      title: "Guru Kelas",
      name: "Deni Kurniawan",
      identifier: "guru.deni",
      email: "deni.kurniawan@alhikmahnusantara.sch.id",
      seedIdentifier: "guru.deni",
      description:
        "Buka jadwal, absensi, materi, tugas, forum kelas, dan penilaian harian.",
    },
    {
      key: "student",
      role: "STUDENT",
      label: "Siswa",
      title: "Siswa",
      name: "Alya Safitri",
      identifier: "siswa.xmipa1.01",
      email: "siswa.xmipa1.01@demo.schoolio.id",
      seedIdentifier: "siswa.xmipa1.01",
      description:
        "Lihat jadwal, materi, tugas, nilai, forum, catatan, dan notifikasi kelas.",
    },
    {
      key: "parent",
      role: "PARENT",
      label: "Orang Tua",
      title: "Orang Tua",
      name: "Budi Safitri",
      identifier: "ortu.xmipa1.01",
      email: "ortu.xmipa1.01@demo.schoolio.id",
      seedIdentifier: "ortu.xmipa1.01",
      description:
        "Pantau anak yang terhubung, tugas, absensi, nilai, dan informasi sekolah.",
    },
  ],
} as const;

export type DemoPublicRole = (typeof DEMO_CATALOG.publicRoles)[number];
export type DemoRoleKey = DemoPublicRole["key"];
export type DemoRole = DemoPublicRole["role"];

export const DEMO_PUBLIC_ROLES = DEMO_CATALOG.publicRoles;

export const getDemoPublicRoleByKey = (key: string) =>
  DEMO_PUBLIC_ROLES.find((role) => role.key === key) ?? null;

export const getDemoPublicRoleByRole = (role: string) =>
  DEMO_PUBLIC_ROLES.find((item) => item.role === role) ?? null;

