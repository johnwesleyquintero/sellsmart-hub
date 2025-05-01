$ErrorActionPreference='Stop'

# Configuration
$LogFile = "project-cli.log"


# Read Node.js version from package.json
$PackageJson = Get-Content -Path "package.json" | ConvertFrom-Json
$RequiredNodeVersion = $PackageJson.engines.node -replace '\^|>=|~', ''
$RequiredNodeVersion = $RequiredNodeVersion.Split(' ')[0] # Take first version if multiple are specified
$RequiredNpmVersion = "9.0.0" # Consider making this configurable too

# Command definitions
$Commands = @{
    'reset' = 'Reset the project environment (clean build artifacts and node_modules)'
    'setup' = 'Initial project setup including dependencies'
    'check' = 'Run all checks (lint, type check, tests)'
    'build' = 'Build the project'
    'dev' = 'Start development server'
    'test' = 'Run tests'
    'clean' = 'Clean build artifacts'
    'update' = 'Update dependencies'
    'info' = 'Display project information'
    'clean-logs' = 'Clear log and temporary files'
    'audit' = 'Run security audit for dependencies'
    'docs' = 'New project documentation'
    'stats' = 'Show project statistics'
    'backup' = 'Create project backup'
    'validate' = 'Test project structure'
}

# Project paths

$BuildArtifacts = @('.next', '.vercel', 'node_modules', 'package-lock.json', 'coverage', '.nyc_output', 'storybook-static')
$LogFiles = @('*.log', '*.tmp', '*.temp', '*.bak', '*.cache')


function Write-Log {
    param(
        [string]$Message,
        [string]$Level = 'INFO'
    )
    $Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $LogMessage = "$Timestamp - [$Level] $Message"
    $LogMessage | Out-File -FilePath $LogFile -Append

    switch ($Level) {
        'ERROR' { Write-Host $Message -ForegroundColor Red }
        'WARN'  { Write-Host $Message -ForegroundColor Yellow }
        'SUCCESS' { Write-Host $Message -ForegroundColor Green }
        default { Write-Host $Message }
    }
}

function Test-RequiredCommands {
    $requiredCommands = @('npm-run-all', 'cross-env', 'ts-node')
    $missingCommands = @()

    foreach ($cmd in $requiredCommands) {
        try {
            $null = Get-Command $cmd -ErrorAction Stop
        } catch {
            $missingCommands += $cmd
        }
    }

    if ($missingCommands.Count -gt 0) {
        Write-Log "Missing required commands: $($missingCommands -join ', ')" 'ERROR'
        Write-Host "`nThe following required commands are missing:`n" -ForegroundColor Red
        foreach ($cmd in $missingCommands) {
            Write-Host "- $cmd" -ForegroundColor Red
        }
        Write-Host "`nTo install missing commands, run:`nnpm install -g $($missingCommands -join ' ')" -ForegroundColor Yellow
        return $false
    }
    return $true
}

function Show-InteractiveMenu {
    if (-not (Test-RequiredCommands)) {
        return $null
    }

    do {
        Clear-Host
        Write-Host "`nPROJECT MANAGEMENT CLI`n" -ForegroundColor Cyan
        Write-Host "Select an option:`n" -ForegroundColor Yellow

        $i = 1
        $menuOptions = @()
        $Commands.GetEnumerator() | ForEach-Object {
            Write-Host ("  {0}. {1,-15} {2}" -f $i, $_.Key, $_.Value)
            $menuOptions += $_.Key
            $i++
        }
        Write-Host "`n  Q. Quit`n"

        $selection = Read-Host "Enter your choice"

        if ($selection -eq 'Q' -or $selection -eq 'q') {
            return $null
        }

        if ($selection -match '^\d+$' -and [int]$selection -ge 1 -and [int]$selection -le $menuOptions.Count) {
            return $menuOptions[[int]$selection - 1]
        }

        Write-Host "Invalid selection. Please try again." -ForegroundColor Red
        Start-Sleep -Seconds 1
    } while ($true)
}

function Show-Help {
    Write-Host "`nProject Management CLI`n" -ForegroundColor Cyan
    Write-Host "Available Commands:" -ForegroundColor Yellow
    $Commands.GetEnumerator() | ForEach-Object {
        Write-Host ("  {0,-15} {1}" -f $_.Key, $_.Value)
    }
    Write-Host "`nUsage: .\scripts\project-cli.ps1 [command]`n"
}

function Test-ProjectStructure {
    $RequiredFiles = @('package.json', 'tsconfig.json', 'next.config.js')
    $MissingFiles = @()

    foreach ($File in $RequiredFiles) {
        if (-not (Test-Path $File)) {
            $MissingFiles += $File
        }
    }

    if ($MissingFiles.Count -gt 0) {
        Write-Log "Missing required project files: $($MissingFiles -join ', ')" 'ERROR'
        return $false
    }
    return $true
}

function Test-NodeVersion {
    try {
        $nodeVersion = (node --version).TrimStart('v')
        if ([version]$nodeVersion -lt [version]$RequiredNodeVersion) {
            throw "Node.js version $nodeVersion is below required version $RequiredNodeVersion"
        }
        return $true
    } catch {
        return $false
    }
}

function Test-GlobalPackages {
    $RequiredGlobalPackages = @('npm-run-all', 'cross-env', 'ts-node')
    $MissingPackages = @()

    foreach ($pkg in $RequiredGlobalPackages) {
        try {
            $null = npm list -g $pkg --depth=0
        } catch {
            $MissingPackages += $pkg
        }
    }

    if ($MissingPackages.Count -gt 0) {
        Write-Log "Missing required global packages: $($MissingPackages -join ', ')" 'ERROR'
        Write-Host "`nTo install missing packages, run:`n" -ForegroundColor Yellow
        Write-Host "npm install -g $($MissingPackages -join ' ')" -ForegroundColor Cyan
        Write-Host "`n"
        return $false
    }
    return $true
}

function Test-NpmVersion {
    try {
        $npmVersion = (npm --version).Trim()
        if ([version]$npmVersion -lt [version]$RequiredNpmVersion) {
            throw "npm version $npmVersion is below required version $RequiredNpmVersion"
        }
        return $true
    } catch {
        return $false
    }
}

function Start-ProjectSetup {
    Write-Log "Starting project setup..." 'INFO'

    if (-not (Test-ProjectStructure)) {
        Write-Log "Project structure validation failed" 'ERROR'
        return $false
    }

    # Install dependencies
    try {
        Write-Log "Installing project dependencies..." 'INFO'
        npm install
        Write-Log "Dependencies installed successfully" 'SUCCESS'
        return $true
    } catch {
        Write-Log "Failed to install dependencies: $_" 'ERROR'
        return $false
    }
}

function Start-ProjectBuild {
    Write-Log "Starting project build..." 'INFO'
    try {
        npm run build
        Write-Log "Build completed successfully" 'SUCCESS'
        return $true
    } catch {
        Write-Log "Build failed: $_" 'ERROR'
        return $false
    }
}

function Start-ProjectDev {
    Write-Log "Starting development server..." 'INFO'
    try {
        npm run dev
        return $true
    } catch {
        Write-Log "Failed to start development server: $_" 'ERROR'
        return $false
    }
}

function Start-ProjectTests {
    Write-Log "Running tests..." 'INFO'
    try {
        npm run test
        Write-Log "Tests completed successfully" 'SUCCESS'
        return $true
    } catch {
        Write-Log "Tests failed: $_" 'ERROR'
        return $false
    }
}

function Start-ProjectClean {
    Write-Log "Starting cleanup process..." 'INFO'
    $success = $true

    foreach ($artifact in $BuildArtifacts) {
        if (Test-Path $artifact) {
            try {
                Remove-Item -Path $artifact -Recurse -Force
                Write-Log "Removed $artifact" 'SUCCESS'
            } catch {
                Write-Log "Failed to remove ${artifact}: $_" 'ERROR'
                $success = $false
            }
        }
    }

    return $success
}

function Start-DependencyUpdate {
    Write-Log "Checking for dependency updates..." 'INFO'
    try {
        npm update
        Write-Log "Dependencies updated successfully" 'SUCCESS'
        return $true
    } catch {
        Write-Log "Failed to update dependencies: $_" 'ERROR'
        return $false
    }
}

function Show-ProjectInfo {
    $packageJson = Get-Content -Path "package.json" | ConvertFrom-Json

    Write-Host "`nProject Information:`n" -ForegroundColor Cyan
    Write-Host "Name: $($packageJson.name)"
    Write-Host "Version: $($packageJson.version)"
    Write-Host "Node.js Version: $RequiredNodeVersion"
    Write-Host "NPM Version: $RequiredNpmVersion"
    Write-Host "`nAvailable Scripts:"
    $packageJson.scripts.PSObject.Properties | ForEach-Object {
        Write-Host ("  {0,-20} {1}" -f $_.Name, $_.Value)
    }
    Write-Host ""
}

function Clear-LogsAndTempFiles {
    try {
        Write-Host "Cleaning log and temporary files..." -ForegroundColor Yellow

        # Clean project log files
        Get-ChildItem -Path . -Include $LogFiles -Recurse -File | Remove-Item -Force

        # Clean system temp files
        if (Test-Path $env:TEMP) {
            Get-ChildItem -Path $env:TEMP -Include $LogFiles -File | Remove-Item -Force
        }

        Write-Host "Log and temporary files cleaned successfully" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Failed to clean log files: $_" -ForegroundColor Red
        return $false
    }
}

function Start-SecurityAudit {
    Write-Log "Running security audit for dependencies..." 'INFO'
    try {
        npm audit
        Write-Log "Security audit completed successfully" 'SUCCESS'
        return $true
    } catch {
        Write-Log "Failed to run security audit: $_" 'ERROR'
        return $false
    }
}

function New-Documentation {
    Write-Log "Generating project documentation..." 'INFO'
    try {
        npm run docs
        Write-Log "Documentation generated successfully" 'SUCCESS'
        return $true
    } catch {
        Write-Log "Failed to generate documentation: $_" 'ERROR'
        return $false
    }
}

function Show-ProjectStatistics {
    Write-Log "Calculating project statistics..." 'INFO'
    try {
        $loc = (Get-ChildItem -Recurse -Include *.js,*.ts,*.jsx,*.tsx,*.css,*.scss,*.json |
               Select-String -Pattern "." -AllMatches |
               ForEach-Object { $_.Matches.Count } |
               Measure-Object -Sum).Sum

        $files = (Get-ChildItem -Recurse -Include *.js,*.ts,*.jsx,*.tsx,*.css,*.scss,*.json).Count

        Write-Host "`nProject Statistics:`n" -ForegroundColor Cyan
        Write-Host "Lines of Code: $loc"
        Write-Host "Files Count: $files"
        Write-Host ""

        Write-Log "Project statistics displayed successfully" 'SUCCESS'
        return $true
    } catch {
        Write-Log "Failed to calculate statistics: $_" 'ERROR'
        return $false
    }
}

function New-ProjectBackup {
    Write-Log "Creating project backup..." 'INFO'
    try {
        $backupName = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
        Compress-Archive -Path . -DestinationPath $backupName -CompressionLevel Optimal
        Write-Log "Project backup created successfully: $backupName" 'SUCCESS'
        return $true
    } catch {
        Write-Log "Failed to create backup: $_" 'ERROR'
        return $false
    }
}

function Test-ProjectStructure {
    Write-Log "Validating project structure..." 'INFO'
    try {
        $result = Test-ProjectStructure
        if ($result) {
            Write-Log "Project structure validation passed" 'SUCCESS'
        } else {
            Write-Log "Project structure validation failed" 'ERROR'
        }
        return $result
    } catch {
        Write-Log "Failed to validate project structure: $_" 'ERROR'
        return $false
    }
}

# Main execution
try {
    # Get command from arguments
    $command = $args[0]
    if (-not $command) {
        $command = Show-InteractiveMenu
        if (-not $command) {
            exit 0
        }
    }

    # Verify dependencies for all commands except 'info' and 'help'
    if ($command -ne 'info' -and $command -ne 'help') {
        if (-not (Test-NodeVersion)) {
            throw "Node.js version check failed. Required version: $RequiredNodeVersion"
        }
        if (-not (Test-NpmVersion)) {
            throw "npm version check failed. Required version: $RequiredNpmVersion"
        }
        if (-not (Test-GlobalPackages)) {
            throw "Missing required global npm packages"
        }
    }

    # Execute command
    if ($command -eq 'clean-logs') {
        Clear-LogsAndTempFiles | Out-Null
        exit
    }
    $success = switch ($command) {
        'reset' {
            Write-Log "Starting reset process" 'INFO'
            Write-Log "Target directories: $($BuildArtifacts -join ', ')" 'INFO'

            # Clean build artifacts
            $cleanSuccess = Start-ProjectClean
            if (-not $cleanSuccess) {
                Write-Log "Cleanup failed" 'ERROR'
                $false
                break
            }

            # Clear npm cache
            Write-Log 'Clearing npm cache' 'INFO'
            $spinner = @('|', '/', '-', '\\')

            try {
                npm install
            } catch {
                Write-Log "Package installation failed" 'ERROR'
                $false
                break
            }

            foreach ($char in $spinner) {
                Write-Host "`r$char" -NoNewline -ForegroundColor Cyan
                Start-Sleep -Milliseconds 100
            }

            $jobOutput = Receive-Job -Job $job
            Remove-Job -Job $job

            if ($jobOutput -match 'error') {
                Write-Log "Package installation failed" 'ERROR'
                $false
                break
            }

            Write-Log 'Package reinstallation completed successfully' 'SUCCESS'
            $true
        }
        'audit' {
            Start-SecurityAudit
        }
        'docs' {
            Start-Generate-Documentation
        }
        'stats' {
            Start-Show-ProjectStatistics
        }
        'backup' {
            Start-Create-ProjectBackup
        }
        'validate' {
            Start-Validate-ProjectStructure
        }
        'setup' { Start-ProjectSetup }
        'check' {
            Write-Log "Running project checks" 'INFO'
            npm run wes-cq
            $LASTEXITCODE -eq 0
        }
        'build' { Start-ProjectBuild }
        'dev' { Start-ProjectDev }
        'test' { Start-ProjectTests }
        'clean' { Start-ProjectClean }
        'update' { Start-DependencyUpdate }
        'info' { Show-ProjectInfo; $true }
        'help' { Show-Help; $true }
        'clean-logs' { Start-Clear-LogsAndTempFiles }
        default {
            Write-Log "Unknown command: $command" 'ERROR'
            Show-Help
            $false
        }
    }

    if (-not $success) {
        Write-Log "Command '$command' failed" 'ERROR'
        exit 1
    }

    Write-Log "Command '$command' completed successfully" 'SUCCESS'
} catch {
    $criticalError = "CRITICAL ERROR: Command failed - $_"
    Write-Log $criticalError 'ERROR'
    exit 1
}
