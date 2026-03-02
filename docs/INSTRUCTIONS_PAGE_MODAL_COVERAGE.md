# Instructions Coverage Matrix (Halaman + Modal)

Dokumen ini jadi source of truth untuk memastikan `public/instructions.yaml` mencakup seluruh halaman dashboard dan seluruh modal/sheet/dialog yang dipakai user.

## Sumber data
- Routing halaman: `app/**/page.tsx` dan `app/not-found.tsx`
- Akses menu per role: `components/layout/Sidebar.tsx`
- Guard role tambahan di halaman: `components/pages/*`
- Kondisi saat ini: `public/instructions.yaml` baru punya 3 route (`/dashboard`, `/dashboard/attendance`, `/dashboard/assignments`)

## Catatan penting format saat ini
- `HelpMenu` saat ini melakukan match ke **satu** item route pertama yang cocok.
- Artinya, untuk route yang sama, jangan pakai duplikasi entri route per role (entri kedua tidak akan dipakai).
- Solusi sementara: satu route berisi semua flow role dalam `features` (judul feature harus jelas menyebut role).
- Solusi ideal (lanjutan): tambah `roles` di level `features` lalu filter di `HelpMenu`.

## Matrix halaman dashboard
| Route | Modul/Halaman | Role yang harus tercakup instruksi | Status di `instructions.yaml` | Catatan flow role |
| --- | --- | --- | --- | --- |
| `/dashboard` | Home Dashboard | `ADMIN, TEACHER, STUDENT, PARENT` | Ada (parsial) | `ADMIN` saat ini render analytics, non-admin render dashboard umum. |
| `/dashboard/analytics` | Analytics | `ADMIN` | Belum ada | Admin-only (guard di halaman). |
| `/dashboard/users` | Manajemen Pengguna | `ADMIN` | Belum ada | CRUD user + linking parent/student. |
| `/dashboard/classes` | Manajemen Kelas | `ADMIN` | Belum ada | Admin dapat tambah/edit kelas + lihat detail kelas. |
| `/dashboard/majors` | Jurusan | `ADMIN` | Belum ada | Admin-only (guard di halaman). |
| `/dashboard/subjects` | Mata Pelajaran | `ADMIN` | Belum ada | Admin dapat CRUD mapel + assign guru. |
| `/dashboard/schedules` | Jadwal | `ADMIN, TEACHER, STUDENT, PARENT` | Belum ada | Admin punya flow create, semua role punya flow lihat detail jadwal. |
| `/dashboard/calendar` | Kalender Akademik | `ADMIN, TEACHER, STUDENT, PARENT` | Belum ada | Edit event hanya `ADMIN/TEACHER`, `STUDENT/PARENT` view-only. |
| `/dashboard/attendance` | Absensi | `ADMIN, TEACHER, STUDENT, PARENT` | Ada (parsial) | Flow berbeda per role (admin monitoring, teacher isi, student/parent lihat). |
| `/dashboard/materials` | Materi | `ADMIN, TEACHER, STUDENT, PARENT` | Belum ada | `ADMIN/TEACHER` bisa kelola materi, `STUDENT/PARENT` fokus konsumsi materi. |
| `/dashboard/assignments` | Tugas | `ADMIN, TEACHER, STUDENT, PARENT` | Ada (parsial) | `ADMIN/TEACHER` kelola tugas; `STUDENT` kerjakan; `PARENT` monitor anak. |
| `/dashboard/assignments/[assignmentId]/work` | Halaman Kerja Tugas | `STUDENT` (utama) | Belum ada | Non-student tidak bisa submit. |
| `/dashboard/question-bank` | Bank Soal | `TEACHER` | Belum ada | Pembuatan soal/paket + aksi hapus. |
| `/dashboard/grades` | Nilai | `ADMIN, TEACHER, STUDENT, PARENT` | Belum ada | Flow penilaian vs monitoring nilai berbeda per role. |
| `/dashboard/forum` | Forum Diskusi | `ADMIN, TEACHER, STUDENT` + state terbatas `PARENT` | Belum ada | `PARENT` mendapat layar akses terbatas. |
| `/dashboard/notes` | Catatan | `TEACHER, STUDENT` | Belum ada | Flow catatan kelas/pribadi, modal create/edit catatan. |
| `/dashboard/profile` | Profil Saya | `ADMIN, TEACHER, STUDENT, PARENT` | Belum ada | Edit profil dan data personal. |
| `/dashboard/settings` | Pengaturan Sistem | `ADMIN` | Belum ada | Admin-only (guard di halaman). |
| `/dashboard/governance` | Governance | `ADMIN` | Belum ada | Admin-only (guard di halaman). |

## Matrix modal/sheet/dialog
| Route induk | Modal/Sheet/Dialog | Role yang harus tercakup instruksi | Status di `instructions.yaml` |
| --- | --- | --- | --- |
| `/dashboard/assignments` | `SelectQuestionSourceDialog` | `ADMIN, TEACHER` | Belum ada |
| `/dashboard/assignments` | `SelectPackageDialog` | `ADMIN, TEACHER` | Belum ada |
| `/dashboard/assignments` | `SelectQuestionsDialog` | `ADMIN, TEACHER` | Belum ada |
| `/dashboard/assignments` | `Dialog` Buat/Edit Tugas | `ADMIN, TEACHER` | Belum ada |
| `/dashboard/assignments` | `Sheet` Detail Tugas | `ADMIN, TEACHER, STUDENT, PARENT` | Belum ada |
| `/dashboard/calendar` | `EventFormDialog` | `ADMIN, TEACHER` | Belum ada |
| `/dashboard/classes` | `ClassFormDialog` | `ADMIN` | Belum ada |
| `/dashboard/classes` | `ClassDetailSheet` | `ADMIN` | Belum ada |
| `/dashboard/forum` | `ThreadFormDialog` | `ADMIN, TEACHER, STUDENT` | Belum ada |
| `/dashboard/forum` | `ThreadDetailSheet` | `ADMIN, TEACHER, STUDENT` | Belum ada |
| `/dashboard/majors` | `Dialog` Tambah Jurusan | `ADMIN` | Belum ada |
| `/dashboard/majors` | `Dialog` Atur Guru Jurusan | `ADMIN` | Belum ada |
| `/dashboard/materials` | `Dialog` Tambah/Edit Materi | `ADMIN, TEACHER` | Belum ada |
| `/dashboard/materials` | `Sheet` Detail Materi | `ADMIN, TEACHER, STUDENT, PARENT` | Belum ada |
| `/dashboard/notes` | `Dialog` Buat/Edit Catatan | `TEACHER, STUDENT` | Belum ada |
| `/dashboard/question-bank` | `QuestionFormDialog` | `TEACHER` | Belum ada |
| `/dashboard/question-bank` | `PackageFormDialog` | `TEACHER` | Belum ada |
| `/dashboard/question-bank` | `AlertDialog` Konfirmasi Hapus | `TEACHER` | Belum ada |
| `/dashboard/schedules` | `Dialog` Tambah Jadwal Pelajaran | `ADMIN` | Belum ada |
| `/dashboard/schedules` | `Sheet` Detail Jadwal Harian | `ADMIN, TEACHER, STUDENT, PARENT` | Belum ada |
| `/dashboard/subjects` | `SubjectFormDialog` | `ADMIN` | Belum ada |
| `/dashboard/subjects` | `AssignTeacherDialog` | `ADMIN` | Belum ada |
| `/dashboard/users` | `UserFormDialog` | `ADMIN` | Belum ada |
| `/dashboard/users` | `LinkUserDialog` | `ADMIN` | Belum ada |
| `/dashboard/users` | `AlertDialog` Hapus Pengguna | `ADMIN` | Belum ada |

## Halaman non-dashboard
- `/` dan `/auth` ada di app router, tapi saat ini tidak menampilkan `HelpMenu` dari dashboard.
- Jika ingin full coverage lintas aplikasi, bisa tambah entri instruksi juga untuk 2 route ini (opsional fase berikutnya).

## Gap summary saat ini
- Route dashboard yang perlu instruksi: `19`
- Route yang sudah ada di YAML: `3` (semuanya masih parsial)
- Modal/sheet/dialog yang perlu instruksi: `25`
- Modal yang sudah ada di YAML: `0`

## Open policy points (perlu diputuskan)
- Beberapa modul hanya muncul di sidebar role tertentu, tetapi belum punya guard route eksplisit (contoh: `users`, `classes`, `subjects`, `question-bank`, `notes`).
- Jika policy final adalah "hanya role di sidebar yang boleh akses", sebaiknya tambahkan guard di halaman/API agar coverage instruksi dan akses runtime konsisten.

## Template implementasi YAML (sementara)
```yaml
- route: /dashboard/assignments
  roles: [ADMIN, TEACHER, STUDENT, PARENT]
  features:
    - name: "[ADMIN/TEACHER] Buat Tugas (Dialog)"
      steps:
        - title: Pilih sumber soal
          description: Gunakan dialog pemilihan paket atau bank soal.
    - name: "[STUDENT] Kerjakan Tugas"
      steps:
        - title: Buka detail tugas
          description: Klik tugas untuk membuka sheet detail lalu masuk ke halaman kerja.
    - name: "[PARENT] Monitoring Tugas Anak"
      steps:
        - title: Pilih anak
          description: Pastikan anak dipilih agar daftar tugas dan status sinkron.
```
