import { NextRequest } from "next/server";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildSchoolCodeFromId } from "@/lib/school-code";

type OnboardingStep = {
  id: string;
  title: string;
  required: boolean;
  completed: boolean;
};

type OnboardingReminder = {
  id: string;
  title: string;
  description: string;
  href: string;
};

const SETTINGS_HREF = "/dashboard/settings";
const PROFILE_HREF = "/dashboard/profile";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const roleError = requireRole(auth, [
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.PARENT,
  ]);
  if (roleError) return roleError;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      name: true,
      role: true,
      firstName: true,
      lastName: true,
      phone: true,
      address: true,
      bio: true,
      onboardingCompletedAt: true,
    },
  });
  if (!user) {
    return jsonError("UNAUTHORIZED", "Authentication required", 401);
  }

  let schoolProfile = await prisma.schoolProfile.findFirst({
    select: {
      id: true,
      schoolCode: true,
      name: true,
      address: true,
      email: true,
      phone: true,
      website: true,
      principalName: true,
    },
  });
  if (schoolProfile && !schoolProfile.schoolCode) {
    schoolProfile = await prisma.schoolProfile.update({
      where: { id: schoolProfile.id },
      data: { schoolCode: buildSchoolCodeFromId(schoolProfile.id) },
      select: {
        id: true,
        schoolCode: true,
        name: true,
        address: true,
        email: true,
        phone: true,
        website: true,
        principalName: true,
      },
    });
  }

  const steps: OnboardingStep[] = [];
  const reminders: OnboardingReminder[] = [];

  if (auth.role === ROLES.ADMIN) {
    const academicYearCount = await prisma.academicYear.count();
    const scheduleTemplateCount = await prisma.scheduleTemplate.count();
    const notificationPreferenceCount = await prisma.notificationPreference.count(
      {
        where: { userId: auth.userId },
      }
    );
    const schoolProfileComplete = Boolean(
      schoolProfile?.name &&
        schoolProfile?.address &&
        schoolProfile?.email &&
        schoolProfile?.schoolCode
    );
    const schoolContactOptionalComplete = Boolean(
      schoolProfile?.phone && schoolProfile?.website && schoolProfile?.principalName
    );

    steps.push(
      {
        id: "school-profile",
        title: "Profil sekolah (wajib)",
        required: true,
        completed: schoolProfileComplete,
      },
      {
        id: "academic-year",
        title: "Tahun ajaran awal (opsional)",
        required: false,
        completed: academicYearCount > 0,
      },
      {
        id: "schedule-template",
        title: "Template jam pelajaran (opsional)",
        required: false,
        completed: scheduleTemplateCount > 0,
      },
      {
        id: "notification-preference",
        title: "Preferensi notifikasi (opsional)",
        required: false,
        completed: notificationPreferenceCount > 0,
      }
    );

    if (!schoolContactOptionalComplete) {
      reminders.push({
        id: "school-contact-optional",
        title: "Lengkapi profil sekolah lanjutan",
        description:
          "Tambahkan telepon, website, dan kepala sekolah agar profil lebih lengkap.",
        href: SETTINGS_HREF,
      });
    }
    if (academicYearCount === 0) {
      reminders.push({
        id: "academic-year",
        title: "Tentukan tahun ajaran aktif",
        description: "Buat tahun ajaran pertama agar modul akademik bisa dipakai penuh.",
        href: SETTINGS_HREF,
      });
    }
    if (scheduleTemplateCount === 0) {
      reminders.push({
        id: "schedule-template",
        title: "Atur template jam pelajaran",
        description: "Template jadwal mempermudah penyusunan jadwal kelas.",
        href: SETTINGS_HREF,
      });
    }
    if (notificationPreferenceCount === 0) {
      reminders.push({
        id: "notification-preference",
        title: "Atur preferensi notifikasi admin",
        description: "Aktifkan preferensi notifikasi sesuai kebutuhan operasional.",
        href: SETTINGS_HREF,
      });
    }
  } else {
    const profileComplete = Boolean(
      user.name || user.firstName || user.lastName || user.phone || user.address || user.bio
    );
    steps.push({
      id: "profile-quick",
      title: "Profil cepat",
      required: true,
      completed: profileComplete,
    });
    if (auth.role === ROLES.PARENT) {
      const linkedChildren = await prisma.parentStudent.count({
        where: { parentId: auth.userId },
      });
      steps.push({
        id: "link-child",
        title: "Hubungkan akun anak (opsional)",
        required: false,
        completed: linkedChildren > 0,
      });
      if (linkedChildren === 0) {
        reminders.push({
          id: "link-child",
          title: "Hubungkan akun anak",
          description:
            "Minta ID akun siswa dari anak Anda lalu hubungkan agar data dapat dipantau.",
          href: PROFILE_HREF,
        });
      }
    }
  }

  return jsonOk({
    role: auth.role,
    onboardingCompleted: Boolean(user.onboardingCompletedAt),
    schoolCode: schoolProfile?.schoolCode ?? null,
    steps,
    reminders,
  });
}
