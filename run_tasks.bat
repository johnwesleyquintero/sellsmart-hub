@echo off
REM Clear npm and Next.js caches
call npm cache clean --force
if %errorlevel% neq 0 exit /b %errorlevel%

cd %~dp0
rmdir /s /q .next\cache
if %errorlevel% neq 0 exit /b %errorlevel%

call npm install --force
if %errorlevel% neq 0 exit /b %errorlevel%

REM Execute configured tasks
node .\.wescore\main.js %*
exit /b %errorlevel%
