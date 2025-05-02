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
    Reset   = "`e[0m"
    Red     = "`e[31m"
    Green   = "`e[32m"
    Yellow  = "`e[33m"
    Blue    = "`e[34m"
    Magenta = "`e[35m"
    Cyan    = "`e[36m"
    White   = "`e[37m"
    Gray    = "`e[90m"
    BoldCyan = "`e[1;36m`""
    BoldYellow = "`e[1;33m`""
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
        if ($caller) {
            $CommandContext = $caller.FunctionName
        } else {
            $CommandContext = $ScriptName # Fallback to script name
        }
    }

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] [$CommandContext] $Message"

    try {
        # Ensure log file still exists (might be deleted externally)
        if (-not (Test-Path $LogFile)) {
            Initialize-Logging # Attempt re-initialization
        }
        Add-Content -Path $LogFile -Value $logEntry -ErrorAction Stop
    } catch {
        Write-Error "Failed to write to log file '$LogFile': $_"
        # Avoid infinite loop if logging fails repeatedly
    }

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
        [int]$DelayMs = $SpinnerDelayMs # Now using the config variable
    )

    # Implementation of spinner logic
}

function Show-InteractiveMenu {
    do {
        Clear-Host
        # Status bar and header
        $nodeVersion = try { (node --version).TrimStart('v') } catch { "not found" }
        $npmVersion = try { npm --version } catch { "not found" }
        Write-Host "$($ANSI.Gray)Node: v$nodeVersion | npm: v$npmVersion | $(Get-Date -Format 'HH:mm:ss')$($ANSI.Reset)"
        Write-Host ($ANSI.Gray + "=" * ($Host.UI.RawUI.WindowSize.Width) + $ANSI.Reset)

        # ...existing code...

        # Footer with help and navigation (using proper Unicode arrows)
        Write-Host ($ANSI.Gray + "-" * ($Host.UI.RawUI.WindowSize.Width) + $ANSI.Reset)
        Write-Host "Navigation: $($ANSI.Yellow)↑↓$($ANSI.Reset) Move  $($ANSI.Yellow)Enter$($ANSI.Reset) Select  $($ANSI.Yellow)H$($ANSI.Reset) Help  $($ANSI.Yellow)Q$($ANSI.Reset) Quit"
        Write-Host ""

        # ...existing code...
    } while ($running)
}

function Clear-LogsAndTemp {
    Write-Log "Cleaning temporary files..." 'INFO'
    $filesFound = Get-ChildItem -Path $ProjectRoot -Include $TempFilePatterns -Recurse -File
    if ($filesFound) {
        foreach ($file in $filesFound) {
            try {
                Remove-Item $file.FullName -Force
                Write-Log "Removed: $($file.BaseName)" 'DEBUG'
            } catch {
                Write-Log "Failed to remove $($file.BaseName): $_" 'WARN'
            }
        }
        Write-Log "Cleaned $($filesFound.Count) temporary files" 'SUCCESS'
        return $true
    } else {
        Write-Log "No temporary files found to clean" 'INFO'
        return $true
    }
}
}

function Show-Stats {
    <#
    .SYNOPSIS
    Display comprehensive project statistics.
    #>
    Write-Log "Gathering project statistics..." 'INFO'
    try {
        Write-Host ""
        Write-Host "$($ANSI.BoldCyan)=== Project Statistics ===$($ANSI.Reset)"
        Write-Host ""

        # File counts and sizes
        Write-Host "$($ANSI.Yellow)File Statistics:$($ANSI.Reset)"
        $fileStats = @{
            "TypeScript/JavaScript" = @("*.ts", "*.tsx", "*.js", "*.jsx")
            "Styles"               = @("*.css", "*.scss", "*.sass")
            "Configuration"        = @("*.json", "*.yaml", "*.yml")
            "Documentation"        = @("*.md", "*.mdx")
        }

        foreach ($type in $fileStats.Keys) {
            $files = foreach ($pattern in $fileStats[$type]) {
                Get-ChildItem -Path $ProjectRoot -Include $pattern -Recurse -File |
                    Where-Object { $_.DirectoryName -notlike '*node_modules*' -and
                                 $_.DirectoryName -notlike '*build*' }
            }

            if ($files) {
                $count = @($files).Count
                $lines = 0
                foreach ($file in $files) {
                    $lines += @(Get-Content $file.FullName).Count
                }
                Write-Host "  $($type.PadRight(20)) : $($count.ToString().PadLeft(4)) files, $($lines.ToString().PadLeft(6)) lines"
            }
        }

        # Git statistics if available
        $gitInfo = Get-GitInfo
        if ($gitInfo.IsGitRepo) {
            Write-Host ""
            Write-Host "$($ANSI.Yellow)Git Statistics:$($ANSI.Reset)"
            $commitCount = git rev-list --count HEAD 2>$null
            $contributorCount = git shortlog -s HEAD 2>$null | Measure-Object | Select-Object -ExpandProperty Count
            Write-Host "  Total Commits        : $commitCount"
            Write-Host "  Contributors         : $contributorCount"
            Write-Host "  Current Branch       : $($gitInfo.Branch)"
            Write-Host "  Uncommitted Changes  : $(if ($gitInfo.HasChanges) { 'Yes' } else { 'No' })"
        }

        # Dependencies overview
        Write-Host ""
        Write-Host "$($ANSI.Yellow)Dependencies:$($ANSI.Reset)"
        $depCount = ($PackageJson.dependencies | Get-Member -MemberType NoteProperty).Count
        $devDepCount = ($PackageJson.devDependencies | Get-Member -MemberType NoteProperty).Count
        Write-Host "  Runtime Dependencies  : $depCount"
        Write-Host "  Dev Dependencies     : $devDepCount"
        Write-Host "  Total               : $($depCount + $devDepCount)"

        # Build artifacts size
        Write-Host ""
        Write-Host "$($ANSI.Yellow)Build Artifacts:$($ANSI.Reset)"
        foreach ($artifact in $BuildArtifacts) {
            $path = Join-Path $ProjectRoot $artifact
            if (Test-Path $path) {
                $size = Get-ChildItem $path -Recurse -File | Measure-Object -Property Length -Sum
                $sizeInMB = [math]::Round($size.Sum / 1MB, 2)
                Write-Host "  $($artifact.PadRight(20)) : $($sizeInMB) MB"
            }
        }

        Write-Host ""
        return $true
    }
    catch {
        Write-Log "Failed to gather project statistics: $_" 'ERROR'
        return $false
    }
}
#endregion

#region Main Execution
try {
    # Initialize logging system first
    Initialize-Logging
    Write-Log "--- CLI Session Started ($ScriptName) ---" 'INFO'
    Write-Log "Project: $ProjectName v$ProjectVersion" 'INFO'
    Write-Log "Script Path: $PSScriptRoot" 'DEBUG'
    Write-Log "Log File: $LogFile" 'DEBUG'

    # Check environment before proceeding (optional, but recommended)
    if (-not (Test-Environment)) {
        Write-Log "Environment validation failed. Some commands may not work as expected." 'WARN'
    } else {
        Write-Log "Environment validation passed." 'INFO'
    }

    # --- Main Command Loop ---
    $running = $true
    while ($running) {
        $commandResult = $null
        $selectedCommand = $null
        try {
            $selectedCommand = Show-InteractiveMenu

            # Use a hashtable to map command strings to script blocks for cleaner execution
            $commandActions = @{
                'info'         = { $script:commandResult = Show-ProjectInfo }
                'test-env'     = { $script:commandResult = Test-Project }
                'install'      = { $script:commandResult = Install-Project }
                'update'       = { $script:commandResult = Update-Dependencies }
                'reset'        = { $script:commandResult = Reset-Project }
                'build'        = { $script:commandResult = Build-Project }
                'dev'          = { $script:commandResult = Start-DevServer }
                'invoke-test'  = { $script:commandResult = Invoke-Tests }
                'invoke-check' = { $script:commandResult = Invoke-Checks }
                'invoke-audit' = { $script:commandResult = Invoke-Audit }
                'clear-build'  = { $script:commandResult = Clear-Artifacts }
                'clear-logs'   = { $script:commandResult = Clear-LogsAndTemp }
                'new-docs'     = { $script:commandResult = New-Docs }
                'stats'        = { $script:commandResult = Show-Stats }
                'new-backup'   = { $script:commandResult = New-Backup }
                'help'         = { $script:commandResult = $true }
                'exit'         = { $script:running = $false; $script:commandResult = $true }
            }

            if ($commandActions.ContainsKey($selectedCommand)) {
                Write-Log "Executing command: '$selectedCommand'" 'INFO'
                Invoke-Command -ScriptBlock $commandActions[$selectedCommand]

                if ($script:commandResult -is [bool] -and $script:commandResult) {
                    Write-Log "Command '$selectedCommand' completed successfully." 'SUCCESS'
                } elseif ($selectedCommand -ne 'exit' -and $selectedCommand -ne 'help') {
                    if ($script:commandResult -is [bool] -and -not $script:commandResult) {
                        Write-Log "Command '$selectedCommand' failed or was not fully successful." 'ERROR'
                    } else {
                        Write-Log "Command '$selectedCommand' finished execution." 'INFO'
                    }
                }
            } else {
                Write-Log "Unknown command selected: '$selectedCommand'" 'ERROR'
            }

            if ($running -and $selectedCommand -ne 'dev') {
                Write-Host ""
                $choice = Read-Host "Press Enter to return to menu, or Q to quit"
                if ($choice -match '^q') {
                    $running = $false
                }
            } elseif ($selectedCommand -eq 'dev' -and -not $script:commandResult) {
                Read-Host "Press Enter to return to menu..."
            }

        } catch {
            Write-Log "An error occurred while processing command '$selectedCommand': $_" 'ERROR'
            Write-Log "Stack trace: $($_.ScriptStackTrace)" 'DEBUG'
            Read-Host "An error occurred. Press Enter to return to the menu..."
        }
    }
  Write-Log "--- CLI Session Ended ---" 'INFO'
  exit 0
} catch {
    $errorMessage = "FATAL ERROR: $($_.Exception.Message)"
    $errorStackTrace = if ($_.ScriptStackTrace) { $_.ScriptStackTrace } else { "N/A" }

    if ($LogFile -and (Test-Path (Split-Path $LogFile -Parent))) {
        Write-Log $errorMessage 'CRITICAL' -CommandContext $ScriptName
        Write-Log "Stack trace: $errorStackTrace" 'DEBUG' -CommandContext $ScriptName
    } else {
        Write-Error $errorMessage
        Write-Error "Stack trace: $($errorStackTrace)"  # Ensure proper concatenation
    }

    exit 1
}
