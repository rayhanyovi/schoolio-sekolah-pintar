# Authorization Approval Packet

Tanggal update: 22 Februari 2026  
Status: Pending sign-off Product + Engineering

## Tujuan

Dokumen ini menyiapkan approval formal untuk menutup item `TP-AUTHZ-001` (authorization matrix eksplisit per resource/action) dan membuka syarat `TP-REL-001`.

## Dokumen Acuan

- `AUTHZ_MATRIX.md` (versi 1.0 draft implementasi)
- `techplan.md` (WS-AUTHZ, WS-RELEASE)

## Ringkasan Cakupan Matrix

- Resource yang dicakup: user domain, akademik (kelas/mapel/jadwal), attendance, assignment-submission, forum, notes, calendar, analytics, settings, question bank.
- Action yang dicakup: read, create, update, delete, activate, link/unlink, lock/pin/upvote, dan relasi mapping.
- Prinsip kebijakan:
- `deny-by-default` untuk endpoint sensitif tanpa policy eksplisit.
- ownership enforcement untuk student-self, parent-linked-child, teacher-owned-class/subject.
- actor identity pada write diambil dari session server-side.

## Evidensi Teknis

- Endpoint policy coverage audit: `TP-AUTHZ-007` sudah `[x]` pada `techplan.md`.
- Suite verifikasi authz/integritas:
- `tests/integration/authz-sensitive.integration.test.ts`
- `tests/integration/role-parent.e2e.test.ts`
- `tests/integration/forum-lock.integration.test.ts`
- `tests/integration/schedule-conflict.integration.test.ts`
- `tests/integration/attendance-duplicate.integration.test.ts`
- CI gate authz/integritas aktif: `.github/workflows/ci-authz-integrity.yml`.

## Checklist Sign-off

- [ ] Product menyetujui seluruh constraint role/ownership pada `AUTHZ_MATRIX.md`.
- [ ] Engineering menyetujui keterlaksanaan policy di route handler + test gate.
- [ ] Security/Compliance menyetujui prinsip minimum access dan data scoping.
- [ ] Tidak ada blocker critical terkait policy authz sebelum pilot.

## Approval Record

| Role Approver | Nama | Keputusan | Tanggal | Catatan |
|---|---|---|---|---|
| Product Lead | - | Pending | - | - |
| Engineering Lead | - | Pending | - | - |
| Security/Compliance | - | Pending | - | - |

## Catatan Keputusan

- Jika ada perubahan policy, update `AUTHZ_MATRIX.md` dan tambahkan entry pada scope log `techplan.md`.
- Item `TP-AUTHZ-001` baru boleh diubah ke `[x]` setelah minimal Product + Engineering berstatus `Approved`.
