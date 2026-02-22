@echo off
setlocal EnableExtensions

set "INPUT_FILE=%~1"
if "%INPUT_FILE%"=="" (
  echo ERROR: File backup wajib diisi.
  echo Usage: set DATABASE_URL=postgresql://user:pass@host:port/dbname ^&^& scripts\db-restore.cmd ^<input-file^>
  exit /b 1
)

if "%DATABASE_URL%"=="" (
  echo ERROR: DATABASE_URL belum tersedia.
  echo Usage: set DATABASE_URL=postgresql://user:pass@host:port/dbname ^&^& scripts\db-restore.cmd ^<input-file^>
  exit /b 1
)

for /f "tokens=* delims= " %%A in ("%DATABASE_URL%") do set "DATABASE_URL=%%A"
:trim_db_url
if "%DATABASE_URL:~-1%"==" " (
  set "DATABASE_URL=%DATABASE_URL:~0,-1%"
  goto trim_db_url
)

if not exist "%INPUT_FILE%" (
  echo ERROR: File backup tidak ditemukan: "%INPUT_FILE%"
  exit /b 1
)

echo [db-restore] Menjalankan restore dari "%INPUT_FILE%"
psql --dbname="%DATABASE_URL%" --set ON_ERROR_STOP=on --single-transaction --file="%INPUT_FILE%"
if errorlevel 1 (
  echo [db-restore] Restore gagal.
  exit /b 1
)

echo [db-restore] Restore selesai.
endlocal
