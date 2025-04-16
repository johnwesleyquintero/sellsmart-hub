@echo off
setlocal

REM --- FIX: Escaped the '&' character with '^' ---
echo --- Starting Dev Reset ^& Check Script ---

REM --- Define the port your dev server runs on (default Next.js is 3000) ---
set DEV_PORT=3000

REM --- Kill existing process on the dev port ---
echo --- Attempting to find and kill any process listening on port %DEV_PORT% ---
set PID_FOUND=0
REM Use netstat to find PID (Process ID) listening on the specified port
REM -a: Displays all active TCP connections and the TCP and UDP ports on which the computer is listening.
REM -n: Displays addresses and port numbers in numerical form.
REM -o: Displays the process identifier (PID) associated with each connection.
REM findstr "LISTENING": Filters for lines indicating a listening state.
REM findstr ":%DEV_PORT% ": Filters for lines containing the specific port number.
REM for /f "tokens=5": Parses the output line and grabs the 5th token, which is the PID.
REM --- NOTE: The ^| escapes are correct for cmd.exe's parsing of the for command ---
setlocal enabledelayedexpansion
for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":%DEV_PORT% "') do (
    if not "%%a"=="" (
        echo --- Found process with PID: %%a listening on port %DEV_PORT%. Attempting to kill... ---
        REM /F: Forcefully terminates the process.
        REM /PID: Specifies the PID to terminate.
        taskkill /PID %%a /F
        echo --- Taskkill command executed for PID %%a. Exit code: %errorlevel% ---
        set PID_FOUND=1
    )
)

if !PID_FOUND! equ 1 (
    echo --- Attempted to kill process(es). Adding short delay for port release... ---
    REM Wait for 1 second to allow the OS to release the port
    timeout /t 1 /nobreak > nul
) else (
    echo --- No process found listening on port %DEV_PORT%. ---
)
echo --- Port killing process finished ---
REM --- End of kill section ---

REM Ensure we are in the script's directory
cd %~dp0
echo --- Current directory: %cd% ---

echo --- Removing node_modules and package-lock.json (if they exist) ---
powershell -Command "Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue; Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue"
echo --- Removal finished ---

REM Clear npm and Next.js caches
echo --- Cleaning npm cache ---
call npm cache clean --force
echo --- npm cache clean finished with errorlevel: %errorlevel% ---
if %errorlevel% neq 0 exit /b %errorlevel%

echo --- Removing .next/cache (if it exists) ---
if exist .next\cache (
    rmdir /s /q .next\cache
    echo --- .next/cache removal finished with errorlevel: %errorlevel% ---
    REM Allow script to continue even if rmdir fails (permissions etc.)
) else (
    echo --- .next/cache does not exist, skipping removal ---
)


echo --- Running npm install ---
call npm install
echo --- npm install finished with errorlevel: %errorlevel% ---
if %errorlevel% neq 0 exit /b %errorlevel%

REM Execute configured tasks
echo --- Running code quality checks ---
node .\.wescore\scripts\check-quality.mjs %*
echo --- Code quality check script finished with errorlevel: %errorlevel% ---
if %errorlevel% neq 0 (
    echo ERROR: Code quality checks failed! Not starting dev server.
    exit /b %errorlevel%
)

echo --- Starting the application in development mode (Port: %DEV_PORT%) ---
REM Assumes you have a 'dev' script in your package.json (e.g., "next dev")
REM Pass any arguments received by reset.bat to the dev command
call npm run dev %*

REM The script will likely stay running here until you manually stop the server (Ctrl+C)
echo --- Development server stopped. Exit code: %errorlevel% ---
endlocal
exit /b %errorlevel%
