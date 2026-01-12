'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { APP_DESCRIPTION } from "@/lib/constants";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Shield,
  Sparkles,
} from "lucide-react";

export default function Index() {
  const features = [
    {
      icon: ClipboardCheck,
      title: "Absensi Digital",
      description: "Kelola kehadiran siswa per sesi kelas dengan mudah dan akurat",
    },
    {
      icon: BookOpen,
      title: "Materi & Tugas",
      description: "Distribusi materi pembelajaran dan penugasan secara online",
    },
    {
      icon: BarChart3,
      title: "Penilaian Otomatis",
      description: "Penilaian otomatis untuk soal pilihan ganda, manual untuk esai",
    },
    {
      icon: Users,
      title: "Akses Orang Tua",
      description: "Transparansi informasi kehadiran dan nilai untuk wali murid",
    },
  ];

  const benefits = [
    "Jadwal berbasis waktu yang fleksibel",
    "Manajemen kelas dan mata pelajaran",
    "Substitusi guru dengan mudah",
    "Laporan kehadiran real-time",
    "Pengumpulan tugas terintegrasi",
    "Antarmuka berbahasa Indonesia",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Fitur
            </a>
            <a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors">
              Keunggulan
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth">Masuk</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link href="/auth">
                Mulai Sekarang
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-6 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Sistem Manajemen Sekolah Modern</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Kelola Pembelajaran Sekolah dengan{" "}
              <span className="text-primary">Mudah & Efisien</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {APP_DESCRIPTION}. Platform terintegrasi untuk absensi, tugas, dan penilaian yang dirancang khusus untuk SMA Indonesia.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link href="/auth">
                  <GraduationCap className="h-5 w-5" />
                  Mulai Gratis
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/dashboard">
                  Lihat Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Fitur Utama
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola pembelajaran di sekolah
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl bg-card border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Mengapa Memilih{" "}
                <span className="text-primary">Schoolio</span>?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Dirancang khusus untuk kebutuhan SMA di Indonesia dengan fokus pada kesederhanaan dan efektivitas.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl gradient-hero p-8 flex items-center justify-center">
                <div className="text-center text-primary-foreground">
                  <Shield className="h-24 w-24 mx-auto mb-6 opacity-80" />
                  <h3 className="text-2xl font-bold mb-2">Aman & Terpercaya</h3>
                  <p className="opacity-80">Data sekolah Anda dilindungi dengan standar keamanan terbaik</p>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 h-24 w-24 bg-accent/20 rounded-2xl -z-10" />
              <div className="absolute -bottom-4 -left-4 h-32 w-32 bg-secondary/20 rounded-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Siap Memulai?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan sekolah-sekolah yang sudah menggunakan Schoolio
          </p>
          <Button
            size="xl"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            asChild
          >
            <Link href="/auth">
              Daftar Sekarang - Gratis!
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-card">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              © 2025 Schoolio. Hak Cipta Dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
