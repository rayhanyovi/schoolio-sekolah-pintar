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

if "%DATABASE_URL%"=="" (
  echo ERROR: DATABASE_URL belum tersedia.
  echo Usage:
  echo   set DATABASE_URL=postgresql://user:pass@host:port/dbname ^&^& scripts\academic-year-rollover.cmd --targetAcademicYearId^=<id^> [options]
  exit /b 1
)

npx tsx scripts/academic-year-rollover.ts %*
if errorlevel 1 (
  echo [academic-rollover] Eksekusi gagal.
  exit /b 1
)

echo [academic-rollover] Eksekusi selesai.
endlocal
