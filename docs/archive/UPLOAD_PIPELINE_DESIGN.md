# Upload Pipeline Design (v1)

Dokumen ini mendefinisikan arsitektur teknis upload file backend untuk mendukung flow aman: `create intent -> upload content -> confirm`.

## 1. Tujuan

- Memindahkan upload dari metadata-only ke pipeline berbasis object storage.
- Memastikan validasi size/type dilakukan sebelum upload.
- Memastikan integritas payload (size + checksum) diverifikasi server-side.
- Menyediakan hook antivirus scan yang extensible.

## 2. Arsitektur Endpoint

### 2.1 Create Upload Intent

- `POST /api/uploads/intents`
- Actor: `ADMIN`, `TEACHER`
- Input:
- `materialId`
- `fileName`
- `fileType`
- `sizeBytes`
- `checksumSha256`
- Output:
- `id` (upload intent id)
- `uploadUrl` signed (`/api/uploads/intents/{id}/content?token=...`)
- `expiresAt`

### 2.2 Upload Binary Content

- `PUT /api/uploads/intents/{id}/content?token=...`
- Auth: signed token (simulasi signed URL)
- Input: raw binary body
- Server checks:
- token hash
- intent status + expiry
- size exact match
- checksum SHA-256 exact match
- Output: status `UPLOADED` + `etag`

### 2.3 Confirm Upload

- `POST /api/uploads/intents/{id}/confirm`
- Actor: `ADMIN`, `TEACHER` (teacher owner-only material)
- Server actions:
- verifikasi integritas final dari metadata upload vs intent awal
- persist `MaterialAttachment` final
- queue scan job (`UploadScanJob`)
- update intent status `CONFIRMED`

## 3. Data Model

- `UploadIntent`
- metadata intent, token hash, status lifecycle upload, hasil checksum upload, scan status/result
- `UploadScanJob`
- queue status scan async (PENDING/CLEAN/INFECTED/FAILED)
- `MaterialAttachment` (extended)
- menyimpan `checksumSha256`, `etag`, `scanStatus`, dan relasi `uploadIntentId`

## 4. Security & Integrity

- Token upload disimpan sebagai hash (`uploadTokenHash`) untuk menghindari token plaintext di DB.
- `checksumSha256` + `sizeBytes` divalidasi dua kali:
- saat upload binary,
- saat confirm sebelum attachment final dipersist.
- Endpoint lama attachment kini hanya menerima `uploadIntentId` confirmed, sehingga metadata-only spoofing ditutup.

## 5. Object Storage Strategy

- Backend menggunakan object storage abstraction `lib/object-storage.ts`.
- Implementasi v1 menggunakan filesystem root (`OBJECT_STORAGE_ROOT`, default `.tmp/object-storage`) sebagai object storage nyata.
- `storageKey` menjadi referensi permanen attachment.

## 6. Antivirus Hook (Extensible)

- Hook queue scan melalui `lib/upload-scan.ts` + model `UploadScanJob`.
- Provider saat ini `NOOP` (queue only), siap diganti adapter scanner eksternal.
- Dukungan simulasi hasil scan via env `UPLOAD_SCAN_MOCK_RESULT` untuk testing/pipeline.

## 7. Kontrak Operasional

- File max size: `MAX_UPLOAD_SIZE_BYTES` (default 15 MB).
- TTL upload intent: `UPLOAD_INTENT_TTL_MINUTES` (default 15 menit).
- MIME allowlist terpusat di `lib/upload-intent.ts`.
- Auto-escalation threshold scan queue (opsional override via env):
  - `UPLOAD_SCAN_ALERT_FAILED_THRESHOLD` (default `3`)
  - `UPLOAD_SCAN_ALERT_INFECTED_THRESHOLD` (default `1`)
  - `UPLOAD_SCAN_ALERT_PENDING_THRESHOLD` (default `20`)
  - `UPLOAD_SCAN_ALERT_PENDING_AGE_MINUTES_THRESHOLD` (default `30`)

## 8. Checklist Rollout

- [x] UI client diubah ke flow 3 tahap (intent/upload/confirm) pada modul Materials (upload lampiran).
- [x] Monitoring scan queue dipasang melalui `GET /api/metrics` (`uploadScanQueue`).
- [x] SOP incident file malware didokumentasikan (`OPS_FILE_MALWARE_INCIDENT_SOP.md`), menunggu sign-off stakeholder operasional.
