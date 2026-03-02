# Operational SOP Sign-off Packet

Tanggal update: 22 Februari 2026  
Status: Pending stakeholder approval (`TP-REL-005`)

## Tujuan

Dokumen ini mengkonsolidasikan approval stakeholder untuk SOP operasional dan eskalasi insiden sebagai syarat release readiness.

## SOP Dalam Scope

- `OPS_DB_BACKUP_RESTORE_SOP.md`
- `OPS_FALLBACK_PLAYBOOK.md`
- `OPS_ACADEMIC_YEAR_ROLLOVER_SOP.md`
- `ATTENDANCE_EVENT_POLICY.md`
- `OPS_FILE_MALWARE_INCIDENT_SOP.md`

## Checklist Verifikasi Sebelum Sign-off

- [ ] SOP backup-restore memuat langkah prasyarat, eksekusi, verifikasi, dan rollback.
- [ ] SOP fallback akademik memuat trigger, role PIC, komunikasi, dan closure criteria.
- [ ] SOP rollover memuat mode dry-run/execute, validasi pasca-run, dan mitigasi kegagalan.
- [ ] Policy attendance-event memuat rule skip/seed yang dapat diaudit.
- [ ] Tim akademik + ops memahami channel eskalasi dan SLA respon insiden.

## Approval Matrix

| Stakeholder | Area | Keputusan | Tanggal | Catatan |
|---|---|---|---|---|
| Kepala Sekolah / Operasional Akademik | Proses akademik harian | Pending | - | - |
| Product Owner | Kesesuaian flow produk | Pending | - | - |
| Engineering Manager | Kesiapan implementasi teknis | Pending | - | - |
| QA Lead | Verifikasi jalur fallback dan uji regresi | Pending | - | - |

## Exit Criteria

- Semua approver utama berstatus `Approved`.
- Tidak ada gap SOP kritikal tanpa owner/timeline mitigasi.
- Item `TP-REL-005` di `techplan.md` boleh diubah ke `[x]` hanya setelah kriteria di atas terpenuhi.
