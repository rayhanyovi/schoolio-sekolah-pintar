'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Users, ClipboardCheck, BarChart3, Eye, EyeOff, ArrowRight, Mail, Lock } from "lucide-react";
import { Logo } from "@/components/Logo";
import { APP_DESCRIPTION, ROLES, ROLE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setDebugAccess } from "@/lib/auth-session";
import { login, register } from "@/lib/handlers/auth";

type RegisterRole = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [registerRole, setRegisterRole] = useState<RegisterRole>(ROLES.STUDENT);
  const [schoolCode, setSchoolCode] = useState("");
  const [childStudentId, setChildStudentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const isDemoEnvironment = process.env.NODE_ENV !== "production";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const result = isLogin
        ? await login({
            identifier: identifier.trim(),
            password,
          })
        : await register({
            name: name.trim(),
            identifier: identifier.trim(),
            password,
            role: registerRole,
            schoolCode:
              registerRole === ROLES.ADMIN ? undefined : schoolCode.trim(),
            childStudentId:
              registerRole === ROLES.PARENT && childStudentId.trim()
                ? childStudentId.trim()
                : undefined,
          });

      setDebugAccess(result.canUseDebugPanel);
      toast({
        title: isLogin ? "Login berhasil" : "Registrasi berhasil",
        description: result.onboardingCompleted
          ? "Anda akan diarahkan ke dashboard."
          : "Lanjutkan setup awal akun Anda.",
      });
      router.push(result.onboardingCompleted ? "/dashboard" : "/onboarding");
    } catch (error) {
      setDebugAccess(false);
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat proses autentikasi.";
      toast({
        title: isLogin ? "Login gagal" : "Registrasi gagal",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: ClipboardCheck, title: "Absensi Digital", desc: "Kelola kehadiran siswa dengan mudah" },
    { icon: BookOpen, title: "Tugas & Materi", desc: "Distribusi materi dan penugasan online" },
    { icon: BarChart3, title: "Penilaian", desc: "Pantau progres belajar siswa" },
    { icon: Users, title: "Akses Orang Tua", desc: "Transparansi untuk wali murid" },
  ];

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-hero p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border border-primary-foreground/30 rounded-full" />
          <div className="absolute bottom-40 right-10 w-96 h-96 border border-primary-foreground/20 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 border border-primary-foreground/25 rounded-full" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary-foreground">Schoolio</span>
          </div>
          <p className="text-primary-foreground/80 text-lg mt-4 max-w-md">
            {APP_DESCRIPTION}
          </p>
          {isDemoEnvironment && (
            <p className="mt-4 text-sm text-primary-foreground/80">
              Demo debug: gunakan `admin / admin` untuk akses panel debug role-switch.
            </p>
          )}
        </div>

        <div className="relative z-10 space-y-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="flex items-start gap-4 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="h-12 w-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">{feature.title}</h3>
                <p className="text-primary-foreground/70 text-sm">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 text-primary-foreground/60 text-sm">
          © 2026 Schoolio. Hak Cipta Dilindungi.
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="lg" />
          </div>

          <Card variant="elevated" className="border-0">
            <CardHeader className="space-y-1 text-center pb-4">
              <CardTitle className="text-2xl font-bold">
                {isLogin ? "Selamat Datang Kembali" : "Buat Akun Baru"}
              </CardTitle>
              <CardDescription className="text-base">
                {isLogin
                  ? "Masuk ke akun Anda untuk melanjutkan"
                  : "Daftar dan lanjutkan setup awal sekolah"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap</Label>
                      <Input
                        id="name"
                        placeholder="Masukkan nama lengkap"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerRole">Daftar sebagai</Label>
                      <select
                        id="registerRole"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={registerRole}
                        onChange={(event) =>
                          setRegisterRole(event.target.value as RegisterRole)
                        }
                      >
                        <option value={ROLES.ADMIN}>{ROLE_LABELS.ADMIN}</option>
                        <option value={ROLES.TEACHER}>{ROLE_LABELS.TEACHER}</option>
                        <option value={ROLES.STUDENT}>{ROLE_LABELS.STUDENT}</option>
                        <option value={ROLES.PARENT}>{ROLE_LABELS.PARENT}</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="identifier">Email / Username</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="nama@sekolah.sch.id atau username"
                      className="pl-10"
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      required
                    />
                  </div>
                </div>

                {!isLogin && registerRole !== ROLES.ADMIN && (
                  <div className="space-y-2">
                    <Label htmlFor="schoolCode">Kode Sekolah</Label>
                    <Input
                      id="schoolCode"
                      type="text"
                      placeholder="Mis: SCH-ABC12345"
                      value={schoolCode}
                      onChange={(event) => setSchoolCode(event.target.value)}
                      required
                    />
                  </div>
                )}

                {!isLogin && registerRole === ROLES.PARENT && (
                  <div className="space-y-2">
                    <Label htmlFor="childStudentId">ID Akun Anak (opsional)</Label>
                    <Input
                      id="childStudentId"
                      type="text"
                      placeholder="Masukkan userId siswa"
                      value={childStudentId}
                      onChange={(event) => setChildStudentId(event.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Kata Sandi</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan kata sandi"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {!isLogin && (
                    <p className="text-xs text-muted-foreground">
                      Minimal 8 karakter.
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {isLogin ? "Masuk" : "Daftar"}
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <span className="text-muted-foreground">
                  {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}
                </span>{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary font-medium hover:underline"
                >
                  {isLogin ? "Daftar sekarang" : "Masuk di sini"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
