# Sekolah Pintar

Next.js + Prisma app untuk operasional sekolah.

## App Mode

Project ini mendukung dua mode deployment:

- `self_host` (default): koneksi DB dari `DATABASE_URL` (PostgreSQL local/self-host).
- `saas`: koneksi DB dari `SUPABASE_DATABASE_URL` (prioritas), fallback ke `DATABASE_URL`.

## Setup Environment

1. Copy env template sesuai mode:
```bash
copy .env.self-host.example .env.self-host
copy .env.saas.example .env.saas
```
2. Isi variabel di file mode yang dipakai.

## Self-Host Quickstart

1. Set di `.env.self-host`:
   - `APP_MODE=self_host`
   - `DATABASE_URL=postgresql://...`
2. Jalankan DB lokal:
```bash
docker compose up -d db
```
3. Install + migrate:
```bash
npm install
npm run prisma:generate:self-host
npm run prisma:migrate:self-host
```
4. Jalankan app:
```bash
npm run dev:self-host
```

## SaaS Quickstart (Supabase)

1. Set di `.env.saas`:
   - `APP_MODE=saas`
   - `SUPABASE_DATABASE_URL=postgresql://...` (recommended)
   - `SESSION_SECRET=<secret-production>`
2. Install + migrate:
```bash
npm install
npm run prisma:generate:saas
npm run prisma:migrate:saas
```
3. Jalankan app:
```bash
npm run dev:saas
```

## Utility Scripts

Script berikut sudah support mode `self_host` dan `saas`:

- `scripts\db-backup.cmd [output-file]`
- `scripts\db-restore.cmd <input-file>`
- `scripts\academic-year-rollover.cmd --targetAcademicYearId=<id> [options]`
