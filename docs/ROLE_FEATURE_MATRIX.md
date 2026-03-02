**Overview**
Aplikasi menggunakan Next.js App Router + Prisma. Role dan menu utama berasal dari `components/layout/Sidebar.tsx`, endpoint berada di `app/api/*`, handler di `lib/handlers/*`, dan schema tipe data di `lib/schemas.ts`. Mode mock bisa aktif jika `debug_with_mock_data=true` di `.env`.

**Legend**
- [x] Endpoint ada + response sudah diparse schema + tidak ada `any` di flow utama fitur.
- [ ] Belum memenuhi salah satu dari tiga syarat di atas (lihat kolom Notes).

**Admin**
| Implemented | Feature | Endpoints | Type Status | Notes |
| --- | --- | --- | --- | --- |
| [x] | Dashboard | `/api/analytics/overview`, `/api/subjects`, `/api/assignments`, `/api/schedules`, `/api/attendance/records` | Schema OK | Data sudah dari endpoint (belum role-specific). |
| [x] | Analytics | `/api/analytics/*` | Schema OK | Overview, attendance, grades, demographics. |
| [x] | Manajemen Pengguna | `/api/users`, `/api/students`, `/api/teachers`, `/api/parents`, `/api/parent-links`, `/api/users/[id]/profile` | Schema OK | Payload create/update user sudah typed. |
| [x] | Manajemen Kelas | `/api/classes`, `/api/classes/[id]`, `/api/classes/[id]/students`, `/api/classes/[id]/subjects` | Schema OK | Endpoint subjects per class sudah typed schema. |
| [x] | Manajemen Mata Pelajaran | `/api/subjects`, `/api/subjects/[id]`, `/api/subjects/[id]/teachers`, `/api/subjects/[id]/classes` | Schema OK | Set teachers/classes sudah typed payload. |
| [x] | Jadwal (Kalender Jadwal) | `/api/schedules`, `/api/schedules/[id]` | Schema OK | Normalisasi data handler jadwal sudah typed mapper. |
| [x] | Kalender Akademik (Event) | `/api/calendar/events*` | Schema OK | Create/update/delete event tersedia. |
| [x] | Absensi | `/api/attendance/sessions*`, `/api/attendance/records*` | Schema OK | Policy integritas + ownership sudah enforce di server. |
| [x] | Profil Sekolah | `/api/settings/school-profile` | Schema OK | CRUD profil sekolah. |
| [x] | Tahun Ajaran | `/api/academic-years*` | Schema OK | Aktivasi tahun ajaran tersedia. |
| [x] | Template Jam Pelajaran | `/api/schedule-templates` | Schema OK | UI edit + simpan backend tersedia di Settings. |
| [x] | Notifikasi Sistem | `/api/settings/notifications`, `/api/notifications*` | Schema OK | Preferensi + inbox notifikasi sudah persist backend. |
| [x] | Profil Saya | `/api/users/[id]/profile` | Schema OK | Profil terhubung ke backend. |

**Teacher**
| Implemented | Feature | Endpoints | Type Status | Notes |
| --- | --- | --- | --- | --- |
| [x] | Dashboard | `/api/analytics/overview`, `/api/subjects`, `/api/assignments`, `/api/schedules`, `/api/attendance/records` | Schema OK | Data sudah dari endpoint (belum role-specific). |
| [x] | Jadwal Saya | `/api/schedules*` | Schema OK | Normalisasi data handler jadwal sudah typed mapper. |
| [x] | Absensi Kelas | `/api/attendance/sessions*`, `/api/attendance/records*` | Schema OK | Payload masih generic. |
| [x] | Materi (CRUD + Lampiran) | `/api/materials*`, `/api/materials/[id]/attachments*` | Schema OK | Normalisasi data material sudah typed mapper. |
| [x] | Tugas (CRUD + Submission) | `/api/assignments*`, `/api/submissions/[id]` | Schema OK | Payload masih generic. |
| [x] | Bank Soal (Soal + Paket) | `/api/questions*`, `/api/question-packages*` | Schema OK | Termasuk set paket/soal. |
| [x] | Penilaian | `/api/grades`, `/api/grades/summary` | Schema OK | Ringkasan dan detail nilai. |
| [x] | Kalender (Event) | `/api/calendar/events*` | Schema OK | Teacher dapat create/update event. |
| [x] | Forum (Diskusi + Moderasi) | `/api/forum/threads*`, `/api/forum/replies*` | Schema OK | Pin/lock/upvote tersedia. |
| [x] | Catatan | `/api/notes*` | Schema OK | Catatan pribadi/kelas. |
| [x] | Profil Saya | `/api/users/[id]/profile` | Schema OK | Profil terhubung ke backend. |

**Student**
| Implemented | Feature | Endpoints | Type Status | Notes |
| --- | --- | --- | --- | --- |
| [x] | Dashboard | `/api/analytics/overview`, `/api/subjects`, `/api/assignments`, `/api/schedules`, `/api/attendance/records` | Schema OK | Data sudah dari endpoint (belum role-specific). |
| [x] | Jadwal | `/api/schedules*` | Schema OK | Normalisasi data handler jadwal sudah typed mapper. |
| [x] | Kehadiran | `/api/attendance/records*` | Schema OK | Read-only untuk siswa. |
| [x] | Materi | `/api/materials*` | Schema OK | Normalisasi data material sudah typed mapper. |
| [x] | Tugas (Lihat + Submit) | `/api/assignments*`, `/api/assignments/[id]/submissions` | Schema OK | Submit via endpoint tersedia. |
| [x] | Nilai | `/api/grades` | Schema OK | Ringkasan nilai per mapel. |
| [x] | Kalender | `/api/calendar/events*` | Schema OK | View-only. |
| [x] | Forum | `/api/forum/threads*`, `/api/forum/replies*` | Schema OK | Create thread/reply tersedia. |
| [x] | Catatan | `/api/notes*` | Schema OK | Catatan pribadi/kelas. |
| [x] | Profil Saya | `/api/users/[id]/profile` | Schema OK | Profil terhubung ke backend. |

**Parent**
| Implemented | Feature | Endpoints | Type Status | Notes |
| --- | --- | --- | --- | --- |
| [x] | Dashboard | `/api/analytics/overview`, `/api/subjects`, `/api/assignments`, `/api/schedules`, `/api/attendance/records` | Schema OK | Data sudah dari endpoint (belum role-specific). |
| [x] | Kehadiran Anak | `/api/attendance/records*` | Schema OK | Read-only berdasarkan anak terpilih. |
| [x] | Tugas Anak | `/api/assignments*`, `/api/grades` | Schema OK | Status tugas anak via grades/submission. |
| [x] | Nilai Anak | `/api/grades` | Schema OK | Read-only. |
| [x] | Kalender | `/api/calendar/events*` | Schema OK | View-only. |
| [x] | Profil Saya | `/api/users/[id]/profile` | Schema OK | Profil terhubung ke backend. |
