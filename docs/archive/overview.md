# Sekolah Pintar Overview
Dokumen gabungan BRD + PRD + TRD  
Versi: 1.0 (As-Is Audit)  
Tanggal audit: 21 Februari 2026  
Basis audit: seluruh source code di repository `sekolah-pintar` (frontend, API routes, handlers, schema Prisma, seed data, dan dokumen internal).

---

## 1. Ringkasan Eksekutif
`Sekolah Pintar` adalah aplikasi manajemen operasional sekolah berbasis web yang mencakup alur inti:
- Manajemen pengguna dan relasi orang tua-anak.
- Struktur akademik (jurusan, kelas, mapel, jadwal).
- Operasional pembelajaran (absensi, materi, tugas, bank soal, nilai).
- Komunikasi akademik (forum, catatan, kalender event).
- Monitoring ringkas (dashboard, analytics).

Secara fungsional, fondasi fitur sudah luas dan dapat dipresentasikan sebagai produk edutech end-to-end untuk SMA.  
Namun secara readiness enterprise, ada gap kritikal pada keamanan dan governance:
- Belum ada autentikasi server-side dan otorisasi role/ownership di API.
- Banyak endpoint menerima `authorId`, `studentId`, `teacherId` dari payload client.
- Beberapa validasi bisnis penting masih dilakukan di UI (bukan di server).

Implikasinya: secara demo produk ini kuat, tetapi untuk produksi diperlukan hardening arsitektur, permission model, dan kontrol integritas data.

---

## 2. Tujuan Dokumen
Dokumen ini disusun agar stakeholder dapat langsung memahami:
- Aplikasi ini menyelesaikan masalah apa.
- Fitur apa saja yang tersedia per modul dan per role.
- Flow proses bisnis dan flow teknis data.
- Bentuk data dan kontrak API saat ini.
- Perubahan apa yang perlu dilakukan (ubah/tambah/revisi) dengan prioritas jelas.

---

## 3. Konteks Bisnis (BRD)

## 3.1 Problem Statement
Sekolah membutuhkan platform terintegrasi untuk:
- Menyatukan data pengguna akademik (admin, guru, siswa, orang tua).
- Menjalankan proses belajar mengajar harian (jadwal, absensi, materi, tugas, nilai).
- Menyediakan transparansi progres siswa untuk wali murid.
- Menurunkan beban administrasi manual dan fragmentasi data lintas tools.

## 3.2 Tujuan Bisnis
- Meningkatkan efisiensi operasional akademik harian.
- Mempercepat siklus assignment-to-grading.
- Menyediakan visibilitas kehadiran dan performa siswa.
- Menjadi single source of truth untuk data pembelajaran.

## 3.3 KPI yang Relevan
- Ketepatan pengisian absensi per sesi.
- SLA penilaian tugas setelah deadline.
- Persentase tugas terkumpul per kelas/mapel.
- Tingkat keterlibatan forum/catatan kelas.
- Rasio kehadiran mingguan/bulanan.

## 3.4 In Scope (As-Is)
- Dashboard, analytics, users, majors, classes, subjects, schedules, attendance, materials, assignments, question bank, grades, calendar, forum, notes, profile, settings.
- API CRUD untuk seluruh domain utama.
- Database relational model lengkap via Prisma + PostgreSQL.

## 3.5 Out of Scope (Saat Ini)
- Auth production (JWT/session backend), SSO, MFA.
- Audit log terstruktur.
- Notification engine real (email/WA/push).
- Workflow approval formal.
- File storage pipeline sungguhan (signed URL/upload service).

---

## 4. Ruang Lingkup Produk (PRD)

## 4.1 Peran Pengguna
- `ADMIN`: konfigurasi akademik, tata kelola data master, monitoring sistem.
- `TEACHER`: eksekusi pembelajaran, absensi kelas, materi, tugas, penilaian, forum.
- `STUDENT`: konsumsi materi, pengumpulan tugas, melihat nilai dan jadwal.
- `PARENT`: monitoring kehadiran, tugas, nilai anak.

## 4.2 Navigasi per Role (Sidebar)
- `ADMIN`: Dashboard, Pengguna, Kelas, Jurusan, Mata Pelajaran, Jadwal, Kalender Akademik, Absensi, Pengaturan.
- `TEACHER`: Dashboard, Jadwal Saya, Absensi, Materi, Tugas, Bank Soal, Penilaian, Kalender, Forum, Catatan.
- `STUDENT`: Dashboard, Jadwal, Kehadiran, Materi, Tugas, Nilai, Kalender, Forum, Catatan.
- `PARENT`: Dashboard, Kehadiran Anak, Tugas Anak, Nilai Anak, Kalender.

## 4.3 Catatan Produk Penting (As-Is)
- Role aktif ditentukan client-side via `RoleProvider` di `DashboardLayout`.
- Login `admin/admin` mengaktifkan debug mode (sessionStorage) dan memunculkan panel impersonasi role/user.
- Tanpa debug mode, aplikasi berjalan seperti demo student default.

---

## 5. Arsitektur Teknis (TRD)

## 5.1 Stack
- Framework: Next.js App Router (`app/`), React 19, TypeScript strict.
- UI: Tailwind + Radix/shadcn components.
- Data access: Prisma (`@prisma/client`) ke PostgreSQL.
- Validation parsing: Zod (`lib/schemas.ts`).
- Visualization: Recharts.
- State infra: React state hooks; React Query provider tersedia tetapi belum dipakai intensif dalam halaman.

## 5.2 Layering
- `app/dashboard/*`: route pages.
- `components/pages/*`: logic UI per modul.
- `lib/handlers/*`: client-side API adapter (`apiGet/apiPost/...`) + schema parsing.
- `app/api/*`: backend route handlers (Next Route Handlers).
- `prisma/schema.prisma`: domain model dan relasi data.

## 5.3 Pola API
- Success: `{ "data": ... }`.
- Error: `{ "error": { "code": "...", "message": "..." } }`.
- Client wrapper: `lib/api-client.ts` otomatis parse `data`/`error`.

## 5.4 Deployment & Runtime
- Dev DB via `docker-compose.yml` (`postgres:16-alpine`).
- Script: `dev`, `build`, `start`, `prisma:migrate`, `prisma:studio`, `prisma:generate`.
- Konfigurasi mock parsial via env `debug_with_mock_data=true` pada sejumlah endpoint.

## 5.5 Security Posture Saat Ini
- Tidak ada middleware auth server (`middleware.ts` tidak ada).
- Tidak ada session/token validation di `app/api/*`.
- Tidak ada role/ownership enforcement backend.
- Kontrol akses dominan di UI, sehingga bisa di-bypass dengan direct API call.

---

## 6. Domain Data & Bentuk Data

## 6.1 Entitas Inti (Prisma)
- Identity:
`User`, `StudentProfile`, `TeacherProfile`, `ParentProfile`, `ParentStudent`.
- Akademik:
`AcademicYear`, `Major`, `MajorTeacher`, `Class`, `Subject`, `SubjectTeacher`, `SubjectClass`, `ClassSchedule`, `ScheduleTemplate`, `SchoolProfile`.
- Operasional belajar:
`AttendanceSession`, `AttendanceRecord`, `TeacherAttendance`, `Assignment`, `AssignmentClass`, `AssignmentQuestion`, `AssignmentSubmission`, `Material`, `MaterialAttachment`, `Question`, `QuestionPackage`, `QuestionPackageItem`.
- Komunikasi:
`ForumThread`, `ForumReply`, `Note`, `CalendarEvent`, `CalendarEventClass`.

## 6.2 Relasi Kunci
- `User` 1-1 profile role (`StudentProfile/TeacherProfile/ParentProfile`).
- `ParentStudent` many-to-many parent dan student (composite key).
- `Class` terhubung ke `Subject` melalui `SubjectClass`.
- `Subject` terhubung ke `Teacher` melalui `SubjectTeacher`.
- `Assignment` many-to-many ke `Class` melalui `AssignmentClass`.
- `AssignmentSubmission` unik per `(assignmentId, studentId)`.
- `AttendanceRecord` unik per `(sessionId, studentId)`.

## 6.3 Shape Data Ringkas (Zod Summary)

### `UserSummary`
```json
{
  "id": "usr_xxx",
  "name": "Nama",
  "email": "user@school.local",
  "role": "STUDENT",
  "phone": "0812...",
  "studentProfile": { "classId": "cls_xxx" },
  "parentLinks": [{ "parentId": "usr_parent", "studentId": "usr_student" }]
}
```

### `ScheduleSummary`
```json
{
  "id": "sch_xxx",
  "classId": "cls_xxx",
  "className": "XI MIPA 1",
  "subjectId": "sub_xxx",
  "subjectName": "Matematika",
  "teacherId": "usr_teacher",
  "teacherName": "Pak Andi",
  "dayOfWeek": "MON",
  "startTime": "07:00",
  "endTime": "08:00",
  "room": "R-1",
  "color": "bg-primary"
}
```

### `AttendanceSessionSummary`
```json
{
  "id": "ats_xxx",
  "classId": "cls_xxx",
  "subjectId": "sub_xxx",
  "teacherId": "usr_teacher",
  "takenByTeacherId": "usr_substitute",
  "date": "2026-02-21T00:00:00.000Z",
  "startTime": "07:00",
  "endTime": "08:00"
}
```

### `AssignmentSummary` + `AssignmentSubmissionSummary`
```json
{
  "assignment": {
    "id": "asg_xxx",
    "title": "Tugas Trigonometri",
    "subjectId": "sub_math",
    "teacherId": "usr_teacher",
    "classIds": ["cls_xi_mipa1"],
    "dueDate": "2026-03-01T00:00:00.000Z",
    "deliveryType": "ESSAY",
    "kind": "HOMEWORK",
    "status": "ACTIVE"
  },
  "submission": {
    "id": "subm_xxx",
    "assignmentId": "asg_xxx",
    "studentId": "usr_student",
    "status": "SUBMITTED",
    "submittedAt": "2026-02-21T08:00:00.000Z",
    "grade": null,
    "response": { "text": "Jawaban..." }
  }
}
```

### `MaterialSummary`
```json
{
  "id": "mat_xxx",
  "title": "Materi Turunan",
  "subjectId": "sub_math",
  "classId": "cls_xi_mipa1",
  "teacherId": "usr_teacher",
  "attachments": [
    {
      "id": "att_xxx",
      "name": "materi.pdf",
      "type": "application/pdf",
      "url": "https://..."
    }
  ]
}
```

---

## 7. Modul, Fitur, Flow, dan API

## 7.1 Auth & Access
Tujuan:
- Entry point login/registrasi.

As-Is:
- Login simulasi di `Auth.tsx`.
- Kredensial `admin/admin` mengaktifkan `sessionStorage` key `schoolio:debug-access`.
- Debug panel memungkinkan impersonasi role dan user.

Flow:
1. User submit form auth.
2. Jika `admin/admin`, sistem set debug access.
3. Redirect ke `/dashboard`.
4. Dashboard layout set role admin jika debug aktif.

API:
- Belum ada endpoint auth dedicated.

Catatan:
- Ini mode demo, bukan alur autentikasi production.

## 7.2 Dashboard & Analytics
Tujuan:
- Menampilkan ringkasan performa harian dan agregasi sekolah.

As-Is:
- Non-admin: `Dashboard` (stat total siswa/mapel/attendance/tugas, jadwal hari ini, tugas terbaru).
- Admin: route `/dashboard` langsung ke `Analytics`.
- Analytics tab: attendance, grades, demographics (chart-based).

Flow utama:
1. `Dashboard` memanggil `analytics/overview`, `subjects`, `assignments`, `schedules`, `attendance/records`.
2. Analytics memanggil `analytics/overview|attendance|grades|demographics`.

API:
- `GET /api/analytics/overview`
- `GET /api/analytics/attendance?from&to`
- `GET /api/analytics/grades?from&to`
- `GET /api/analytics/demographics`

## 7.3 Manajemen Pengguna
Tujuan:
- Mengelola siswa, guru, orang tua, dan relasi parent-student.

As-Is:
- CRUD user.
- Update profile per user.
- Link/unlink parent-student.
- Filter/search per tab.

Flow utama:
1. Load students, teachers, parents, classes.
2. Create/update user.
3. Jika role student: update `studentProfile.classId`.
4. Jika role parent: sinkronisasi relasi anak.

API:
- `GET/POST /api/users`
- `GET/PATCH/DELETE /api/users/:id`
- `GET/PATCH /api/users/:id/profile`
- `GET /api/students`, `GET /api/teachers`, `GET /api/parents`
- `POST/DELETE /api/parent-links`

## 7.4 Jurusan (Majors)
Tujuan:
- Mengelola master jurusan dan assignment guru jurusan.

As-Is:
- Admin only page.
- CRUD major.
- Assign teacher ke major (`MajorTeacher`).
- Menampilkan kelas/siswa/guru berdasarkan major.

API:
- `GET/POST /api/majors`
- `GET/PATCH/DELETE /api/majors/:id`
- `GET/PUT /api/majors/:id/teachers`

## 7.5 Kelas
Tujuan:
- Mengelola kelas, wali kelas, dan statistik murid.

As-Is:
- CRUD class.
- Detail siswa per kelas.
- Filter grade dan search.

API:
- `GET/POST /api/classes`
- `GET/PATCH/DELETE /api/classes/:id`
- `GET /api/classes/:id/students`
- `GET/PUT /api/classes/:id/subjects`

## 7.6 Mata Pelajaran
Tujuan:
- Mengelola mapel dan relasi mapel-guru-mapel-kelas.

As-Is:
- CRUD subject.
- Assign guru ke subject.
- Assign class ke subject via endpoint (dipakai modul lain).

API:
- `GET/POST /api/subjects`
- `GET/PATCH/DELETE /api/subjects/:id`
- `PUT /api/subjects/:id/teachers`
- `PUT /api/subjects/:id/classes`

## 7.7 Jadwal
Tujuan:
- Menyediakan kalender jadwal pelajaran dan setup jadwal kelas.

As-Is:
- Admin: filter kelas, tambah jadwal.
- Teacher: lihat jadwal mengajar.
- Student: lihat jadwal kelas sendiri.
- Parent: lihat jadwal berdasarkan kelas anak.
- Validasi bentrok jadwal ada di client (form create).
- Fitur admin assign guru pengganti berdasarkan data ketidakhadiran guru hari ini.

Flow penting:
1. Load schedules by role/filter.
2. Admin create schedule (dengan validasi jam dan bentrok di UI).
3. Admin monitor sesi yang butuh substitusi.
4. Assign substitute update `AttendanceSession.takenByTeacherId` dan create `TeacherAttendance`.

API:
- `GET/POST /api/schedules`
- `GET/PATCH/DELETE /api/schedules/:id`
- `GET/PATCH /api/schedule-templates`

## 7.8 Absensi
Tujuan:
- Mencatat kehadiran siswa per sesi dan kehadiran guru.

As-Is:
- Teacher view:
  - Pilih tanggal/sesi.
  - Auto-seeding `AttendanceSession` dari jadwal jika sesi belum ada.
  - Mulai sesi, tandai tidak hadir (sakit/izin, opsional all-day), isi status siswa, bulk status, simpan via upsert.
- Student/Parent view:
  - Kalender bulanan status kehadiran.
- Admin view:
  - Mode siswa/guru, pilih individu, lihat rekap kalender.

API:
- `GET/POST /api/attendance/sessions`
- `GET/PATCH/DELETE /api/attendance/sessions/:id`
- `POST /api/attendance/sessions/:id/records`
- `GET /api/attendance/records`
- `PATCH /api/attendance/records/:id`
- `GET/POST /api/teacher-attendance`

## 7.9 Materi
Tujuan:
- Distribusi materi pembelajaran per mapel/kelas.

As-Is:
- Teacher/Admin:
  - CRUD materi.
  - Filter per jadwal/mapel/keyword.
  - Detail materi + daftar lampiran.
- Student/Parent:
  - View-only list materi.
  - Parent memilih siswa dari dropdown.

API:
- `GET/POST /api/materials`
- `GET/PATCH/DELETE /api/materials/:id`
- `POST /api/materials/:id/attachments`
- `DELETE /api/materials/:id/attachments/:attachmentId`

Catatan:
- UI belum memiliki upload file backend nyata; endpoint attachment menerima metadata.

## 7.10 Tugas
Tujuan:
- Lifecycle tugas dari perencanaan hingga pengumpulan dan penilaian.

As-Is:
- Teacher/Admin:
  - Buat tugas dari sumber soal (paket, bank soal, atau baru).
  - Set kelas, mapel, guru, deadline, delivery type.
  - Lihat progress submission dan detail pengumpulan.
- Student:
  - Lihat tugas pending/submitted/graded.
  - Kerjakan tugas via halaman work.
- Parent:
  - Monitoring status tugas anak (tanpa submit).

Flow `AssignmentWork`:
1. Load detail assignment.
2. Validasi role submit hanya student.
3. Submit response:
   - FILE: metadata file (`name/size/type`) saja.
   - ESSAY/MCQ: text response.
4. POST submission ke API.

API:
- `GET/POST /api/assignments`
- `GET/PATCH/DELETE /api/assignments/:id`
- `PUT /api/assignments/:id/classes`
- `PUT /api/assignments/:id/questions`
- `GET/POST /api/assignments/:id/submissions`
- `PATCH /api/submissions/:id`

## 7.11 Bank Soal
Tujuan:
- Pengelolaan soal dan paket soal reusable.

As-Is:
- CRUD question.
- CRUD question package.
- Duplicate question.
- Assign questionIds ke package.
- Dipakai saat pembuatan assignment.

API:
- `GET/POST /api/questions`
- `GET/PATCH/DELETE /api/questions/:id`
- `GET/POST /api/question-packages`
- `GET/PATCH/DELETE /api/question-packages/:id`
- `PUT /api/question-packages/:id/questions`

## 7.12 Nilai
Tujuan:
- Menyediakan rekap nilai siswa untuk guru, siswa, dan orang tua.

As-Is:
- Teacher/Admin:
  - Pilih schedule.
  - Lihat `grade summary` per student (average, assignment count).
  - Chart performa kelas.
- Student/Parent:
  - Lihat daftar nilai per assignment + status.

API:
- `GET /api/grades?classId&subjectId&studentId`
- `GET /api/grades/summary?classId&subjectId`

## 7.13 Forum
Tujuan:
- Diskusi mapel antara guru dan siswa.

As-Is:
- Parent diblokir di UI.
- Create thread, list/filter thread, detail thread.
- Balas thread.
- Moderasi pin/lock oleh admin/teacher.
- Upvote endpoint tersedia, namun tombol upvote di detail/list belum terhubung penuh.

API:
- `GET/POST /api/forum/threads`
- `GET/PATCH/DELETE /api/forum/threads/:id`
- `GET/POST /api/forum/threads/:id/replies`
- `PATCH /api/forum/replies/:id`
- `POST /api/forum/threads/:id/pin`
- `POST /api/forum/threads/:id/lock`
- `POST /api/forum/threads/:id/upvote`
- `POST /api/forum/replies/:id/upvote`

## 7.14 Catatan
Tujuan:
- Menyimpan catatan pribadi atau catatan kelas.

As-Is:
- CRUD note.
- Pin note.
- Tab private/class visibility.
- Subject tagging dan color tagging.

API:
- `GET/POST /api/notes`
- `GET/PATCH/DELETE /api/notes/:id`
- `POST /api/notes/:id/pin`

## 7.15 Kalender Akademik
Tujuan:
- Menampilkan event sekolah dan timeline akademik.

As-Is:
- List event by range/type/class.
- Admin/Teacher dapat create/update/delete.
- Student/Parent read-only (UI).
- Highlights event type pada calendar.

API:
- `GET/POST /api/calendar/events`
- `GET/PATCH/DELETE /api/calendar/events/:id`
- `PUT /api/calendar/events/:id/classes`

## 7.16 Profile & Settings
Tujuan:
- Pengelolaan profil user dan konfigurasi sekolah.

As-Is Profile:
- View/edit biodata.
- Placeholder change password (belum terhubung backend).
- Sumber user profile diambil dari `listUsers({ role })` lalu memilih data pertama.

As-Is Settings (Admin only):
- Update school profile.
- Set academic year active.
- View schedule template.
- Notification setting masih state lokal UI.

API:
- Profile:
  - `GET/PATCH /api/users/:id/profile`
- Settings:
  - `GET/PATCH /api/settings/school-profile`
  - `GET/PATCH /api/schedule-templates`
  - `GET/POST/PATCH/DELETE /api/academic-years*`
  - `POST /api/academic-years/:id/activate`

---

## 8. Flow End-to-End per Role

## 8.1 Admin Flow
1. Login debug (`admin/admin`) lalu masuk dashboard.
2. Setup data master:
`Users -> Majors -> Classes -> Subjects -> ScheduleTemplates`.
3. Susun jadwal pelajaran (`Schedules`).
4. Pantau absensi siswa/guru (`Attendance`).
5. Pantau performa agregat sekolah (`Analytics`).
6. Kelola event dan konfigurasi sekolah (`Calendar`, `Settings`).

## 8.2 Teacher Flow
1. Cek jadwal mengajar harian (`Schedules`).
2. Mulai sesi dan isi absensi kelas (`Attendance`).
3. Publish materi (`Materials`).
4. Buat tugas dari bank/paket soal (`Assignments`, `QuestionBank`).
5. Monitor submission dan grading progress (`Assignments`, `Grades`).
6. Diskusi akademik dan catatan kelas (`Forum`, `Notes`).

## 8.3 Student Flow
1. Lihat jadwal dan kehadiran pribadi (`Schedules`, `Attendance`).
2. Akses materi pembelajaran (`Materials`).
3. Kerjakan dan submit tugas (`Assignments` -> `AssignmentWork`).
4. Pantau nilai (`Grades`).
5. Ikut diskusi dan membaca catatan (`Forum`, `Notes`).

## 8.4 Parent Flow
1. Pilih anak (UI dropdown di beberapa modul).
2. Pantau kehadiran anak (`Attendance`).
3. Pantau status tugas anak (`Assignments`).
4. Pantau nilai anak (`Grades`).
5. Lihat kalender kegiatan (`Calendar`).

---

## 9. Gap Audit dan Risiko

## 9.1 P0 (Kritikal)
- Tidak ada autentikasi dan authorization server-side di API.
- Ownership spoofing:
  - Submission menerima `studentId` dari payload.
  - Thread/reply/note menerima `authorId` dari payload.
  - Attendance guru menerima `teacherId` dari payload.
- Parent dan student berpotensi akses data lintas user/class melalui direct API.
- Role enforcement hanya di UI dan mudah di-bypass.

## 9.2 P1 (Integritas Data)
- Validasi bentrok jadwal hanya client-side.
- Attendance session dapat terduplikasi (belum ada unique key bisnis per date/class/subject/schedule).
- Forum lock status belum memblokir create reply di server route.
- Beberapa halaman parent memuat `listStudents()` tanpa filter parent-child di layer UI.

## 9.3 P2 (Kualitas Produk/Operasional)
- Notifikasi sistem belum persist ke backend.
- Perubahan password belum terhubung backend.
- File upload belum real (baru metadata).
- Search bar top layout dan badge notifikasi masih placeholder.
- Automated tests sudah tersedia di repository (unit/integration/e2e API via Vitest).

---

## 10. Ubah/Tambah/Revisi yang Direkomendasikan

## 10.1 Prioritas 0-30 Hari (Wajib Sebelum Production)
- Implement authentication backend (session/JWT) + middleware route protection.
- Terapkan authorization matrix di semua endpoint (`ADMIN`, `TEACHER`, `STUDENT`, `PARENT` + ownership).
- Derive actor identity dari session, bukan dari payload (`authorId`, `studentId`, `teacherId`).
- Tutup endpoint yang sensitif dari akses lintas role.

## 10.2 Prioritas 31-60 Hari (Integritas dan Ketahanan)
- Tambah validasi bisnis server-side:
  - Overlap jadwal.
  - Lock thread mencegah reply.
  - Teacher hanya bisa akses kelas/mapel yang diajar.
  - Parent hanya bisa lihat anak yang linked.
- Tambah unique constraint bisnis tambahan (attendance session policy).
- Tambah audit log tabel untuk aksi kritikal (grade change, attendance override, role/profile update).

## 10.3 Prioritas 61-120 Hari (Product Hardening)
- Real file storage pipeline (upload service + signed URL + antivirus policy).
- Notification service (template + queue + channel).
- Testing pyramid:
  - Unit test validators/handlers.
  - Integration test route.
  - E2E role journey utama.
- Observability (request logging, error rate, performance metrics).

---

## 11. Dampak Per Stakeholder

## 11.1 Manajemen Sekolah / Pemilik Produk
- Keuntungan:
  - Fitur komprehensif sudah tersedia untuk operasional harian.
- Risiko:
  - Tanpa P0, data siswa/nilai/absensi belum aman untuk produksi.
- Keputusan:
  - Prioritaskan fase hardening sebelum rollout penuh.

## 11.2 Tim Operasional Akademik
- Keuntungan:
  - Alur kerja admin-guru-siswa-parent sudah terbentuk.
- Kebutuhan revisi:
  - SOP data ownership (siapa boleh melihat/mengubah apa).
  - SOP fallback saat input absensi/tugas gagal.

## 11.3 Tim Engineering
- Fokus teknis:
  - Security-by-default di route layer.
  - Refactor payload generic `Record<string, unknown>` ke typed DTO + schema validation.
  - Normalisasi endpoint yang masih campur mock/live.

## 11.4 Tim Compliance / Governance
- Wajib:
  - Audit trail.
  - Policy akses data pribadi siswa.
  - Retensi data dan incident response.

---

## 12. Blueprint Roadmap Implementasi

## Fase 1: Secure Foundation
- Deliverables:
  - Auth middleware.
  - Role + ownership guard semua endpoint.
  - Session-derived actor context.

## Fase 2: Data Integrity
- Deliverables:
  - Business validator server-side.
  - Constraints dan transaction policy.
  - Audit log minimal viable.

## Fase 3: Product Maturity
- Deliverables:
  - Notification engine.
  - Real upload pipeline.
  - Automated testing + observability dashboard.

---

## 13. Open Questions untuk Finalisasi BRD/PRD/TRD
- Model autentikasi final: internal credential, SSO sekolah, atau hybrid?
- Apakah parent boleh melihat detail submission file/jawaban teks anak atau hanya status?
- Apakah guru boleh lintas jurusan/kelas tertentu (co-teaching policy)?
- Apakah kalender event perlu approval workflow sebelum publish?
- SLA grading dan SLA respons forum yang diinginkan sekolah?
- Apakah perlu support multi-school (multi-tenant) pada roadmap jangka menengah?

---

## 14. Kesimpulan
`Sekolah Pintar` sudah memiliki coverage fitur yang kuat untuk proses akademik inti dan layak dipitch sebagai platform manajemen sekolah end-to-end.  
Untuk menjadi dokumen BRD/PRD/TRD yang executable, fokus implementasi berikutnya harus diarahkan ke:
- Keamanan akses data.
- Integritas proses bisnis.
- Kesiapan operasional produksi.

Dengan menutup gap prioritas P0-P1, aplikasi ini siap ditransformasikan dari mode demo-operasional menjadi platform produksi yang aman dan governable.
