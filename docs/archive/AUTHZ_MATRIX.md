# Authorization Matrix - Sekolah Pintar

Versi: 1.0 (draft implementasi)  
Tanggal: 21 Februari 2026

## Aturan Umum

- Seluruh endpoint API non-auth mewajibkan session valid.
- Pengecualian publik hanya:
  - `/api/auth/login`
  - `/api/auth/logout`
- Semua role di bawah mengacu pada: `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`.

## Matrix Resource x Action

| Resource | Action | Allowed Roles | Ownership/Constraint |
|---|---|---|---|
| Users | Read list/create/mutate user | ADMIN | Full access |
| User Profile | Read/update own profile | ADMIN, self user | Non-admin hanya self |
| Students | Read student data | ADMIN, TEACHER, STUDENT, PARENT | STUDENT=self; PARENT=linked child |
| Parents | Read parent data | ADMIN, TEACHER, PARENT | PARENT=self |
| Teachers | Read teacher data | ADMIN, TEACHER | TEACHER=self |
| Parent Links | Link/unlink parent-student | ADMIN | Full access |
| Classes | Read class list/detail | ADMIN, TEACHER, STUDENT, PARENT | STUDENT=own class; PARENT=linked classes |
| Classes | Create/update/delete class | ADMIN | Full access |
| Class Students | Read class roster | ADMIN, TEACHER | Full access for role |
| Class Subjects | Read class-subject mapping | ADMIN, TEACHER, STUDENT, PARENT | STUDENT/PARENT sesuai class scope |
| Class Subjects | Set class-subject mapping | ADMIN | Full access |
| Subjects | Read subject list/detail | ADMIN, TEACHER, STUDENT, PARENT | Full read by role |
| Subjects | Create/update/delete subject | ADMIN | Full access |
| Subject Teachers | Set subject-teacher mapping | ADMIN | Full access |
| Subject Classes | Set subject-class mapping | ADMIN | Full access |
| Majors | Read major list/detail | ADMIN, TEACHER | Full read by role |
| Majors | Create/update/delete major | ADMIN | Full access |
| Major Teachers | Read mapping | ADMIN, TEACHER | Full read by role |
| Major Teachers | Set mapping | ADMIN | Full access |
| Academic Years | Read list/detail | ADMIN, TEACHER, STUDENT, PARENT | Full read by role |
| Academic Years | Create/update/delete/activate | ADMIN | Full access |
| Schedules | Read schedule | ADMIN, TEACHER, STUDENT, PARENT | TEACHER=own/managed subject-class; STUDENT=own class; PARENT=linked classes |
| Schedules | Create/update/delete | ADMIN, TEACHER | TEACHER hanya mapel-kelas yang dia ajar |
| Schedule Templates | Read/update template | ADMIN | Full access |
| Attendance Sessions | Read session | ADMIN, TEACHER, STUDENT, PARENT | TEACHER=own/taken-by/managed; STUDENT=own class; PARENT=linked classes |
| Attendance Sessions | Create/update/delete | ADMIN, TEACHER | TEACHER hanya mapel-kelas yang dia ajar |
| Attendance Records | Read record | ADMIN, TEACHER, STUDENT, PARENT | STUDENT=self; PARENT=linked child |
| Attendance Records | Update single record | ADMIN, TEACHER | TEACHER sesuai scope sesi |
| Attendance Session Records | Bulk upsert record | ADMIN, TEACHER | TEACHER sesuai scope sesi |
| Teacher Attendance | Read/create attendance guru | ADMIN, TEACHER | TEACHER=self |
| Materials | Read list/detail | ADMIN, TEACHER, STUDENT, PARENT | TEACHER=own; STUDENT/PARENT sesuai class scope |
| Materials | Create/update/delete | ADMIN, TEACHER | TEACHER hanya mapel-kelas yang dia ajar |
| Material Attachments | Add/delete attachment | ADMIN, TEACHER | TEACHER hanya pada material miliknya |
| Assignments | Read list/detail | ADMIN, TEACHER, STUDENT, PARENT | TEACHER=own; STUDENT/PARENT sesuai class scope |
| Assignments | Create/update/delete | ADMIN, TEACHER | TEACHER hanya mapel-kelas yang dia ajar |
| Assignment Classes/Questions | Set relasi class/question | ADMIN, TEACHER | TEACHER hanya assignment miliknya |
| Assignment Submissions | Read by assignment | ADMIN, TEACHER, STUDENT, PARENT | STUDENT=self; PARENT=linked child; TEACHER=owner assignment |
| Submission Detail | Update submission | ADMIN, TEACHER, STUDENT | STUDENT=self; TEACHER=owner assignment |
| Grades | Read grade records | ADMIN, TEACHER, STUDENT, PARENT | STUDENT=self; PARENT=linked child |
| Grade Summary | Read grade summary | ADMIN, TEACHER | TEACHER=scoped ke assignment miliknya |
| Notes | Read/create notes | ADMIN, TEACHER, STUDENT, PARENT | Author dari session |
| Notes | Update/delete/pin | ADMIN, TEACHER, STUDENT, PARENT | Non-admin hanya author |
| Forum Threads | Read/create thread | ADMIN, TEACHER, STUDENT | Parent diblokir |
| Forum Threads | Update/lock/pin/upvote | ADMIN, TEACHER, STUDENT | Lock/pin moderator/admin; owner rules pada update |
| Forum Replies | Read/create/update/upvote | ADMIN, TEACHER, STUDENT | Parent diblokir; lock-thread enforcement aktif |
| Calendar Events | Read events | ADMIN, TEACHER, STUDENT, PARENT | STUDENT/PARENT scoped class + global event |
| Calendar Events | Create/update/delete | ADMIN, TEACHER | TEACHER hanya event yang dibuat sendiri |
| Calendar Event Classes | Set class links | ADMIN, TEACHER | TEACHER hanya event yang dibuat sendiri |
| Analytics Overview | Read | ADMIN, TEACHER, STUDENT, PARENT | Auth required |
| Analytics Attendance | Read | ADMIN, TEACHER | TEACHER scoped ke sesi miliknya |
| Analytics Grades | Read | ADMIN, TEACHER | TEACHER scoped ke assignment miliknya |
| Analytics Demographics | Read | ADMIN | Full access |
| School Profile | Read | ADMIN, TEACHER, STUDENT, PARENT | Auth required |
| School Profile | Update | ADMIN | Full access |
| Questions | Read/create/update/delete | ADMIN, TEACHER | Full access by role |
| Question Packages | Read/create/update/delete | ADMIN, TEACHER | Full access by role |
| Question Package Questions | Set package-question mapping | ADMIN, TEACHER | Full access by role |

## Catatan Approval

- Dokumen ini adalah draft teknis hasil implementasi backend saat ini.
- Status approval Product + Engineering: `Pending`.
