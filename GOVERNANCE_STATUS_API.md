# Governance Status API

Tanggal update: 22 Februari 2026

## Endpoint

- `GET /api/governance/readiness`

## Tujuan

Menyediakan status readiness governance secara real-time dari backend untuk memonitor blocker:

- `TP-REL-001`
- `TP-REL-005`
- `TP-DEC-*` gate

## Authorization

- Wajib authenticated session.
- Role yang diizinkan: `ADMIN`.

## Response

```json
{
  "data": {
    "generatedAt": "2026-02-22T15:00:00.000Z",
    "overallReady": false,
    "rel001": {
      "ready": false,
      "blockers": ["TP-AUTHZ-001", "Product Lead", "Engineering Lead"]
    },
    "rel005": {
      "ready": false,
      "blockers": [
        "Kepala Sekolah / Operasional Akademik",
        "Product Owner",
        "Engineering Manager",
        "QA Lead"
      ]
    },
    "decisionGate": {
      "ready": false,
      "blockers": [
        "TP-DEC-001",
        "TP-DEC-003",
        "TP-DEC-004",
        "TP-DEC-005",
        "TP-DEC-006"
      ]
    }
  }
}
```

## Sumber Data

Endpoint menghitung status dari dokumen governance berikut:

- `techplan.md`
- `AUTHZ_APPROVAL_PACKET.md`
- `OPS_SIGNOFF_PACKET.md`
- `PRODUCT_DECISION_PACKET.md`

## Integrasi Dashboard

- Halaman admin: `GET /dashboard/governance`
- Frontend handler: `lib/handlers/governance.ts`
- Schema parser: `governanceReadinessSnapshotSchema` di `lib/schemas.ts`

## Error Handling

- `401 UNAUTHORIZED`: session tidak valid.
- `403 FORBIDDEN`: role bukan `ADMIN`.
- `500 CONFLICT`: gagal membaca/menghitung snapshot governance.
