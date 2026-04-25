# SOP Backup dan Restore Database

Versi: 1.0  
Tanggal: 22 Februari 2026  
Workstream: `TP-OPS-004`

## 1. Tujuan

Dokumen ini mendefinisikan prosedur backup dan restore database PostgreSQL yang bisa dijalankan oleh tim operasional, termasuk bukti drill restore minimal satu kali.

## 2. Ruang Lingkup

- Backup logical database PostgreSQL (format SQL plain).
- Restore database dari file backup SQL.
- Verifikasi pasca-restore untuk memastikan data kembali utuh.

## 3. Prasyarat

- Tool tersedia di PATH: `pg_dump`, `psql`, `createdb`, `dropdb`.
- Environment variable `DATABASE_URL` mengarah ke database target.
- Operator memiliki hak akses read/write ke database target.

Contoh set koneksi di `cmd`:

```bat
set DATABASE_URL=postgresql://postgres@localhost:55432/ops_backup_restore_demo
```

## 4. Script Operasional

- Backup: `scripts\db-backup.cmd [output-file]`
- Restore: `scripts\db-restore.cmd <input-file>`

Contoh:

```bat
scripts\db-backup.cmd backups\ops-backup.sql
scripts\db-restore.cmd backups\ops-backup.sql
```

## 5. Prosedur Backup

1. Pastikan `DATABASE_URL` sudah benar.
2. Jalankan `scripts\db-backup.cmd` dengan nama file output.
3. Pastikan script selesai dengan pesan `Backup selesai`.
4. Simpan file backup sesuai kebijakan retensi.

## 6. Prosedur Restore

1. Pastikan database target sudah disiapkan (kosong atau sesuai strategi restore).
2. Pastikan `DATABASE_URL` mengarah ke database target restore.
3. Jalankan `scripts\db-restore.cmd <input-file>`.
4. Pastikan script selesai dengan pesan `Restore selesai`.
5. Jalankan query verifikasi data kritikal setelah restore.

## 7. Drill Restore (Bukti Uji)

Tanggal uji: 22 Februari 2026  
Lingkungan uji: local PostgreSQL ephemeral pada `localhost:55432` (cluster `.tmp\pg-ops\data`)

Langkah uji yang dijalankan:

1. Buat database `ops_backup_restore_demo`.
2. Seed tabel uji `ops_restore_probe` dengan 3 baris.
3. Jalankan backup:

```bat
set DATABASE_URL=postgresql://postgres@localhost:55432/ops_backup_restore_demo
scripts\db-backup.cmd .tmp\pg-ops\backups\ops-backup-scripted.sql
```

4. Drop database, lalu create ulang database kosong.
5. Jalankan restore:

```bat
set DATABASE_URL=postgresql://postgres@localhost:55432/ops_backup_restore_demo
scripts\db-restore.cmd .tmp\pg-ops\backups\ops-backup-scripted.sql
```

6. Verifikasi pasca-restore:
   - Row count: `3`
   - Ringkasan payload: `Alya:PRESENT,Bima:SICK,Citra:LATE`

Status drill: `PASS`

## 8. Checklist Operasional

- [ ] File backup tersimpan di lokasi yang ditetapkan.
- [ ] Restore berhasil tanpa error SQL.
- [ ] Query verifikasi pasca-restore sesuai baseline.
- [ ] Bukti pelaksanaan drill terdokumentasi.
