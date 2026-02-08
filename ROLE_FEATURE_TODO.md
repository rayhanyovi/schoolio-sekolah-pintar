**To-Do List: Fitur Belum Well Implemented**

**Global / Multi-Role**
- [ ] Dashboard: ganti data hardcoded di `components/pages/Dashboard.tsx` dengan data dari endpoint (stats, jadwal hari ini, tugas terbaru, ringkasan kehadiran).
- [ ] Profil Saya: buat endpoint profil user + handler typed, lalu hubungkan UI di `components/pages/Profile.tsx`.
- [ ] Notifikasi Sistem: buat endpoint/handler + simpan setting, lalu hubungkan di `components/pages/Settings.tsx`.

**Admin**
- [ ] Classes: ketikkan response `listClassSubjects` + payload `setClassSubjects` dengan schema jelas.
- [ ] Subjects: ketikkan payload `setSubjectTeachers` dan `setSubjectClasses` dengan schema jelas.
- [ ] Schedules: hilangkan `any` pada normalisasi di `lib/handlers/schedules.ts` (buat schema/typed mapper).
- [ ] Schedule Templates: tambahkan UI edit + panggil `updateScheduleTemplates` (saat ini read-only).

**Teacher**
- [ ] Schedules: sama seperti Admin (typed data/mapper di handler).
- [ ] Materials: hilangkan `any` pada normalisasi di `lib/handlers/materials.ts` (buat typed schema/mapper).

**Student**
- [ ] Schedules: sama seperti Admin/Teacher (typed data/mapper di handler).
- [ ] Materials: sama seperti Teacher (typed data/mapper).

**Parent**
- [ ] (Tidak ada tambahan khusus, selain item Global/Student terkait dashboard & profil.)
