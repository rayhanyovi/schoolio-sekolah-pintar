# Product Decision Packet

Tanggal update: 22 Februari 2026  
Status: Menunggu keputusan stakeholder (`TP-DEC-*`)

## Tujuan

Dokumen ini merangkum opsi, rekomendasi, dan dampak teknis untuk item keputusan terbuka pada `techplan.md`.

## Ringkasan Status

| ID | Keputusan | Status |
|---|---|---|
| TP-DEC-001 | Model auth final | Pending |
| TP-DEC-002 | Visibilitas parent submission anak | Approved |
| TP-DEC-003 | Co-teaching/substitute grading authority | Pending |
| TP-DEC-004 | Late submission/remedial/resubmission policy | Pending |
| TP-DEC-005 | Rollover tahun ajaran policy | Pending |
| TP-DEC-006 | Data retention + export compliance policy | Pending |

## Detail Keputusan

### TP-DEC-001 - Model Auth Final

Pilihan:
- `Internal credential` (email/username + password managed internal).
- `SSO` (Google/Microsoft/IdP sekolah).
- `Hybrid` (internal + SSO, dengan fallback internal admin).

Rekomendasi:
- `Hybrid` untuk transisi bertahap, mengurangi risiko lockout saat adopsi awal.

Dampak teknis:
- API/Auth: endpoint login + session issuance perlu mode provider-aware.
- UI: halaman login perlu selector provider.
- OPS: butuh prosedur onboarding/offboarding akun lintas provider.

### TP-DEC-003 - Co-teaching/Substitute Grading Authority

Pilihan:
- `Owner only`: hanya teacher pemilik assignment boleh memberi nilai.
- `Owner + delegated`: teacher delegated/substitute bisa grading dengan jejak override.
- `Department scope`: teacher mapel yang sama dalam kelas bisa grading.

Rekomendasi:
- `Owner + delegated` dengan audit trail wajib (`delegationReason`, `grantedBy`, `grantedAt`).

Dampak teknis:
- DB/API: perlu model delegation assignment-level atau class-subject-level.
- Audit: aksi grading oleh non-owner wajib log tambahan.
- QA: test matrix role-teacher perlu branch delegated authority.

### TP-DEC-004 - Late Submission/Remedial/Resubmission

Pilihan:
- `Strict deadline` (tanpa late submit).
- `Configurable late window` (sudah ada baseline `allowLateSubmission`, `lateUntil`, `maxAttempts`).
- `Two-phase` (normal submit + remedial window terpisah).

Rekomendasi:
- `Configurable late window` sebagai default v1, tambah flag remedial terpisah pada fase berikutnya jika dibutuhkan kurikulum.

Dampak teknis:
- API sudah siap sebagian; perlu finalisasi rule UI + notifikasi policy.
- Analytics nilai perlu menandai submission late/remedial.

### TP-DEC-005 - Policy Rollover Tahun Ajaran

Pilihan:
- `Freeze only` (aktifkan tahun ajaran baru tanpa clone data).
- `Freeze + clone classes` (sudah didukung script rollover).
- `Freeze + clone + promotion` (otomatis promosi siswa lintas grade).

Rekomendasi:
- `Freeze + clone classes` untuk pilot, promotion otomatis ditunda sampai rule akademik disepakati.

Dampak teknis:
- Script `academic-year:rollover` sudah mendukung freeze + clone.
- Promotion otomatis butuh aturan detail status siswa (ACTIVE/ALUMNI/TRANSFERRED).

### TP-DEC-006 - Data Retention dan Export Compliance

Pilihan:
- `Minimal retention` (arsip terbatas, purge agresif).
- `Regulatory retention` (retensi sesuai kebijakan sekolah/regulasi lokal).
- `Extended retention` (retensi panjang + export self-service).

Rekomendasi:
- `Regulatory retention` dengan policy tiered:
- data operasional detail: retensi pendek-menengah,
- data akademik final (rapor/transkrip): retensi panjang,
- audit log: retensi minimal sesuai kebutuhan investigasi.

Dampak teknis:
- DB: perlu lifecycle job purge/anonymize terjadwal.
- API: endpoint export by role + guard compliance.
- OPS: prosedur DSAR/export request dan approval chain.

## Keputusan yang Sudah Final

### TP-DEC-002 - Parent Visibility Submission

Disepakati:
- Parent boleh melihat status submit, timestamp, nilai, feedback.
- Parent tidak boleh melihat jawaban mentah siswa (`response`), wajib masking server-side.

## Approval Record

| ID | Owner Keputusan | Due Date | Keputusan Final | Tanggal | Catatan |
|---|---|---|---|---|---|
| TP-DEC-001 | Product + Engineering | - | Pending | - | - |
| TP-DEC-003 | Product Akademik | - | Pending | - | - |
| TP-DEC-004 | Product Akademik + Kurikulum | - | Pending | - | - |
| TP-DEC-005 | Operasional Akademik + Engineering | - | Pending | - | - |
| TP-DEC-006 | Compliance + Product + Engineering | - | Pending | - | - |
