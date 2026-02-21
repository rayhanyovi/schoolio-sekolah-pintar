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

- [ ] TP-SEC-001 Implement route protection `middleware.ts` untuk `/dashboard` dan route sensitif. DoD: unauthenticated user tidak bisa akses halaman privat.
- [ ] TP-SEC-002 Implement `requireAuth()` helper di API layer. DoD: endpoint sensitif return 401 jika tanpa session/token valid.
- [ ] TP-SEC-003 Implement actor context server-side (`userId`, `role`, `schoolId?`). DoD: seluruh handler sensitif memakai actor context yang sama.
- [ ] TP-SEC-004 Nonaktifkan debug impersonation di environment produksi. DoD: fitur debug hanya aktif di dev/test.
- [x] TP-SEC-005 Tambahkan endpoint login/logout backend final. DoD: flow login tidak bergantung pada sessionStorage role mock.
- [ ] TP-SEC-006 Tambahkan session validation untuk setiap request API sensitif. DoD: request dengan session invalid ditolak konsisten.

### 6.3 WS-AUTHZ: Role & Ownership Authorization (P0)

- [ ] TP-AUTHZ-001 Buat authorization matrix eksplisit per resource dan action. DoD: matrix approved Product + Engineering.
- [ ] TP-AUTHZ-002 Implement `requireRole()` untuk aksi level role (ADMIN/TEACHER/STUDENT/PARENT). DoD: endpoint terproteksi role.
- [ ] TP-AUTHZ-003 Implement ownership guard parent-child (`canViewStudent`). DoD: parent hanya dapat akses anak ter-link.
- [ ] TP-AUTHZ-004 Implement ownership guard student-self data. DoD: student hanya akses data milik sendiri.
- [ ] TP-AUTHZ-005 Implement ownership guard teacher kelas/mapel yang diajar. DoD: teacher tidak bisa mutate data kelas lain.
- [ ] TP-AUTHZ-006 Terapkan deny-by-default pada endpoint yang belum punya policy. DoD: endpoint tanpa policy eksplisit return 403.
- [ ] TP-AUTHZ-007 Audit semua endpoint `app/api/*` untuk policy coverage. DoD: 100% endpoint sensitif terdaftar status policy.

### 6.4 WS-API: DTO Typing, Validation, dan Handler Quality (P0-P1)

- [ ] TP-API-001 Hapus field actor identity dari payload sensitif (`authorId`, `studentId`, `teacherId`). DoD: actor identity hanya dari session.
- [ ] TP-API-002 Standarkan input validation Zod untuk seluruh endpoint write (POST/PATCH/PUT). DoD: invalid payload return 400 + code konsisten.
- [ ] TP-API-003 Implement standard error code (`UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `CONFLICT`, `NOT_FOUND`). DoD: response error seragam lintas route.
- [ ] TP-API-004 Refactor `listClassSubjects` response/payload jadi typed schema. DoD: tidak ada `Record<string, unknown>` pada flow utama.
- [ ] TP-API-005 Refactor `setClassSubjects` payload typed schema. DoD: payload tervalidasi penuh.
- [ ] TP-API-006 Refactor `setSubjectTeachers` payload typed schema. DoD: payload tervalidasi penuh.
- [ ] TP-API-007 Refactor `setSubjectClasses` payload typed schema. DoD: payload tervalidasi penuh.
- [ ] TP-API-008 Hilangkan `any` normalisasi di `lib/handlers/schedules.ts`. DoD: mapper typed + parse schema lulus.
- [ ] TP-API-009 Hilangkan `any` normalisasi di `lib/handlers/materials.ts`. DoD: mapper typed + parse schema lulus.
- [ ] TP-API-010 Tertibkan endpoint profile agar tidak ambil user berdasarkan fallback data pertama. DoD: profile endpoint actor-scoped jelas.

### 6.5 WS-SCHEDULE: Jadwal & Template (P1)

- [ ] TP-SCH-001 Tambahkan server-side validation `startTime < endTime`. DoD: invalid range ditolak di API.
- [ ] TP-SCH-002 Tambahkan server-side overlap validator bentrok kelas. DoD: jadwal bentrok kelas tidak bisa disimpan.
- [ ] TP-SCH-003 Tambahkan server-side overlap validator bentrok guru. DoD: jadwal bentrok guru tidak bisa disimpan.
- [ ] TP-SCH-004 Tambahkan server-side overlap validator bentrok ruang (jika room digunakan). DoD: bentrok ruang ditolak.
- [ ] TP-SCH-005 Tambahkan UI edit schedule templates + integrasi `updateScheduleTemplates`. DoD: admin bisa update template dari Settings.
- [ ] TP-SCH-006 Tambahkan test integrasi untuk bypass validasi jadwal via direct API call. DoD: test gagal jika rule dilanggar.

### 6.6 WS-ATT: Attendance Integrity & Governance (P1)

- [ ] TP-ATT-001 Tetapkan business key unik attendance session. DoD: policy unik disepakati dan terdokumentasi.
- [ ] TP-ATT-002 Tambahkan unique constraint attendance session di Prisma + migration. DoD: duplicate session gagal di DB level.
- [ ] TP-ATT-003 Ubah create attendance session menjadi idempotent upsert. DoD: retry request tidak menghasilkan duplikasi.
- [ ] TP-ATT-004 Tambahkan status sesi absensi (`OPEN`, `LOCKED`, `FINALIZED`). DoD: update mengikuti status policy.
- [ ] TP-ATT-005 Tambahkan cutoff edit absensi untuk teacher + override policy admin. DoD: edit retroaktif mengikuti aturan.
- [ ] TP-ATT-006 Tambahkan `overrideReason`, `overriddenBy`, `overriddenAt`. DoD: semua override tersimpan jejaknya.
- [ ] TP-ATT-007 Tambahkan guard teacher hanya isi absensi kelas yang diajar/substitute authorized. DoD: unauthorized attendance write ditolak.

### 6.7 WS-FORUM: Enforcement & Moderation Integrity (P1)

- [ ] TP-FORUM-001 Enforce `locked thread` di server saat create reply. DoD: reply ke thread locked ditolak untuk non-moderator.
- [ ] TP-FORUM-002 Enforce lock policy pada edit reply dan aksi terkait. DoD: policy lock konsisten di semua endpoint forum.
- [ ] TP-FORUM-003 Validasi role parent tidak bisa akses forum endpoint jika policy final tetap blokir. DoD: parent receive 403.
- [ ] TP-FORUM-004 Tambahkan integration test bypass UI untuk forum lock. DoD: direct API bypass gagal.

### 6.8 WS-ASSIGN: Assignment & Submission Lifecycle (P1-P2)

- [ ] TP-ASG-001 Enforce teacher ownership untuk create/update assignment per mapel/kelas. DoD: teacher lintas kelas tidak bisa mutate.
- [ ] TP-ASG-002 Enforce student ownership untuk submit assignment milik sendiri. DoD: student tidak bisa submit atas nama user lain.
- [ ] TP-ASG-003 Tambahkan policy late submission (`allowLateSubmission`, `lateUntil`). DoD: rule submit telat berjalan sesuai konfigurasi.
- [ ] TP-ASG-004 Tambahkan policy resubmission (`maxAttempts` atau versioning). DoD: percobaan submit mengikuti kebijakan.
- [ ] TP-ASG-005 Definisikan `gradingPolicy` (`LATEST`/`HIGHEST`/`MANUAL`). DoD: perhitungan nilai mengikuti policy aktif.
- [ ] TP-ASG-006 Tambahkan audit jejak perubahan status submission penting. DoD: perubahan kritikal dapat ditelusuri.

### 6.9 WS-GRADE: Grade Policy & Auditability (P1-P2)

- [ ] TP-GRD-001 Tambahkan guard grading: hanya actor authorized bisa publish/ubah nilai. DoD: unauthorized grade mutation ditolak.
- [ ] TP-GRD-002 Tambahkan grade change audit log (before/after, reason, actor). DoD: setiap perubahan nilai punya audit record.
- [ ] TP-GRD-003 Definisikan komponen nilai minimal (`Homework`, `Quiz`, `Exam`, `Practical`). DoD: komponen tersimpan dan dipakai summary.
- [ ] TP-GRD-004 Definisikan bobot nilai per subject/class/semester. DoD: summary grade bukan average mentah.
- [ ] TP-GRD-005 Tambahkan snapshot nilai final saat publish rapor. DoD: histori nilai final tidak berubah oleh recalculation belakangan.

### 6.10 WS-PARENT: Parent Flow & Data Scoping (P0-P1)

- [ ] TP-PRN-001 Pastikan endpoint parent hanya mengembalikan linked children. DoD: tidak ada akses daftar siswa global dari parent context.
- [ ] TP-PRN-002 Validasi `selectedChildId` selalu belongs-to-parent. DoD: child context invalid auto reject/reset.
- [ ] TP-PRN-003 Audit halaman parent yang masih memanggil list siswa generik. DoD: semua diganti endpoint scoped.
- [ ] TP-PRN-004 Definisikan policy visibilitas parent pada detail submission/jawaban anak. DoD: keputusan produk terdokumentasi dan diterapkan.

### 6.11 WS-LIFE: Academic Lifecycle & Edge Cases (P2)

- [ ] TP-LIFE-001 Tambahkan model histori perpindahan kelas (`StudentClassEnrollment` atau ekuivalen). DoD: riwayat kelas tidak overwrite data lama.
- [ ] TP-LIFE-002 Tambahkan status lifecycle siswa (`ACTIVE`, `INACTIVE`, `GRADUATED`, `TRANSFERRED_OUT`). DoD: query operasional default hanya active.
- [ ] TP-LIFE-003 Terapkan scoping query default ke academic year aktif. DoD: modul utama tidak mencampur data lintas tahun ajaran.
- [ ] TP-LIFE-004 Buat workflow rollover tahun ajaran (minimal checklist service). DoD: proses pergantian tahun ajaran terdokumentasi + executable.
- [ ] TP-LIFE-005 Definisikan policy jadwal saat event khusus/libur (`SCHOOL_HOLIDAY`, `EXAM_PERIOD`, dsb). DoD: attendance seeding patuh aturan event.

### 6.12 WS-FILE: Real Upload Pipeline (P2)

- [ ] TP-FILE-001 Desain flow upload intent + signed URL + confirm upload. DoD: arsitektur teknis disetujui.
- [ ] TP-FILE-002 Implement endpoint create upload intent dengan validasi size/type. DoD: file invalid ditolak sebelum upload.
- [ ] TP-FILE-003 Implement endpoint confirm upload dan persist attachment final. DoD: metadata terhubung ke object storage nyata.
- [ ] TP-FILE-004 Tambahkan checksum/etag atau validasi integritas file. DoD: upload spoofing metadata-only tidak mungkin.
- [ ] TP-FILE-005 Tambahkan hook antivirus scanning async (minimal extensible). DoD: pipeline siap untuk scanning policy.

### 6.13 WS-NOTIF: Notification Backend (P2)

- [ ] TP-NOTIF-001 Tambahkan model data notifikasi (`Notification`, `NotificationPreference`). DoD: preferensi dan inbox dapat dipersist.
- [ ] TP-NOTIF-002 Implement endpoint CRUD preference notifikasi di Settings. DoD: setting tidak lagi state lokal UI.
- [ ] TP-NOTIF-003 Implement trigger notifikasi tugas baru/deadline/nilai/alpha. DoD: event utama menghasilkan notifikasi in-app.
- [ ] TP-NOTIF-004 Implement endpoint list/mark-as-read notifikasi. DoD: user bisa melacak notifikasi terbaca/belum.

### 6.14 WS-AUDIT: Audit Log & Compliance (P1-P2)

- [ ] TP-AUD-001 Tambahkan tabel `AuditLog` minimal (actor, action, entity, before/after, timestamp). DoD: skema audit tersedia.
- [ ] TP-AUD-002 Log aksi sensitif users/profiles/role change. DoD: perubahan identitas/akses selalu tercatat.
- [ ] TP-AUD-003 Log aksi sensitif attendance override. DoD: semua override absensi punya jejak.
- [ ] TP-AUD-004 Log aksi sensitif grade change/publish. DoD: perubahan nilai bisa diinvestigasi.
- [ ] TP-AUD-005 Log aksi sensitif parent-student relink dan activate academic year. DoD: aksi governance tercatat.

### 6.15 WS-TEST: Testing Pyramid & Quality Gate (P1-P3)

- [ ] TP-TEST-001 Siapkan baseline test framework unit + integration. DoD: pipeline test bisa jalan di CI.
- [ ] TP-TEST-002 Tambahkan unit test validator policy authz utama. DoD: branch policy kritikal tercakup.
- [ ] TP-TEST-003 Tambahkan integration test endpoint auth/authz sensitif. DoD: bypass role/ownership tertangkap test.
- [ ] TP-TEST-004 Tambahkan integration test schedule overlap + attendance duplicate. DoD: integritas data tervalidasi otomatis.
- [ ] TP-TEST-005 Tambahkan integration test forum lock enforcement. DoD: lock tidak bisa dibypass direct API.
- [ ] TP-TEST-006 Tambahkan E2E role journey ADMIN. DoD: flow master data sampai monitoring lolos.
- [ ] TP-TEST-007 Tambahkan E2E role journey TEACHER. DoD: flow ajar-absen-tugas-nilai lolos.
- [ ] TP-TEST-008 Tambahkan E2E role journey STUDENT. DoD: flow materi-tugas-submit-nilai lolos.
- [ ] TP-TEST-009 Tambahkan E2E role journey PARENT. DoD: flow monitor anak aman dan scoped.

### 6.16 WS-OPS: Observability, Error Handling, dan Operasional (P2-P3)

- [ ] TP-OPS-001 Tambahkan request logging standar dengan correlation ID. DoD: incident tracing antar layer memungkinkan.
- [ ] TP-OPS-002 Tambahkan error monitoring dan klasifikasi severity. DoD: error kritikal terdeteksi dengan alert dasar.
- [ ] TP-OPS-003 Tambahkan metrics endpoint untuk health dasar API. DoD: status layanan bisa dipantau.
- [ ] TP-OPS-004 Definisikan SOP backup dan restore database. DoD: prosedur diuji minimal satu kali.
- [ ] TP-OPS-005 Definisikan SOP fallback operasional saat input absensi/tugas gagal. DoD: tim akademik punya panduan jelas.

### 6.17 WS-ROLE: Role Flow Compliance Checklist (Acceptance)

- [ ] TP-ROLE-001 Admin flow end-to-end valid sesuai spec BRD/PRD/TRD.
- [ ] TP-ROLE-002 Teacher flow end-to-end valid sesuai spec BRD/PRD/TRD.
- [ ] TP-ROLE-003 Student flow end-to-end valid sesuai spec BRD/PRD/TRD.
- [ ] TP-ROLE-004 Parent flow end-to-end valid sesuai spec BRD/PRD/TRD.
- [ ] TP-ROLE-005 Semua akses lintas role tanpa hak menghasilkan 403/401 sesuai kontrak API.
- [ ] TP-ROLE-006 Semua data lintas ownership tanpa hak tidak muncul di UI maupun API.

### 6.18 WS-RELEASE: Definition of Ready for Pilot

- [ ] TP-REL-001 Semua item P0 selesai (`TP-SEC-*`, `TP-AUTHZ-*`, `TP-API-001`, `TP-PRN-001`).
- [ ] TP-REL-002 Minimal 90% item P1 selesai.
- [ ] TP-REL-003 Tidak ada bug severity kritikal pada authz/integritas data.
- [ ] TP-REL-004 Test integration authz + data integrity lulus di CI.
- [ ] TP-REL-005 SOP operasional dan eskalasi insiden disetujui stakeholder.

## 7. Checklist Keputusan Produk (Wajib Diputuskan)

- [ ] TP-DEC-001 Putuskan model auth final (internal credential / SSO / hybrid).
- [ ] TP-DEC-002 Putuskan policy detail visibilitas parent terhadap submission anak.
- [ ] TP-DEC-003 Putuskan policy co-teaching/substitute untuk grading authority.
- [ ] TP-DEC-004 Putuskan policy late submission/remedial/resubmission.
- [ ] TP-DEC-005 Putuskan policy rollover tahun ajaran (freeze, clone, promotion).
- [ ] TP-DEC-006 Putuskan data retention dan export policy compliance.

## 8. Scope Change Log (Jangan Hapus Histori)

- [x] TP-SCOPE-000 Inisialisasi baseline tech plan v1.0 pada 21-02-2026.
- [ ] TP-SCOPE-001 Template perubahan scope berikutnya. Format catatan: `Tanggal | ID baru | Alasan perubahan | Dampak modul | Keputusan`.

## 9. Catatan Eksekusi

- Checklist ini adalah dokumen hidup; update harus langsung saat implementasi item selesai.
- Jika satu item dipecah jadi beberapa PR, status item tetap `[ ]` sampai DoD terpenuhi penuh.
- Jika ada item baru karena perubahan requirement, tambahkan ID baru tanpa menghapus item lama.

## 10. Catatan Commit Message

- Commit message dibuat per task, bukan 1 commit untuk semua task.
- Commit message harus menggunakan format <tag>: <nama task>
- Tag bisa berupa Feat, Fix, Refactor, Style, Docs, Test, Build, Chore, Revert, etc.
- Contoh: `Feat: add new feature`
