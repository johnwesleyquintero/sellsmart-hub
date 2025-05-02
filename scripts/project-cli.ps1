<#
.SYNOPSIS
Project Management CLI with robust error handling and interactive features

.DESCRIPTION
This script provides a comprehensive interface for managing Node.js projects with
enhanced error handling, logging, and user interaction capabilities.

.NOTES
File Name      : project-cli.ps1
Author         : John Wesley Quintero
Prerequisites  : PowerShell 5.1+, Node.js, npm
#>

#region Configuration
$ErrorActionPreference = 'Stop'
$DebugPreference = 'Continue' # Set to 'SilentlyContinue' to hide debug messages
$WarningPreference = 'Continue'

# Script metadata
$ScriptName = $MyInvocation.MyCommand.Name

# Configuration
$LogFile = Join-Path $PSScriptRoot "project-cli.log"
$MaxLogSizeMB = 10
$BackupCount = 3
$SpinnerDelayMs = 100

# Read Node.js version and other info from package.json
$PackageJson = $null
$RequiredNodeVersion = $null
$RequiredNpmVersion = "9.0.0" # Define a minimum required npm version
$ProjectName = "Unknown Project"
$ProjectVersion = "N/A"

# Get project root directory (one level up from scripts)
$ProjectRoot = Split-Path $PSScriptRoot -Parent

try {
    $packageJsonPath = Join-Path $ProjectRoot "package.json"
    if (-not (Test-Path $packageJsonPath)) {
        throw "package.json not found at '$packageJsonPath'. Cannot proceed."
    }
    $PackageJson = Get-Content -Path $packageJsonPath -ErrorAction Stop | ConvertFrom-Json
    $ProjectName = $PackageJson.name
    $ProjectVersion = $PackageJson.version

    if ($PackageJson.engines -and $PackageJson.engines.node) {
        $RequiredNodeVersion = ($PackageJson.engines.node -replace '\^|>=|~', '').Split(' ')[0]
    } else {
        Write-Warning "engines.node not specified in package.json. Skipping Node version check."
    }
} catch {
    # Use Write-Error here as logging might not be initialized yet
    Write-Error "FATAL: Failed to read or parse package.json: $_"
    exit 1
}

# Project paths and patterns
$BuildArtifacts = @('.next', '.vercel', 'node_modules', 'package-lock.json', 'coverage', '.nyc_output', 'storybook-static', 'dist', 'build')
$TempFilePatterns = @('*.log', '*.tmp', '*.temp', '*.bak', '*.cache') # Patterns for clean-logs

# ANSI color codes
$ANSI = @{
    Reset      = "`e[0m"
    Red        = "`e[31m"
    Green        = "`e[32m"
    Yellow     = "`e[33m"
    Blue         = "`e[34m"
    Magenta    = "`e[35m"
    Cyan       = "`e[36m"
    White      = "`e[37m"
    Gray       = "`e[90m"
    BoldCyan   = "`e[1;36m"  # Removed extra quote
    BoldYellow = "`e[1;33m"  # Removed extra quote
}
#endregion

#region Helper Functions
function Initialize-Logging {
    <#
    .SYNOPSIS
    Initialize logging system with rotation.
    #>
    try {
        $logDir = Split-Path $LogFile -Parent
        if (-not (Test-Path $logDir)) {
            New-Item -Path $logDir -ItemType Directory -Force | Out-Null
        }

        if (Test-Path $LogFile) {
            $logSize = (Get-Item $LogFile).Length / 1MB
            if ($logSize -gt $MaxLogSizeMB) {
                # Rotate logs
                for ($i = $BackupCount; $i -ge 1; $i--) {
                    $oldLog = "$LogFile.$i"
                    $newLog = "$LogFile.$($i+1)"
                    if (Test-Path $oldLog) {
                        if ($i -eq $BackupCount) {
                            Remove-Item $oldLog -Force -ErrorAction SilentlyContinue
                        } else {
                            Rename-Item $oldLog $newLog -Force -ErrorAction Stop
                        }
                    }
                }
                Rename-Item $LogFile "$LogFile.1" -Force -ErrorAction Stop
            }
        } else {
            # Ensure the file exists
            New-Item -Path $LogFile -ItemType File -Force | Out-Null
        }
    } catch {
        Write-Error "FATAL: Failed to initialize logging at '$LogFile': $_"
        # Cannot use Write-Log here as logging failed
        exit 1
    }
}

function Write-Log {
    <#
    .SYNOPSIS
    Write a message to the log file and console with colored output.
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,

        [ValidateSet('DEBUG','INFO','WARN','ERROR','CRITICAL','SUCCESS')]
        [string]$Level = 'INFO',

        [string]$CommandContext = $null, # Renamed for clarity

        [switch]$NoConsole
    )

    # Determine caller context if not provided
    if (-not $CommandContext) {
        $caller = Get-PSCallStack | Select-Object -Skip 1 -First 1
        $CommandContext = if ($caller) { $caller.FunctionName } else { $ScriptName }
    }

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] [$CommandContext] $Message"

    try {
        # Ensure log file still exists (might be deleted externally)
        if (-not (Test-Path $LogFile)) {
            Initialize-Logging # Attempt re-initialization
        }
        Add-Content -Path $LogFile -Value $logEntry -ErrorAction Stop

        if (-not $NoConsole) {
            $color = switch ($Level) {
                'ERROR'    { $ANSI.Red }
                'WARN'     { $ANSI.Yellow }
                'SUCCESS'  { $ANSI.Green }
                'DEBUG'    { $ANSI.Gray }
                'CRITICAL' { $ANSI.Magenta }
                default    { $ANSI.White } # INFO and others
            }
            $levelIndicator = "[$Level]".PadRight(10) # Pad for alignment
            Write-Host "$color$levelIndicator$($ANSI.Reset) $Message"
        }
    } catch {
        Write-Error "Failed to write to log file '$LogFile': $_"
        # Avoid infinite loop if logging fails repeatedly
    }
}

function Write-Error-WithTrace {
    param(
        [string]$Message,
        [string]$ErrorTrace
    )
    Write-Error $Message
    Write-Error "Stack trace: $ErrorTrace"
}

function Write-Log-WithContext {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,

        [Parameter(Mandatory=$true)]
        [string]$Level,

        [Parameter(Mandatory=$true)]
        [string]$Context
    )
    Write-Log -Message $Message -Level $Level -CommandContext $Context
}

function Show-ProgressBar {
    param (
        [int]$PercentComplete,
        [int]$Width = 40,
        [string]$Status
    )

    $completed = [math]::Floor($Width * ($PercentComplete / 100))
    $remaining = $Width - $completed

    $progressBar = "$($ANSI.Green)"
    $progressBar += "█" * $completed
    $progressBar += "$($ANSI.Gray)"
    $progressBar += "░" * $remaining
    $progressBar += "$($ANSI.Reset)"

    Write-Host "`r$progressBar $PercentComplete% $Status" -NoNewline
}

function Get-GitInfo {
    try {
        $branch = git rev-parse --abbrev-ref HEAD 2>$null
        $status = git status --porcelain 2>$null
        if ($branch) {
            return @{
                Branch = $branch
                HasChanges = [bool]$status
                IsGitRepo = $true
            }
        }
    } catch {
        return @{
            Branch = $null
            HasChanges = $false
            IsGitRepo = $false
        }
    }
}

function Test-Environment {
    <#
    .SYNOPSIS
    Validate the development environment meets requirements.
    #>
    Write-Log "Starting environment validation" 'INFO' -CommandContext 'Test-Environment'
    $issues = @()
    $validationSuccess = $true

    # Node.js version check
    if ($RequiredNodeVersion) {
        try {
            $nodeVersion = (node --version).TrimStart('v')
            if ([version]$nodeVersion -lt [version]$RequiredNodeVersion) {
                $issues += "Node.js $nodeVersion is below required $RequiredNodeVersion"
                $validationSuccess = $false
            }
        } catch {
            $issues += "Node.js not found or version check failed"
            $validationSuccess = $false
        }
    }

    # npm version check
    try {
        $npmVersion = (npm --version)
        if ([version]$npmVersion -lt [version]$RequiredNpmVersion) {
            $issues += "npm $npmVersion is below required $RequiredNpmVersion"
            $validationSuccess = $false
        }
    } catch {
        $issues += "npm not found or version check failed"
        $validationSuccess = $false
    }

    # Project structure validation
    foreach ($artifact in $BuildArtifacts) {
        $path = Join-Path $ProjectRoot $artifact
        if (Test-Path $path) {
            Write-Log "Found build artifact: $artifact" 'DEBUG'
        }
    }

    if ($issues.Count -gt 0) {
        foreach ($issue in $issues) {
            Write-Log $issue 'WARN'
        }
    }

    return $validationSuccess
}

function Show-Spinner {
    param (
        [Parameter(Mandatory=$true)]
        [scriptblock]$ScriptBlock,
        [string]$Message = "Processing...",
        [int]$DelayMs = $SpinnerDelayMs
    )

    $spinner = @('|', '/', '-', '\')
    $spinnerIndex = 0
    $job = Start-Job -ScriptBlock $ScriptBlock

    while ($job.State -eq 'Running') {
        Write-Host "`r$($spinner[$spinnerIndex]) $Message" -NoNewline
        $spinnerIndex = ($spinnerIndex + 1) % $spinner.Length
        Start-Sleep -Milliseconds $DelayMs
    }

    Write-Host "`r" -NoNewline
    $result = Receive-Job -Job $job
    Remove-Job -Job $job
    return $result
}

function Show-InteractiveMenu {
    $menuItems = @(
        @{ Command = 'info'; Description = 'Show Project Information' }
        @{ Command = 'test-env'; Description = 'Test Development Environment' }
        @{ Command = 'install'; Description = 'Install Dependencies' }
        @{ Command = 'update'; Description = 'Update Dependencies' }
        @{ Command = 'reset'; Description = 'Reset Project State' }
        @{ Command = 'build'; Description = 'Build Project' }
        @{ Command = 'dev'; Description = 'Start Development Server' }
        @{ Command = 'invoke-test'; Description = 'Run Tests' }
        @{ Command = 'invoke-check'; Description = 'Run Code Checks' }
        @{ Command = 'invoke-audit'; Description = 'Run Security Audit' }
        @{ Command = 'clear-build'; Description = 'Clear Build Artifacts' }
        @{ Command = 'clear-logs'; Description = 'Clear Logs and Temp Files' }
        @{ Command = 'new-docs'; Description = 'Generate Documentation' }
        @{ Command = 'stats'; Description = 'Show Project Statistics' }
        @{ Command = 'new-backup'; Description = 'Create Project Backup' }
        @{ Command = 'help'; Description = 'Show Help' }
        @{ Command = 'exit'; Description = 'Exit' }
    )

    $selectedIndex = 0
    $maxItems = 10
    $startIndex = 0
    $continue = $true

    while ($continue) {
        Clear-Host
        $nodeVersion = try { (node --version).TrimStart('v') } catch { "not found" }
        $npmVersion = try { npm --version } catch { "not found" }
        Write-Host "$($ANSI.Gray)Node: v$nodeVersion | npm: v$npmVersion | $(Get-Date -Format 'HH:mm:ss')$($ANSI.Reset)"
        Write-Host ($ANSI.Gray + "=" * ($Host.UI.RawUI.WindowSize.Width) + $ANSI.Reset)
        Write-Host ""
        Write-Host "$($ANSI.BoldCyan)Project Management CLI$($ANSI.Reset)"
        Write-Host ""

        $endIndex = [Math]::Min($startIndex + $maxItems, $menuItems.Count)

        for ($i = $startIndex; $i -lt $endIndex; $i++) {
            $prefix = if ($i -eq $selectedIndex) { "$($ANSI.Green)> " } else { "  " }
            $suffix = if ($i -eq $selectedIndex) { $ANSI.Reset } else { "" }
            Write-Host "$prefix$($menuItems[$i].Description)$suffix"
        }

        if ($startIndex -gt 0) {
            Write-Host "$($ANSI.Yellow)↑ More options above$($ANSI.Reset)"
        }
        if ($endIndex -lt $menuItems.Count) {
            Write-Host "$($ANSI.Yellow)↓ More options below$($ANSI.Reset)"
        }

        Write-Host ""
        Write-Host ($ANSI.Gray + "-" * ($Host.UI.RawUI.WindowSize.Width) + $ANSI.Reset)
        Write-Host "Navigation: $($ANSI.Yellow)↑↓$($ANSI.Reset) Move  $($ANSI.Yellow)Enter$($ANSI.Reset) Select  $($ANSI.Yellow)H$($ANSI.Reset) Help  $($ANSI.Yellow)Q$($ANSI.Reset) Quit"

        $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

        switch ($key.VirtualKeyCode) {
            38 { # Up arrow
                $selectedIndex--
                if ($selectedIndex -lt 0) { $selectedIndex = $menuItems.Count - 1 }
                if ($selectedIndex -lt $startIndex) { $startIndex = $selectedIndex }
                if ($selectedIndex -ge ($startIndex + $maxItems)) { $startIndex = $selectedIndex - $maxItems + 1 }
            }
            40 { # Down arrow
                $selectedIndex++
                if ($selectedIndex -ge $menuItems.Count) { $selectedIndex = 0 }
                if ($selectedIndex -lt $startIndex) { $startIndex = $selectedIndex }
                if ($selectedIndex -ge ($startIndex + $maxItems)) { $startIndex = $selectedIndex - $maxItems + 1 }
            }
            81 { # Q key
                $continue = $false
                return "exit"
            }
            72 { # H key
                return "help"
            }
            13 { # Enter key
                return $menuItems[$selectedIndex].Command
            }
        }
    }
}
    }

function Show-ProjectInfo {
    Write-Log "Displaying project information..." 'INFO'
    try {
        Write-Host ""
        Write-Host "$($ANSI.BoldCyan)=== Project Information ===$($ANSI.Reset)"
        Write-Host ""
        Write-Host "Project Name    : $ProjectName"
        Write-Host "Version         : $ProjectVersion"
        Write-Host "Node Version    : $(node --version)"
        Write-Host "NPM Version     : $(npm --version)"

        $gitInfo = Get-GitInfo
        if ($gitInfo.IsGitRepo) {
            Write-Host "Git Branch      : $($gitInfo.Branch)"
            Write-Host "Has Changes     : $(if ($gitInfo.HasChanges) { 'Yes' } else { 'No' })"
        }
        return $true
    } catch {
        Write-Log "Failed to display project information: $_" 'ERROR'
        return $false
    }
}

function Show-Help {
    Write-Host ""
    Write-Host "$($ANSI.BoldCyan)=== Project Management CLI Help ===$($ANSI.Reset)"
    Write-Host ""
    Write-Host "Available Commands:"
    Write-Host "  info         - Show project information"
    Write-Host "  test-env     - Test development environment"
    Write-Host "  install      - Install project dependencies"
    Write-Host "  update       - Update dependencies"
    Write-Host "  reset        - Reset project state"
    Write-Host "  build        - Build the project"
    Write-Host "  dev          - Start development server"
    Write-Host "  invoke-test  - Run tests"
    Write-Host "  invoke-check - Run code checks"
    Write-Host "  invoke-audit - Run security audit"
    Write-Host "  clear-build  - Clear build artifacts"
    Write-Host "  clear-logs   - Clear logs and temp files"
    Write-Host "  new-docs     - Generate documentation"
    Write-Host "  stats        - Show project statistics"
    Write-Host "  new-backup   - Create project backup"
    Write-Host "  help         - Show this help message"
    Write-Host "  exit         - Exit the CLI"
    Write-Host ""
    Write-Host "Navigation:"
    Write-Host "  ↑/↓          - Move selection"
    Write-Host "  Enter        - Execute selected command"
    Write-Host "  H            - Show help"
    Write-Host "  Q            - Quit"
    Write-Host ""
    return $true
}

function Test-Project {
    return Test-Environment
}

function Install-Project {
    Write-Log "Installing project dependencies..." 'INFO'
    try {
        npm ci --prefer-offline
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Dependencies installed successfully" 'SUCCESS'
            return $true
        }
        Write-Log "Failed to install dependencies" 'ERROR'
        return $false
    } catch {
        Write-Log "Error installing dependencies: $_" 'ERROR'
        return $false
    }
}

function Update-Dependencies {
    Write-Log "Updating dependencies..." 'INFO'
    try {
        npm update
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Dependencies updated successfully" 'SUCCESS'
            return $true
        }
        Write-Log "Failed to update dependencies" 'ERROR'
        return $false
    } catch {
        Write-Log "Error updating dependencies: $_" 'ERROR'
        return $false
    }
}

function Reset-Project {
    Write-Log "Resetting project state..." 'INFO'
    try {
        foreach ($artifact in $BuildArtifacts) {
            $path = Join-Path $ProjectRoot $artifact
            if (Test-Path $path) {
                Remove-Item -Path $path -Recurse -Force
                Write-Log "Removed: $artifact" 'DEBUG'
            }
        }

        npm cache clean --force
        npm ci --prefer-offline

        Write-Log "Project reset completed successfully" 'SUCCESS'
        return $true
    } catch {
        Write-Log "Error resetting project: $_" 'ERROR'
        return $false
    }
}

function Build-Project {
    Write-Log "Building project..." 'INFO'
    try {
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Project built successfully" 'SUCCESS'
            return $true
        }
        Write-Log "Build failed" 'ERROR'
        return $false
    } catch {
        Write-Log "Error during build: $_" 'ERROR'
        return $false
    }
}

function Start-DevServer {
    Write-Log "Starting development server..." 'INFO'
    try {
        npm run dev
        return $true
    } catch {
        Write-Log "Error starting development server: $_" 'ERROR'
        return $false
    }
}

function Invoke-Tests {
    Write-Log "Running tests..." 'INFO'
    try {
        npm test
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Tests completed successfully" 'SUCCESS'
            return $true
        }
        Write-Log "Tests failed" 'ERROR'
        return $false
    } catch {
        Write-Log "Error running tests: $_" 'ERROR'
        return $false
    }
}

function Invoke-Checks {
    Write-Log "Running ESLint..." 'DEBUG'
        npm run lint

        Write-Log "Running TypeScript checks..." 'DEBUG'
        npx tsc --noEmit

        if ($LASTEXITCODE -eq 0) {
            Write-Log "All checks passed" 'SUCCESS'
            return $true
        }
        Write-Log "Checks failed" 'ERROR'
        return $false
    } catch {
        Write-Log "Error running checks: $_" 'ERROR'
        return $false
    }
}

function Invoke-Audit {
    Write-Log "Running security audit..." 'INFO'
    try {
        npm audit
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Security audit passed" 'SUCCESS'
            return $true
        }
        Write-Log "Security audit found issues" 'WARN'
        return $false
    } catch {
        Write-Log "Error running security audit: $_" 'ERROR'
        return $false
    }
}

function Clear-Artifacts {
    Write-Log "Clearing build artifacts..." 'INFO'
    try {
        foreach ($artifact in $BuildArtifacts) {
            $path = Join-Path $ProjectRoot $artifact
            if (Test-Path $path) {
                Remove-Item -Path $path -Recurse -Force
                Write-Log "Removed: $($artifact)" 'DEBUG'
            }
        }
        Write-Log "Build artifacts cleared successfully" 'SUCCESS'
        return $true
    } catch {
        Write-Log "Error clearing build artifacts: $_" 'ERROR'
        return $false
    }
}

function Clear-LogsAndTemp {
    Write-Log "Clearing logs and temporary files..." 'INFO'
    try {
        $filesFound = Get-ChildItem -Path $ProjectRoot -Include $TempFilePatterns -Recurse -File
        if ($filesFound) {
            foreach ($file in $filesFound) {
                Remove-Item $file.FullName -Force
                Write-Log "Removed: $($file.Name)" 'DEBUG'
            }
            Write-Log "Cleared $($filesFound.Count) temporary files" 'SUCCESS'
            return $true
        }
        Write-Log "No temporary files found to clear" 'INFO'
        return $true
    } catch {
        Write-Log "Error clearing temporary files: $_" 'ERROR'
        return $false
    }
}

function New-Docs {
    Write-Log "Generating documentation..." 'INFO'
    try {
        if (Test-Path (Join-Path $ProjectRoot "typedoc.json")) {
            npx typedoc
        } else {
            npm run docs
        }
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Documentation generated successfully" 'SUCCESS'
            return $true
        }
        Write-Log "Documentation generation failed" 'ERROR'
        return $false
    } catch {
        Write-Log "Error generating documentation: $_" 'ERROR'
        return $false
    }
}

function New-Backup {
    Write-Log "Creating project backup..." 'INFO'
    try {
        $date = Get-Date -Format "yyyy-MM-dd_HH-mm"
        $backupName = "${ProjectName}_backup_${date}.zip"
        $backupDir = Join-Path $ProjectRoot "backups"

        if (-not (Test-Path $backupDir)) {
            New-Item -Path $backupDir -ItemType Directory | Out-Null
        }

        $tempDir = Join-Path $env:TEMP "project_backup_temp"
        if (Test-Path $tempDir) {
            Remove-Item -Path $tempDir -Recurse -Force
        }

        Copy-Item -Path $ProjectRoot -Destination $tempDir -Recurse
        foreach ($pattern in ($BuildArtifacts + $TempFilePatterns)) {
            Get-ChildItem -Path $tempDir -Include $pattern -Recurse | Remove-Item -Recurse -Force
        }

        $backupPath = Join-Path $backupDir $backupName
        Compress-Archive -Path "$tempDir\*" -DestinationPath $backupPath -Force
        Remove-Item -Path $tempDir -Recurse -Force

        Write-Log "Backup created successfully at: $backupPath" 'SUCCESS'
        return $true
    } catch {
        Write-Log "Error creating backup: $_" 'ERROR'
        return $false
    }
}
#endregion

#region Main Execution
try {
    Initialize-Logging
    Write-Log -Message "--- CLI Session Started ($ScriptName) ---" -Level 'INFO'

    if (-not (Test-Environment)) {
        Write-Log -Message "Environment validation failed" -Level 'WARN'
    }

    $running = $true
    while ($running) {
        try {
            $selectedCommand = Show-InteractiveMenu

            switch ($selectedCommand) {
                'exit' {
                    $running = $false
                    continue
                }
                'info' { Show-ProjectInfo }
                'test-env' { Test-Project }
                'install' { Install-Project }
                'update' { Update-Dependencies }
                'reset' { Reset-Project }
                'build' { Build-Project }
                'dev' { Start-DevServer }
                'invoke-test' { Invoke-Tests }
                'invoke-check' { Invoke-Checks }
                'invoke-audit' { Invoke-Audit }
                'clear-build' { Clear-Artifacts }
                'clear-logs' { Clear-LogsAndTemp }
                'new-docs' { New-Docs }
                'stats' { Show-Stats }
                'new-backup' { New-Backup }
                'help' { Show-Help }
                default {
                    Write-Log -Message "Unknown command: $selectedCommand" -Level 'ERROR'
                }
            }

            if ($running -and $selectedCommand -ne 'dev') {
                $choice = Read-Host "`nPress Enter to continue or Q to quit"
                if ($choice -match '^[qQ]') {
                    $running = $false
                }
            }
        } catch {
            $errorMsg = $_.Exception.Message
            $stackTrace = if ($_.ScriptStackTrace) { $_.ScriptStackTrace } else { "N/A" }
            Write-Log -Message "Command error: $errorMsg" -Level 'ERROR'
            Write-Log -Message "Stack trace: $stackTrace" -Level 'DEBUG'
            Read-Host "Press Enter to continue..."
        }
    }

    Write-Log -Message "--- CLI Session Ended ---" -Level 'INFO'
    exit 0
} catch {
    $errorMsg = $_.Exception.Message
    $stackTrace = if ($_.ScriptStackTrace) { $_.ScriptStackTrace } else { "N/A" }

    if ($LogFile -and (Test-Path (Split-Path $LogFile -Parent))) {
        Write-Log -Message "FATAL: $errorMsg" -Level 'CRITICAL'
        Write-Log -Message "Stack trace: $stackTrace" -Level 'DEBUG'
    } else {
        Write-Error-WithTrace -Message "FATAL: $errorMsg" -ErrorTrace $stackTrace
    }
    exit 1
}
#endregion
