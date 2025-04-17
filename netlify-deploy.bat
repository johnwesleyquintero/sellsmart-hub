@echo off
setlocal

echo Checking if Netlify CLI is installed...
where netlify >nul 2>nul
if %errorlevel% neq 0 (
    echo Netlify CLI not found. Installing...
    call npm install -g netlify-cli
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Netlify CLI!
        exit /b %errorlevel%
    )
)

echo Authenticating with Netlify...
netlify login
if %errorlevel% neq 0 (
    echo ERROR: Netlify login failed!
    exit /b %errorlevel%
)

echo Building project...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    exit /b %errorlevel%
)

echo Deploying to Netlify...
netlify deploy --prod
if %errorlevel% neq 0 (
    echo ERROR: Deployment failed!
    exit /b %errorlevel%
)

echo Deployment complete!
pause