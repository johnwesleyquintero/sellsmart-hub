@echo off
echo --- Starting Local Deployment ---

REM Ensure we are in the script's directory
cd %~dp0
echo --- Current directory: %cd% ---

echo --- Removing .next (if they exist) ---
powershell -Command "Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue"
echo --- Removal finished ---

echo --- Building the project for production ---
call npm run build
echo --- npm run build finished with errorlevel: %errorlevel% ---
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    exit /b %errorlevel%
)

REM --- ADD THIS SECTION TO RUN THE STATIC PACKAGER ---
echo --- Packaging static assets ---
node .\.wescore\scripts\package-static.mjs
echo --- package-static.mjs finished with errorlevel: %errorlevel% ---
if %errorlevel% neq 0 (
    echo ERROR: Static packaging failed!
    exit /b %errorlevel%
)
REM --- END OF ADDED SECTION ---

echo --- Starting the application locally ---
call npm run start %*

echo --- Application server stopped. Exit code: %errorlevel% ---
exit /b %errorlevel%
