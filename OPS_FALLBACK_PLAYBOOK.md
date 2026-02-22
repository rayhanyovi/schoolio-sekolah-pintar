# SOP Fallback Operasional: Gagal Input Absensi/Tugas

Versi: 1.0  
Tanggal: 22 Februari 2026

## 1. Tujuan

Dokumen ini menjadi panduan operasional saat terjadi gangguan input data akademik (khususnya absensi dan pengumpulan tugas), agar proses belajar mengajar tetap berjalan sambil menjaga integritas data.

## 2. Ruang Lingkup

- Gagal simpan absensi kelas.
- Gagal update koreksi absensi.
- Gagal submit tugas siswa.
- Gagal ubah status submission/nilai.

## 3. Trigger Insiden

Jalankan SOP ini jika salah satu kondisi berikut terjadi:

- API mengembalikan `5xx` berulang > 3 kali dalam 5 menit.
- API mengembalikan `409`/`403` yang tidak sesuai ekspektasi proses operasional.
- UI tidak dapat menyimpan data setelah retry standar.

## 4. Peran dan Tanggung Jawab

- `PIC Akademik`: guru/wali kelas/operator yang pertama kali mendeteksi gangguan.
- `PIC IT Sekolah`: verifikasi operasional dan kumpulkan bukti insiden.
- `Backend On-Call`: triage teknis, root cause, dan recovery backend.
- `Admin Sekolah`: approval override operasional bila diperlukan.

## 5. Prosedur Fallback Absensi

1. `PIC Akademik` catat data absensi secara manual (template tabel: siswa, status, catatan, timestamp).
2. `PIC Akademik` retry input aplikasi maksimal 3 kali.
3. Jika tetap gagal, kirim eskalasi ke `PIC IT Sekolah` dengan data berikut:
   - kelas, mapel, tanggal sesi
   - screenshot error
   - waktu kejadian
   - `x-correlation-id` (jika tersedia)
4. `PIC IT Sekolah` buat tiket insiden dan tandai prioritas `P1 Akademik`.
5. Setelah backend pulih, input ulang data manual oleh `Admin`/guru sesuai policy:
   - jika di luar cutoff normal, isi `overrideReason` wajib.
6. Lakukan rekonsiliasi: cocokkan jumlah siswa dan status akhir terhadap catatan manual.

## 6. Prosedur Fallback Tugas

1. Siswa menyimpan jawaban/file secara lokal (bukti timestamp lokal).
2. Guru membuka kanal fallback resmi (mis. LMS cadangan/email kelas) dengan batas waktu yang sama.
3. `PIC Akademik` mengumpulkan daftar submission fallback:
   - siswa
   - waktu submit
   - bukti lampiran/jawaban
4. Saat sistem pulih:
   - input ulang submission sesuai urutan waktu.
   - jika melewati deadline normal, pastikan policy `allowLateSubmission/lateUntil` atau approval override yang berlaku.
5. Guru validasi ulang daftar submission akhir dengan daftar fallback.

## 7. Aturan Integritas Data

- Dilarang menghapus catatan manual sebelum rekonsiliasi selesai.
- Semua edit retroaktif wajib memiliki alasan operasional tertulis.
- Setiap override harus bisa ditelusuri pada audit log backend.

## 8. Checklist Penutupan Insiden

- [ ] Data akademik lengkap terinput ulang.
- [ ] Rekonsiliasi manual vs sistem selesai.
- [ ] Root cause dan tindakan pencegahan dicatat.
- [ ] Stakeholder akademik menerima notifikasi penutupan insiden.

## 9. Format Eskalasi Singkat

Gunakan format berikut saat eskalasi:

`[P1-AKADEMIK] <modul> | <kelas/mapel> | <waktu> | <gejala> | <correlation-id?>`

Contoh:

`[P1-AKADEMIK] Attendance Save | X IPA 1 / Matematika | 2026-02-22 08:15 WIB | 500 on save attendance | 9f6b2f6e-...`
