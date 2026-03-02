# Schoolie Gap & Edge Case Analysis
**Role perspective:** Business Analyst + Senior Developer  
**Basis review:** `overview.md` (Sekolah Pintar / Schoolie as-is audit)  
**Tanggal analisis:** 2026-02-21

---

## 1) Executive Summary (Straight to the point)

Schoolie sudah **sangat kuat sebagai demo end-to-end** untuk operasional sekolah (admin–guru–siswa–orang tua) dan scope fiturnya luas.  
Masalah utamanya bukan kekurangan fitur, tapi **fondasi production readiness**:

1. **Security & authorization belum ada di backend**
2. **Data integrity rules masih banyak di UI**
3. **Policy sekolah (siapa boleh lihat/ubah apa) belum dipaksa di server**
4. **Operasional nyata sekolah punya edge cases** yang belum terlihat di flow normal

Kalau dipaksa produksi sekarang, risikonya bukan “UI kurang lengkap”, tapi:
- kebocoran data siswa,
- manipulasi nilai/absensi via direct API call,
- data duplikat/inkonsisten,
- konflik proses akademik saat kondisi non-ideal (guru pengganti, pindah kelas, remedial, dll).

---

## 2) What Already Exists (Strengths You Should Keep)

Berdasarkan overview saat ini, fondasi yang **layak dipertahankan**:
- Coverage modul luas: users, classes, subjects, schedules, attendance, materials, assignments, bank soal, grades, forum, notes, calendar, settings.
- Role-based UX sudah dirancang (ADMIN/TEACHER/STUDENT/PARENT).
- Domain model relational (Prisma + PostgreSQL) sudah kaya dan cukup serius.
- API pattern sudah konsisten (`{data}` / `{error}`).
- Ada pemisahan route UI, handler, API route, schema/validation.
- Banyak flow bisnis sekolah sudah dipetakan (assignment lifecycle, attendance, parent monitoring).

**Kesimpulan BA/Dev:**  
Ini bukan project “masih ide”. Ini sudah masuk fase **hardening & policy enforcement**, bukan fase brainstorming fitur dasar.

---

## 3) Root Problem Framing (As-Is vs Target)

### As-Is (realita sekarang)
- UI sudah kaya fitur
- API masih “percaya client”
- Validasi bisnis penting masih dilakukan di client
- Mode demo behavior (debug access, impersonation) bercampur dengan struktur yang mirip production

### Seharusnya (target produksi)
- UI hanya presentasi + input
- API jadi sumber kebenaran (source of truth)
- Semua rule akses & rule bisnis dipaksa di server
- Data actor (siapa yang melakukan aksi) selalu dari session, bukan payload
- Ada auditability (siapa ubah apa, kapan)

### Implikasi teknis
Refactor terbesar bukan bikin halaman baru, tapi:
- **Authorization architecture**
- **Business invariants**
- **Data lifecycle policy**
- **Observability + audit trail**

---

## 4) Gap Analysis Matrix (Situasi Saat Ini vs Seharusnya vs Solusi Teknis)

> Format utama yang kamu minta: **situasi saat ini**, **seharusnya**, **solusi teknis**

## 4.1 Auth & Authorization

### Gap A1 — Tidak ada auth/authorization backend
**Situasi saat ini**
- Role aktif ditentukan client-side, debug mode via sessionStorage, dan API belum enforce auth/role secara server-side.

**Seharusnya**
- Semua endpoint sensitif hanya bisa diakses oleh user terautentikasi.
- Role & ownership enforcement wajib di server (bukan hanya di UI).

**Solusi teknis**
- Tambah auth backend (pilih salah satu):
  - **Session-based** (recommended untuk web dashboard internal sekolah)
  - JWT (kalau butuh mobile/API eksternal)
- Tambah middleware route protection (`middleware.ts`) untuk halaman dashboard.
- Di `app/api/*`, gunakan helper standar:
  - `requireAuth()`
  - `requireRole([...])`
  - `assertOwnership(resource, actor)`
- Buat `actorContext` dari session:
  ```ts
  type ActorContext = {
    userId: string;
    role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
    schoolId: string; // future-ready untuk multi-school
    profileId?: string;
  }
  ```
- **Ban** field payload seperti `authorId`, `studentId`, `teacherId` untuk aksi yang identity-nya harus berasal dari session.

---

### Gap A2 — Ownership spoofing lewat payload
**Situasi saat ini**
- Payload bisa mengirim `studentId` / `authorId` / `teacherId`, berpotensi memalsukan identitas actor.

**Seharusnya**
- Actor identity 100% ditentukan server dari session.
- Payload hanya mengirim data bisnis (mis. `content`, `status`, `answers`), bukan identity actor.

**Solusi teknis**
- Redesign DTO endpoint:
  - `POST /submissions` body **tanpa `studentId`**
  - `POST /forum/threads` body **tanpa `authorId`**
  - `POST /teacher-attendance` body **tanpa `teacherId`**
- Mapping actor di server:
  ```ts
  const actor = await requireAuth(req);
  await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: actor.userId } },
    ...
  });
  ```

---

### Gap A3 — Parent/student bisa akses data lintas user/class via direct API
**Situasi saat ini**
- Role enforcement dominan di UI, sehingga request langsung ke API berpotensi membuka data lintas user/class.

**Seharusnya**
- Parent hanya bisa melihat data anak yang linked.
- Student hanya bisa melihat data miliknya sendiri / kelas yang relevan.
- Teacher hanya bisa mengakses kelas/mapel yang diajar (kecuali admin).

**Solusi teknis**
- Buat **Policy Layer** (jangan sebar logic di tiap route):
  - `canViewStudent(actor, studentId)`
  - `canGradeAssignment(actor, assignmentId)`
  - `canReadClass(actor, classId)`
- Query scoping di repository layer:
  - Parent endpoint selalu join `ParentStudent`
  - Teacher endpoint selalu filter via `SubjectTeacher` / `ClassSchedule`
- Default pattern:
  - **deny by default**
  - explicit allow by role + ownership

---

## 4.2 Data Integrity & Business Rule Enforcement

### Gap B1 — Validasi bentrok jadwal hanya di UI
**Situasi saat ini**
- Cek overlap jadwal dilakukan client-side saat create schedule.

**Seharusnya**
- Overlap jadwal dicek server-side agar tidak bisa dibypass.
- Rule harus cover konflik:
  - kelas bentrok
  - guru bentrok
  - ruang bentrok (jika room dipakai)
  - jam tidak valid (`start < end`)
  - duplikasi exact slot

**Solusi teknis**
- Tambah validator server:
  - `validateScheduleTimeRange`
  - `checkScheduleConflict({classId, teacherId, room, dayOfWeek, startTime, endTime})`
- Gunakan transaction saat create/update schedule.
- Tambah index untuk query konflik.
- Pertimbangkan representasi time sebagai menit (`startMinute`, `endMinute`) agar compare lebih mudah/cepat.
- Tambah DB-level constraint minimum:
  - `CHECK (start_time < end_time)` (jika feasible via migration raw SQL)

---

### Gap B2 — Attendance session bisa terduplikasi
**Situasi saat ini**
- Attendance session bisa auto-seeding dari jadwal; tanpa unique key bisnis yang kuat, sesi bisa double-create.

**Seharusnya**
- Satu sesi absensi unik per kombinasi bisnis yang jelas (misalnya per schedule/date/slot).
- Retry request tidak membuat data ganda.

**Solusi teknis**
- Tentukan kebijakan uniqueness (pilih salah satu, konsisten):
  1. `scheduleId + date`
  2. `classId + subjectId + date + startTime + endTime`
  3. `scheduleId + date + sessionIndex` (kalau ada multiple session split)
- Tambah unique constraint Prisma + migration.
- Ubah create flow jadi **idempotent upsert**.
- Tambah `idempotencyKey` opsional untuk endpoint create sesi.

---

### Gap B3 — Forum lock belum enforce di server
**Situasi saat ini**
- UI bisa blokir, tapi server route reply masih bisa menerima request.

**Seharusnya**
- Thread `locked=true` memblokir create/update reply non-admin.
- Policy konsisten di semua endpoint (reply create, edit, upvote jika perlu).

**Solusi teknis**
- Di route reply create/update:
  - Fetch thread status
  - Reject jika locked dan actor bukan admin/moderator
- Tambah centralized forum policy:
  - `assertThreadWritable(actor, thread)`
- Tambah test integration untuk scenario bypass UI.

---

### Gap B4 — Rule bisnis masih tidak konsisten antar endpoint
**Situasi saat ini**
- Sebagian validasi ada di UI, sebagian ada di route, sebagian implied dari flow.

**Seharusnya**
- Rule bisnis penting terdokumentasi dan reusable.
- Semua route pakai validator & policy yang sama.

**Solusi teknis**
- Pisahkan layer:
  - `schemas/` (shape validation / Zod)
  - `policies/` (authorization)
  - `services/` (business use case)
  - `repositories/` (DB query)
- Contoh:
  - `AttendanceService.startSession()`
  - `AssignmentService.submitWork()`
  - `GradeService.publishGrade()`
- Hindari route handler berisi campuran parsing + policy + query + mapping semuanya sekaligus.

---

## 4.3 Real-World School Edge Cases (yang sering bikin sistem sekolah “jebol”)

Bagian ini yang paling penting buat BA, karena flow normal hampir selalu terlihat mulus saat demo.

### Edge Case C1 — Siswa pindah kelas di tengah semester
**Situasi saat ini**
- Ada relasi student ke class, tapi belum terlihat policy historis untuk perpindahan.

**Masalah**
- Nilai, absensi, tugas lama ikut class lama atau pindah?
- Parent monitoring semester berjalan bisa kacau kalau data historis tidak dipisah dari state terbaru.

**Seharusnya**
- Riwayat keanggotaan kelas bersifat historis, bukan overwrite tunggal.

**Solusi teknis**
- Tambah tabel historis misalnya `StudentClassEnrollment`:
  - `studentId`, `classId`, `academicYearId`, `startDate`, `endDate`, `status`
- `StudentProfile.classId` boleh tetap ada sebagai current snapshot, tapi laporan historis harus pakai enrollment history.
- Semua query nilai/absensi pakai tanggal + enrollment history saat generate rapor/rekap.

---

### Edge Case C2 — Guru pengganti / team teaching / co-teaching
**Situasi saat ini**
- Ada indikasi substitute teacher via attendance session, tapi policy akses mapel/kelas belum kuat.

**Masalah**
- Guru pengganti boleh isi absensi saja atau juga grading?
- Co-teacher boleh lihat submission? edit nilai?
- Siapa yang “official teacher of record”?

**Seharusnya**
- Ada policy granular per permission, bukan hanya role `TEACHER`.

**Solusi teknis**
- Tambah concept permission per assignment/schedule:
  - `canTakeAttendance`
  - `canPublishMaterial`
  - `canCreateAssignment`
  - `canGrade`
- Buat assignment/subject teacher relation dengan role:
  - `PRIMARY_TEACHER`, `ASSISTANT_TEACHER`, `SUBSTITUTE`
- Attendance session bisa refer `takenByTeacherId`, tapi grade publish tetap oleh primary/authorized actor.

---

### Edge Case C3 — Tugas terlambat, revisi, remedial, resubmission
**Situasi saat ini**
- Ada status assignment/submission, tapi belum terlihat policy resubmission/remedial.

**Masalah**
- Apakah submit telat diterima?
- Boleh resubmit setelah dinilai?
- Nilai remedial menimpa nilai lama atau jadi nilai baru dengan alasan?

**Seharusnya**
- Submission lifecycle jelas dan audit-able.

**Solusi teknis**
- Tambah field & policy:
  - `allowLateSubmission`
  - `lateUntil`
  - `maxAttempts`
  - `gradingPolicy` (`LATEST`, `HIGHEST`, `MANUAL`)
- Buat versioning submission:
  - `AssignmentSubmissionAttempt`
  - `AssignmentSubmission` jadi summary/latest pointer
- Simpan audit grade change:
  - before/after value, reason, actorId, timestamp

---

### Edge Case C4 — Absensi setelah jam pelajaran lewat (retroactive edit)
**Situasi saat ini**
- Teacher bisa isi absensi sesi; belum terlihat policy lock period.

**Masalah**
- Guru mengubah absensi 2 minggu lalu tanpa jejak.
- Admin koreksi absensi tanpa alasan.
- Rekap bulanan berubah diam-diam.

**Seharusnya**
- Ada cutoff + override policy + audit trail.

**Solusi teknis**
- Tambah status session:
  - `OPEN`, `LOCKED`, `FINALIZED`
- Rule:
  - Teacher bisa edit dalam X jam/hari
  - Setelah itu hanya admin/wali kelas dengan reason wajib
- Simpan `AttendanceRecordAudit` / generic audit log.
- Tambah `overrideReason`, `overriddenBy`, `overriddenAt`.

---

### Edge Case C5 — Orang tua punya lebih dari satu anak (beda kelas, beda jenjang)
**Situasi saat ini**
- Parent memilih anak via dropdown di beberapa modul; ada catatan risk filter parent-child di UI.

**Masalah**
- Potensi kebocoran data jika dropdown load semua siswa.
- UX kacau kalau parent punya 2–3 anak dan state selected child tidak konsisten.

**Seharusnya**
- Semua parent endpoint scoped ke linked children.
- Child context konsisten lintas halaman.

**Solusi teknis**
- Server: endpoint parent return hanya linked students.
- Client: simpan `selectedChildId` per session + validasi belongs-to-parent.
- Tambah endpoint agregat parent:
  - summary semua anak (attendance alerts, tugas overdue, nilai terbaru)
- Jangan pakai `listStudents()` general untuk parent UI.

---

### Edge Case C6 — Tahun ajaran / semester berganti
**Situasi saat ini**
- Ada `AcademicYear` dan activate endpoint, tapi belum terlihat policy freeze data semester lalu.

**Masalah**
- Jadwal lama tercampur dengan tahun baru.
- Assignment/attendance query tanpa `academicYearId` berisiko salah tarik data.
- Report historis jadi ambigu.

**Seharusnya**
- Semua data akademik operasional punya konteks tahun ajaran/semester yang eksplisit (langsung atau turunan relasi).
- Aktivasi tahun ajaran baru memicu workflow rollover.

**Solusi teknis**
- Review semua entitas apakah perlu `academicYearId` (langsung atau via relation):
  - schedules, assignments, attendance sessions, calendar academic events
- Buat “rollover wizard”:
  - clone template jadwal
  - promote kelas (opsional)
  - archive/freeze semester lama
- Query default harus selalu scoped ke active academic year (kecuali admin report historis).

---

### Edge Case C7 — Siswa nonaktif / lulus / pindah sekolah
**Situasi saat ini**
- Belum terlihat status lifecycle user/student yang kaya.

**Masalah**
- Student lama masih muncul di dropdown assignment/attendance
- Parent relation tetap aktif padahal siswa sudah lulus/pindah
- Analitik tercampur

**Seharusnya**
- Lifecycle siswa jelas: `ACTIVE`, `INACTIVE`, `GRADUATED`, `TRANSFERRED_OUT`, dll.

**Solusi teknis**
- Tambah status pada student profile / enrollment.
- Semua query operasional default filter active only.
- Report historis bisa include inactive via explicit filter.
- Parent visibility policy untuk alumni ditentukan product policy (lihat histori vs read-only terbatas).

---

### Edge Case C8 — Jadwal berubah mendadak (event sekolah, ujian, libur, guru rapat)
**Situasi saat ini**
- Ada kalender event & jadwal, tapi belum terlihat collision policy dengan jadwal akademik.

**Masalah**
- Kelas tetap muncul padahal hari libur/event sekolah.
- Absensi auto-seed tetap membuat sesi di hari libur.
- Jadwal ujian/khusus menimpa jadwal reguler.

**Seharusnya**
- Calendar event bisa mempengaruhi operasional (blocking/override) jika tipenya akademik-operasional.

**Solusi teknis**
- Klasifikasi event:
  - `INFORMATIONAL`
  - `SCHEDULE_BLOCKER`
  - `SCHOOL_HOLIDAY`
  - `EXAM_PERIOD`
- Attendance seeding & schedule display harus cek event blocking.
- Tambah precedence rules:
  - holiday > special exam schedule > regular schedule
- Cache invalidation strategy untuk dashboard/jadwal bila event berubah.

---

### Edge Case C9 — Penilaian berbeda per mapel / komponen nilai
**Situasi saat ini**
- Grades ada, tapi belum terlihat rubrik/weighting policy.

**Masalah**
- Nilai tugas, kuis, uts, uas, praktik punya bobot berbeda.
- Guru butuh fleksibilitas, tapi laporan harus konsisten.

**Seharusnya**
- Ada model komponen penilaian + weighting + publish policy.

**Solusi teknis**
- Tambah domain:
  - `GradeComponent` (Homework, Quiz, Exam, Practical)
  - `GradeScheme` per subject/class/semester
- `Assignment.kind` dipetakan ke component
- Summary grade dihitung dari policy, bukan average mentah semua tugas
- Simpan snapshot nilai final saat publish rapor (hindari recalculation drift)

---

### Edge Case C10 — File upload palsu (metadata-only) & keamanan file
**Situasi saat ini**
- Attachment/submission file baru metadata, belum pipeline upload real.

**Masalah**
- User bisa mengirim URL/metadata palsu
- Tidak ada virus scan / file type enforcement
- Link mati / broken assets

**Seharusnya**
- Upload file melalui storage pipeline yang tervalidasi.

**Solusi teknis**
- Flow:
  1. Client minta upload intent
  2. Server validasi type/size
  3. Server buat signed URL
  4. Client upload ke storage
  5. Client confirm upload
  6. Server persist attachment final
- Simpan metadata plus checksum/etag bila memungkinkan.
- Tambah antivirus scanning async (minimal hook queue untuk future).

---

### Edge Case C11 — Concurrency: dua guru/admin edit data yang sama
**Situasi saat ini**
- Belum terlihat mekanisme optimistic locking/versioning.

**Masalah**
- Lost update: nilai/absensi/profile tertimpa tanpa sadar.
- Admin A ubah jadwal, Admin B simpan versi lama -> konflik.

**Seharusnya**
- Ada deteksi konflik untuk entitas penting.

**Solusi teknis**
- Tambah `updatedAt` + `version` (integer) pada entitas kritikal.
- PATCH endpoint menerima `ifMatchVersion` / `updatedAt` check.
- Jika conflict: return `409 CONFLICT`.
- UI tampilkan diff/reload prompt.

---

### Edge Case C12 — Multi-tenant (future roadmap) belum disiapkan
**Situasi saat ini**
- Belum terlihat `schoolId` boundary secara eksplisit di domain inti.

**Masalah**
- Jika nanti support multi-school, refactor akan mahal dan rawan kebocoran data antar sekolah.

**Seharusnya**
- Walau single-school sekarang, boundary tenant mulai dipikirkan.

**Solusi teknis**
- Minimal future-proof:
  - `schoolId` pada entitas root/master
  - `actorContext.schoolId`
  - Semua query scoped by `schoolId`
- Kalau belum implement sekarang, set sebagai **architectural decision record (ADR)** agar tidak lupa.

---

## 4.4 Product & Operational Gaps (Non-security tapi penting)

### Gap D1 — Notification masih placeholder
**Situasi saat ini**
- Notifikasi belum persist/backend-driven.

**Seharusnya**
- Event penting menghasilkan notifikasi yang bisa dilacak & dibaca ulang.

**Solusi teknis**
- Event-driven minimal:
  - `notification_events` table / queue
  - `notifications` table per recipient
- Trigger awal:
  - tugas baru
  - deadline mendekat
  - nilai terbit
  - absensi alpha
- Channel bertahap:
  1. In-app
  2. Email
  3. WA/push (nanti)

---

### Gap D2 — Change password belum backend
**Situasi saat ini**
- Placeholder UI.

**Seharusnya**
- Password management aman dan usable.

**Solusi teknis**
- Endpoint:
  - `POST /api/auth/change-password`
- Rule:
  - verify current password
  - password policy
  - rate limit
  - revoke other sessions (opsional tapi bagus)
- Simpan hash modern (Argon2id atau bcrypt cost memadai).

---

### Gap D3 — Audit log belum ada
**Situasi saat ini**
- Belum ada audit trail terstruktur.

**Seharusnya**
- Aksi sensitif punya jejak lengkap untuk compliance & troubleshooting.

**Solusi teknis**
- Tabel `AuditLog` minimal:
  - `id`, `actorId`, `actorRole`, `action`, `entityType`, `entityId`,
  - `before`, `after`, `reason`, `ip`, `userAgent`, `createdAt`
- Prioritaskan action:
  - grade change
  - attendance override
  - role/profile update
  - parent-student relink
  - academic year activate

---

## 5) Recommended Target Architecture (Pragmatic, not over-engineered)

## 5.1 Layering yang lebih aman
Struktur yang disarankan (tetap cocok dengan Next.js App Router):
- `app/api/...` → transport layer only
- `lib/auth/*` → session & actor context
- `lib/policies/*` → role/ownership checks
- `lib/services/*` → business use cases
- `lib/repositories/*` → Prisma query access
- `lib/schemas/*` → Zod DTO input/output
- `lib/audit/*` → audit logging helper

**Kenapa penting?**  
Karena sekarang problemmu bukan kurang halaman, tapi **konsistensi enforcement**. Tanpa layer ini, bug policy akan berulang di banyak endpoint.

---

## 5.2 Authorization Matrix (harus dibikin eksplisit)
Bikin dokumen matrix per resource, contoh ringkas:

- **Attendance**
  - ADMIN: read/write all
  - TEACHER: write kelas yang diajar / assigned substitute
  - STUDENT: read own only
  - PARENT: read linked child only

- **Assignments**
  - ADMIN: full access
  - TEACHER: create/manage subject-class yang diajar
  - STUDENT: read assigned to own class, submit own only
  - PARENT: read child summary/status (detail jawaban perlu policy)

- **Forum**
  - ADMIN: moderate all
  - TEACHER: create/reply/moderate mapel terkait
  - STUDENT: create/reply mapel/class allowed
  - PARENT: default no access (sesuai product decision saat ini)

> Tanpa matrix tertulis, engineering akan terus “menebak” policy.

---

## 5.3 Typed DTO & error discipline
**Masalah umum yang akan datang:** endpoint dengan payload longgar (`Record<string, unknown>`) sulit diaudit.

**Solusi**
- Semua route:
  - `parseInput(zodSchema)`
  - `authorize(actor, action, resource)`
  - `service.execute(...)`
  - `return ok(data)` / `return error(code, message)`
- Standard error code examples:
  - `UNAUTHORIZED`
  - `FORBIDDEN`
  - `VALIDATION_ERROR`
  - `CONFLICT`
  - `NOT_FOUND`
  - `BUSINESS_RULE_VIOLATION`

---

## 6) Priority Roadmap (Reframed with Implementation Granularity)

## Phase 0 — Stop the bleeding (1–2 minggu)
Tujuan: mencegah exploit paling mudah.
- Disable/guard debug impersonation di non-dev environment
- Tambah auth check minimal di seluruh `/api/*`
- Hapus field actor identity dari payload sensitif
- Parent/student API scoping minimal (own + linked child only)
- Server-side lock forum reply
- Server-side schedule overlap validation (minimal)

**Output:** demo masih jalan, tapi direct API abuse paling obvious tertutup.

---

## Phase 1 — Secure Foundation (2–4 minggu)
- Session/JWT auth final
- `ActorContext` helper
- Policy layer reusable
- Authorization matrix implemented for top 10 endpoint sensitif
- Audit log minimal untuk attendance/grades/users
- Integration tests untuk authz

**Output:** siap pilot terbatas (bukan full rollout massal).

---

## Phase 2 — Data Integrity (3–6 minggu)
- Attendance unique constraint + idempotent create
- Academic year scoping review
- Enrollment history untuk perpindahan kelas
- Concurrency protection untuk entitas kritikal
- Grade policy (minimal komponen & weighting baseline)

**Output:** data lebih konsisten, laporan lebih bisa dipercaya.

---

## Phase 3 — Product Maturity (ongoing)
- Real file upload pipeline
- Notifications backend
- E2E role journeys
- Observability dashboard
- SOP operasional & incident handling

**Output:** siap scaling penggunaan nyata.

---

## 7) Practical Backlog Candidates (Actionable Ticket Ideas)

Berikut contoh tiket yang langsung bisa kamu pecah ke sprint.

### Security / Authz
- [ ] Add `middleware.ts` route protection for `/dashboard`
- [ ] Implement `requireAuth()` helper for API routes
- [ ] Create `ActorContext` from session
- [ ] Remove `authorId` from forum create/update payload DTO
- [ ] Remove `studentId` from submission create payload DTO
- [ ] Implement parent-child ownership guard helper
- [ ] Implement teacher class/subject ownership guard helper
- [ ] Add integration tests for direct API access bypass attempts

### Scheduling / Attendance Integrity
- [ ] Server-side schedule overlap validator (class/teacher/room)
- [ ] Add unique constraint for attendance session business key
- [ ] Convert attendance session create to upsert/idempotent path
- [ ] Add attendance session lock/finalize states
- [ ] Add attendance override reason and audit trail

### Academic Lifecycle
- [ ] Add `StudentClassEnrollment` history table
- [ ] Add student lifecycle status (active/graduated/transferred)
- [ ] Scope default academic queries by active academic year
- [ ] Add academic year rollover checklist endpoint/service

### Assignments / Grading
- [ ] Add late submission policy fields
- [ ] Add resubmission attempt model (or submission versioning)
- [ ] Add grade change audit logging
- [ ] Define grading policy for assignment kinds (baseline config)

### Files / Notifications / Ops
- [ ] Design upload intent + signed URL flow
- [ ] Add `Notification` table + in-app notification API
- [ ] Add request logging and error correlation ID
- [ ] Add smoke E2E for role journeys (admin/teacher/student/parent)

---

## 8) Critical Open Decisions (Product + BA)

Kalau ini tidak diputuskan cepat, engineering bakal ambigu dan implementasi policy jadi bolak-balik.

1. **Auth model final**
   - Internal credentials only?
   - SSO sekolah (Google/Microsoft)?
   - Hybrid?

2. **Parent visibility depth**
   - Hanya status tugas/nilai?
   - Boleh lihat jawaban essay/file submission anak?
   - Boleh lihat forum activity anak?

3. **Teacher permission granularity**
   - Co-teacher/substitute bisa grading atau hanya attendance?
   - Wali kelas punya akses tambahan apa?

4. **Academic policy**
   - Late submission diterima?
   - Remedial overwrite atau separate score?
   - Deadline hard vs soft?

5. **Semester rollover policy**
   - Data lama di-freeze?
   - Jadwal di-clone otomatis?
   - Kelas promoted otomatis atau manual?

6. **Compliance & retention**
   - Berapa lama simpan absensi/nilai/forum?
   - Siapa boleh export data?
   - Audit log retention berapa lama?

---

## 9) Final Assessment (Blunt Version)

### Kekuatan
- Scope fitur kuat dan realistis untuk sekolah.
- Arsitektur dasar modern (Next.js + Prisma + Zod) sudah cocok untuk scale tahap awal.
- Produk sudah cukup matang untuk dipresentasikan dan diuji sebagai prototype operasional.

### Kekurangan paling besar
- **Belum aman untuk production**, terutama karena trust ke client dan role enforcement di UI.
- **Belum kuat menghadapi edge cases sekolah nyata** (perpindahan kelas, remedial, lock absensi, tahun ajaran, concurrency).
- **Belum ada governance trail** (audit log, policy enforcement yang konsisten).

### Rekomendasi keputusan
- Jangan tambah fitur baru dulu (kecuali sangat kecil).
- Fokus 1–2 sprint ke:
  - auth/authz backend,
  - server-side business validation,
  - attendance/schedule integrity,
  - audit logging minimal.

Kalau itu beres, value produkmu akan naik jauh lebih besar daripada nambah 3 fitur baru.

---

## 10) Appendix — Suggested “Definition of Ready for Pilot School”

Gunakan checklist ini sebelum pilot ke sekolah beneran.

### Security & Access
- [ ] Semua endpoint sensitif wajib auth
- [ ] Role + ownership guard minimal untuk attendance/assignments/grades/users
- [ ] Tidak ada actor identity dari payload sensitif
- [ ] Debug impersonation nonaktif di production

### Data Integrity
- [ ] Schedule overlap tervalidasi server-side
- [ ] Attendance session tidak bisa duplikat
- [ ] Forum lock enforce di server
- [ ] Academic year scoping jelas

### Operations
- [ ] Audit log minimal aktif untuk aksi sensitif
- [ ] Error logging tersedia
- [ ] SOP fallback input absensi/tugas ada
- [ ] Backup & restore DB basic procedure ada

### Product Clarity
- [ ] Parent visibility policy diputuskan
- [ ] Late submission/remedial policy diputuskan
- [ ] Guru pengganti/co-teaching policy diputuskan

---

## 11) Note for Next Step (If You Want Me to Continue)

Tahap lanjutan paling efektif setelah dokumen ini:
1. **Bikin Authorization Matrix detail per endpoint** (bisa langsung jadi checklist implementasi)
2. **Bikin ERD change proposal** (enrollment history, audit log, grade policy, notification)
3. **Bikin sprint backlog technical hardening** (estimasi effort + dependency)
4. **Review schema Prisma / route satu-satu** untuk mapping gap → code change
