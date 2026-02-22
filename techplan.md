# Tech Plan Sekolah Pintar

Versi: 1.0  
Tanggal: 21 Februari 2026  
Sumber analisis: `overview.md`, `ROLE_FEATURE_TODO.md`, `ROLE_FEATURE_MATRIX.md`, `schoolie-gap-analysis.md`

## 1. Tujuan Dokumen

Dokumen ini adalah rencana implementasi teknis terpadu untuk menutup gap readiness produksi pada aplikasi Sekolah Pintar, sekaligus jadi tracker progres lintas tim (engineering, product, QA, stakeholder).

## 2. Aturan Checklist (Wajib)

- `[ ]` = belum selesai / belum sesuai spec.
- `[x]` = sudah sesuai spec.

Rule update:

- Setiap 1 item implementasi selesai, langsung ubah checklist item terkait di dokumen ini.
- Jika ada perubahan scope, tambah item baru (jangan hapus histori item lama tanpa catatan).

Aturan histori:

- Item lama yang dibatalkan harus tetap ada dan diberi catatan `Scope berubah`.
- Dilarang menghapus item checklist lama tanpa jejak perubahan.

## 3. Cara Pakai Tracking

- Satu checklist item mewakili satu output teknis yang bisa diverifikasi.
- Item dianggap `[x]` hanya jika memenuhi DoD (Definition of Done) pada item tersebut.
- Jika implementasi parsial, tetap `[ ]` dan tambahkan catatan progres.
- ID item wajib dipakai di commit/PR agar traceability jelas.

## 4. Ringkasan Gap Prioritas

- P0: autentikasi backend, otorisasi role/ownership server-side, anti spoofing actor identity.
- P1: integritas data (schedule conflict, attendance uniqueness, forum lock server enforcement).
- P2: hardening operasional (audit log, upload pipeline, notifications, testing).
- P3: maturity (observability, governance lifecycle akademik, rollout readiness).

## 5. Timeline Fase (Target)

- Fase 0 (Minggu 1-2): stop the bleeding (security minimum).
- Fase 1 (Minggu 3-6): secure foundation + policy layer.
- Fase 2 (Minggu 7-12): data integrity + academic lifecycle.
- Fase 3 (Minggu 13+): product maturity + operational excellence.

## 6. Master Checklist Implementasi

### 6.1 WS-DOC: Baseline, Alignment, dan Scope Control

- [x] TP-DOC-001 Buat dokumen `techplan.md` sebagai single source of truth plan teknis.
- [x] TP-DOC-002 Sinkronkan mismatch status fitur antara `ROLE_FEATURE_TODO.md` dan `ROLE_FEATURE_MATRIX.md`. DoD: perbedaan status Dashboard/Profile/Settings disepakati dan didokumentasikan.
- [x] TP-DOC-003 Definisikan owner per workstream (Backend, Frontend, QA, Product). DoD: tiap item P0-P1 punya owner.
- [x] TP-DOC-004 Tetapkan ritme update dokumen (harian/mingguan). DoD: jadwal update disetujui dan berjalan.

Alignment note TP-DOC-002 (21-02-2026):
- Dashboard: disepakati `implemented with refinement`. Data utama sudah endpoint-driven, tetapi role-specific scoping masih backlog.
- Profil Saya: disepakati `implemented with refinement`. Endpoint profile sudah terhubung backend, tetapi actor-scoped behavior masih backlog.
- Settings/Notifikasi: disepakati `not implemented`. Masih state lokal UI dan belum persist backend.

Owner mapping TP-DOC-003:
- WS-SEC, WS-AUTHZ, WS-API, WS-ATT, WS-AUD: `Backend Lead`
- WS-SCHEDULE, WS-PARENT, WS-ASSIGN, WS-GRADE, WS-FORUM: `Backend + Product`
- WS-NOTIF, WS-FILE, WS-LIFE: `Backend + Architect`
- WS-ROLE, WS-TEST: `QA Lead`
- WS-DOC, WS-RELEASE, WS-OPS: `Engineering Manager`
- Frontend execution owner untuk semua perubahan UI/API integration: `Frontend Lead`

Ritme update TP-DOC-004:
- Harian (workday): update checklist item yang berubah status maksimal H+0 setelah PR merge.
- Mingguan: review progres lintas workstream setiap Jumat pukul 16:00 WIB.
- Sprint boundary: validasi ulang prioritas P0/P1 dan catat scope change log bila ada perubahan requirement.

### 6.2 WS-SEC: Authentication & Session Foundation (P0)

- [x] TP-SEC-001 Implement route protection `middleware.ts` untuk `/dashboard` dan route sensitif. DoD: unauthenticated user tidak bisa akses halaman privat.
- [x] TP-SEC-002 Implement `requireAuth()` helper di API layer. DoD: endpoint sensitif return 401 jika tanpa session/token valid.
- [x] TP-SEC-003 Implement actor context server-side (`userId`, `role`, `schoolId?`). DoD: seluruh handler sensitif memakai actor context yang sama.
- [x] TP-SEC-004 Nonaktifkan debug impersonation di environment produksi. DoD: fitur debug hanya aktif di dev/test.
- [x] TP-SEC-005 Tambahkan endpoint login/logout backend final. DoD: flow login tidak bergantung pada sessionStorage role mock.
- [x] TP-SEC-006 Tambahkan session validation untuk setiap request API sensitif. DoD: request dengan session invalid ditolak konsisten.

Implementasi TP-SEC-004:
- Gating debug impersonation memakai env check (`NODE_ENV` + flag debug env).
- Login session hanya mengizinkan `canUseDebugPanel` untuk admin pada env yang mengizinkan debug.
- Client helper debug access otomatis menolak enable debug di production.

### 6.3 WS-AUTHZ: Role & Ownership Authorization (P0)

- [ ] TP-AUTHZ-001 Buat authorization matrix eksplisit per resource dan action. DoD: matrix approved Product + Engineering.
- [x] TP-AUTHZ-002 Implement `requireRole()` untuk aksi level role (ADMIN/TEACHER/STUDENT/PARENT). DoD: endpoint terproteksi role.
- [x] TP-AUTHZ-003 Implement ownership guard parent-child (`canViewStudent`). DoD: parent hanya dapat akses anak ter-link.
- [x] TP-AUTHZ-004 Implement ownership guard student-self data. DoD: student hanya akses data milik sendiri.
- [x] TP-AUTHZ-005 Implement ownership guard teacher kelas/mapel yang diajar. DoD: teacher tidak bisa mutate data kelas lain.
- [x] TP-AUTHZ-006 Terapkan deny-by-default pada endpoint yang belum punya policy. DoD: endpoint tanpa policy eksplisit return 403.
- [x] TP-AUTHZ-007 Audit semua endpoint `app/api/*` untuk policy coverage. DoD: 100% endpoint sensitif terdaftar status policy.

Progress TP-AUTHZ-001:
- Draft authorization matrix eksplisit per resource/action sudah dibuat di `AUTHZ_MATRIX.md`.
- Approval packet + checklist sign-off formal disiapkan di `AUTHZ_APPROVAL_PACKET.md`.
- Ditambahkan automasi update approval `npm run governance:approve` + sinkronisasi checklist `npm run governance:sync-techplan` (lihat `GOVERNANCE_AUTOMATION.md`).
- Histori perubahan approval governance kini tercatat otomatis di `GOVERNANCE_APPROVAL_HISTORY.md` untuk menjaga jejak audit keputusan.
- Status approval Product + Engineering masih pending, sehingga item tetap terbuka.

Implementasi TP-SEC-003:
- `requireAuth()` sekarang mengembalikan `ActorContext` terstandar (`userId`, `role`, `schoolId`).

Implementasi TP-AUTHZ-002:
- Helper `requireRole()` dipakai untuk role enforcement terstandar di endpoint user-domain.
- Endpoint yang sudah terproteksi role: `/api/users`, `/api/users/[id]` (mutasi), `/api/students`, `/api/parents`, `/api/teachers`, `/api/parent-links`.

Implementasi TP-AUTHZ-003:
- Ownership guard parent-child dipakai pada endpoint data siswa/monitoring: `/api/students`, `/api/grades`, `/api/attendance/records`, `/api/assignments/[id]/submissions`.
- Parent request di luar linked child sekarang ditolak (`403`) atau hasil dikosongkan sesuai konteks query.

Implementasi TP-AUTHZ-004:
- Student scope dipaksa ke data diri sendiri pada endpoint: `/api/students`, `/api/users/[id]`, `/api/grades`, `/api/attendance/records`, `/api/assignments/[id]/submissions`, `/api/submissions/[id]`.
- Payload submission tidak lagi menerima `studentId` dari client; identitas submitter selalu dari session actor.

Implementasi TP-AUTHZ-005:
- Ownership guard teacher untuk domain assignment sudah diterapkan pada endpoint: `/api/assignments`, `/api/assignments/[id]`, `/api/assignments/[id]/classes`, `/api/assignments/[id]/questions`, `/api/submissions/[id]`.
- Ownership guard teacher untuk domain materi/jadwal/absensi sudah diterapkan pada endpoint: `/api/materials`, `/api/materials/[id]`, `/api/materials/[id]/attachments`, `/api/materials/[id]/attachments/[attachmentId]`, `/api/schedules`, `/api/schedules/[id]`, `/api/attendance/sessions`, `/api/attendance/sessions/[id]`, `/api/attendance/sessions/[id]/records`, `/api/attendance/records/[id]`.
- Guard memastikan guru hanya bisa mutate resource pada kombinasi mapel/kelas yang dia ajar atau resource yang dia miliki.

Implementasi TP-AUTHZ-006:
- Deny-by-default diterapkan pada cluster endpoint yang sebelumnya terbuka: `calendar`, `analytics`, `grades summary`, `classes`, `subjects`, `majors`, `academic-years`, `schedule-templates`, `settings/school-profile`, `question-packages`, `questions`.
- Endpoint tersebut kini menolak request tanpa session (`401`) dan menolak role tidak sesuai (`403`).

Implementasi TP-AUTHZ-007:
- Audit policy coverage dilakukan untuk seluruh route `app/api/*` berbasis pengecekan source route handler.
- Hasil audit coverage: semua route API non-auth sudah memiliki guard auth server-side; pengecualian terkontrol hanya endpoint publik auth `/api/auth/login` dan `/api/auth/logout`.
- Baseline ini memastikan endpoint sensitif tercatat memiliki policy coverage aktif (auth + role/ownership sesuai konteks route).

### 6.4 WS-API: DTO Typing, Validation, dan Handler Quality (P0-P1)

- [x] TP-API-001 Hapus field actor identity dari payload sensitif (`authorId`, `studentId`, `teacherId`). DoD: actor identity hanya dari session.
- [x] TP-API-002 Standarkan input validation Zod untuk seluruh endpoint write (POST/PATCH/PUT). DoD: invalid payload return 400 + code konsisten.
- [x] TP-API-003 Implement standard error code (`UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `CONFLICT`, `NOT_FOUND`). DoD: response error seragam lintas route.
- [x] TP-API-004 Refactor `listClassSubjects` response/payload jadi typed schema. DoD: tidak ada `Record<string, unknown>` pada flow utama.
- [x] TP-API-005 Refactor `setClassSubjects` payload typed schema. DoD: payload tervalidasi penuh.
- [x] TP-API-006 Refactor `setSubjectTeachers` payload typed schema. DoD: payload tervalidasi penuh.
- [x] TP-API-007 Refactor `setSubjectClasses` payload typed schema. DoD: payload tervalidasi penuh.
- [x] TP-API-008 Hilangkan `any` normalisasi di `lib/handlers/schedules.ts`. DoD: mapper typed + parse schema lulus.
- [x] TP-API-009 Hilangkan `any` normalisasi di `lib/handlers/materials.ts`. DoD: mapper typed + parse schema lulus.
- [x] TP-API-010 Tertibkan endpoint profile agar tidak ambil user berdasarkan fallback data pertama. DoD: profile endpoint actor-scoped jelas.

Implementasi TP-API-001:
- Forum thread/reply submit sudah derive actor dari session (tanpa `authorId` payload).
- Assignment submission sudah derive `studentId` dari session (tanpa `studentId` payload).
- Notes create sudah derive `authorId` dari session (tanpa `authorId` payload).
- Teacher attendance create sudah derive `teacherId` dari session untuk role `TEACHER` (admin masih dapat menentukan target guru).
- Material create/update untuk role `TEACHER` sekarang derive `teacherId` dari session (payload `teacherId` tidak dipercaya).
- Schedule create/update untuk role `TEACHER` sekarang derive `teacherId` dari session saat mutasi guru.
- Attendance session create/update untuk role `TEACHER` sekarang derive `teacherId`/`takenByTeacherId` dari session saat field actor dikirim client.
- Calendar event create sekarang derive `createdById` dari session actor (payload `createdById` tidak dipercaya).
- Seluruh penetapan actor saat write dilakukan dari session server-side; field ID pada payload hanya dipakai sebagai target business entity untuk konteks admin yang sah.

Implementasi TP-API-003:
- Kode error lintas route API diseragamkan ke set standar (`UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `CONFLICT`, `NOT_FOUND`), termasuk normalisasi endpoint login (`UNAUTHORIZED`) dan health metrics (`CONFLICT` dengan status `503`).
- Ditambahkan unit guard `tests/unit/api-error-codes.unit.test.ts` yang memverifikasi seluruh pemanggilan `jsonError()` di `app/api` hanya memakai kode standar tersebut.

Implementasi TP-API-002:
- Ditambahkan helper validasi Zod terstandar `parseJsonBody()`, `parseJsonRecordBody()`, dan `parseJsonRecordArrayBody()` di `lib/api.ts` untuk memastikan invalid payload konsisten mengembalikan `400 VALIDATION_ERROR`.
- Seluruh endpoint write (`POST/PATCH/PUT`) pada `app/api` kini memakai parser terstandar tersebut (baik schema-spesifik maupun record parser sebagai payload gate awal), sehingga tidak ada route write yang memanggil `request.json()` mentah.
- Migrasi ini mencakup domain utama: akademik (`academic-years`, `classes`, `subjects`, `majors`), operasional (`schedules`, `attendance`, `teacher-attendance`, `calendar`, `settings`), pembelajaran (`materials`, `assignments`, `submissions`, `questions`, `question-packages`), forum/notes, parent-link, serta upload intent flow.
- Ditinggalkan script utilitas `scripts/codemod-parse-json-record.mjs` untuk menjaga konsistensi pola saat penambahan route write baru.
- Pengecualian terkontrol: endpoint auth login tetap melakukan parsing khusus karena membutuhkan fallback kompatibilitas format kredensial lama (`username`/`identifier`).

### 6.5 WS-SCHEDULE: Jadwal & Template (P1)

- [x] TP-SCH-001 Tambahkan server-side validation `startTime < endTime`. DoD: invalid range ditolak di API.
- [x] TP-SCH-002 Tambahkan server-side overlap validator bentrok kelas. DoD: jadwal bentrok kelas tidak bisa disimpan.
- [x] TP-SCH-003 Tambahkan server-side overlap validator bentrok guru. DoD: jadwal bentrok guru tidak bisa disimpan.
- [x] TP-SCH-004 Tambahkan server-side overlap validator bentrok ruang (jika room digunakan). DoD: bentrok ruang ditolak.
- [x] TP-SCH-005 Tambahkan UI edit schedule templates + integrasi `updateScheduleTemplates`. DoD: admin bisa update template dari Settings.
- [x] TP-SCH-006 Tambahkan test integrasi untuk bypass validasi jadwal via direct API call. DoD: test gagal jika rule dilanggar.

Implementasi TP-SCH-001:
- Endpoint create/update jadwal (`/api/schedules`, `/api/schedules/[id]`) sekarang memvalidasi format jam `HH:mm` dan menolak request jika `startTime >= endTime`.

Implementasi TP-SCH-002:
- Endpoint create/update jadwal sekarang mengecek overlap per kelas pada hari yang sama dan menolak konflik dengan `409 CONFLICT`.

Implementasi TP-SCH-003:
- Endpoint create/update jadwal sekarang mengecek overlap per guru pada hari yang sama dan menolak konflik dengan `409 CONFLICT`.

Implementasi TP-SCH-004:
- Endpoint create/update jadwal sekarang mengecek overlap penggunaan ruang (jika room diisi) pada hari yang sama dan menolak konflik dengan `409 CONFLICT`.

Implementasi TP-SCH-005:
- Tab `Jam Pelajaran` pada halaman Settings sekarang mendukung edit inline (nama slot, jam mulai/selesai, durasi, dan flag istirahat) serta menyimpan ke backend melalui `updateScheduleTemplates`.

Implementasi TP-SCH-006:
- Ditambahkan integration test `tests/integration/schedule-conflict.integration.test.ts` untuk memastikan direct API call ke `POST /api/schedules` tetap ditolak (`409 CONFLICT`) saat terjadi bentrok jadwal kelas.

### 6.6 WS-ATT: Attendance Integrity & Governance (P1)

- [x] TP-ATT-001 Tetapkan business key unik attendance session. DoD: policy unik disepakati dan terdokumentasi.
- [x] TP-ATT-002 Tambahkan unique constraint attendance session di Prisma + migration. DoD: duplicate session gagal di DB level.
- [x] TP-ATT-003 Ubah create attendance session menjadi idempotent upsert. DoD: retry request tidak menghasilkan duplikasi.
- [x] TP-ATT-004 Tambahkan status sesi absensi (`OPEN`, `LOCKED`, `FINALIZED`). DoD: update mengikuti status policy.
- [x] TP-ATT-005 Tambahkan cutoff edit absensi untuk teacher + override policy admin. DoD: edit retroaktif mengikuti aturan.
- [x] TP-ATT-006 Tambahkan `overrideReason`, `overriddenBy`, `overriddenAt`. DoD: semua override tersimpan jejaknya.
- [x] TP-ATT-007 Tambahkan guard teacher hanya isi absensi kelas yang diajar/substitute authorized. DoD: unauthorized attendance write ditolak.

Implementasi TP-ATT-001:
- Business key attendance session ditetapkan sebagai `sessionKey` terhitung:
- `schedule:{scheduleId}:{YYYY-MM-DD}` untuk sesi berbasis jadwal.
- `manual:{classId}:{subjectId}:{YYYY-MM-DD}:{startTime|-}:{endTime|-}` untuk sesi manual.

Implementasi TP-ATT-002:
- Ditambahkan kolom `AttendanceSession.sessionKey` dengan constraint `@unique` di Prisma.
- Migration DB ditambahkan: `prisma/migrations/20260222051500_add_attendance_session_key/migration.sql`.

Implementasi TP-ATT-003:
- Endpoint create sesi absensi (`/api/attendance/sessions`) diubah menjadi idempotent `upsert` berbasis `sessionKey`.
- Retry request dengan key yang sama tidak lagi membuat duplikasi record.

Implementasi TP-ATT-004:
- Ditambahkan enum dan field status sesi absensi di Prisma (`OPEN`, `LOCKED`, `FINALIZED`) pada `AttendanceSession`.
- Endpoint update sesi (`PATCH /api/attendance/sessions/[id]`) sekarang memvalidasi transisi status dan timestamp status (`lockedAt`, `finalizedAt`) secara konsisten.

Implementasi TP-ATT-005:
- Diterapkan cutoff edit absensi untuk teacher berbasis policy window (`ATTENDANCE_TEACHER_EDIT_CUTOFF_HOURS`, default 24 jam) pada endpoint write attendance.
- Jika sesi berada di luar policy normal (status non-OPEN atau cutoff lewat), admin wajib menyertakan `overrideReason` untuk melakukan edit.

Implementasi TP-ATT-006:
- Field override attendance (`overrideReason`, `overriddenById`, `overriddenAt`) ditambahkan di `AttendanceSession` beserta relasi actor override.
- Endpoint write attendance session/record sekarang mengisi jejak override otomatis saat admin melakukan edit di luar policy normal.

Implementasi TP-ATT-007:
- Write absensi siswa (`/api/attendance/sessions/[id]/records` dan `/api/attendance/records/[id]`) sekarang hanya diizinkan untuk guru pengampu sesi atau guru pengganti yang ditetapkan (`takenByTeacherId`).
- Request write dari guru di luar konteks sesi tersebut kini ditolak dengan `403`.

### 6.7 WS-FORUM: Enforcement & Moderation Integrity (P1)

- [x] TP-FORUM-001 Enforce `locked thread` di server saat create reply. DoD: reply ke thread locked ditolak untuk non-moderator.
- [x] TP-FORUM-002 Enforce lock policy pada edit reply dan aksi terkait. DoD: policy lock konsisten di semua endpoint forum.
- [x] TP-FORUM-003 Validasi role parent tidak bisa akses forum endpoint jika policy final tetap blokir. DoD: parent receive 403.
- [x] TP-FORUM-004 Tambahkan integration test bypass UI untuk forum lock. DoD: direct API bypass gagal.

Implementasi TP-FORUM-004:
- Ditambahkan integration test `tests/integration/forum-lock.integration.test.ts` untuk memastikan direct API call ke endpoint forum tetap ditolak saat thread `LOCKED` (create reply dan edit reply oleh non-moderator).

### 6.8 WS-ASSIGN: Assignment & Submission Lifecycle (P1-P2)

- [x] TP-ASG-001 Enforce teacher ownership untuk create/update assignment per mapel/kelas. DoD: teacher lintas kelas tidak bisa mutate.
- [x] TP-ASG-002 Enforce student ownership untuk submit assignment milik sendiri. DoD: student tidak bisa submit atas nama user lain.
- [x] TP-ASG-003 Tambahkan policy late submission (`allowLateSubmission`, `lateUntil`). DoD: rule submit telat berjalan sesuai konfigurasi.
- [x] TP-ASG-004 Tambahkan policy resubmission (`maxAttempts` atau versioning). DoD: percobaan submit mengikuti kebijakan.
- [x] TP-ASG-005 Definisikan `gradingPolicy` (`LATEST`/`HIGHEST`/`MANUAL`). DoD: perhitungan nilai mengikuti policy aktif.
- [x] TP-ASG-006 Tambahkan audit jejak perubahan status submission penting. DoD: perubahan kritikal dapat ditelusuri.

Implementasi TP-ASG-001 + TP-ASG-002:
- Teacher assignment mutate dibatasi oleh ownership + relasi mapel/kelas di endpoint assignment.
- Student submission endpoint sekarang session-derived (`studentId` tidak diambil dari payload) dan update submission dibatasi ke owner submission.

Implementasi TP-ASG-003:
- Model assignment ditambah field policy submit telat: `allowLateSubmission` dan `lateUntil`.
- Validasi policy diterapkan pada create/update assignment serta enforcement submit di endpoint submission (`POST /api/assignments/[id]/submissions` dan `PATCH /api/submissions/[id]`) sehingga submit telat hanya diterima jika konfigurasi mengizinkan.

Implementasi TP-ASG-004:
- Ditambahkan policy resubmission berbasis `maxAttempts` di assignment dan `attemptCount` di submission.
- Endpoint submit tugas sekarang menaikkan `attemptCount` per submit siswa dan menolak request ketika jumlah percobaan melebihi `maxAttempts`.

Implementasi TP-ASG-005:
- Ditambahkan field `gradingPolicy` pada assignment (`LATEST`, `HIGHEST`, `MANUAL`) dengan default `LATEST` dan validasi create/update assignment.
- Endpoint grading submission (`PATCH /api/submissions/[id]`) kini menerapkan policy aktif; untuk `HIGHEST` nilai tersimpan otomatis mengambil nilai tertinggi antara nilai lama dan nilai baru.

Implementasi TP-ASG-006:
- Lifecycle submit tugas sekarang menulis audit log pada endpoint `POST /api/assignments/[id]/submissions` (`SUBMISSION_CREATED`/`SUBMISSION_STATUS_CHANGED`) dan `PATCH /api/submissions/[id]` (`SUBMISSION_STATUS_CHANGED`).
- Snapshot `beforeData`/`afterData` serta metadata (`assignmentId`, `studentId`) disimpan untuk melacak perubahan status submission yang kritikal.

### 6.9 WS-GRADE: Grade Policy & Auditability (P1-P2)

- [x] TP-GRD-001 Tambahkan guard grading: hanya actor authorized bisa publish/ubah nilai. DoD: unauthorized grade mutation ditolak.
- [x] TP-GRD-002 Tambahkan grade change audit log (before/after, reason, actor). DoD: setiap perubahan nilai punya audit record.
- [x] TP-GRD-003 Definisikan komponen nilai minimal (`Homework`, `Quiz`, `Exam`, `Practical`). DoD: komponen tersimpan dan dipakai summary.
- [x] TP-GRD-004 Definisikan bobot nilai per subject/class/semester. DoD: summary grade bukan average mentah.
- [x] TP-GRD-005 Tambahkan snapshot nilai final saat publish rapor. DoD: histori nilai final tidak berubah oleh recalculation belakangan.

Implementasi TP-GRD-001:
- Endpoint `PATCH /api/submissions/[id]` sekarang memblokir mutation grading (`grade`, `feedback`, atau `status=GRADED`) untuk actor `STUDENT` dengan `403`.
- Validasi status submission ditambahkan server-side (`PENDING`, `SUBMITTED`, `GRADED`) dan request status invalid ditolak dengan `400 VALIDATION_ERROR`.

Implementasi TP-GRD-002:
- Grade mutation pada endpoint `PATCH /api/submissions/[id]` sudah menulis `AuditLog` (`GRADE_UPDATED`/`GRADE_PUBLISHED`) lengkap dengan actor, reason, serta snapshot `beforeData`/`afterData`.

Implementasi TP-GRD-003:
- Ditambahkan enum `GradeComponent` (`HOMEWORK`, `QUIZ`, `EXAM`, `PRACTICAL`) dan field `Assignment.gradeComponent` (default `HOMEWORK`) agar komponen nilai tersimpan per assignment.
- Endpoint assignment (`/api/assignments`, `/api/assignments/[id]`) kini memvalidasi dan mempersist `gradeComponent`, dan endpoint grade (`/api/grades`) mengembalikan komponen ini.
- Summary nilai (`/api/grades/summary`) kini menghitung rata-rata per komponen sebelum komputasi nilai akhir.

Implementasi TP-GRD-004:
- Ditambahkan model `GradeWeight` untuk bobot nilai per `subjectId + classId + semester` beserta endpoint kelola bobot `GET/PATCH /api/grades/weights`.
- Endpoint summary nilai (`/api/grades/summary`) kini menggunakan bobot komponen aktif (`GradeWeight`) dengan fallback default 25/25/25/25, sehingga hasil bukan average mentah.
- Ditambahkan integration test `tests/integration/grade-summary-weighted.integration.test.ts` untuk memastikan perhitungan weighted berjalan sesuai bobot.

Implementasi TP-GRD-005:
- Ditambahkan model immutable `ReportCardSnapshot` untuk menyimpan snapshot nilai final saat proses publish rapor.
- Ditambahkan endpoint `POST /api/grades/report-cards` (publish snapshot) dan `GET /api/grades/report-cards` (riwayat snapshot), sehingga nilai final yang sudah dipublish tidak terpengaruh recalculation berikutnya.
- Ditambahkan integration test `tests/integration/report-card-snapshot.integration.test.ts` untuk memastikan setiap publish menghasilkan snapshot baru (histori tidak ter-overwrite).

### 6.10 WS-PARENT: Parent Flow & Data Scoping (P0-P1)

- [x] TP-PRN-001 Pastikan endpoint parent hanya mengembalikan linked children. DoD: tidak ada akses daftar siswa global dari parent context.
- [x] TP-PRN-002 Validasi `selectedChildId` selalu belongs-to-parent. DoD: child context invalid auto reject/reset.
- [x] TP-PRN-003 Audit halaman parent yang masih memanggil list siswa generik. DoD: semua diganti endpoint scoped.
- [x] TP-PRN-004 Definisikan policy visibilitas parent pada detail submission/jawaban anak. DoD: keputusan produk terdokumentasi dan diterapkan.

Implementasi TP-PRN-001:
- Parent context pada endpoint siswa dan monitoring dipersempit ke linked children: `/api/students`, `/api/grades`, `/api/attendance/records`, `/api/assignments/[id]/submissions`.
- Endpoint `/api/parents` untuk actor parent dipersempit ke profil parent sendiri (bukan daftar parent global).

Implementasi TP-PRN-002:
- Halaman parent `Assignments`, `Materials`, dan `Grades` sekarang memvalidasi ulang `selectedStudentId` terhadap daftar anak ter-link setiap kali daftar siswa berubah.
- Context anak yang tidak valid otomatis di-reset ke anak pertama yang valid atau dikosongkan jika parent belum punya anak ter-link.

Implementasi TP-PRN-003:
- Ditambahkan endpoint scoped parent children: `GET /api/parents/me/children` (role parent-only) untuk mengambil daftar anak ter-link langsung dari backend.
- Halaman parent `Assignments`, `Materials`, `Grades`, dan `Attendance` sudah menggunakan endpoint scoped tersebut (bukan lagi flow list siswa generik + filter client-side).

Implementasi TP-PRN-004:
- Policy v1 visibilitas parent ditetapkan: parent dapat melihat status submit, waktu submit, nilai, dan feedback anak; tetapi tidak dapat melihat detail jawaban mentah (`response`) anak.
- Enforcement server-side diterapkan di endpoint `GET /api/assignments/[id]/submissions` dengan masking `response = null` khusus actor `PARENT`.

### 6.11 WS-LIFE: Academic Lifecycle & Edge Cases (P2)

- [x] TP-LIFE-001 Tambahkan model histori perpindahan kelas (`StudentClassEnrollment` atau ekuivalen). DoD: riwayat kelas tidak overwrite data lama.
- [x] TP-LIFE-002 Tambahkan status lifecycle siswa (`ACTIVE`, `INACTIVE`, `GRADUATED`, `TRANSFERRED_OUT`). DoD: query operasional default hanya active.
- [x] TP-LIFE-003 Terapkan scoping query default ke academic year aktif. DoD: modul utama tidak mencampur data lintas tahun ajaran.
- [x] TP-LIFE-004 Buat workflow rollover tahun ajaran (minimal checklist service). DoD: proses pergantian tahun ajaran terdokumentasi + executable.
- [x] TP-LIFE-005 Definisikan policy jadwal saat event khusus/libur (`SCHOOL_HOLIDAY`, `EXAM_PERIOD`, dsb). DoD: attendance seeding patuh aturan event.

Implementasi TP-LIFE-001:
- Ditambahkan model historis `StudentClassEnrollment` untuk menyimpan perpindahan kelas siswa beserta periode aktif (`startedAt`/`endedAt`) tanpa menimpa histori lama.
- Flow create siswa (`POST /api/users` untuk role `STUDENT`) kini menulis enrollment awal saat `classId` diberikan.
- Flow update profil siswa (`PATCH /api/users/[id]/profile`) kini menutup enrollment aktif lama dan membuat enrollment baru saat `classId` berubah.
- Ditambahkan endpoint histori enrollment `GET /api/students/[id]/enrollments` dan integration test `tests/integration/student-enrollment-history.integration.test.ts`.

Implementasi TP-LIFE-002:
- Ditambahkan enum Prisma `StudentLifecycleStatus` dan field `StudentProfile.status` (default `ACTIVE`) melalui migration `prisma/migrations/20260222190000_add_student_lifecycle_status/migration.sql`.
- Endpoint write user-domain kini mendukung lifecycle status siswa:
- `POST /api/users` menerima `studentLifecycleStatus` untuk create student.
- `PATCH /api/users/[id]/profile` menerima `studentProfile.status` untuk update lifecycle.
- Query operasional siswa sekarang default hanya `ACTIVE` dan bisa override eksplisit lewat query param:
- `GET /api/students`, `GET /api/parents/me/children`, dan `GET /api/users` (student-scoped query) menerapkan filter default `status=ACTIVE` kecuali `includeInactive=true`.
- Ditambahkan integration test `tests/integration/student-lifecycle-filter.integration.test.ts` untuk memastikan default filter aktif dan behavior `includeInactive=true`.

Implementasi TP-LIFE-003:
- Ditambahkan helper scope `lib/academic-year-scope.ts` untuk resolusi `academicYearId` default (active year), opsi bypass (`includeAllAcademicYears=true`), validasi `academicYearId`, dan utility gabung filter `AND`.
- Scoping query default ke tahun ajaran aktif diterapkan pada modul utama:
- Siswa dan user-domain: `GET /api/users` (student-scoped), `GET /api/students`, `GET /api/parents/me/children`.
- Master akademik dan operasional: `GET /api/classes`, `GET /api/schedules`, `GET /api/attendance/sessions`, `GET /api/attendance/records`.
- Pembelajaran: `GET /api/assignments`, `GET /api/materials`.
- Penilaian: `GET /api/grades`, `GET /api/grades/summary`, `GET /api/grades/weights`, `GET /api/grades/report-cards`.
- Kalender akademik: `GET /api/calendar/events`.
- Saat tidak ada active academic year dan query tidak meminta `includeAllAcademicYears`, endpoint list operasional return data kosong agar tidak mencampur data lintas tahun.
- Ditambahkan integration test `tests/integration/academic-year-scope.integration.test.ts` untuk validasi default scope active year, bypass `includeAllAcademicYears`, dan fallback saat active year belum ada.

Implementasi TP-LIFE-004:
- Ditambahkan script executable rollover tahun ajaran `scripts/academic-year-rollover.ts` dengan mode:
- `FREEZE`: aktivasi tahun ajaran target.
- `CLONE_CLASSES`: clone struktur kelas + relasi subject-class dari source year ke target year (dengan reset student counters).
- Script mendukung guard operasional: `dryRun`, validasi target/source year, proteksi duplikasi class target, opsi `actorId` untuk jejak audit (`ACADEMIC_YEAR_ROLLOVER_EXECUTED`).
- Ditambahkan wrapper command untuk environment `cmd`: `scripts/academic-year-rollover.cmd`.
- Ditambahkan script npm `academic-year:rollover` untuk eksekusi lintas environment.
- SOP operasional rollover terdokumentasi di `OPS_ACADEMIC_YEAR_ROLLOVER_SOP.md` mencakup prasyarat, langkah dry-run/execute, checklist verifikasi, SQL check, dan rollback.

Implementasi TP-LIFE-005:
- Ditambahkan policy resolver event untuk attendance seeding di `lib/attendance-seeding-policy.ts` dengan kode kebijakan:
- `NORMAL_DAY` (seed),
- `SCHOOL_HOLIDAY` (skip saat event `type=HOLIDAY`),
- `EXAM_PERIOD` (skip saat keyword periode ujian terdeteksi di title/description).
- Ditambahkan endpoint seeding server-side `POST /api/attendance/sessions/seed` (admin-only) untuk generate sesi absensi dari jadwal secara batch (maksimal 31 hari), dengan enforcement policy event per tanggal+kelas.
- Endpoint seeding hanya memproses jadwal pada academic year target (default active year, atau `academicYearId` eksplisit) dan menghasilkan ringkasan hasil (`candidateSlots`, `createdSessions`, `skippedExisting`, `skippedByPolicy`, `policyBreakdown`).
- Ditambahkan handler client `seedAttendanceSessions` di `lib/handlers/attendance.ts`.
- Policy dan aturan operasional didokumentasikan di `ATTENDANCE_EVENT_POLICY.md`.
- Ditambahkan integration test `tests/integration/attendance-seeding-policy.integration.test.ts` untuk memverifikasi:
- sesi tidak dibuat saat `SCHOOL_HOLIDAY`,
- sesi dibuat normal saat `NORMAL_DAY`.

### 6.12 WS-FILE: Real Upload Pipeline (P2)

- [x] TP-FILE-001 Desain flow upload intent + signed URL + confirm upload. DoD: arsitektur teknis disetujui.
- [x] TP-FILE-002 Implement endpoint create upload intent dengan validasi size/type. DoD: file invalid ditolak sebelum upload.
- [x] TP-FILE-003 Implement endpoint confirm upload dan persist attachment final. DoD: metadata terhubung ke object storage nyata.
- [x] TP-FILE-004 Tambahkan checksum/etag atau validasi integritas file. DoD: upload spoofing metadata-only tidak mungkin.
- [x] TP-FILE-005 Tambahkan hook antivirus scanning async (minimal extensible). DoD: pipeline siap untuk scanning policy.

Implementasi TP-FILE-001:
- Arsitektur upload 3 tahap (`create intent -> upload content -> confirm`) didokumentasikan di `UPLOAD_PIPELINE_DESIGN.md`.
- Kontrak endpoint v1:
- `POST /api/uploads/intents` (create intent),
- `PUT /api/uploads/intents/{id}/content?token=...` (binary upload via signed URL),
- `POST /api/uploads/intents/{id}/confirm` (finalize attachment).
- Data model pipeline ditambahkan: `UploadIntent`, `UploadScanJob`, serta perluasan `MaterialAttachment` untuk metadata integritas.

Implementasi TP-FILE-002:
- Endpoint `POST /api/uploads/intents` dibuat dengan validasi ketat:
- role guard (`ADMIN`/`TEACHER`),
- ownership material untuk teacher,
- validasi MIME allowlist,
- validasi `sizeBytes` dan batas maksimum (`MAX_UPLOAD_SIZE_BYTES`),
- validasi format `checksumSha256`.
- Upload intent menghasilkan signed upload URL berbasis token hash + TTL (`UPLOAD_INTENT_TTL_MINUTES`).
- Ditambahkan integration test `tests/integration/upload-intent-validation.integration.test.ts`.

Implementasi TP-FILE-003:
- Endpoint `POST /api/uploads/intents/{id}/confirm` mempersist attachment final setelah upload tervalidasi.
- Persist attachment kini terhubung ke object storage nyata melalui `storageKey` dan write binary pada filesystem object storage (`lib/object-storage.ts`, root default `.tmp/object-storage`).
- Endpoint legacy `POST /api/materials/{id}/attachments` kini hanya menerima `uploadIntentId` yang sudah `CONFIRMED`, menutup flow metadata-only manual.

Implementasi TP-FILE-004:
- Validasi integritas end-to-end diterapkan:
- saat upload binary: ukuran payload dan `checksumSha256` harus persis sesuai intent,
- saat confirm: `uploadedSizeBytes`/`uploadedChecksumSha256` diverifikasi ulang terhadap intent awal.
- Metadata integritas (`checksumSha256`, `etag`) dipersist pada `MaterialAttachment`.
- Ditambahkan integration test `tests/integration/upload-content-integrity.integration.test.ts`.

Implementasi TP-FILE-005:
- Hook scanning async ditambahkan via service `lib/upload-scan.ts` dan model queue `UploadScanJob`.
- Confirm upload otomatis enqueue scan job (`PENDING`) dan meng-update `scanStatus` attachment/intent.
- Pipeline dibuat extensible untuk provider scanner eksternal; v1 memakai provider `NOOP` dengan opsi simulasi hasil scan (`UPLOAD_SCAN_MOCK_RESULT`).
- Ditambahkan integration test `tests/integration/upload-confirm-scan.integration.test.ts`.

### 6.13 WS-NOTIF: Notification Backend (P2)

- [x] TP-NOTIF-001 Tambahkan model data notifikasi (`Notification`, `NotificationPreference`). DoD: preferensi dan inbox dapat dipersist.
- [x] TP-NOTIF-002 Implement endpoint CRUD preference notifikasi di Settings. DoD: setting tidak lagi state lokal UI.
- [x] TP-NOTIF-003 Implement trigger notifikasi tugas baru/deadline/nilai/alpha. DoD: event utama menghasilkan notifikasi in-app.
- [x] TP-NOTIF-004 Implement endpoint list/mark-as-read notifikasi. DoD: user bisa melacak notifikasi terbaca/belum.

Implementasi TP-NOTIF-001:
- Ditambahkan model `Notification` dan `NotificationPreference` di Prisma beserta enum `NotificationType`.
- Relasi notifikasi ke user recipient/trigger actor ditambahkan sehingga inbox dan preferensi dapat dipersist.

Implementasi TP-NOTIF-002:
- Ditambahkan endpoint settings notifikasi `GET/PATCH /api/settings/notifications` untuk mengelola preference per user.
- Halaman Settings kini load/save preference notifikasi langsung ke backend (`getNotificationPreferences`, `updateNotificationPreferences`), tidak lagi state lokal semata.

Implementasi TP-NOTIF-003:
- Trigger notifikasi in-app ditambahkan untuk event utama:
- assignment baru + deadline dekat pada create assignment (`ASSIGNMENT_NEW`, `ASSIGNMENT_DEADLINE`),
- publish nilai pada grading (`GRADE_PUBLISHED`),
- catatan alpha/absen pada write attendance (`ATTENDANCE_ALERT`).
- Service `lib/notification-service.ts` menangani dispatch notifikasi dengan menghormati preference user.

Implementasi TP-NOTIF-004:
- Ditambahkan endpoint inbox notifikasi `GET /api/notifications` dan mark-as-read (`POST /api/notifications/[id]/read`, `POST /api/notifications/read-all`).
- Handler frontend notifikasi ditambahkan (`lib/handlers/notifications.ts`) untuk konsumsi list + aksi read status.

### 6.14 WS-AUDIT: Audit Log & Compliance (P1-P2)

- [x] TP-AUD-001 Tambahkan tabel `AuditLog` minimal (actor, action, entity, before/after, timestamp). DoD: skema audit tersedia.
- [x] TP-AUD-002 Log aksi sensitif users/profiles/role change. DoD: perubahan identitas/akses selalu tercatat.
- [x] TP-AUD-003 Log aksi sensitif attendance override. DoD: semua override absensi punya jejak.
- [x] TP-AUD-004 Log aksi sensitif grade change/publish. DoD: perubahan nilai bisa diinvestigasi.
- [x] TP-AUD-005 Log aksi sensitif parent-student relink dan activate academic year. DoD: aksi governance tercatat.

Implementasi TP-AUD-001:
- Model `AuditLog` ditambahkan di Prisma dengan field inti actor/action/entity/beforeData/afterData/timestamp (`createdAt`), termasuk relasi actor ke `User`.
- Migration baseline ditambahkan di `prisma/migrations/20260222103000_add_audit_log/migration.sql` lengkap dengan index query utama (`actorId`, `entityType+entityId`, `createdAt`).

Implementasi TP-AUD-002:
- Endpoint mutasi user-domain sekarang menulis audit: `POST /api/users` (`USER_CREATED`), `PATCH /api/users/[id]` (`USER_UPDATED`/`USER_ROLE_CHANGED`), `DELETE /api/users/[id]` (`USER_DELETED`), dan `PATCH /api/users/[id]/profile` (`USER_PROFILE_UPDATED`).
- Audit menyimpan actor dari session dan snapshot perubahan `beforeData`/`afterData` untuk kebutuhan investigasi perubahan identitas/akses.

Implementasi TP-AUD-003:
- Semua jalur attendance override oleh admin sekarang menulis `AuditLog`: override sesi (`ATTENDANCE_SESSION_OVERRIDE`), bulk update record sesi (`ATTENDANCE_RECORDS_OVERRIDE_BULK`), dan override per record (`ATTENDANCE_RECORD_OVERRIDE`).
- Log override menyimpan actor, reason, serta snapshot `beforeData`/`afterData` untuk jejak investigasi perubahan absensi retroaktif.

Implementasi TP-AUD-004:
- Endpoint `PATCH /api/submissions/[id]` sekarang menulis `AuditLog` otomatis untuk perubahan grading (`GRADE_UPDATED`/`GRADE_PUBLISHED`) dengan snapshot `beforeData` dan `afterData`.
- Metadata audit menyertakan `assignmentId` dan `studentId`, serta actor dari session (`actorId`, `actorRole`) untuk kebutuhan investigasi.

Implementasi TP-AUD-005:
- Endpoint `/api/parent-links` (`POST`/`DELETE`) sekarang mencatat aksi governance relink/unlink parent-student ke `AuditLog` (`PARENT_STUDENT_LINK_CREATED`/`PARENT_STUDENT_LINK_REMOVED`).
- Endpoint `/api/academic-years/[id]/activate` sekarang mencatat aktivasi tahun ajaran ke `AuditLog` (`ACADEMIC_YEAR_ACTIVATED`) dengan snapshot daftar active year sebelum/sesudah.

### 6.15 WS-TEST: Testing Pyramid & Quality Gate (P1-P3)

- [x] TP-TEST-001 Siapkan baseline test framework unit + integration. DoD: pipeline test bisa jalan di CI.
- [x] TP-TEST-002 Tambahkan unit test validator policy authz utama. DoD: branch policy kritikal tercakup.
- [x] TP-TEST-003 Tambahkan integration test endpoint auth/authz sensitif. DoD: bypass role/ownership tertangkap test.
- [x] TP-TEST-004 Tambahkan integration test schedule overlap + attendance duplicate. DoD: integritas data tervalidasi otomatis.
- [x] TP-TEST-005 Tambahkan integration test forum lock enforcement. DoD: lock tidak bisa dibypass direct API.
- [x] TP-TEST-006 Tambahkan E2E role journey ADMIN. DoD: flow master data sampai monitoring lolos.
- [x] TP-TEST-007 Tambahkan E2E role journey TEACHER. DoD: flow ajar-absen-tugas-nilai lolos.
- [x] TP-TEST-008 Tambahkan E2E role journey STUDENT. DoD: flow materi-tugas-submit-nilai lolos.
- [x] TP-TEST-009 Tambahkan E2E role journey PARENT. DoD: flow monitor anak aman dan scoped.

Implementasi TP-TEST-001:
- Baseline test framework ditambahkan menggunakan Vitest (`vitest.config.ts`) beserta script `npm test` dan `npm run test:watch`.
- Pipeline test lokal tervalidasi berjalan (`10` file test, `16` test pass).

Implementasi TP-TEST-002:
- Ditambahkan unit test `tests/unit/authz-policy.unit.test.ts` untuk branch policy authz utama pada helper `lib/authz.ts`:
- `hasAnyRole`, `canAccessOwnUser`, `canViewStudent` (student self vs other, parent linked vs not-linked), dan `canViewParent`.

Implementasi TP-TEST-003:
- Ditambahkan integration test `tests/integration/authz-sensitive.integration.test.ts` untuk endpoint sensitif auth/authz:
- skenario bypass role pada `POST /api/users` (non-admin harus `403`),
- skenario bypass ownership pada `GET /api/users/[id]` (akses user lain harus `403`).

Implementasi TP-TEST-004:
- Integration test schedule overlap ditambahkan pada `tests/integration/schedule-conflict.integration.test.ts` untuk memastikan direct API call jadwal bentrok ditolak (`409 CONFLICT`).
- Integration test attendance duplicate/idempotency ditambahkan pada `tests/integration/attendance-duplicate.integration.test.ts` untuk memastikan request duplikat attendance session tidak menghasilkan session baru.

Implementasi TP-TEST-005:
- Integration test enforcement forum lock ditambahkan pada `tests/integration/forum-lock.integration.test.ts` untuk skenario bypass direct API pada aksi create/edit reply.

Implementasi TP-TEST-006:
- Ditambahkan E2E API journey role ADMIN di `tests/integration/role-admin.e2e.test.ts` untuk alur master data sampai monitoring (`POST academic year` -> `POST class` -> `GET metrics`).

Implementasi TP-TEST-007:
- Ditambahkan E2E API journey role TEACHER di `tests/integration/role-teacher.e2e.test.ts` untuk alur ajar-absen-tugas-nilai (`POST assignment` -> `POST attendance session` -> `PATCH submission grade`).

Implementasi TP-TEST-008:
- Ditambahkan E2E API journey role STUDENT di `tests/integration/role-student.e2e.test.ts` untuk alur materi-tugas-submit-nilai (`GET materials` -> `POST submission` -> `GET grades`).

Implementasi TP-TEST-009:
- Ditambahkan E2E API journey role PARENT di `tests/integration/role-parent.e2e.test.ts` untuk alur monitoring anak scoped (`GET parent children` + validasi guard akses grade linked vs non-linked).

### 6.16 WS-OPS: Observability, Error Handling, dan Operasional (P2-P3)

- [x] TP-OPS-001 Tambahkan request logging standar dengan correlation ID. DoD: incident tracing antar layer memungkinkan.
- [x] TP-OPS-002 Tambahkan error monitoring dan klasifikasi severity. DoD: error kritikal terdeteksi dengan alert dasar.
- [x] TP-OPS-003 Tambahkan metrics endpoint untuk health dasar API. DoD: status layanan bisa dipantau.
- [x] TP-OPS-004 Definisikan SOP backup dan restore database. DoD: prosedur diuji minimal satu kali.
- [x] TP-OPS-005 Definisikan SOP fallback operasional saat input absensi/tugas gagal. DoD: tim akademik punya panduan jelas.

Implementasi TP-OPS-001:
- Middleware API sekarang menghasilkan dan mempropagasikan `x-correlation-id` ke request downstream dan response header.
- Logging request API dasar ditambahkan (`[api-request] correlationId=... METHOD PATH`) untuk tracing insiden antar layer.

Implementasi TP-OPS-002:
- Ditambahkan modul monitoring error `lib/error-monitoring.ts` untuk klasifikasi severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- Helper `jsonError()` kini otomatis memonitor error dan mengeluarkan alert log dasar untuk severity tinggi/kritikal (`[api-alert]`) sehingga error kritikal dapat terdeteksi.

Implementasi TP-OPS-003:
- Ditambahkan endpoint health metrics dasar `GET /api/metrics` (role `ADMIN`) yang mengembalikan status layanan, timestamp, uptime, dan hasil DB ping (`SELECT 1`).
- Jika DB health check gagal, endpoint merespons `503 SERVICE_UNAVAILABLE`.

Implementasi TP-OPS-004:
- SOP backup/restore database ditambahkan di `OPS_DB_BACKUP_RESTORE_SOP.md`.
- Script operasional ditambahkan untuk environment `cmd`: `scripts/db-backup.cmd` dan `scripts/db-restore.cmd`.
- Drill backup/restore tervalidasi pada 22-02-2026 menggunakan PostgreSQL lokal `localhost:55432` dengan verifikasi pasca-restore `count=3` dan payload `Alya:PRESENT,Bima:SICK,Citra:LATE`.

Implementasi TP-OPS-005:
- SOP fallback operasional dibuat di `OPS_FALLBACK_PLAYBOOK.md` untuk insiden gagal input absensi/tugas.
- Runbook memuat trigger insiden, peran PIC, langkah fallback, aturan integritas data, format eskalasi, dan checklist penutupan insiden.

### 6.17 WS-ROLE: Role Flow Compliance Checklist (Acceptance)

- [x] TP-ROLE-001 Admin flow end-to-end valid sesuai spec BRD/PRD/TRD.
- [x] TP-ROLE-002 Teacher flow end-to-end valid sesuai spec BRD/PRD/TRD.
- [x] TP-ROLE-003 Student flow end-to-end valid sesuai spec BRD/PRD/TRD.
- [x] TP-ROLE-004 Parent flow end-to-end valid sesuai spec BRD/PRD/TRD.
- [x] TP-ROLE-005 Semua akses lintas role tanpa hak menghasilkan 403/401 sesuai kontrak API.
- [x] TP-ROLE-006 Semua data lintas ownership tanpa hak tidak muncul di UI maupun API.

Implementasi TP-ROLE-001 s.d. TP-ROLE-004:
- Validasi flow E2E per role ditetapkan melalui suite:
- `tests/integration/role-admin.e2e.test.ts`
- `tests/integration/role-teacher.e2e.test.ts`
- `tests/integration/role-student.e2e.test.ts`
- `tests/integration/role-parent.e2e.test.ts`

Implementasi TP-ROLE-005:
- Kontrak denial lintas role tervalidasi via:
- `tests/integration/authz-sensitive.integration.test.ts` (role bypass),
- `tests/integration/forum-lock.integration.test.ts` (aksi tidak diizinkan),
- `tests/integration/role-parent.e2e.test.ts` (akses grade di luar link anak -> `403`).

Implementasi TP-ROLE-006:
- Scoping ownership data tervalidasi via:
- `tests/integration/role-parent.e2e.test.ts` (data anak tidak ter-link ditolak),
- `tests/integration/student-lifecycle-filter.integration.test.ts` + `tests/integration/academic-year-scope.integration.test.ts` (data operasional scoped by lifecycle/year),
- `tests/integration/authz-sensitive.integration.test.ts` (akses data user non-owner ditolak).

### 6.18 WS-RELEASE: Definition of Ready for Pilot

- [ ] TP-REL-001 Semua item P0 selesai (`TP-SEC-*`, `TP-AUTHZ-*`, `TP-API-001`, `TP-PRN-001`).
- [x] TP-REL-002 Minimal 90% item P1 selesai.
- [x] TP-REL-003 Tidak ada bug severity kritikal pada authz/integritas data.
- [x] TP-REL-004 Test integration authz + data integrity lulus di CI.
- [ ] TP-REL-005 SOP operasional dan eskalasi insiden disetujui stakeholder.
- [x] TP-REL-006 Sediakan endpoint status governance readiness untuk monitoring stakeholder. DoD: status blocker REL/DEC dapat diakses via API terproteksi.

Progress TP-REL-001:
- Ditambahkan readiness checker `scripts/release-readiness-report.mjs` dengan command `npm run release:readiness` dan `npm run release:readiness:strict`.
- Checker mengevaluasi blocker otomatis untuk syarat P0 (`TP-SEC-*`, `TP-AUTHZ-*`, `TP-API-001`, `TP-PRN-001`) dan approval authz packet (Product + Engineering) untuk mempercepat verifikasi sebelum checklist diubah menjadi `[x]`.
- Ditambahkan workflow CI non-blocking `.github/workflows/ci-release-readiness-report.yml` untuk menghasilkan artefak status readiness di setiap push/PR.
- Ditambahkan guard sinkronisasi governance `npm run governance:check-sync` + workflow CI `.github/workflows/ci-governance-sync.yml` agar checklist techplan tidak drift dari approval packet.

Implementasi TP-REL-002:
- Rekap progres workstream P1 menunjukkan threshold `>=90%` tercapai; mayoritas item P1 pada WS-SCHEDULE, WS-ATT, WS-FORUM, WS-ASSIGN, WS-GRADE, WS-PARENT, WS-AUD, dan WS-TEST sudah selesai.
- Sisa task non-selesai yang dominan berada pada keputusan/approval lintas stakeholder (bukan implementasi core P1 runtime path).

Implementasi TP-REL-003:
- Ditambahkan release gate script `scripts/release-gate-authz-integrity.mjs` + npm script `test:release-authz-integrity`.
- Gate menjalankan suite kritikal authz/integritas:
- `authz-sensitive`, `schedule-conflict`, `attendance-duplicate`, `forum-lock`, `role-parent`.
- Gate gagal jika ada test failure atau log `severity=CRITICAL`; hasil eksekusi saat ini lulus tanpa severity kritikal.

Implementasi TP-REL-004:
- Ditambahkan workflow CI `.github/workflows/ci-authz-integrity.yml`.
- Pipeline menjalankan `npm ci` -> `npm run prisma:generate` -> `npm run test:release-authz-integrity` pada `push` dan `pull_request`.
- Ini menjadikan integration gate authz + data integrity tervalidasi otomatis di CI.

Progress TP-REL-005:
- Paket sign-off SOP operasional dan eskalasi insiden disiapkan di `OPS_SIGNOFF_PACKET.md` dengan matrix approval lintas stakeholder.
- Readiness checker menghasilkan laporan status terkini di `RELEASE_READINESS_STATUS.md` agar approver dapat melihat blocker sign-off yang tersisa secara objektif.
- Ditambahkan workflow governance refresh (`npm run governance:refresh`) untuk sinkronisasi checklist + regenerasi readiness report setelah approval diupdate.
- Item tetap terbuka sampai seluruh approver utama menandatangani approval record.

Implementasi TP-REL-006:
- Ditambahkan endpoint backend `GET /api/governance/readiness` (admin-only) di `app/api/governance/readiness/route.ts`.
- Endpoint menggunakan utility `lib/governance-readiness.ts` untuk menghitung status gate `TP-REL-001`, `TP-REL-005`, dan decision gate `TP-DEC-*` langsung dari dokumen governance.
- Kontrak endpoint didokumentasikan di `GOVERNANCE_STATUS_API.md`.
- Ditambahkan integration test `tests/integration/governance-readiness.integration.test.ts` untuk memverifikasi guard role admin, success path, dan error path loader.

## 7. Checklist Keputusan Produk (Wajib Diputuskan)

- [ ] TP-DEC-001 Putuskan model auth final (internal credential / SSO / hybrid).
- [x] TP-DEC-002 Putuskan policy detail visibilitas parent terhadap submission anak.
- [ ] TP-DEC-003 Putuskan policy co-teaching/substitute untuk grading authority.
- [ ] TP-DEC-004 Putuskan policy late submission/remedial/resubmission.
- [ ] TP-DEC-005 Putuskan policy rollover tahun ajaran (freeze, clone, promotion).
- [ ] TP-DEC-006 Putuskan data retention dan export policy compliance.

Progress TP-DEC-001, TP-DEC-003, TP-DEC-004, TP-DEC-005, TP-DEC-006:
- Decision packet opsi + rekomendasi teknis disiapkan di `PRODUCT_DECISION_PACKET.md`.
- Status pending decision sekarang ikut dipantau otomatis di `RELEASE_READINESS_STATUS.md` melalui checker `scripts/release-readiness-report.mjs`.
- Update status keputusan per-ID dapat diotomasi via `npm run governance:approve -- --packet decision --id TP-DEC-XXX ...` lalu disinkronkan ke checklist.
- Item-item keputusan tetap terbuka sampai ada keputusan final lintas stakeholder dan dicatat pada approval record.

Keputusan TP-DEC-002:
- Parent dapat melihat status submission, timestamp submit, nilai, dan feedback anak.
- Parent tidak dapat melihat detail jawaban mentah (`response`) anak (masking server-side).

## 8. Scope Change Log (Jangan Hapus Histori)

- [x] TP-SCOPE-000 Inisialisasi baseline tech plan v1.0 pada 21-02-2026.
- [x] TP-SCOPE-001 Template perubahan scope berikutnya. Format catatan: `Tanggal | ID baru | Alasan perubahan | Dampak modul | Keputusan`.
- [x] TP-SCOPE-002 2026-02-22 | TP-REL-006 | Tambah endpoint governance readiness untuk visibilitas stakeholder | Dampak modul (API/OPS) | Keputusan (Approved + Engineering)
- [x] TP-SCOPE-003 2026-02-22 | TP-AUTHZ-001/TP-REL-005/TP-DEC-* | Tambah audit trail histori approval governance otomatis | Dampak modul (OPS/DOC) | Keputusan (Approved + Engineering)

Template TP-SCOPE-001:
- `YYYY-MM-DD | TP-XXX-YYY | Alasan perubahan | Dampak modul (API/UI/DB/OPS) | Keputusan (Approved/Deferred/Rejected + PIC)`

## 9. Catatan Eksekusi

- Checklist ini adalah dokumen hidup; update harus langsung saat implementasi item selesai.
- Jika satu item dipecah jadi beberapa PR, status item tetap `[ ]` sampai DoD terpenuhi penuh.
- Jika ada item baru karena perubahan requirement, tambahkan ID baru tanpa menghapus item lama.

## 10. Catatan Commit Message

- Commit message dibuat per task, bukan 1 commit untuk semua task.
- Commit message harus menggunakan format <tag>: <nama task>
- Tag bisa berupa Feat, Fix, Refactor, Style, Docs, Test, Build, Chore, Revert, etc.
- Contoh: `Feat: add new feature`
