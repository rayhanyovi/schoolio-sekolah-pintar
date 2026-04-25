'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Heart,
  School,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/constants";
import {
  completeOnboarding,
  getAuthSession,
  getOnboardingStatus,
  selectOnboardingRole,
} from "@/lib/handlers/auth";
import { createAcademicYear, listAcademicYears } from "@/lib/handlers/academic-years";
import { createClass, listClasses } from "@/lib/handlers/classes";
import { createMajor, listMajors } from "@/lib/handlers/majors";
import { getSchoolProfile, updateSchoolProfile } from "@/lib/handlers/settings";
import { createSubject, listSubjects } from "@/lib/handlers/subjects";
import { getUserProfile, updateUserProfile } from "@/lib/handlers/users";
import { OnboardingStatus } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";

type SessionPayload = {
  userId: string;
  name: string;
  role: Role;
  canUseDebugPanel: boolean;
  onboardingCompleted: boolean;
  schoolId: string | null;
};

type AdminSchoolProfileForm = {
  schoolCode: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  principalName: string;
};

type ProfileForm = {
  fullName: string;
  birthDate: string;
  avatarUrl: string;
  phone: string;
  address: string;
  bio: string;
};

type SubjectMajorScope =
  | "ALL"
  | "SCIENCE"
  | "SOCIAL"
  | "LANGUAGE"
  | "SCIENCE_SOCIAL"
  | "SOCIAL_LANGUAGE"
  | "SCIENCE_LANGUAGE";

type SubjectTemplate = {
  key: string;
  code: string;
  name: string;
  category: "SCIENCE" | "SOCIAL" | "LANGUAGE" | "ART" | "SPORTS" | "OTHER";
  hoursPerWeek: number;
  majorScope: SubjectMajorScope;
};

type MajorDraft = {
  code: string;
  name: string;
  description: string;
};

type ClassDraft = {
  name: string;
  grade: string;
  section: string;
  majorCode: string;
};

const DEFAULT_SUBJECT_TEMPLATES: SubjectTemplate[] = [
  {
    key: "math",
    code: "MAT",
    name: "Matematika",
    category: "SCIENCE",
    hoursPerWeek: 4,
    majorScope: "ALL",
  },
  {
    key: "indo",
    code: "BIN",
    name: "Bahasa Indonesia",
    category: "LANGUAGE",
    hoursPerWeek: 3,
    majorScope: "ALL",
  },
  {
    key: "english",
    code: "BIG",
    name: "Bahasa Inggris",
    category: "LANGUAGE",
    hoursPerWeek: 3,
    majorScope: "ALL",
  },
  {
    key: "german",
    code: "BJD",
    name: "Bahasa Jerman",
    category: "LANGUAGE",
    hoursPerWeek: 2,
    majorScope: "LANGUAGE",
  },
  {
    key: "science",
    code: "IPA",
    name: "Ilmu Pengetahuan Alam",
    category: "SCIENCE",
    hoursPerWeek: 3,
    majorScope: "SCIENCE_SOCIAL",
  },
  {
    key: "social",
    code: "IPS",
    name: "Ilmu Pengetahuan Sosial",
    category: "SOCIAL",
    hoursPerWeek: 3,
    majorScope: "SOCIAL_LANGUAGE",
  },
  {
    key: "pkn",
    code: "PKN",
    name: "Pendidikan Kewarganegaraan",
    category: "SOCIAL",
    hoursPerWeek: 2,
    majorScope: "ALL",
  },
  {
    key: "religion",
    code: "AGM",
    name: "Pendidikan Agama",
    category: "OTHER",
    hoursPerWeek: 2,
    majorScope: "ALL",
  },
  {
    key: "informatics",
    code: "INF",
    name: "Informatika",
    category: "SCIENCE",
    hoursPerWeek: 2,
    majorScope: "ALL",
  },
  {
    key: "arts",
    code: "SBD",
    name: "Seni Budaya",
    category: "ART",
    hoursPerWeek: 2,
    majorScope: "ALL",
  },
  {
    key: "sports",
    code: "PJK",
    name: "Pendidikan Jasmani",
    category: "SPORTS",
    hoursPerWeek: 2,
    majorScope: "ALL",
  },
  {
    key: "craft",
    code: "PRK",
    name: "Prakarya",
    category: "OTHER",
    hoursPerWeek: 2,
    majorScope: "ALL",
  },
  {
    key: "local-language",
    code: "BDA",
    name: "Bahasa Daerah",
    category: "LANGUAGE",
    hoursPerWeek: 2,
    majorScope: "LANGUAGE",
  },
  {
    key: "history",
    code: "SEJ",
    name: "Sejarah",
    category: "SOCIAL",
    hoursPerWeek: 2,
    majorScope: "SOCIAL",
  },
  {
    key: "geography",
    code: "GEO",
    name: "Geografi",
    category: "SOCIAL",
    hoursPerWeek: 2,
    majorScope: "SOCIAL",
  },
  {
    key: "economics",
    code: "EKO",
    name: "Ekonomi",
    category: "SOCIAL",
    hoursPerWeek: 2,
    majorScope: "SOCIAL",
  },
  {
    key: "physics",
    code: "FIS",
    name: "Fisika",
    category: "SCIENCE",
    hoursPerWeek: 3,
    majorScope: "SCIENCE",
  },
  {
    key: "chemistry",
    code: "KIM",
    name: "Kimia",
    category: "SCIENCE",
    hoursPerWeek: 3,
    majorScope: "SCIENCE",
  },
  {
    key: "biology",
    code: "BIO",
    name: "Biologi",
    category: "SCIENCE",
    hoursPerWeek: 3,
    majorScope: "SCIENCE",
  },
];

const toDateInput = (value: Date) => value.toISOString().slice(0, 10);
const emptyToNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const emptyMajorDraft = (): MajorDraft => ({
  code: "",
  name: "",
  description: "",
});

const emptyClassDraft = (): ClassDraft => ({
  name: "",
  grade: "",
  section: "",
  majorCode: "",
});

const normalizeMajorCode = (value: string) => value.trim().toUpperCase();

const majorBucketFromCode = (
  code: string
): "SCIENCE" | "SOCIAL" | "LANGUAGE" | null => {
  const normalized = normalizeMajorCode(code);
  const scienceHints = ["SCI", "IPA", "MIPA", "SAIN", "STEM"];
  const socialHints = ["SOC", "IPS", "SOS", "HUM"];
  const languageHints = ["LANG", "LNG", "BHS", "BAHASA"];
  if (scienceHints.some((hint) => normalized.includes(hint))) return "SCIENCE";
  if (socialHints.some((hint) => normalized.includes(hint))) return "SOCIAL";
  if (languageHints.some((hint) => normalized.includes(hint))) return "LANGUAGE";
  return null;
};

const resolveTemplateMajorIds = (
  scope: SubjectMajorScope,
  majors: Array<{ id: string; code: string }>
) => {
  if (scope === "ALL") return [];
  const allowedBuckets = scope.split("_");
  const matched = majors.filter((major) => {
    const bucket = majorBucketFromCode(major.code);
    return bucket ? allowedBuckets.includes(bucket) : false;
  });
  if (!matched.length) return [];
  return matched.map((major) => major.id);
};

const resolveAdminWizardStep = (onboardingStatus: OnboardingStatus) => {
  const profileDone =
    onboardingStatus.steps.find((step) => step.id === "profile-basic")?.completed ??
    false;
  const schoolDone =
    onboardingStatus.steps.find((step) => step.id === "school-profile")?.completed ??
    false;
  const yearDone =
    onboardingStatus.steps.find((step) => step.id === "academic-year")?.completed ??
    false;
  const subjectDone =
    onboardingStatus.steps.find((step) => step.id === "subject-template")?.completed ??
    false;
  const majorDone =
    onboardingStatus.steps.find((step) => step.id === "major-setup")?.completed ??
    false;
  const classDone =
    onboardingStatus.steps.find((step) => step.id === "class-setup")?.completed ??
    false;

  if (!profileDone) return 0 as const;
  if (!schoolDone) return 1 as const;
  if (!yearDone) return 2 as const;
  if (!subjectDone) return 3 as const;
  if (!majorDone) return 4 as const;
  if (!classDone) return 5 as const;
  return 5 as const;
};

export default function Onboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const inviteSchoolId = searchParams.get("schoolId")?.trim() ?? "";
  const inviteSchoolCode = searchParams.get("schoolCode")?.trim() ?? "";
  const hasInviteSchoolTarget = Boolean(inviteSchoolId || inviteSchoolCode);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);

  const [roleSelectionRole, setRoleSelectionRole] = useState<
    "ADMIN" | "TEACHER" | "STUDENT" | "PARENT" | null
  >(null);
  const [roleSelectionStep, setRoleSelectionStep] = useState<1 | 2>(1);
  const [roleSelectionSchoolCode, setRoleSelectionSchoolCode] = useState("");
  const [roleSelectionStudentCode, setRoleSelectionStudentCode] = useState("");
  const [adminWizardStep, setAdminWizardStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    fullName: "",
    birthDate: "",
    avatarUrl: "",
    phone: "",
    address: "",
    bio: "",
  });
  const [adminProfile, setAdminProfile] = useState<AdminSchoolProfileForm>({
    schoolCode: "",
    name: "",
    address: "",
    email: "",
    phone: "",
    website: "",
    principalName: "",
  });
  const [academicYearForm, setAcademicYearForm] = useState({
    year: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    semester: "ODD",
    startDate: toDateInput(new Date()),
    endDate: toDateInput(new Date(Date.now() + 1000 * 60 * 60 * 24 * 180)),
  });
  const [selectedTemplateKeys, setSelectedTemplateKeys] = useState<
    Record<string, boolean>
  >({
    math: true,
    indo: true,
    english: true,
    science: true,
    social: true,
    german: false,
    pkn: false,
    religion: true,
    informatics: false,
    arts: false,
    sports: false,
    craft: false,
    "local-language": false,
    history: false,
    geography: false,
    economics: false,
    physics: false,
    chemistry: false,
    biology: false,
  });
  const [majorDrafts, setMajorDrafts] = useState<MajorDraft[]>([emptyMajorDraft()]);
  const [classDrafts, setClassDrafts] = useState<ClassDraft[]>([emptyClassDraft()]);

  const requiredStepDone = useMemo(() => {
    if (!status) return false;
    return status.steps.filter((item) => item.required).every((item) => item.completed);
  }, [status]);

  const loadProfileForm = useCallback(async (userId: string) => {
    const profile = await getUserProfile(userId);
    setProfileForm({
      fullName: profile.name ?? "",
      birthDate: profile.birthDate ? toDateInput(profile.birthDate) : "",
      avatarUrl: profile.avatarUrl ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      bio: profile.bio ?? "",
    });
  }, []);

  const loadAdminProfile = useCallback(async (fallbackSchoolCode?: string | null) => {
    const schoolProfile = await getSchoolProfile();
    setAdminProfile({
      schoolCode: fallbackSchoolCode ?? schoolProfile.schoolCode ?? "",
      name: schoolProfile.name ?? "",
      address: schoolProfile.address ?? "",
      email: schoolProfile.email ?? "",
      phone: schoolProfile.phone ?? "",
      website: schoolProfile.website ?? "",
      principalName: schoolProfile.principalName ?? "",
    });
  }, []);

  const refreshContext = useCallback(async () => {
    const [sessionResult, onboardingResult] = await Promise.all([
      getAuthSession(),
      getOnboardingStatus(),
    ]);

    if (onboardingResult.onboardingCompleted) {
      router.replace("/dashboard");
      return;
    }

    setSession(sessionResult as SessionPayload);
    setStatus(onboardingResult);
    setRoleSelectionSchoolCode(inviteSchoolCode || onboardingResult.schoolCode || "");
    setRoleSelectionStudentCode("");
    setRoleSelectionStep(1);
    if (sessionResult.role === ROLES.ADMIN) {
      setAdminWizardStep(resolveAdminWizardStep(onboardingResult));
    }

    if (!onboardingResult.roleSelectionRequired) {
      await loadProfileForm(sessionResult.userId);
      if (sessionResult.role === ROLES.ADMIN) {
        await loadAdminProfile(onboardingResult.schoolCode);
      }
    }
  }, [inviteSchoolCode, loadAdminProfile, loadProfileForm, router]);

  const refreshOnboardingStatus = async () => {
    const nextStatus = await getOnboardingStatus();
    setStatus(nextStatus);
    if (session?.role === ROLES.ADMIN) {
      setAdminWizardStep(resolveAdminWizardStep(nextStatus));
    }
    if (nextStatus.onboardingCompleted) {
      router.replace("/dashboard");
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await refreshContext();
      } catch (error) {
        if (!active) return;
        toast({
          title: "Gagal memuat onboarding",
          description: error instanceof Error ? error.message : "Terjadi kesalahan",
          variant: "destructive",
        });
        router.replace("/auth");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [refreshContext, router, toast]);

  const handleRoleStepNext = () => {
    if (!roleSelectionRole) {
      toast({
        title: "Role belum dipilih",
        description: "Pilih peran akun terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }
    if (roleSelectionRole === ROLES.ADMIN) {
      void handleSubmitRoleSelection();
      return;
    }
    if (
      (roleSelectionRole === ROLES.TEACHER || roleSelectionRole === ROLES.STUDENT) &&
      hasInviteSchoolTarget
    ) {
      void handleSubmitRoleSelection();
      return;
    }
    setRoleSelectionStep(2);
  };

  const handleRoleStepBack = () => {
    if (roleSelectionStep === 2) {
      setRoleSelectionStep(1);
      return;
    }
    router.push("/auth");
  };

  const handleSubmitRoleSelection = async () => {
    if (!roleSelectionRole) {
      toast({
        title: "Role belum dipilih",
        description: "Pilih peran akun terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    const normalizedRoleSchoolCode = roleSelectionSchoolCode.trim();
    const resolvedSchoolId = inviteSchoolId;
    const resolvedSchoolCode = normalizedRoleSchoolCode || inviteSchoolCode;

    if (
      (roleSelectionRole === ROLES.TEACHER || roleSelectionRole === ROLES.STUDENT) &&
      !resolvedSchoolId &&
      !resolvedSchoolCode
    ) {
      toast({
        title: "Kode sekolah belum diisi",
        description: "Masukkan kode sekolah untuk role guru atau siswa.",
        variant: "destructive",
      });
      return;
    }

    if (roleSelectionRole === ROLES.PARENT && !roleSelectionStudentCode.trim()) {
      toast({
        title: "Kode siswa belum diisi",
        description: "Masukkan kode siswa untuk role orang tua.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      await selectOnboardingRole({
        role: roleSelectionRole,
        schoolId:
          roleSelectionRole === ROLES.TEACHER || roleSelectionRole === ROLES.STUDENT
            ? resolvedSchoolId || undefined
            : undefined,
        schoolCode:
          (roleSelectionRole === ROLES.TEACHER || roleSelectionRole === ROLES.STUDENT) &&
          !resolvedSchoolId
            ? resolvedSchoolCode || undefined
            : undefined,
        studentCode:
          roleSelectionRole === ROLES.PARENT
            ? roleSelectionStudentCode.trim()
            : undefined,
      });

      await refreshContext();
      toast({
        title: "Peran tersimpan",
        description: "Lanjut ke pengisian profil.",
      });
    } catch (error) {
      toast({
        title: "Gagal menyimpan peran",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!session) return false;
    if (!profileForm.fullName.trim() || !profileForm.birthDate) {
      toast({
        title: "Data diri belum lengkap",
        description: "Nama lengkap dan tanggal lahir wajib diisi.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsSaving(true);
      await updateUserProfile(session.userId, {
        name: profileForm.fullName.trim(),
        birthDate: profileForm.birthDate,
        avatarUrl: emptyToNull(profileForm.avatarUrl),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
        bio: profileForm.bio.trim(),
      });
      await refreshOnboardingStatus();
      toast({
        title: "Data diri tersimpan",
        description: "Fase data diri berhasil diperbarui.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Gagal menyimpan data diri",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAdminProfile = async () => {
    if (!adminProfile.name || !adminProfile.address || !adminProfile.email) {
      toast({
        title: "Profil sekolah belum lengkap",
        description: "Nama sekolah, alamat, dan email wajib diisi.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsSaving(true);
      await updateSchoolProfile({
        schoolCode: adminProfile.schoolCode.trim() || undefined,
        name: adminProfile.name.trim(),
        address: adminProfile.address.trim(),
        email: adminProfile.email.trim(),
        phone: adminProfile.phone.trim(),
        website: adminProfile.website.trim(),
        principalName: adminProfile.principalName.trim(),
      });
      await refreshOnboardingStatus();
      toast({
        title: "Profil sekolah tersimpan",
        description: "Fase profil sekolah sudah diperbarui.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Gagal menyimpan profil sekolah",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAcademicYear = async () => {
    try {
      setIsSaving(true);
      const years = await listAcademicYears();
      if (!years.length) {
        await createAcademicYear({
          year: academicYearForm.year,
          semester: academicYearForm.semester,
          startDate: academicYearForm.startDate,
          endDate: academicYearForm.endDate,
          isActive: true,
        });
      }
      await refreshOnboardingStatus();
      toast({
        title: "Tahun ajaran tersimpan",
        description:
          years.length > 0
            ? "Tahun ajaran sudah ada, tidak membuat data baru."
            : "Tahun ajaran awal berhasil dibuat.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Gagal menyimpan tahun ajaran",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSubjectTemplates = async () => {
    const selectedTemplates = DEFAULT_SUBJECT_TEMPLATES.filter(
      (item) => selectedTemplateKeys[item.key]
    );
    if (!selectedTemplates.length) {
      toast({
        title: "Template belum dipilih",
        description: "Pilih minimal satu mata pelajaran.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsSaving(true);
      const [existingSubjects, majorRows] = await Promise.all([
        listSubjects(),
        listMajors(),
      ]);
      const existingCodes = new Set(
        existingSubjects.map((item) => item.code.trim().toUpperCase())
      );

      let createdCount = 0;
      for (const item of selectedTemplates) {
        if (existingCodes.has(item.code.toUpperCase())) continue;
        const majorIds = resolveTemplateMajorIds(
          item.majorScope,
          majorRows.map((major) => ({ id: major.id, code: major.code }))
        );
        await createSubject({
          name: item.name,
          code: item.code,
          category: item.category,
          description: "Template onboarding admin",
          color: "bg-primary",
          hoursPerWeek: item.hoursPerWeek,
          appliesToAllMajors: majorIds.length === 0,
          majorIds: majorIds.length ? majorIds : undefined,
        });
        createdCount += 1;
      }

      await refreshOnboardingStatus();
      toast({
        title: "Template mata pelajaran tersimpan",
        description:
          createdCount > 0
            ? `${createdCount} mata pelajaran berhasil ditambahkan.`
            : "Semua template yang dipilih sudah tersedia.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Gagal menyimpan template mata pelajaran",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMajorSetup = async () => {
    const draftRows = majorDrafts.filter(
      (item) => item.code.trim() || item.name.trim() || item.description.trim()
    );
    if (!draftRows.length) {
      toast({
        title: "Setup jurusan dilewati",
        description: "Anda bisa menambahkan jurusan nanti dari menu Jurusan.",
      });
      return true;
    }

    for (const row of draftRows) {
      if (!row.code.trim()) {
        toast({
          title: "Kode jurusan belum lengkap",
          description: "Setiap jurusan wajib memiliki kode.",
          variant: "destructive",
        });
        return false;
      }
    }

    try {
      setIsSaving(true);
      const existingMajors = await listMajors();
      const existingCodes = new Set(
        existingMajors.map((item) => normalizeMajorCode(item.code))
      );

      let createdCount = 0;
      for (const row of draftRows) {
        const code = normalizeMajorCode(row.code);
        if (existingCodes.has(code)) continue;
        await createMajor({
          code,
          name: row.name.trim() || code,
          description: row.description.trim() || null,
        });
        createdCount += 1;
      }

      await refreshOnboardingStatus();
      toast({
        title: "Setup jurusan tersimpan",
        description:
          createdCount > 0
            ? `${createdCount} jurusan berhasil ditambahkan.`
            : "Semua kode jurusan sudah ada sebelumnya.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Gagal menyimpan jurusan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClassSetup = async () => {
    const draftRows = classDrafts.filter(
      (item) =>
        item.name.trim() || item.grade.trim() || item.section.trim() || item.majorCode.trim()
    );
    if (!draftRows.length) {
      toast({
        title: "Setup kelas dilewati",
        description: "Anda bisa menambahkan kelas nanti dari menu Kelas.",
      });
      return true;
    }

    for (const row of draftRows) {
      if (!row.name.trim() || !row.grade.trim() || !row.section.trim()) {
        toast({
          title: "Data kelas belum lengkap",
          description: "Nama kelas, tingkat, dan rombel wajib diisi.",
          variant: "destructive",
        });
        return false;
      }
      const parsedGrade = Number(row.grade);
      if (!Number.isInteger(parsedGrade) || parsedGrade <= 0) {
        toast({
          title: "Tingkat kelas tidak valid",
          description: "Tingkat harus berupa angka lebih dari 0.",
          variant: "destructive",
        });
        return false;
      }
    }

    try {
      setIsSaving(true);
      const [existingMajors, existingClasses] = await Promise.all([
        listMajors(),
        listClasses(),
      ]);
      const majorCodes = new Set(
        existingMajors.map((item) => normalizeMajorCode(item.code))
      );
      const existingClassKeys = new Set(
        existingClasses.map((item) =>
          `${item.name.trim().toUpperCase()}::${item.section.trim().toUpperCase()}::${item.grade}`
        )
      );

      let createdCount = 0;
      for (const row of draftRows) {
        const grade = Number(row.grade);
        const key = `${row.name.trim().toUpperCase()}::${row.section
          .trim()
          .toUpperCase()}::${grade}`;
        if (existingClassKeys.has(key)) continue;

        const majorCode = normalizeMajorCode(row.majorCode);
        if (majorCode && !majorCodes.has(majorCode)) {
          toast({
            title: "Kode jurusan tidak ditemukan",
            description: `Jurusan ${majorCode} belum ada. Tambahkan dulu di step jurusan atau kosongkan jurusan kelas.`,
            variant: "destructive",
          });
          return false;
        }

        await createClass({
          name: row.name.trim(),
          grade,
          section: row.section.trim(),
          major: majorCode || null,
        });
        createdCount += 1;
      }

      await refreshOnboardingStatus();
      toast({
        title: "Setup kelas tersimpan",
        description:
          createdCount > 0
            ? `${createdCount} kelas berhasil ditambahkan.`
            : "Semua kelas yang diinput sudah ada.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Gagal menyimpan kelas",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async (skipLocalGuard = false) => {
    if (!skipLocalGuard && !requiredStepDone) {
      toast({
        title: "Fase onboarding belum lengkap",
        description: "Selesaikan semua langkah wajib sebelum masuk dashboard.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSaving(true);
      const result = await completeOnboarding();
      router.replace(result.redirectTo);
    } catch (error) {
      toast({
        title: "Gagal menyelesaikan onboarding",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdminStepBack = () => {
    setAdminWizardStep((prev) =>
      prev > 0 ? ((prev - 1) as 0 | 1 | 2 | 3 | 4 | 5) : prev
    );
  };

  const handleAdminStepNext = async () => {
    if (adminWizardStep === 0) {
      const saved = await handleSaveProfile();
      if (saved) setAdminWizardStep(1);
      return;
    }
    if (adminWizardStep === 1) {
      const saved = await handleSaveAdminProfile();
      if (saved) setAdminWizardStep(2);
      return;
    }
    if (adminWizardStep === 2) {
      const saved = await handleSaveAcademicYear();
      if (saved) setAdminWizardStep(3);
      return;
    }
    if (adminWizardStep === 3) {
      const saved = await handleSaveSubjectTemplates();
      if (saved) setAdminWizardStep(4);
      return;
    }
    if (adminWizardStep === 4) {
      const saved = await handleSaveMajorSetup();
      if (saved) setAdminWizardStep(5);
      return;
    }
    if (adminWizardStep === 5) {
      const saved = await handleSaveClassSetup();
      if (saved) {
        await handleComplete(true);
      }
    }
  };

  const handleSkipOptionalAdminStep = async () => {
    if (adminWizardStep === 4) {
      setAdminWizardStep(5);
      return;
    }
    if (adminWizardStep === 5) {
      await handleComplete(true);
    }
  };

  const updateMajorDraft = (index: number, next: Partial<MajorDraft>) => {
    setMajorDrafts((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...next } : item))
    );
  };

  const removeMajorDraft = (index: number) => {
    setMajorDrafts((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const updateClassDraft = (index: number, next: Partial<ClassDraft>) => {
    setClassDrafts((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...next } : item))
    );
  };

  const removeClassDraft = (index: number) => {
    setClassDrafts((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  if (isLoading || !status || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Memuat onboarding...
      </div>
    );
  }

  if (status.roleSelectionRequired) {
    const roleOptions: Array<{
      role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
      title: string;
      description: string;
      icon: typeof School;
    }> = [
      {
        role: ROLES.ADMIN,
        title: "Admin",
        description: "Buat dan kelola sekolah",
        icon: School,
      },
      {
        role: ROLES.TEACHER,
        title: "Guru",
        description: "Kelola kelas dan materi",
        icon: GraduationCap,
      },
      {
        role: ROLES.STUDENT,
        title: "Siswa",
        description: "Belajar dan kerjakan tugas",
        icon: UserRound,
      },
      {
        role: ROLES.PARENT,
        title: "Orang Tua",
        description: "Pantau progres anak",
        icon: Heart,
      },
    ].filter((item) => status.availableRoles.includes(item.role));

    const roleStepIndex = roleSelectionStep === 1 ? 2 : 3;

    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
        <Card>
          <CardContent className="space-y-8 pt-6">
            <div className="flex items-center justify-center gap-4 text-sm">
              {[
                { number: 1, label: "Akun", done: true, active: false },
                {
                  number: 2,
                  label: "Peran",
                  done: roleStepIndex > 2,
                  active: roleStepIndex === 2,
                },
                {
                  number: 3,
                  label: "Kode",
                  done: false,
                  active: roleStepIndex === 3,
                },
                { number: 4, label: "Profil", done: false, active: false },
              ].map((item, index) => (
                <div key={item.number} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold",
                        item.done
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : item.active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 text-muted-foreground",
                      ].join(" ")}
                    >
                      {item.done ? <CheckCircle2 className="h-5 w-5" /> : item.number}
                    </div>
                    <span
                      className={
                        item.active ? "font-medium text-foreground" : "text-muted-foreground"
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                  {index < 3 && <div className="h-px w-12 bg-border" />}
                </div>
              ))}
            </div>

            {roleSelectionStep === 1 ? (
              <>
                <div className="space-y-1 text-center">
                  <h2 className="text-3xl font-semibold tracking-tight">Pilih Peran Anda</h2>
                  <p className="text-muted-foreground">
                    Sesuaikan pengalaman aplikasi dengan peran Anda.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {roleOptions.map((item) => {
                    const Icon = item.icon;
                    const isSelected = roleSelectionRole === item.role;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => setRoleSelectionRole(item.role)}
                        className={[
                          "rounded-xl border p-4 text-left transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40",
                        ].join(" ")}
                      >
                        <div className="mb-4 inline-flex rounded-lg bg-muted p-2">
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between gap-3">
                  <Button variant="outline" onClick={handleRoleStepBack} disabled={isSaving}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Kembali
                  </Button>
                  <Button onClick={handleRoleStepNext} disabled={isSaving || !roleSelectionRole}>
                    Lanjutkan
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight">Masukkan Kode</h2>
                  <p className="text-muted-foreground">
                    {roleSelectionRole === ROLES.ADMIN
                      ? "Admin tidak perlu kode. Lanjutkan untuk membuat sekolah baru."
                      : roleSelectionRole === ROLES.PARENT
                      ? "Masukkan kode siswa untuk menghubungkan akun orang tua."
                      : hasInviteSchoolTarget
                      ? "Sekolah dari link invite sudah terdeteksi. Lanjutkan untuk menerapkan otomatis."
                      : "Masukkan kode sekolah untuk bergabung ke sekolah yang tepat."}
                  </p>
                </div>

                {(roleSelectionRole === ROLES.TEACHER ||
                  roleSelectionRole === ROLES.STUDENT) &&
                  !hasInviteSchoolTarget && (
                  <div className="space-y-2">
                    <Label htmlFor="roleSchoolCode">Kode Sekolah</Label>
                    <Input
                      id="roleSchoolCode"
                      value={roleSelectionSchoolCode}
                      onChange={(event) => setRoleSelectionSchoolCode(event.target.value)}
                      placeholder="Mis: SCH-ABC12345"
                    />
                  </div>
                )}
                {(roleSelectionRole === ROLES.TEACHER ||
                  roleSelectionRole === ROLES.STUDENT) &&
                  hasInviteSchoolTarget && (
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                      Kode sekolah dari link invite akan dipakai otomatis.
                    </div>
                  )}

                {roleSelectionRole === ROLES.PARENT && (
                  <div className="space-y-2">
                    <Label htmlFor="roleStudentCode">Kode Siswa</Label>
                    <Input
                      id="roleStudentCode"
                      value={roleSelectionStudentCode}
                      onChange={(event) => setRoleSelectionStudentCode(event.target.value)}
                      placeholder="Masukkan userId siswa"
                    />
                    <p className="text-xs text-muted-foreground">
                      Kode siswa dibagikan oleh akun siswa.
                    </p>
                  </div>
                )}

                <div className="flex justify-between gap-3">
                  <Button variant="outline" onClick={handleRoleStepBack} disabled={isSaving}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Kembali
                  </Button>
                  <Button onClick={handleSubmitRoleSelection} disabled={isSaving}>
                    Lanjutkan
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = session.role === ROLES.ADMIN;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-center gap-4 text-sm">
            {[
              { number: 1, label: "Akun", done: true, active: false },
              { number: 2, label: "Peran", done: true, active: false },
              { number: 3, label: "Kode", done: true, active: false },
              { number: 4, label: "Profil", done: requiredStepDone, active: true },
            ].map((item, index) => (
              <div key={item.number} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold",
                      item.done
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : item.active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30 text-muted-foreground",
                    ].join(" ")}
                  >
                    {item.done ? <CheckCircle2 className="h-5 w-5" /> : item.number}
                  </div>
                  <span
                    className={
                      item.active ? "font-medium text-foreground" : "text-muted-foreground"
                    }
                  >
                    {item.label}
                  </span>
                </div>
                {index < 3 && <div className="h-px w-12 bg-border" />}
              </div>
            ))}
          </div>
          <div className="text-center">
            <Badge variant="outline">
              Role: {ROLE_LABELS[session.role as keyof typeof ROLE_LABELS]}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {adminWizardStep === 0 && "Profil"}
              {adminWizardStep === 1 && "Profil Sekolah"}
              {adminWizardStep === 2 && "Tahun Ajaran"}
              {adminWizardStep === 3 && "Template Mata Pelajaran"}
              {adminWizardStep === 4 && "Setup Jurusan (Opsional)"}
              {adminWizardStep === 5 && "Setup Kelas (Opsional)"}
            </CardTitle>
            <CardDescription>
              {adminWizardStep === 0 &&
                "Lengkapi profil personal sebelum lanjut ke setup sekolah."}
              {adminWizardStep === 1 &&
                "Isi profil sekolah inti yang akan dibuat oleh admin."}
              {adminWizardStep === 2 &&
                "Buat minimal satu tahun ajaran aktif untuk sekolah."}
              {adminWizardStep === 3 &&
                "Pilih template mata pelajaran awal. Mata pelajaran bisa dibatasi ke jurusan tertentu."}
              {adminWizardStep === 4 &&
                "Tambahkan jurusan sekolah (contoh: SCI, SOC, LANG). Anda bisa melewati dan atur nanti."}
              {adminWizardStep === 5 &&
                "Tambahkan daftar kelas awal. Anda bisa melewati dan atur nanti."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminWizardStep === 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profileName">Nama Lengkap</Label>
                    <Input
                      id="profileName"
                      value={profileForm.fullName}
                      onChange={(event) =>
                        setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))
                      }
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profileBirthDate">Tanggal Lahir</Label>
                    <Input
                      id="profileBirthDate"
                      type="date"
                      value={profileForm.birthDate}
                      onChange={(event) =>
                        setProfileForm((prev) => ({ ...prev, birthDate: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileAvatar">Foto Profil (URL)</Label>
                  <Input
                    id="profileAvatar"
                    value={profileForm.avatarUrl}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, avatarUrl: event.target.value }))
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profilePhone">Telepon</Label>
                    <Input
                      id="profilePhone"
                      value={profileForm.phone}
                      onChange={(event) =>
                        setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profileAddress">Alamat</Label>
                    <Input
                      id="profileAddress"
                      value={profileForm.address}
                      onChange={(event) =>
                        setProfileForm((prev) => ({ ...prev, address: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileBio">Bio</Label>
                  <Textarea
                    id="profileBio"
                    value={profileForm.bio}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, bio: event.target.value }))
                    }
                    placeholder="Perkenalkan diri Anda secara singkat"
                  />
                </div>
              </>
            )}

            {adminWizardStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="schoolCode">Kode Sekolah</Label>
                  <Input
                    id="schoolCode"
                    value={adminProfile.schoolCode}
                    onChange={(event) =>
                      setAdminProfile((prev) => ({ ...prev, schoolCode: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">Nama Sekolah</Label>
                    <Input
                      id="schoolName"
                      value={adminProfile.name}
                      onChange={(event) =>
                        setAdminProfile((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolEmail">Email Sekolah</Label>
                    <Input
                      id="schoolEmail"
                      value={adminProfile.email}
                      onChange={(event) =>
                        setAdminProfile((prev) => ({ ...prev, email: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolAddress">Alamat Sekolah</Label>
                  <Textarea
                    id="schoolAddress"
                    value={adminProfile.address}
                    onChange={(event) =>
                      setAdminProfile((prev) => ({ ...prev, address: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="schoolPhone">Telepon</Label>
                    <Input
                      id="schoolPhone"
                      value={adminProfile.phone}
                      onChange={(event) =>
                        setAdminProfile((prev) => ({ ...prev, phone: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolWebsite">Website</Label>
                    <Input
                      id="schoolWebsite"
                      value={adminProfile.website}
                      onChange={(event) =>
                        setAdminProfile((prev) => ({ ...prev, website: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolPrincipal">Kepala Sekolah</Label>
                    <Input
                      id="schoolPrincipal"
                      value={adminProfile.principalName}
                      onChange={(event) =>
                        setAdminProfile((prev) => ({
                          ...prev,
                          principalName: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {adminWizardStep === 2 && (
              <div className="flex flex-col gap-4">
                <Input
                  value={academicYearForm.year}
                  onChange={(event) =>
                    setAcademicYearForm((prev) => ({ ...prev, year: event.target.value }))
                  }
                  placeholder="2026/2027"
                />
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={academicYearForm.semester}
                  onChange={(event) =>
                    setAcademicYearForm((prev) => ({
                      ...prev,
                      semester: event.target.value,
                    }))
                  }
                >
                  <option value="ODD">Semester Ganjil</option>
                  <option value="EVEN">Semester Genap</option>
                </select>
                <Input
                  type="date"
                  value={academicYearForm.startDate}
                  onChange={(event) =>
                    setAcademicYearForm((prev) => ({ ...prev, startDate: event.target.value }))
                  }
                />
                <Input
                  type="date"
                  value={academicYearForm.endDate}
                  onChange={(event) =>
                    setAcademicYearForm((prev) => ({ ...prev, endDate: event.target.value }))
                  }
                />
              </div>
            )}

            {adminWizardStep === 3 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {DEFAULT_SUBJECT_TEMPLATES.map((item) => (
                  <label key={item.key} className="flex items-center gap-3 rounded-md border p-3">
                    <Checkbox
                      checked={Boolean(selectedTemplateKeys[item.key])}
                      onCheckedChange={(checked) =>
                        setSelectedTemplateKeys((prev) => ({
                          ...prev,
                          [item.key]: Boolean(checked),
                        }))
                      }
                    />
                    <span className="text-sm">
                      {item.name} ({item.code})
                    </span>
                  </label>
                ))}
              </div>
            )}

            {adminWizardStep === 4 && (
              <div className="space-y-3">
                {majorDrafts.map((row, index) => (
                  <div key={`major-${index}`} className="rounded-md border p-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input
                        value={row.code}
                        onChange={(event) =>
                          updateMajorDraft(index, { code: event.target.value.toUpperCase() })
                        }
                        placeholder="Kode (mis. SCI)"
                      />
                      <Input
                        value={row.name}
                        onChange={(event) =>
                          updateMajorDraft(index, { name: event.target.value })
                        }
                        placeholder="Nama jurusan"
                      />
                      <Input
                        value={row.description}
                        onChange={(event) =>
                          updateMajorDraft(index, { description: event.target.value })
                        }
                        placeholder="Deskripsi (opsional)"
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMajorDraft(index)}
                        disabled={majorDrafts.length <= 1}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMajorDrafts((prev) => [...prev, emptyMajorDraft()])}
                >
                  Tambah Baris Jurusan
                </Button>
              </div>
            )}

            {adminWizardStep === 5 && (
              <div className="space-y-3">
                {classDrafts.map((row, index) => (
                  <div key={`class-${index}`} className="rounded-md border p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        value={row.name}
                        onChange={(event) =>
                          updateClassDraft(index, { name: event.target.value })
                        }
                        placeholder="Nama kelas (mis. X IPA 1)"
                      />
                      <Input
                        value={row.grade}
                        onChange={(event) =>
                          updateClassDraft(index, { grade: event.target.value })
                        }
                        placeholder="Tingkat (mis. 10)"
                      />
                      <Input
                        value={row.section}
                        onChange={(event) =>
                          updateClassDraft(index, { section: event.target.value })
                        }
                        placeholder="Rombel (mis. A)"
                      />
                      <Input
                        value={row.majorCode}
                        onChange={(event) =>
                          updateClassDraft(index, {
                            majorCode: event.target.value.toUpperCase(),
                          })
                        }
                        placeholder="Kode jurusan (opsional)"
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeClassDraft(index)}
                        disabled={classDrafts.length <= 1}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setClassDrafts((prev) => [...prev, emptyClassDraft()])}
                >
                  Tambah Baris Kelas
                </Button>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleAdminStepBack}
                disabled={isSaving || adminWizardStep === 0}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Kembali
              </Button>
              <div className="flex gap-2">
                {(adminWizardStep === 4 || adminWizardStep === 5) && (
                  <Button variant="outline" onClick={handleSkipOptionalAdminStep} disabled={isSaving}>
                    Setting nanti
                  </Button>
                )}
                <Button onClick={handleAdminStepNext} disabled={isSaving}>
                  {adminWizardStep === 5 ? "Simpan & Selesaikan" : "Simpan & Lanjutkan"}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
              <CardDescription>
                Lengkapi profil personal sebelum menyelesaikan onboarding.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profileName">Nama Lengkap</Label>
                  <Input
                    id="profileName"
                    value={profileForm.fullName}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileBirthDate">Tanggal Lahir</Label>
                  <Input
                    id="profileBirthDate"
                    type="date"
                    value={profileForm.birthDate}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, birthDate: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileAvatar">Foto Profil (URL)</Label>
                <Input
                  id="profileAvatar"
                  value={profileForm.avatarUrl}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, avatarUrl: event.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profilePhone">Telepon</Label>
                  <Input
                    id="profilePhone"
                    value={profileForm.phone}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileAddress">Alamat</Label>
                  <Input
                    id="profileAddress"
                    value={profileForm.address}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, address: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileBio">Bio</Label>
                <Textarea
                  id="profileBio"
                  value={profileForm.bio}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, bio: event.target.value }))
                  }
                  placeholder="Perkenalkan diri Anda secara singkat"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => void handleSaveProfile()} disabled={isSaving}>
                  Simpan Data Diri
                </Button>
                <Button onClick={() => void handleComplete()} disabled={isSaving}>
                  Selesaikan Onboarding
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

    </div>
  );
}
