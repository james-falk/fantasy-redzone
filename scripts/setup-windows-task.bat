@echo off
echo Setting up Windows Scheduled Task for daily YouTube content refresh...

REM Get the current directory
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..

echo Project directory: %PROJECT_DIR%

REM Create the scheduled task
schtasks /create /tn "Fantasy Red Zone - Daily Content Refresh" /tr "cmd /c cd /d \"%PROJECT_DIR%\" && node scripts/setup-daily-refresh.js" /sc daily /st 06:00 /f

if %errorlevel% equ 0 (
    echo ✅ Scheduled task created successfully!
    echo 📅 The task will run daily at 6:00 AM
    echo 🔧 You can modify the schedule using Task Scheduler
    echo.
    echo To test the task manually, run:
    echo   node scripts/setup-daily-refresh.js
) else (
    echo ❌ Failed to create scheduled task
    echo Please run this script as Administrator
)

pause