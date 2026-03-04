@echo off
setlocal EnableExtensions

set "INPUT_FILE=%~1"
if "%INPUT_FILE%"=="" (
  echo ERROR: File backup wajib diisi.
  echo Usage: set DATABASE_URL=postgresql://user:pass@host:port/dbname ^&^& scripts\db-restore.cmd ^<input-file^>
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
  echo Usage self_host: set DATABASE_URL=postgresql://user:pass@host:port/dbname ^&^& scripts\db-restore.cmd ^<input-file^>
  echo Usage saas    : set APP_MODE=saas ^&^& set SUPABASE_DATABASE_URL=postgresql://user:pass@host:port/dbname ^&^& scripts\db-restore.cmd ^<input-file^>
  exit /b 1
)

for /f "tokens=* delims= " %%A in ("%RESOLVED_DATABASE_URL%") do set "RESOLVED_DATABASE_URL=%%A"
:trim_db_url
if "%RESOLVED_DATABASE_URL:~-1%"==" " (
  set "RESOLVED_DATABASE_URL=%RESOLVED_DATABASE_URL:~0,-1%"
  goto trim_db_url
)

if not exist "%INPUT_FILE%" (
  echo ERROR: File backup tidak ditemukan: "%INPUT_FILE%"
  exit /b 1
)

echo [db-restore] Menjalankan restore dari "%INPUT_FILE%"
psql --dbname="%RESOLVED_DATABASE_URL%" --set ON_ERROR_STOP=on --single-transaction --file="%INPUT_FILE%"
if errorlevel 1 (
  echo [db-restore] Restore gagal.
  exit /b 1
)

echo [db-restore] Restore selesai.
endlocal
