"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  GraduationCap,
  KeyRound,
  ShieldCheck,
  Users,
  UserRoundCheck,
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
import { startDemoSession } from "@/lib/handlers/demo";

type DemoRoleCard = {
  key: string;
  role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
  label: string;
  title: string;
  name: string;
  identifier: string;
  email: string;
  seedIdentifier: string;
  description: string;
};

type DemoSchool = {
  schoolCode: string;
  name: string;
};

type DemoProps = {
  password: string;
  roles: DemoRoleCard[];
  school: DemoSchool;
};

const roleIcons = {
  ADMIN: ShieldCheck,
  TEACHER: BookOpenCheck,
  STUDENT: GraduationCap,
  PARENT: Users,
} as const;

export default function Demo({ password, roles, school }: DemoProps) {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async (role: DemoRoleCard["role"]) => {
    setLoadingRole(role);
    setError(null);
    try {
      await startDemoSession({ role });
      router.replace("/dashboard");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Demo belum bisa dibuka. Coba ulangi beberapa saat lagi.",
      );
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <main className="flex flex-col min-h-screen bg-[#f8f4ea] text-[#13231f] dark:bg-[#101a17] dark:text-[#fffaf0]">
      <div className="!flex !flex-col !h-full !flex-1 items-center justify-center relative overflow-hidden border-b border-[#13231f]/10 bg-[#13231f] px-6 py-12 text-[#fffaf0] dark:border-[#fffaf0]/10 dark:bg-[#fffaf0] dark:text-[#13231f] lg:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,250,240,0.055)_1px,transparent_1px),linear-gradient(0deg,rgba(255,250,240,0.04)_1px,transparent_1px)] bg-[length:42px_42px] dark:bg-[linear-gradient(90deg,rgba(19,35,31,0.055)_1px,transparent_1px),linear-gradient(0deg,rgba(19,35,31,0.04)_1px,transparent_1px)]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1fr] lg:items-center">
          <div>
            <h1 className="mt-6 max-w-[12ch] text-5xl font-semibold leading-[0.94] tracking-normal sm:text-6xl lg:text-7xl">
              Schoolio Demo
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#fffaf0]/74 dark:text-[#263a34] sm:text-lg">
              Masuk ke sandbox {school.name}. Data tersimpan di database selama
              sesi demo dan terpisah untuk setiap browser.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {roles.map((item) => {
              const Icon = roleIcons[item.role];
              const isLoading = loadingRole === item.role;

              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleStart(item.role)}
                  disabled={Boolean(loadingRole)}
                  className="group min-h-[148px] rounded-2xl border border-[#fffaf0]/12 bg-[#fffaf0]/8 p-5 text-left transition  disabled:cursor-wait disabled:opacity-70 dark:border-[#13231f]/12 dark:bg-[#13231f]/5 dark:hover:border-[#074838]/30 dark:hover:bg-[#13231f]/8"
                >
                  <span className="flex items-center justify-start gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d7a12b] text-[#13231f] dark:bg-[#074838] dark:text-[#fffaf0]">
                      <Icon className="h-5 w-5" />
                    </span>

                    <span className="block text-xl font-semibold whitespace-pre-line flex-1">
                      {isLoading
                        ? "Membuka..."
                        : `Masuk sebagai\n${item.label}`}
                    </span>

                    <ArrowRight className="h-5 w-5 opacity-70 transition group-hover:translate-x-1" />
                  </span>

                  {/*
                    "key": "admin",
                    "role": "ADMIN",
                    "label": "Admin",
                    "title": "Admin Sekolah",
                    "name": "Nur Aisyah Rahma",
                    "identifier": "admin.sekolah",
                    "email": "nur.aisyah@alhikmahnusantara.sch.id",
                    "seedIdentifier": "admin.sekolah",
                    "description": "Kelola struktur sekolah, data pengguna, kelas, mapel, dan pengaturan operasional."
                  */}
                  {/* <div className="bg-white !text-black !text-base !font-normal min-h-4 my-4 rounded-lg">
                    <pre>{JSON.stringify(item, null, 2)}</pre>
                  </div> */}
                  {/* <div className="bg-white !text-black !text-base !font-normal min-h-4 my-4 rounded-lg p-4">
                    <p>Name: {item.name}</p>
                    <p>Title: {item.title}</p>
                    <p>Role: {item.role}</p>
                  </div> */}
                  <span className="mt-2 block text-sm leading-6 text-[#fffaf0]/68 dark:text-[#46554e]">
                    {item.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[0.72fr_1fr] lg:px-8 lg:py-12">
        <Card className="h-fit border-[#13231f]/12 bg-[#fffaf0] shadow-none dark:border-[#fffaf0]/10 dark:bg-[#17231f]">
          <CardHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0e6b53]/10 text-[#0e6b53] dark:bg-[#4fb796]/14 dark:text-[#7fd3b9]">
              <KeyRound className="h-5 w-5" />
            </div>
            <CardTitle className="text-2xl">Kredensial publik</CardTitle>
            <CardDescription>
              Tombol role memakai kredensial ini secara otomatis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-xl border border-[#13231f]/10 bg-[#f2eee3] p-4 dark:border-[#fffaf0]/10 dark:bg-[#101a17]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Password
              </p>
              <p className="mt-1 font-mono text-base font-semibold">
                {password}
              </p>
            </div>
            {error && (
              <div className="rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((item) => (
            <Card
              key={item.role}
              className="border-[#13231f]/12 bg-[#fffaf0] shadow-none dark:border-[#fffaf0]/10 dark:bg-[#17231f]"
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline" className="rounded-full">
                    {item.label}
                  </Badge>
                  <UserRoundCheck className="h-5 w-5 text-[#0e6b53] dark:text-[#7fd3b9]" />
                </div>
                <CardTitle className="text-xl">{item.name}</CardTitle>
                <CardDescription>{item.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Identifier
                  </p>
                  <p className="mt-1 break-all font-mono">{item.identifier}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-1 break-all font-mono">{item.email}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  disabled={Boolean(loadingRole)}
                  onClick={() => handleStart(item.role)}
                >
                  Masuk
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section> */}
    </main>
  );
}
