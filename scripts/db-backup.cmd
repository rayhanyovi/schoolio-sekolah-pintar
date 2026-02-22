@echo off
setlocal EnableExtensions

set "OUTPUT_FILE=%~1"
if "%OUTPUT_FILE%"=="" set "OUTPUT_FILE=backups\db-backup.sql"

if "%DATABASE_URL%"=="" (
  echo ERROR: DATABASE_URL belum tersedia.
  echo Usage: set DATABASE_URL=postgresql://user:pass@host:port/dbname ^&^& scripts\db-backup.cmd [output-file]
  exit /b 1
)

for /f "tokens=* delims= " %%A in ("%DATABASE_URL%") do set "DATABASE_URL=%%A"
:trim_db_url
if "%DATABASE_URL:~-1%"==" " (
  set "DATABASE_URL=%DATABASE_URL:~0,-1%"
  goto trim_db_url
)

for %%I in ("%OUTPUT_FILE%") do (
  if not "%%~dpI"=="" if not exist "%%~dpI" mkdir "%%~dpI"
)

echo [db-backup] Menjalankan backup ke "%OUTPUT_FILE%"
pg_dump --dbname="%DATABASE_URL%" --file="%OUTPUT_FILE%" --format=plain --no-owner --no-privileges
if errorlevel 1 (
  echo [db-backup] Backup gagal.
  exit /b 1
)

echo [db-backup] Backup selesai: "%OUTPUT_FILE%"
endlocal
