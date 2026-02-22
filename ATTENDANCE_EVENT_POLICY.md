# Attendance Seeding Event Policy (v1)

Dokumen ini mendefinisikan policy server-side untuk seeding sesi absensi otomatis dari jadwal pelajaran ketika ada event khusus.

## 1. Tujuan

- Mencegah seeding absensi pada hari/event yang seharusnya tidak ada pembelajaran reguler.
- Menjaga konsistensi data absensi terhadap kalender akademik.

## 2. Policy Code

- `NORMAL_DAY`: sesi absensi boleh di-seed.
- `SCHOOL_HOLIDAY`: sesi absensi harus dilewati.
- `EXAM_PERIOD`: sesi absensi regular harus dilewati (diproses manual sesuai SOP ujian).

## 3. Rule Matching

Evaluasi policy dilakukan per kombinasi `tanggal + kelas`:

1. Jika ada event applicable dengan `type=HOLIDAY`:
- Policy: `SCHOOL_HOLIDAY` (skip seeding).

2. Jika tidak ada `HOLIDAY`, tetapi ada event dengan keyword periode ujian:
- Keyword dicari dari `title`/`description`, case-insensitive:
- `EXAM_PERIOD`
- `UJIAN`
- `ASSESSMENT_WEEK`
- Policy: `EXAM_PERIOD` (skip seeding).

3. Selain itu:
- Policy: `NORMAL_DAY` (seeding berjalan).

## 4. Scope Event Applicability

Sebuah event dianggap applicable jika:

- Event berlaku di tanggal target (single-day atau range `date` s.d. `endDate`).
- Dan event bersifat:
- global (`classes` kosong), atau
- ditautkan ke `classId` yang sedang diproses.

## 5. Endpoint Seeding

- `POST /api/attendance/sessions/seed` (ADMIN only)
- Payload minimal:

```json
{
  "dateFrom": "2026-03-01",
  "dateTo": "2026-03-07"
}
```

Payload opsional:

```json
{
  "classId": "class_abc",
  "academicYearId": "ay_2026"
}
```

## 6. Output Ringkas Endpoint

- `candidateSlots`: total slot jadwal yang dievaluasi.
- `createdSessions`: jumlah sesi absensi yang berhasil dibuat.
- `skippedExisting`: slot yang dilewati karena sesi sudah ada.
- `skippedByPolicy`: slot yang dilewati karena policy event.
- `policyBreakdown`: distribusi keputusan (`NORMAL_DAY`, `SCHOOL_HOLIDAY`, `EXAM_PERIOD`).

## 7. Catatan Operasional

- Rentang seeding dibatasi maksimal 31 hari per request.
- Jika tidak ada active academic year dan `academicYearId` tidak dikirim, request ditolak.
- Periode ujian yang butuh absensi khusus tetap diproses manual sesuai SOP akademik.
