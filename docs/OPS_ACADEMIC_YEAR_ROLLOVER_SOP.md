# SOP Academic Year Rollover (v1)

Dokumen ini mendefinisikan prosedur operasional rollover tahun ajaran yang dapat dieksekusi ulang dengan script, sekaligus menjaga jejak audit perubahan.

## 1. Tujuan

- Mengaktifkan tahun ajaran target secara terkontrol.
- Menyediakan mode cloning struktur kelas/mapel untuk tahun ajaran baru.
- Menyediakan mode dry-run untuk validasi sebelum eksekusi nyata.

## 2. Batasan v1

- Policy promosi siswa lintas jenjang belum diotomasi di script ini.
- v1 hanya menangani:
- Aktivasi tahun ajaran target (`FREEZE` mode).
- Opsi clone struktur kelas + relasi subject-class (`CLONE_CLASSES` mode).
- Keputusan final strategi rollover penuh (freeze/clone/promotion) tetap mengikuti item keputusan produk `TP-DEC-005`.

## 3. Prasyarat

- `DATABASE_URL` valid ke database target.
- Sudah backup database sebelum eksekusi (`scripts/db-backup.cmd`).
- ID tahun ajaran target sudah tersedia.
- Jika mode clone dipakai:
- ID tahun ajaran sumber tersedia.
- Tahun ajaran target belum memiliki data kelas (guard script akan menolak jika sudah ada).

## 4. Perintah Eksekusi

### 4.1 Dry-run (wajib)

```bat
scripts\academic-year-rollover.cmd --targetAcademicYearId=<TARGET_ID> --mode=CLONE_CLASSES --sourceAcademicYearId=<SOURCE_ID> --dryRun=true
```

### 4.2 Eksekusi mode FREEZE (hanya aktivasi target year)

```bat
scripts\academic-year-rollover.cmd --targetAcademicYearId=<TARGET_ID> --mode=FREEZE --activateTarget=true
```

### 4.3 Eksekusi mode CLONE_CLASSES (clone struktur + aktivasi target)

```bat
scripts\academic-year-rollover.cmd --targetAcademicYearId=<TARGET_ID> --mode=CLONE_CLASSES --sourceAcademicYearId=<SOURCE_ID> --activateTarget=true
```

### 4.4 Opsi audit actor

```bat
scripts\academic-year-rollover.cmd --targetAcademicYearId=<TARGET_ID> --mode=FREEZE --actorId=<ADMIN_USER_ID>
```

Jika `actorId` dikirim, script akan menulis `AuditLog` dengan action `ACADEMIC_YEAR_ROLLOVER_EXECUTED`.

## 5. Checklist Operasional

- [ ] Backup terbaru tersedia dan tervalidasi.
- [ ] Dry-run sukses tanpa error.
- [ ] Approval eksekusi dari PIC Product + Engineering.
- [ ] Eksekusi command final berhasil.
- [ ] Verifikasi pasca-eksekusi:
- [ ] Hanya satu academic year yang `isActive=true`.
- [ ] (Jika clone) jumlah class target sesuai ekspektasi.
- [ ] (Jika clone) relasi subject-class target tervalidasi sampling.
- [ ] Catatan eksekusi dikirim ke channel incident/ops.

## 6. Verifikasi SQL Cepat

```sql
-- Cek active year
SELECT id, year, semester, "isActive"
FROM "AcademicYear"
ORDER BY "updatedAt" DESC;

-- Cek jumlah class per year
SELECT "academicYearId", COUNT(*) AS class_count
FROM "Class"
GROUP BY "academicYearId"
ORDER BY class_count DESC;
```

## 7. Rollback

- Jika hasil tidak sesuai:
- Restore dari backup terakhir (`scripts/db-restore.cmd <file-backup.sql>`).
- Ulangi dry-run dengan parameter yang benar.
- Eksekusi ulang setelah approval ulang.

## 8. Referensi

- Script utama: `scripts/academic-year-rollover.ts`
- Wrapper CMD: `scripts/academic-year-rollover.cmd`
- SOP backup/restore: `OPS_DB_BACKUP_RESTORE_SOP.md`
