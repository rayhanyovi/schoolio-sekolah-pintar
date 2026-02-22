# Governance Automation Guide

Tanggal update: 22 Februari 2026

## Tujuan

Dokumen ini menjelaskan automasi untuk mempercepat update approval packet dan sinkronisasi checklist `techplan.md` pada item governance:

- `TP-AUTHZ-001`
- `TP-REL-001`
- `TP-REL-005`
- `TP-DEC-001`, `TP-DEC-003`, `TP-DEC-004`, `TP-DEC-005`, `TP-DEC-006`

## Script yang Tersedia

- `npm run governance:approve`
- `npm run governance:sync-techplan`
- `npm run governance:check-sync`
- `npm run governance:refresh`
- `npm run release:readiness`
- `npm run release:readiness:strict`

## 1) Update Approval Packet

### Authz packet (`AUTHZ_APPROVAL_PACKET.md`)

Contoh:

```bash
npm run governance:approve -- --packet authz --subject "Product Lead" --name "Rina PM" --decision Approved --note "Matrix sesuai kebijakan pilot"
```

Parameter utama:

- `--packet authz`
- `--subject` (nilai kolom `Role Approver`)
- `--name` (opsional, isi kolom nama approver)
- `--decision` (`Approved`, `Pending`, `Deferred`, `Rejected`)
- `--date` (opsional, default tanggal hari ini)
- `--note` (opsional)

### Ops packet (`OPS_SIGNOFF_PACKET.md`)

Contoh:

```bash
npm run governance:approve -- --packet ops --subject "Engineering Manager" --name "Budi EM" --decision Approved --note "SOP fallback tervalidasi"
```

Parameter utama:

- `--packet ops`
- `--subject` (nilai kolom `Stakeholder`)
- `--name` (opsional, ditulis ke catatan)
- `--decision`
- `--date` (opsional)
- `--note` (opsional)

### Decision packet (`PRODUCT_DECISION_PACKET.md`)

Contoh:

```bash
npm run governance:approve -- --packet decision --id TP-DEC-004 --decision Approved --owner "Product Akademik + Kurikulum" --note "Gunakan configurable late window"
```

Parameter utama:

- `--packet decision`
- `--id` (format `TP-DEC-XXX`)
- `--decision`
- `--owner` (opsional)
- `--due-date` (opsional)
- `--date` (opsional)
- `--note` (opsional)

## 2) Sinkronisasi Checklist Techplan

Setelah approval packet diupdate:

```bash
npm run governance:sync-techplan
```

Aturan sinkronisasi:

- `TP-AUTHZ-001` otomatis `[x]` jika `Product Lead` dan `Engineering Lead` sudah `Approved` pada `AUTHZ_APPROVAL_PACKET.md`.
- `TP-REL-005` otomatis `[x]` jika semua baris approval matrix pada `OPS_SIGNOFF_PACKET.md` sudah `Approved`.
- Item `TP-DEC-*` target otomatis `[x]` jika status di ringkasan `PRODUCT_DECISION_PACKET.md` adalah `Approved`.
- `TP-REL-001` otomatis `[x]` jika seluruh syarat P0 di `techplan.md` sudah terpenuhi (termasuk `TP-AUTHZ-001` hasil sinkronisasi).

## 3) Validasi Drift (CI/Local)

Untuk memastikan `techplan.md` tidak tertinggal dari approval packet:

```bash
npm run governance:check-sync
```

Command ini exit non-zero jika ada status yang seharusnya berubah tetapi belum disinkronkan.

## 4) Regenerasi Readiness Report

Setelah sinkronisasi:

```bash
npm run release:readiness
```

Untuk mode strict (exit non-zero jika masih ada blocker):

```bash
npm run release:readiness:strict
```

Atau jalankan semua langkah sekaligus:

```bash
npm run governance:refresh
```
