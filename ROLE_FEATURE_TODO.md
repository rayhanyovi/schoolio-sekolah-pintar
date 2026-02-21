**To-Do List: Fitur Belum Well Implemented**

**Global / Multi-Role**
- [x] Dashboard: data utama dashboard sudah dari endpoint (lihat `ROLE_FEATURE_MATRIX.md`), namun masih perlu penyempurnaan role-scoped data.
- [x] Profil Saya: endpoint profil user sudah terhubung backend, namun masih perlu actor-scoped refinement di API.
- [ ] Notifikasi Sistem: buat endpoint/handler + simpan setting, lalu hubungkan di `components/pages/Settings.tsx`.
- [ ] Dashboard (refinement): role-specific scoping untuk stats/jadwal/tugas agar tidak menggunakan agregasi umum.
- [ ] Profil Saya (refinement): rapikan endpoint profile agar selalu actor-scoped dan tidak bergantung fallback data list.

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
