import { NextRequest } from "next/server";
import { jsonError, jsonOk, requireAuth, requireRole } from "@/lib/api";
import { jsonUnexpectedAuthError } from "@/lib/auth-error-response";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

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

  try {
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
        birthDate: true,
        schoolId: true,
        roleSelectedAt: true,
        onboardingCompletedAt: true,
      },
    });
    if (!user) {
      return jsonError("UNAUTHORIZED", "Authentication required", 401);
    }

    const schoolProfile = user.schoolId
      ? await prisma.schoolProfile.findUnique({
          where: { id: user.schoolId },
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
        })
      : null;

    const roleSelectionRequired =
      !user.roleSelectedAt && !user.onboardingCompletedAt;
    const availableRoles = [
      ROLES.ADMIN,
      ROLES.TEACHER,
      ROLES.STUDENT,
      ROLES.PARENT,
    ];
    const hasDisplayName = Boolean(
      user.name?.trim() ||
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    );
    const hasBirthDate = Boolean(user.birthDate);
    const profileComplete = hasDisplayName && hasBirthDate;

    if (roleSelectionRequired) {
      return jsonOk({
        role: auth.role,
        selectedRole: null,
        roleSelectionRequired: true,
        availableRoles,
        onboardingCompleted: false,
        schoolCode: null,
        steps: [
          {
            id: "role-selection",
            title: "Pilih role akun",
            required: true,
            completed: false,
          },
        ],
        reminders: [],
      });
    }

    const steps: OnboardingStep[] = [];
    const reminders: OnboardingReminder[] = [];

    if (auth.role === ROLES.ADMIN) {
      if (!auth.schoolId) {
        return jsonError("FORBIDDEN", "Akun admin belum memiliki sekolah", 403);
      }
      const [academicYearCount, subjectCount, majorCount, classCount] =
        await Promise.all([
          prisma.academicYear.count({ where: { schoolId: auth.schoolId } }),
          prisma.subject.count({ where: { schoolId: auth.schoolId } }),
          prisma.major.count({ where: { schoolId: auth.schoolId } }),
          prisma.class.count({ where: { schoolId: auth.schoolId } }),
        ]);
      const schoolProfileComplete = Boolean(
        schoolProfile?.name?.trim() &&
          schoolProfile?.address?.trim() &&
          schoolProfile?.email?.trim() &&
          schoolProfile?.schoolCode
      );
      steps.push(
        {
          id: "profile-basic",
          title: "Data diri (wajib)",
          required: true,
          completed: profileComplete,
        },
        {
          id: "school-profile",
          title: "Profil sekolah (wajib)",
          required: true,
          completed: schoolProfileComplete,
        },
        {
          id: "academic-year",
          title: "Tahun ajaran awal (wajib)",
          required: true,
          completed: academicYearCount > 0,
        },
        {
          id: "subject-template",
          title: "Template mata pelajaran (wajib)",
          required: true,
          completed: subjectCount > 0,
        },
        {
          id: "major-setup",
          title: "Setup jurusan (opsional)",
          required: false,
          completed: majorCount > 0,
        },
        {
          id: "class-setup",
          title: "Setup kelas (opsional)",
          required: false,
          completed: classCount > 0,
        }
      );

      if (!profileComplete) {
        reminders.push({
          id: "profile-basic",
          title: "Lengkapi data diri",
          description:
            "Isi nama lengkap dan tanggal lahir agar akun dapat digunakan penuh.",
          href: PROFILE_HREF,
        });
      }
      if (academicYearCount === 0) {
        reminders.push({
          id: "academic-year",
          title: "Buat tahun ajaran awal",
          description:
            "Tambahkan minimal satu tahun ajaran untuk memulai operasional.",
          href: SETTINGS_HREF,
        });
      }
      if (subjectCount === 0) {
        reminders.push({
          id: "subject-template",
          title: "Tambahkan template mata pelajaran",
          description:
            "Buat minimal satu mata pelajaran agar modul kelas dan jadwal siap dipakai.",
          href: SETTINGS_HREF,
        });
      }
    } else {
      steps.push({
        id: "profile-basic",
        title: "Data diri (wajib)",
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
      selectedRole: auth.role,
      roleSelectionRequired: false,
      availableRoles,
      onboardingCompleted: Boolean(user.onboardingCompletedAt),
      schoolCode: schoolProfile?.schoolCode ?? null,
      steps,
      reminders,
    });
  } catch (error) {
    return jsonUnexpectedAuthError(request, "onboarding", error);
  }
}
