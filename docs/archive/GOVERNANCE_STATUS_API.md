# Governance Status API

Tanggal update: 22 Februari 2026

## Endpoint

- `GET /api/governance/readiness`
- `POST /api/governance/approvals`
- `GET /api/governance/tracker`

## Tujuan

Menyediakan status readiness governance secara real-time dari backend untuk memonitor blocker:

- `TP-REL-001`
- `TP-REL-005`
- `TP-DEC-*` gate

Serta menyediakan aksi update approval packet governance dari dashboard admin.

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

## Request Update Approval

`POST /api/governance/approvals`

Body:

```json
{
  "packet": "authz",
  "subject": "Product Lead",
  "decision": "Approved",
  "name": "Rina PM",
  "note": "Matrix sesuai kebijakan pilot"
}
```

Response:

```json
{
  "data": {
    "changed": true,
    "packet": "authz",
    "target": "Product Lead",
    "decision": "Approved",
    "date": "2026-03-02",
    "snapshot": {
      "generatedAt": "2026-03-02T14:22:00.000Z",
      "overallReady": false,
      "rel001": { "ready": false, "blockers": ["Engineering Lead"] },
      "rel005": { "ready": false, "blockers": ["QA Lead"] },
      "decisionGate": { "ready": false, "blockers": ["TP-DEC-001"] }
    }
  }
}
```

Catatan:
- `packet=authz|ops` menggunakan field `subject`.
- `packet=decision` menggunakan field `id` (`TP-DEC-XXX`) dan opsional `owner`, `dueDate`.
- Endpoint ini otomatis menjalankan sinkronisasi governance (`governance-sync-techplan`) dan regenerasi report readiness.

## Sumber Data

Endpoint menghitung status dari dokumen governance berikut:

- `techplan.md`
- `AUTHZ_APPROVAL_PACKET.md`
- `OPS_SIGNOFF_PACKET.md`
- `PRODUCT_DECISION_PACKET.md`
- `GOVERNANCE_APPROVAL_HISTORY.md`

## Response Governance Tracker

`GET /api/governance/tracker`

```json
{
  "data": {
    "generatedAt": "2026-03-02T15:00:00.000Z",
    "totals": {
      "total": 12,
      "approved": 2,
      "pending": 10,
      "overdue": 1
    },
    "tasks": [],
    "overdueTasks": [],
    "pendingByPic": [
      { "pic": "Product Lead", "pending": 2, "overdue": 0, "targets": ["TP-AUTHZ-001"] }
    ],
    "recentHistory": []
  }
}
```

## Integrasi Dashboard

- Halaman admin: `GET /dashboard/governance`
- Frontend handler: `lib/handlers/governance.ts`
- Schema parser: `governanceReadinessSnapshotSchema` di `lib/schemas.ts`
- Action update approval: `updateGovernanceApproval()` di `lib/handlers/governance.ts`
- Tracker handler: `getGovernanceTracker()` di `lib/handlers/governance.ts`

## Error Handling

- `401 UNAUTHORIZED`: session tidak valid.
- `403 FORBIDDEN`: role bukan `ADMIN`.
- `500 CONFLICT`: gagal membaca/menghitung snapshot governance.
- `409 CONFLICT`: gagal update row approval (subject/id tidak cocok dokumen).
