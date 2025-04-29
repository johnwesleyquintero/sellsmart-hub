# Portfolio Project Setup Script

# Enable error handling
$ErrorActionPreference = "Stop"

Write-Host "===================================="
Write-Host "    Portfolio Project Setup Script"
Write-Host "===================================="

# Function to download Node.js installer
function Get-NodeInstaller {
    $url = "https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi"
    $output = "nodejs_setup.msi"
    Write-Host "Downloading Node.js installer..."
    try {
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing -ErrorAction Stop
        if (-not (Test-Path $output)) {
            throw "Failed to download Node.js installer"
        }
    } catch {
        Write-Error "Failed to download Node.js installer: $_"
        exit 1
    }
}

# Function to install Node.js
function Set-Node {
    $installer = "nodejs_setup.msi"
    Write-Host "Installing Node.js (this may take a few minutes)..."
    try {
        $process = Start-Process msiexec.exe -ArgumentList "/i `"$installer`" /quiet /norestart /log install.log" -Wait -NoNewWindow -PassThru
        if ($process.ExitCode -ne 0) {
            throw "Installation failed with exit code $($process.ExitCode). Check install.log for details."
        }
    } catch {
        Write-Error "Failed to install Node.js: $_"
        if (Test-Path $installer) {
            Remove-Item $installer -Force
        }
        exit 1
    }
    if (Test-Path $installer) {
        Remove-Item $installer -Force
    }
}

# Check if Node.js is installed
$nodeVersionPath = ".nodeversion"
node --version > $nodeVersionPath 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Node.js is not installed. Attempting automatic installation..."
    Download-NodeInstaller
    Install-Node

    # Refresh environment variables
    Write-Host "Refreshing environment variables..."
    [System.Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\\Program Files\\nodejs", "Machine")
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to refresh environment variables. Please restart your terminal and run this script again."
        exit 1
    }

    # Verify Node.js installation
    node --version > $nodeVersionPath 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Node.js installation verification failed. Please restart your terminal and run this script again."
        Remove-Item $nodeVersionPath -Force
        exit 1
    }
}

# Get Node.js version
$nodeVersion = Get-Content $nodeVersionPath
Remove-Item $nodeVersionPath
Write-Host "Node.js version $nodeVersion successfully installed."

# Check Node.js version compatibility
$requiredVersion = [version]"18.18.0"
if ([version]$nodeVersion -lt $requiredVersion) {
    Write-Error "Incompatible Node.js version. Current version: $nodeVersion. Required version: $requiredVersion. Please update Node.js and restart your terminal."
    exit 1
}

# Create .env file if it doesn't exist
$envFilePath = ".env"
if (-not (Test-Path $envFilePath)) {
    Write-Host "Creating .env file from template..."
    Copy-Item ".env.template" $envFilePath -Force
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Could not create .env file. Please create it manually."
    } else {
        Write-Host "Created .env file successfully."
    }
}

# Install dependencies
Write-Host "Installing dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install dependencies."
    exit 1
}

# Run code quality checks
Write-Host "Running code quality checks..."
npm run wes-cq
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Code quality checks failed. Please review and fix the issues."
}

# Run type checks
Write-Host "Running type checks..."
npm run typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Type checks failed. Please review and fix the type issues."
}

# Set up git hooks
Write-Host "Setting up git hooks..."
npm run prepare

Write-Host "===================================="
Write-Host "Setup completed successfully!"
Write-Host "Next steps:"
Write-Host "1. Configure your .env file with required values"
Write-Host "2. Run 'npm run dev' to start the development server"
Write-Host "===================================="
