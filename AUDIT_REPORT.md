# Audit Report — Core School Ops

Date: 2026-02-09

## Ringkasan Eksekutif
Audit ini fokus ke fitur inti (Users, Classes, Subjects, Schedules, Attendance, Assignments, Grades, Materials, Calendar) dengan kedalaman analisis alur, ketepatan implementasi, dan kontrol akses. Secara struktural UI dan handler sudah rapi dan sebagian besar fitur ada, namun kontrol akses server‑side belum ada sehingga risiko kebocoran data sangat tinggi.

## Temuan Utama
1. P0: Hampir semua endpoint API tidak melakukan role enforcement. Client-side filtering dapat di-bypass.
2. P1: Validasi bisnis banyak terjadi di client, bukan di server (jadwal bentrok, ownership absensi, assignment submit).
3. P2: Payload handler banyak yang masih `Record<string, unknown>` dan ada `any` di normalisasi.

## Per Fitur

### Users
Flow existing:
1. UI Admin memanggil `lib/handlers/users.ts` ke `/api/users`.
2. `POST /api/users` membuat user dan otomatis membuat profile sesuai role.

Yang sudah tepat:
1. Struktur role dan profil terpisah sudah jelas.
2. CRUD dasar tersedia.

Yang belum tepat:
1. Tidak ada auth/role guard di `/api/users`.
2. Parent/Student bisa akses data semua user jika memanggil API langsung.

Rekomendasi:
1. P0: Server-side auth + role enforcement.
2. P1: Validasi role dan ownership.
3. P2: Audit log perubahan user.

### Classes
Flow existing:
1. UI Admin memanggil `/api/classes`.
2. Detail siswa kelas: `/api/classes/[id]/students`.

Yang sudah tepat:
1. Pengambilan siswa per class sudah benar lewat `studentProfile.classId`.
2. Data kelas sudah lengkap (grade, section, homeroom).

Yang belum tepat:
1. Tidak ada batasan akses (student/parent bisa lihat semua kelas).
2. `studentCount` disimpan terpisah dan rawan mismatch.
3. Relasi class-subject masih partial.

Rekomendasi:
1. P0: Restrict akses kelas per role.
2. P1: Hitung studentCount otomatis atau via trigger.
3. P1: Lengkapi schema class-subject/class-teacher.

### Subjects
Flow existing:
1. UI Admin memakai `/api/subjects`.
2. Relasi teachers/classes diset di POST.

Yang sudah tepat:
1. Data subject lengkap dan relasi tersedia.

Yang belum tepat:
1. Tidak ada auth/role guard.
2. Payload relasi masih loose.

Rekomendasi:
1. P0: Admin-only mutasi subject.
2. P1: Schema input ketat untuk teacherIds/classIds.
3. P2: Validasi load guru untuk jam pelajaran.

### Schedules
Flow existing:
1. Admin buat jadwal via `/api/schedules`.
2. Teacher/Student/Parent lihat jadwal via filter client.

Yang sudah tepat:
1. Filter classId/teacherId/dayOfWeek tersedia di API.

Yang belum tepat:
1. Tidak ada validasi bentrok jadwal di server.
2. Siapa pun bisa create/update jadwal via API.

Rekomendasi:
1. P0: Role guard admin-only untuk mutasi.
2. P1: Server-side overlap validation.
3. P1: Restrict read per class/teacher.

### Attendance
Flow existing:
1. Teacher membuat attendance session dari schedule.
2. Teacher mengisi attendance records.
3. Student/Parent melihat records.

Yang sudah tepat:
1. Flow absensi guru dan siswa sudah tersedia.
2. Substitusi guru sudah ada (`takenByTeacherId`).

Yang belum tepat:
1. Tidak ada validasi bahwa teacher berhak mengisi session.
2. Session creation bisa duplikat.
3. `TeacherAttendance` tidak enforce ownership.

Rekomendasi:
1. P0: Guard akses teacher pada session/record.
2. P1: Unique constraint per class/subject/date/session.
3. P1: Admin override dengan audit log.

### Assignments
Flow existing:
1. Teacher/Admin membuat assignment.
2. Student submit assignment.
3. Parent view status.

Yang sudah tepat:
1. UI sudah role-based dengan jelas.
2. Status submission dan grading berjalan.

Yang belum tepat:
1. StudentId di payload submission bisa dipalsukan.
2. Teacher dapat membuat assignment untuk kelas apa pun via API.

Rekomendasi:
1. P0: Derive studentId dari session, bukan payload.
2. P1: Enforce teacher hanya untuk kelas yang dia ajar.
3. P2: Audit log submission & grading.

### Grades
Flow existing:
1. `/api/grades` mengembalikan submission+grade.

Yang sudah tepat:
1. Data grade berasal dari submission.

Yang belum tepat:
1. Tidak ada role guard.
2. Student/Parent bisa akses grade lain via query.

Rekomendasi:
1. P0: Restrict grade access per role.
2. P1: Hide student identity for unauthorized roles.

### Materials
Flow existing:
1. Teacher create material dan attachments.
2. Student view materials.

Yang sudah tepat:
1. Struktur attachment sudah ada.

Yang belum tepat:
1. Tidak ada role guard.
2. Tidak ada enforce class/subject membership.

Rekomendasi:
1. P0: Role guard untuk CRUD materials.
2. P1: Enforce access berdasarkan class/subject.
3. P2: Signed URL untuk attachment.

### Calendar (Events)
Flow existing:
1. `/api/calendar/events` untuk list & create.
2. UI filter type dan class.

Yang sudah tepat:
1. Filter by type dan class ada.

Yang belum tepat:
1. Tidak ada role guard untuk create.
2. Filter class hanya client-side.

Rekomendasi:
1. P0: Admin/Teacher only create event.
2. P1: Enforce class visibility di server.

## Rekomendasi Prioritas

### P0 — Security & Access Control
1. Implement auth (JWT/NextAuth) + middleware.
2. Enforce role & ownership di semua API.
3. Derive `userId` dari session, bukan payload.

### P1 — Data Integrity & Flow Correctness
1. Server-side validation jadwal bentrok.
2. Unique constraint untuk attendance session.
3. Strict input schema untuk payload create/update.

### P2 — UX & Operational
1. Notifikasi sistem (email/push/WA).
2. Audit logs untuk perubahan penting.
3. Pagination + caching untuk data besar.

## Usulan Penambahan Fitur
1. Audit log perubahan (user, grade, attendance).
2. Notification engine untuk tugas, nilai, absensi.
3. Approval workflow untuk izin/penilaian.
4. Report card otomatis per semester.
5. Permission matrix granular (bukan hanya 4 role).

## Asumsi
1. Role management saat ini masih mock via `useRoleContext`.
2. Tidak ada auth server-side di App Router.
