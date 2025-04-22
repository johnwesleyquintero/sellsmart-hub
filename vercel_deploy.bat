@echo off
setlocal EnableDelayedExpansion

echo --- Starting Vercel Deployment ---

set DEV_PORT=3000

REM Kill existing process on the dev port
for /f "delims=" %%a in ('powershell -Command "$ErrorActionPreference='SilentlyContinue'; try { $p = Get-NetTCPConnection -LocalPort %DEV_PORT% -State Listen | Select -Expand OwningProcess -First 1; if ($p) { Stop-Process -Id $p -Force -ErrorAction Stop; echo 1 } else { echo 0 } } catch { echo 0 }" 2^>nul') do set PID_FOUND=%%a

if !PID_FOUND! equ 1 (
    timeout /t 2 /nobreak > nul
)

cd %~dp0

REM Clean build artifacts
powershell -File cleanup.ps1

REM Deploying Production Build
call npm run cq || exit /b 1
call npx vercel deploy --prod --yes %*

endlocal
exit /b !errorlevel!
