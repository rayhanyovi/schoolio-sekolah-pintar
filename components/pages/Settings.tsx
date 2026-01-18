'use client';

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building2, 
  Calendar, 
  Clock, 
  Bell, 
  Save,
  CheckCircle
} from "lucide-react";
import {
  activateAcademicYear,
  listAcademicYears,
} from "@/lib/handlers/academic-years";
import {
  getSchoolProfile,
  getScheduleTemplates,
  updateSchoolProfile,
} from "@/lib/handlers/settings";
import {
  AcademicYearSummary,
  ScheduleTemplateSummary,
  SchoolProfileSummary,
} from "@/lib/schemas";
import { SEMESTERS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useRoleContext } from "@/hooks/useRoleContext";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function Settings() {
  const { role } = useRoleContext();
  const { toast } = useToast();
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfileSummary>({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    principalName: "",
    logoUrl: null,
  });
  const [academicYears, setAcademicYears] = useState<AcademicYearSummary[]>([]);
  const [scheduleTemplate, setScheduleTemplate] = useState<ScheduleTemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    assignmentReminders: true,
    attendanceAlerts: true,
    gradePublished: true,
  });

  const isAdmin = role === "ADMIN";

  const loadData = async () => {
    setIsLoading(true);
    const [profileResult, yearResult, templateResult] = await Promise.allSettled([
      getSchoolProfile(),
      listAcademicYears(),
      getScheduleTemplates(),
    ]);
    if (profileResult.status === "fulfilled") {
      setSchoolProfile(profileResult.value);
    }
    if (yearResult.status === "fulfilled") {
      setAcademicYears(yearResult.value);
    }
    if (templateResult.status === "fulfilled") {
      setScheduleTemplate(templateResult.value);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async () => {
    try {
      await updateSchoolProfile(schoolProfile);
      toast({ title: "Berhasil", description: "Profil sekolah berhasil disimpan" });
    } catch (error) {
      toast({ title: "Gagal menyimpan", description: "Periksa data profil sekolah" });
    }
  };

  const handleSetActiveYear = async (yearId: string) => {
    try {
      await activateAcademicYear(yearId);
      await loadData();
      toast({ title: "Berhasil", description: "Tahun ajaran aktif berhasil diubah" });
    } catch (error) {
      toast({ title: "Gagal mengubah", description: "Tidak dapat mengubah tahun ajaran" });
    }
  };

  const handleSaveNotifications = () => {
    toast({ title: "Berhasil", description: "Pengaturan notifikasi berhasil disimpan" });
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-muted-foreground">Akses Terbatas</h2>
          <p className="text-sm text-muted-foreground">Hanya Administrator yang dapat mengakses halaman ini</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola pengaturan sistem dan konfigurasi sekolah</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="academic" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Tahun Ajaran</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Jam Pelajaran</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifikasi</span>
          </TabsTrigger>
        </TabsList>

        {/* School Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Profil Sekolah
              </CardTitle>
              <CardDescription>Informasi umum tentang sekolah</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">Nama Sekolah</Label>
                  <Input
                    id="schoolName"
                    value={schoolProfile.name}
                    onChange={(e) => setSchoolProfile({ ...schoolProfile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="principalName">Kepala Sekolah</Label>
                  <Input
                    id="principalName"
                    value={schoolProfile.principalName}
                    onChange={(e) => setSchoolProfile({ ...schoolProfile, principalName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  value={schoolProfile.address}
                  onChange={(e) => setSchoolProfile({ ...schoolProfile, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telepon</Label>
                  <Input
                    id="phone"
                    value={schoolProfile.phone}
                    onChange={(e) => setSchoolProfile({ ...schoolProfile, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={schoolProfile.email}
                    onChange={(e) => setSchoolProfile({ ...schoolProfile, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={schoolProfile.website}
                    onChange={(e) => setSchoolProfile({ ...schoolProfile, website: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Year Tab */}
        <TabsContent value="academic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Tahun Ajaran
              </CardTitle>
              <CardDescription>Kelola tahun ajaran dan semester</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {academicYears.map((year) => (
                    <div
                      key={year.id}
                      className={`p-4 rounded-lg border ${year.isActive ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{year.year}</span>
                            <Badge variant={year.isActive ? "default" : "secondary"}>
                              Semester {SEMESTERS[year.semester]}
                            </Badge>
                            {year.isActive && (
                              <Badge variant="outline" className="text-success border-success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aktif
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(year.startDate, "d MMMM yyyy", { locale: id })} - {format(year.endDate, "d MMMM yyyy", { locale: id })}
                          </p>
                        </div>
                        {!year.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetActiveYear(year.id)}
                          >
                            Set Aktif
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Template Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Template Jam Pelajaran
              </CardTitle>
              <CardDescription>Atur durasi dan jadwal jam pelajaran</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {scheduleTemplate.map((slot, index) => (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        slot.isBreak ? "bg-warning/10 border border-warning/20" : "bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-8 text-center text-sm font-medium text-muted-foreground">
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-medium">{slot.name}</span>
                          {slot.isBreak && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Istirahat
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <Badge variant="secondary">{slot.duration} menit</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Pengaturan Notifikasi
              </CardTitle>
              <CardDescription>Kelola notifikasi sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifikasi Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Terima notifikasi melalui email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, emailNotifications: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pengingat Tugas</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifikasi untuk deadline tugas
                    </p>
                  </div>
                  <Switch
                    checked={notifications.assignmentReminders}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, assignmentReminders: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Peringatan Kehadiran</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifikasi untuk masalah kehadiran
                    </p>
                  </div>
                  <Switch
                    checked={notifications.attendanceAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, attendanceAlerts: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Nilai Dipublikasikan</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifikasi saat nilai baru dipublikasikan
                    </p>
                  </div>
                  <Switch
                    checked={notifications.gradePublished}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, gradePublished: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications}>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Pengaturan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
