@echo off
echo --- Starting tasks script ---  REM <-- Changed this line for consistency

echo --- Removing node_modules and package-lock.json (if they exist) ---
powershell -Command "Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue; Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue"
echo --- Removal finished ---

REM Clear npm and Next.js caches
echo --- Cleaning npm cache ---
call npm cache clean --force
echo --- npm cache clean finished with errorlevel: %errorlevel% ---
if %errorlevel% neq 0 exit /b %errorlevel%

cd %~dp0
echo --- Current directory: %cd% ---
echo --- Removing .next/cache ---
rmdir /s /q .next\cache
echo --- rmdir finished with errorlevel: %errorlevel% ---
REM Allow script to continue even if rmdir fails, as the dir might not exist
REM if %errorlevel% neq 0 exit /b %errorlevel%

echo --- Running npm install ---
call npm install
echo --- npm install finished with errorlevel: %errorlevel% ---
if %errorlevel% neq 0 exit /b %errorlevel%

REM Execute configured tasks
echo --- Running code check script ---
node .\.wescore\main.js %*
echo --- code check script finished with errorlevel: %errorlevel% ---
exit /b %errorlevel%
