@echo off
echo --- Starting Local Deployment ---

REM Ensure we are in the script's directory
cd %~dp0
echo --- Current directory: %cd% ---

echo --- Removing node_modules, package-lock.json, .next (if they exist) ---
REM Combine removals into one PowerShell command for slight efficiency
powershell -Command "Remove-Item -Recurse -Force node_modules, .next -ErrorAction SilentlyContinue; Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue"
echo --- Removal finished ---

REM Clear npm cache (Optional but sometimes helpful for stubborn issues)
echo --- Cleaning npm cache ---
call npm cache clean --force
echo --- npm cache clean finished with errorlevel: %errorlevel% ---
if %errorlevel% neq 0 (
    echo ERROR: npm cache clean failed!
    exit /b %errorlevel%
)

echo --- Running npm install ---
call npm install
echo --- npm install finished with errorlevel: %errorlevel% ---
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    exit /b %errorlevel%
)

echo --- Building the project for production ---
REM Assumes you have a 'build' script in your package.json (e.g., "next build")
call npm run build
echo --- npm run build finished with errorlevel: %errorlevel% ---
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    exit /b %errorlevel%
)

echo --- Starting the application locally ---
REM Assumes you have a 'start' script in your package.json (e.g., "next start")
REM Pass any arguments received by local_deploy.bat to the start command
call npm run start %*

REM The script will likely stay running here until you manually stop the server (Ctrl+C)
echo --- Application server stopped. Exit code: %errorlevel% ---
exit /b %errorlevel%
