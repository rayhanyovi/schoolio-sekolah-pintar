@echo off
setlocal EnableExtensions

set "OUTPUT_FILE=%~1"
if "%OUTPUT_FILE%"=="" set "OUTPUT_FILE=backups\db-backup.sql"

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
  echo Usage self_host: set DATABASE_URL=postgresql://user:pass@host:port/dbname ^&^& scripts\db-backup.cmd [output-file]
  echo Usage saas    : set APP_MODE=saas ^&^& set SUPABASE_DATABASE_URL=postgresql://user:pass@host:port/dbname ^&^& scripts\db-backup.cmd [output-file]
  exit /b 1
)

for /f "tokens=* delims= " %%A in ("%RESOLVED_DATABASE_URL%") do set "RESOLVED_DATABASE_URL=%%A"
:trim_db_url
if "%RESOLVED_DATABASE_URL:~-1%"==" " (
  set "RESOLVED_DATABASE_URL=%RESOLVED_DATABASE_URL:~0,-1%"
  goto trim_db_url
)

for %%I in ("%OUTPUT_FILE%") do (
  if not "%%~dpI"=="" if not exist "%%~dpI" mkdir "%%~dpI"
)

echo [db-backup] Menjalankan backup ke "%OUTPUT_FILE%"
pg_dump --dbname="%RESOLVED_DATABASE_URL%" --file="%OUTPUT_FILE%" --format=plain --no-owner --no-privileges
if errorlevel 1 (
  echo [db-backup] Backup gagal.
  exit /b 1
)

echo [db-backup] Backup selesai: "%OUTPUT_FILE%"
endlocal
