**To-Do List: Fitur Belum Well Implemented**

**Global / Multi-Role**
- [x] Dashboard: data utama dashboard sudah dari endpoint (lihat `ROLE_FEATURE_MATRIX.md`), namun masih perlu penyempurnaan role-scoped data.
- [x] Profil Saya: endpoint profil user sudah terhubung backend, namun masih perlu actor-scoped refinement di API.
- [x] Notifikasi Sistem: endpoint/handler + simpan setting sudah terhubung di `components/pages/Settings.tsx`.
- [ ] Dashboard (refinement): role-specific scoping untuk stats/jadwal/tugas agar tidak menggunakan agregasi umum.
- [x] Profil Saya (refinement): endpoint profile sudah actor-scoped dan memakai sesi aktif (tanpa fallback data list).

**Admin**
- [x] Classes: response `listClassSubjects` + payload `setClassSubjects` sudah typed schema.
- [x] Subjects: payload `setSubjectTeachers` dan `setSubjectClasses` sudah typed schema.
- [x] Schedules: normalisasi `lib/handlers/schedules.ts` sudah typed mapper (tanpa `any`).
- [x] Schedule Templates: UI edit + integrasi `updateScheduleTemplates` sudah berjalan di Settings.

**Teacher**
- [x] Schedules: sama seperti Admin (typed data/mapper di handler).
- [x] Materials: normalisasi `lib/handlers/materials.ts` sudah typed mapper (tanpa `any`).

**Student**
- [x] Schedules: sama seperti Admin/Teacher (typed data/mapper di handler).
- [x] Materials: sama seperti Teacher (typed data/mapper).

**Parent**
- [x] Tidak ada tambahan khusus selain item Global/Student terkait dashboard & profil.
