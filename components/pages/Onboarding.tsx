'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import {
  completeOnboarding,
  getAuthSession,
  getOnboardingStatus,
  linkOnboardingChild,
} from "@/lib/handlers/auth";
import { createAcademicYear, listAcademicYears } from "@/lib/handlers/academic-years";
import {
  getNotificationPreferences,
  getScheduleTemplates,
  getSchoolProfile,
  updateNotificationPreferences,
  updateScheduleTemplates,
  updateSchoolProfile,
} from "@/lib/handlers/settings";
import { getUserProfile, updateUserProfile } from "@/lib/handlers/users";
import { OnboardingStatus } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";

type SessionPayload = {
  userId: string;
  name: string;
  role: string;
  canUseDebugPanel: boolean;
  onboardingCompleted: boolean;
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

type QuickProfileForm = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
};

type AdminOptionalState = {
  applyAcademicYear: boolean;
  applyScheduleTemplate: boolean;
  applyNotifications: boolean;
};

const DEFAULT_SCHEDULE_TEMPLATES = [
  { id: "onb-slot-1", name: "Jam 1", startTime: "07:00", endTime: "08:00", duration: 60, isBreak: false },
  { id: "onb-slot-2", name: "Jam 2", startTime: "08:00", endTime: "09:00", duration: 60, isBreak: false },
  { id: "onb-break-1", name: "Istirahat", startTime: "09:00", endTime: "09:30", duration: 30, isBreak: true },
  { id: "onb-slot-3", name: "Jam 3", startTime: "09:30", endTime: "10:30", duration: 60, isBreak: false },
  { id: "onb-slot-4", name: "Jam 4", startTime: "10:30", endTime: "11:30", duration: 60, isBreak: false },
];

const toDateInput = (value: Date) => value.toISOString().slice(0, 10);

export default function Onboarding() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);

  const [adminProfile, setAdminProfile] = useState<AdminSchoolProfileForm>({
    schoolCode: "",
    name: "",
    address: "",
    email: "",
    phone: "",
    website: "",
    principalName: "",
  });
  const [quickProfile, setQuickProfile] = useState<QuickProfileForm>({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });
  const [childStudentId, setChildStudentId] = useState("");
  const [academicYearForm, setAcademicYearForm] = useState({
    year: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    semester: "ODD",
    startDate: toDateInput(new Date()),
    endDate: toDateInput(
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 180)
    ),
  });
  const [notificationForm, setNotificationForm] = useState({
    emailNotifications: true,
    assignmentReminders: true,
    attendanceAlerts: true,
    gradePublished: true,
  });
  const [adminOptional, setAdminOptional] = useState<AdminOptionalState>({
    applyAcademicYear: false,
    applyScheduleTemplate: false,
    applyNotifications: false,
  });

  const requiredStepDone = useMemo(() => {
    if (!status) return false;
    const requiredStep = status.steps.find((item) => item.required);
    return Boolean(requiredStep?.completed);
  }, [status]);

  const refreshOnboardingStatus = async () => {
    const nextStatus = await getOnboardingStatus();
    setStatus(nextStatus);
    if (nextStatus.onboardingCompleted) {
      router.replace("/dashboard");
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [sessionResult, onboardingResult] = await Promise.all([
          getAuthSession(),
          getOnboardingStatus(),
        ]);
        if (!active) return;
        if (onboardingResult.onboardingCompleted) {
          router.replace("/dashboard");
          return;
        }
        setSession(sessionResult);
        setStatus(onboardingResult);

        if (sessionResult.role === ROLES.ADMIN) {
          const [schoolProfileResult, notificationResult] = await Promise.allSettled([
            getSchoolProfile(),
            getNotificationPreferences(),
          ]);
          if (!active) return;
          if (schoolProfileResult.status === "fulfilled") {
            setAdminProfile({
              schoolCode:
                onboardingResult.schoolCode ??
                schoolProfileResult.value.schoolCode ??
                "",
              name: schoolProfileResult.value.name ?? "",
              address: schoolProfileResult.value.address ?? "",
              email: schoolProfileResult.value.email ?? "",
              phone: schoolProfileResult.value.phone ?? "",
              website: schoolProfileResult.value.website ?? "",
              principalName: schoolProfileResult.value.principalName ?? "",
            });
          } else {
            setAdminProfile((prev) => ({
              ...prev,
              schoolCode: onboardingResult.schoolCode ?? prev.schoolCode,
            }));
          }
          if (notificationResult.status === "fulfilled") {
            setNotificationForm(notificationResult.value);
          }
        } else {
          const profile = await getUserProfile(sessionResult.userId);
          if (!active) return;
          setQuickProfile({
            firstName: profile.firstName ?? "",
            lastName: profile.lastName ?? "",
            phone: profile.phone ?? "",
            address: profile.address ?? "",
          });
        }
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
  }, [router, toast]);

  const handleSaveAdminProfile = async () => {
    if (!adminProfile.name || !adminProfile.address || !adminProfile.email) {
      toast({
        title: "Data belum lengkap",
        description: "Nama sekolah, alamat, dan email wajib diisi.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      await updateSchoolProfile({
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
        description: "Langkah wajib admin sudah diperbarui.",
      });
    } catch (error) {
      toast({
        title: "Gagal menyimpan profil sekolah",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveQuickProfile = async () => {
    if (!session) return;
    try {
      setIsSaving(true);
      const fullName = `${quickProfile.firstName} ${quickProfile.lastName}`.trim();
      await updateUserProfile(session.userId, {
        firstName: quickProfile.firstName.trim(),
        lastName: quickProfile.lastName.trim(),
        phone: quickProfile.phone.trim(),
        address: quickProfile.address.trim(),
        name: fullName || undefined,
      });
      await refreshOnboardingStatus();
      toast({
        title: "Profil berhasil disimpan",
        description: "Anda bisa melanjutkan onboarding.",
      });
    } catch (error) {
      toast({
        title: "Gagal menyimpan profil",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkChild = async () => {
    if (!childStudentId.trim()) {
      toast({
        title: "ID siswa belum diisi",
        description: "Masukkan ID akun siswa untuk dihubungkan.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSaving(true);
      const linked = await linkOnboardingChild(childStudentId.trim());
      setChildStudentId("");
      await refreshOnboardingStatus();
      toast({
        title: "Akun anak terhubung",
        description: `${linked.child.name} berhasil ditautkan.`,
      });
    } catch (error) {
      toast({
        title: "Gagal menghubungkan akun anak",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const runAdminOptionalSetup = async () => {
    if (adminOptional.applyAcademicYear) {
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
    }
    if (adminOptional.applyScheduleTemplate) {
      const templates = await getScheduleTemplates();
      if (!templates.length) {
        await updateScheduleTemplates(DEFAULT_SCHEDULE_TEMPLATES);
      }
    }
    if (adminOptional.applyNotifications) {
      await updateNotificationPreferences(notificationForm);
    }
  };

  const handleComplete = async (skipOptional: boolean) => {
    if (!requiredStepDone) {
      toast({
        title: "Langkah wajib belum selesai",
        description: "Selesaikan langkah wajib sebelum menyelesaikan onboarding.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      if (!skipOptional && session?.role === ROLES.ADMIN) {
        await runAdminOptionalSetup();
      }
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

  if (isLoading || !status || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Memuat onboarding...
      </div>
    );
  }

  const isAdmin = session.role === ROLES.ADMIN;
  const isParent = session.role === ROLES.PARENT;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Setup Awal Akun</CardTitle>
          <CardDescription>
            Lanjutkan konfigurasi awal untuk role{" "}
            <Badge variant="outline">{ROLE_LABELS[session.role as keyof typeof ROLE_LABELS]}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {status.steps.map((step) => (
            <div
              key={step.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">
                  {step.required ? "Wajib diselesaikan" : "Opsional"}
                </p>
              </div>
              <Badge variant={step.completed ? "default" : "secondary"}>
                {step.completed ? "Selesai" : "Belum"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {isAdmin ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Langkah Wajib: Profil Sekolah</CardTitle>
              <CardDescription>
                Isi data inti sekolah sebelum menggunakan dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schoolCode">Kode Sekolah</Label>
                <Input
                  id="schoolCode"
                  value={adminProfile.schoolCode}
                  readOnly
                  placeholder="Akan dibuat otomatis"
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
                  <Label htmlFor="schoolPhone">Telepon (opsional)</Label>
                  <Input
                    id="schoolPhone"
                    value={adminProfile.phone}
                    onChange={(event) =>
                      setAdminProfile((prev) => ({ ...prev, phone: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolWebsite">Website (opsional)</Label>
                  <Input
                    id="schoolWebsite"
                    value={adminProfile.website}
                    onChange={(event) =>
                      setAdminProfile((prev) => ({ ...prev, website: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolPrincipal">Kepala Sekolah (opsional)</Label>
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
              <div className="flex justify-end">
                <Button onClick={handleSaveAdminProfile} disabled={isSaving}>
                  Simpan Profil Sekolah
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Langkah Opsional: Konfigurasi Awal</CardTitle>
              <CardDescription>
                Bisa disetel sekarang atau ditunda via tombol &quot;Setting nanti&quot;.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="opt-academic-year"
                    checked={adminOptional.applyAcademicYear}
                    onCheckedChange={(checked) =>
                      setAdminOptional((prev) => ({
                        ...prev,
                        applyAcademicYear: Boolean(checked),
                      }))
                    }
                  />
                  <Label htmlFor="opt-academic-year">
                    Buat tahun ajaran awal (jika belum ada)
                  </Label>
                </div>
                <div className="grid gap-4 sm:grid-cols-4">
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
                      setAcademicYearForm((prev) => ({
                        ...prev,
                        startDate: event.target.value,
                      }))
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
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="opt-schedule-template"
                    checked={adminOptional.applyScheduleTemplate}
                    onCheckedChange={(checked) =>
                      setAdminOptional((prev) => ({
                        ...prev,
                        applyScheduleTemplate: Boolean(checked),
                      }))
                    }
                  />
                  <Label htmlFor="opt-schedule-template">
                    Terapkan template jam pelajaran default (jika belum ada)
                  </Label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="opt-notification"
                    checked={adminOptional.applyNotifications}
                    onCheckedChange={(checked) =>
                      setAdminOptional((prev) => ({
                        ...prev,
                        applyNotifications: Boolean(checked),
                      }))
                    }
                  />
                  <Label htmlFor="opt-notification">
                    Simpan preferensi notifikasi awal
                  </Label>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={notificationForm.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationForm((prev) => ({
                          ...prev,
                          emailNotifications: Boolean(checked),
                        }))
                      }
                    />
                    Notifikasi email
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={notificationForm.assignmentReminders}
                      onCheckedChange={(checked) =>
                        setNotificationForm((prev) => ({
                          ...prev,
                          assignmentReminders: Boolean(checked),
                        }))
                      }
                    />
                    Pengingat tugas
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={notificationForm.attendanceAlerts}
                      onCheckedChange={(checked) =>
                        setNotificationForm((prev) => ({
                          ...prev,
                          attendanceAlerts: Boolean(checked),
                        }))
                      }
                    />
                    Peringatan kehadiran
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={notificationForm.gradePublished}
                      onCheckedChange={(checked) =>
                        setNotificationForm((prev) => ({
                          ...prev,
                          gradePublished: Boolean(checked),
                        }))
                      }
                    />
                    Publikasi nilai
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleComplete(true)}
                  disabled={isSaving}
                >
                  Setting nanti
                </Button>
                <Button onClick={() => handleComplete(false)} disabled={isSaving}>
                  Selesaikan Onboarding
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Langkah Wajib: Profil Cepat</CardTitle>
              <CardDescription>
                Lengkapi profil dasar agar akun siap digunakan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nama Depan</Label>
                  <Input
                    id="firstName"
                    value={quickProfile.firstName}
                    onChange={(event) =>
                      setQuickProfile((prev) => ({ ...prev, firstName: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nama Belakang</Label>
                  <Input
                    id="lastName"
                    value={quickProfile.lastName}
                    onChange={(event) =>
                      setQuickProfile((prev) => ({ ...prev, lastName: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telepon</Label>
                  <Input
                    id="phone"
                    value={quickProfile.phone}
                    onChange={(event) =>
                      setQuickProfile((prev) => ({ ...prev, phone: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input
                    id="address"
                    value={quickProfile.address}
                    onChange={(event) =>
                      setQuickProfile((prev) => ({ ...prev, address: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveQuickProfile} disabled={isSaving}>
                  Simpan Profil
                </Button>
              </div>
            </CardContent>
          </Card>

          {isParent && (
            <Card>
              <CardHeader>
                <CardTitle>Langkah Opsional: Hubungkan Akun Anak</CardTitle>
                <CardDescription>
                  Masukkan ID siswa yang dibagikan oleh anak Anda.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <Input
                    value={childStudentId}
                    onChange={(event) => setChildStudentId(event.target.value)}
                    placeholder="Masukkan userId siswa"
                  />
                  <Button variant="outline" onClick={handleLinkChild} disabled={isSaving}>
                    Hubungkan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={() => handleComplete(false)} disabled={isSaving}>
              Selesaikan Onboarding
            </Button>
          </div>
        </>
      )}

      {status.reminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pengingat Setup</CardTitle>
            <CardDescription>
              Anda bisa melengkapi item berikut setelah onboarding selesai.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {status.reminders.map((reminder) => (
              <div key={reminder.id} className="rounded-md border p-3">
                <p className="font-medium">{reminder.title}</p>
                <p className="text-sm text-muted-foreground">{reminder.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
