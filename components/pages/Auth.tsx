'use client';

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Users, ClipboardCheck, BarChart3, Eye, EyeOff, ArrowRight, Mail, Lock } from "lucide-react";
import { Logo } from "@/components/Logo";
import { APP_DESCRIPTION } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setDebugAccess } from "@/lib/auth-session";
import { forgotPassword, login, register, resetPassword } from "@/lib/handlers/auth";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const isDemoEnvironment = process.env.NODE_ENV !== "production";
  const inviteSchoolId = searchParams.get("schoolId")?.trim() ?? "";
  const inviteSchoolCode = searchParams.get("schoolCode")?.trim() ?? "";
  const resetToken = searchParams.get("resetToken")?.trim() ?? "";
  const isResetPasswordMode = resetToken.length > 0;

  const mode: "login" | "register" | "forgot" | "reset" = isResetPasswordMode
    ? "reset"
    : isForgotPassword
    ? "forgot"
    : isLogin
    ? "login"
    : "register";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "forgot") {
        const result = await forgotPassword(identifier.trim());
        toast({
          title: "Permintaan diproses",
          description: result.message,
        });
        return;
      }

      if (mode === "reset") {
        await resetPassword({
          token: resetToken,
          password,
          confirmPassword,
        });
        toast({
          title: "Password berhasil direset",
          description: "Silakan login dengan password baru.",
        });
        router.replace("/auth");
        setPassword("");
        setConfirmPassword("");
        return;
      }

      const result =
        mode === "login"
          ? await login({
              identifier: identifier.trim(),
              password,
            })
          : await register({
              email: identifier.trim(),
              password,
              confirmPassword,
            });

      setDebugAccess(result.canUseDebugPanel);
      toast({
        title: mode === "login" ? "Login berhasil" : "Registrasi berhasil",
        description: result.onboardingCompleted
          ? "Anda akan diarahkan ke dashboard."
          : "Lanjutkan setup awal akun Anda.",
      });
      if (result.mustChangePassword) {
        router.push("/change-password");
        return;
      }
      const onboardingParams = new URLSearchParams();
      if (inviteSchoolId) onboardingParams.set("schoolId", inviteSchoolId);
      if (!inviteSchoolId && inviteSchoolCode) {
        onboardingParams.set("schoolCode", inviteSchoolCode);
      }
      const onboardingUrl = onboardingParams.toString()
        ? `/onboarding?${onboardingParams.toString()}`
        : "/onboarding";
      router.push(result.onboardingCompleted ? "/dashboard" : onboardingUrl);
    } catch (error) {
      setDebugAccess(false);
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat proses autentikasi.";
      toast({
        title:
          mode === "login"
            ? "Login gagal"
            : mode === "register"
            ? "Registrasi gagal"
            : mode === "forgot"
            ? "Permintaan gagal"
            : "Reset password gagal",
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
                {mode === "login"
                  ? "Selamat Datang Kembali"
                  : mode === "register"
                  ? "Buat Akun Baru"
                  : mode === "forgot"
                  ? "Lupa Password"
                  : "Reset Password"}
              </CardTitle>
              <CardDescription className="text-base">
                {mode === "login"
                  ? "Masuk ke akun Anda untuk melanjutkan"
                  : mode === "register"
                  ? "Daftar dulu dengan email, lalu lanjutkan wizard onboarding"
                  : mode === "forgot"
                  ? "Masukkan email akun Anda untuk instruksi reset password"
                  : "Masukkan password baru untuk akun Anda"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode !== "reset" && (
                  <div className="space-y-2">
                    <Label htmlFor="identifier">
                      {mode === "login" ? "Email / Username" : "Email"}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="identifier"
                        type={mode === "login" ? "text" : "email"}
                        placeholder={
                          mode === "login"
                            ? "nama@sekolah.sch.id atau username"
                            : "nama@sekolah.sch.id"
                        }
                        className="pl-10"
                        value={identifier}
                        onChange={(event) => setIdentifier(event.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {mode !== "forgot" && (
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {mode === "reset" ? "Password Baru" : "Kata Sandi"}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={
                          mode === "reset"
                            ? "Masukkan password baru"
                            : "Masukkan kata sandi"
                        }
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
                    {mode !== "login" && (
                      <p className="text-xs text-muted-foreground">
                        Minimal 8 karakter.
                      </p>
                    )}
                  </div>
                )}

                {(mode === "register" || mode === "reset") && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ulangi kata sandi"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                    />
                  </div>
                )}

                {mode === "login" && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-sm text-primary font-medium hover:underline"
                      onClick={() => setIsForgotPassword(true)}
                    >
                      Lupa password?
                    </button>
                  </div>
                )}

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
                      {mode === "login"
                        ? "Masuk"
                        : mode === "register"
                        ? "Daftar"
                        : mode === "forgot"
                        ? "Kirim Instruksi"
                        : "Simpan Password Baru"}
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                {mode === "forgot" ? (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="text-primary font-medium hover:underline"
                  >
                    Kembali ke login
                  </button>
                ) : mode === "reset" ? (
                  <button
                    type="button"
                    onClick={() => router.replace("/auth")}
                    className="text-primary font-medium hover:underline"
                  >
                    Kembali ke login
                  </button>
                ) : (
                  <>
                    <span className="text-muted-foreground">
                      {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}
                    </span>{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setIsLogin(!isLogin);
                      }}
                      className="text-primary font-medium hover:underline"
                    >
                      {isLogin ? "Daftar sekarang" : "Masuk di sini"}
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
