@echo off
setlocal EnableExtensions

if "%~1"=="" (
  echo Usage:
  echo   set DATABASE_URL=postgresql://user:pass@host:port/dbname ^&^& scripts\academic-year-rollover.cmd --targetAcademicYearId^=<id^> [options]
  echo.
  echo Contoh dry-run:
  echo   scripts\academic-year-rollover.cmd --targetAcademicYearId^=ay-2026 --mode^=CLONE_CLASSES --sourceAcademicYearId^=ay-2025 --dryRun^=true
  exit /b 1
)

set "RESOLVED_DATABASE_URL=%DATABASE_URL%"
if /I "%APP_MODE%"=="saas" (
  if not "%SUPABASE_DATABASE_URL%"=="" (
    set "RESOLVED_DATABASE_URL=%SUPABASE_DATABASE_URL%"
  ) else if not "%SUPABASE_DB_URL%"=="" (
    set "RESOLVED_DATABASE_URL=%SUPABASE_DB_URL%"
  ) else if not "%SUPABASE_POSTGRES_URL%"=="" (
    set "RESOLVED_DATABASE_URL=%SUPABASE_POSTGRES_URL%"
  )
)

if "%RESOLVED_DATABASE_URL%"=="" (
  echo ERROR: URL database belum tersedia.
  echo Usage:
  echo   self_host: set DATABASE_URL=postgresql://user:pass@host:port/dbname ^&^& scripts\academic-year-rollover.cmd --targetAcademicYearId^=<id^> [options]
  echo   saas     : set APP_MODE=saas ^&^& set SUPABASE_DATABASE_URL=postgresql://user:pass@host:port/dbname ^&^& scripts\academic-year-rollover.cmd --targetAcademicYearId^=<id^> [options]
  exit /b 1
)

set "DATABASE_URL=%RESOLVED_DATABASE_URL%"
npx tsx scripts/academic-year-rollover.ts %*
if errorlevel 1 (
  echo [academic-rollover] Eksekusi gagal.
  exit /b 1
)

echo [academic-rollover] Eksekusi selesai.
endlocal
