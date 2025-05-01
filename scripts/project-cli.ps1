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
$DebugPreference = 'Continue'
$WarningPreference = 'Continue'

# Configuration
$LogFile = Join-Path $PSScriptRoot "project-cli.log"
$MaxLogSizeMB = 10
$BackupCount = 3
$SpinnerDelayMs = 100
$CommandTimeoutSeconds = 300

# Read Node.js version from package.json
try {
    $PackageJson = Get-Content -Path "package.json" -ErrorAction Stop | ConvertFrom-Json
    $RequiredNodeVersion = ($PackageJson.engines.node -replace '\^|>=|~', '').Split(' ')[0]
    $RequiredNpmVersion = "9.0.0"
} catch {
    Write-Error "Failed to read package.json: $_"
    exit 1
}

# Command definitions
$Commands = @{
    'reset'       = 'Reset the project environment (clean build artifacts and node_modules)'
    'setup'       = 'Initial project setup including dependencies'
    'check'       = 'Run all checks (lint, type check, tests)'
    'build'       = 'Build the project'
    'dev'         = 'Start development server'
    'test'        = 'Run tests'
    'clean'       = 'Clean build artifacts'
    'update'      = 'Update dependencies'
    'info'        = 'Display project information'
    'clean-logs'  = 'Clear log and temporary files'
    'audit'       = 'Run security audit for dependencies'
    'docs'        = 'Generate project documentation'
    'stats'       = 'Show project statistics'
    'backup'      = 'Create project backup'
    'validate'    = 'Test project structure'
    'exit'        = 'Exit the CLI (or use Q to quit)'
    'help'        = 'Show this help message'
}

# Project paths
$BuildArtifacts = @('.next', '.vercel', 'node_modules', 'package-lock.json', 'coverage', '.nyc_output', 'storybook-static')
$LogFiles = @('*.log', '*.tmp', '*.temp', '*.bak', '*.cache')

# Test configuration
$TestConfig = @{
    TestDir = 'tests/cli'
    TestFilePattern = '*.test.ps1'
    TestResultsFile = 'cli-test-results.xml'
}

# ANSI color codes
$ANSI = @{
    Reset = "`e[0m"
    Red = "`e[31m"
    Green = "`e[32m"
    Yellow = "`e[33m"
    Blue = "`e[34m"
    Magenta = "`e[35m"
    Cyan = "`e[36m"
    White = "`e[37m"
    Gray = "`e[90m"
}
#endregion

#region Helper Functions
function Initialize-Logging {
    <#
    .SYNOPSIS
    Initialize logging system with rotation
    #>
    try {
        if (Test-Path $LogFile) {
            $logSize = (Get-Item $LogFile).Length / 1MB
            if ($logSize -gt $MaxLogSizeMB) {
                for ($i = $BackupCount; $i -gt 0; $i--) {
                    $oldLog = "$LogFile.$i"
                    $newLog = "$LogFile.$($i+1)"
                    if (Test-Path $oldLog) {
                        if ($i -eq $BackupCount) {
                            Remove-Item $oldLog -Force
                        } else {
                            Rename-Item $oldLog $newLog -Force
                        }
                    }
                }
                Rename-Item $LogFile "$LogFile.1" -Force
            }
        }
        New-Item -Path $LogFile -ItemType File -Force | Out-Null
    } catch {
        Write-Error "Failed to initialize logging: $_"
        exit 1
    }
}

function Write-Log {
    <#
    .SYNOPSIS
    Write a message to the log file and console with colored output
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,

        [ValidateSet('DEBUG','INFO','WARN','ERROR','CRITICAL','SUCCESS')]
        [string]$Level = 'INFO',

        [string]$Command = $null,

        [switch]$NoConsole
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] [$Command] $Message"

    try {
        Add-Content -Path $LogFile -Value $logEntry -ErrorAction Stop
    } catch {
        Write-Error "Failed to write to log file: $_"
    }

    if (-not $NoConsole) {
        $color = switch ($Level) {
            'ERROR'    { $ANSI.Red }
            'WARN'     { $ANSI.Yellow }
            'SUCCESS'  { $ANSI.Green }
            'DEBUG'    { $ANSI.Gray }
            'CRITICAL' { $ANSI.Magenta }
            default    { $ANSI.White }
        }

        Write-Host "$color[$Level]$($ANSI.Reset) $Message"
    }
}

function Show-Spinner {
    <#
    .SYNOPSIS
    Display a spinner animation during long-running operations
    #>
    param(
        [string]$Message = "Processing",
        [int]$DelayMs = $SpinnerDelayMs,
        [scriptblock]$ScriptBlock
    )

    $spinner = @('⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏')
    $cursorVisible = [Console]::CursorVisible
    [Console]::CursorVisible = $false

    try {
        $job = Start-Job -ScriptBlock $ScriptBlock -ErrorAction Stop
        $spinnerIndex = 0

        while ($job.State -eq 'Running') {
            Write-Host -NoNewline "`r$($ANSI.Cyan)$($spinner[$spinnerIndex])$($ANSI.Reset) $Message"
            $spinnerIndex = ($spinnerIndex + 1) % $spinner.Length
            Start-Sleep -Milliseconds $DelayMs
        }

        $result = Receive-Job -Job $job -ErrorAction Stop
        Write-Host "`r$($ANSI.Green)✓$($ANSI.Reset) $Message - Completed"
        return $result
    } catch {
        Write-Host "`r$($ANSI.Red)✗$($ANSI.Reset) $Message - Failed"
        throw $_
    } finally {
        if ($job) { Remove-Job -Force $job -ErrorAction SilentlyContinue }
        [Console]::CursorVisible = $cursorVisible
    }
}

try {
    # Main execution code here
} catch {
    Write-Log "Fatal error: $_" 'CRITICAL'
    Write-Log "Stack trace: $($_.ScriptStackTrace)" 'DEBUG'
    exit 1
}

function Test-Environment {
    <#
    .SYNOPSIS
    Validate the development environment meets requirements
    #>
    $issues = @()

    # Node.js version check
    try {
        $nodeVersion = (node --version).TrimStart('v')
        if ([version]$nodeVersion -lt [version]$RequiredNodeVersion) {
            $issues += "Node.js version $nodeVersion is below required version $RequiredNodeVersion"
        }
    } catch {
        $issues += "Node.js is not installed or not in PATH"
    }

    # npm version check
    try {
        $npmVersion = (npm --version).Trim()
        if ([version]$npmVersion -lt [version]$RequiredNpmVersion) {
            $issues += "npm version $npmVersion is below required version $RequiredNpmVersion"
        }
    } catch {
        $issues += "npm is not installed or not in PATH"
    }

    # Global packages check
    $requiredGlobalPackages = @('npm-run-all', 'cross-env', 'ts-node')
    foreach ($pkg in $requiredGlobalPackages) {
        try {
            $null = npm list -g $pkg --depth=0 --silent
        } catch {
            $issues += "Missing required global package: $pkg"
        }
    }

    # Project structure check
    $requiredFiles = @('package.json', 'tsconfig.json', 'next.config.js')
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            $issues += "Missing required project file: $file"
        }
    }

    if ($issues.Count -gt 0) {
        Write-Log "Environment validation failed with $($issues.Count) issues" 'ERROR'
        foreach ($issue in $issues) {
            Write-Log "  - $issue" 'ERROR'
        }
        return $false
    }

    Write-Log "Environment validation passed" 'SUCCESS'
    return $true
}

function Invoke-SafeCommand {
    <#
    .SYNOPSIS
    Execute a command with comprehensive error handling
    #>
    param(
        [Parameter(Mandatory=$true)]
        [scriptblock]$Command,

        [string]$SuccessMessage,

        [string]$ErrorMessage,

        [int]$Timeout = $CommandTimeoutSeconds
    )

    try {
        $timer = [System.Diagnostics.Stopwatch]::StartNew()
        $job = Start-Job -ScriptBlock $Command

        if ($job | Wait-Job -Timeout $Timeout) {
            $output = Receive-Job -Job $job
            $timer.Stop()

            if ($LASTEXITCODE -ne 0) {
                throw "Command failed with exit code $LASTEXITCODE"
            }

            if ($SuccessMessage) {
                Write-Log "$SuccessMessage ($($timer.Elapsed.ToString('mm\:ss')))" 'SUCCESS'
            }
            return $output
        } else {
            throw "Command timed out after $Timeout seconds"
        }
    } catch {
        Write-Log "$ErrorMessage`nError details: $_" 'ERROR' -NoConsole
        Write-Log "Stack trace: $(($_.ScriptStackTrace -split '\r?\n')[0])" 'DEBUG' -NoConsole
        return $null
    } finally {
        if ($job) { Remove-Job -Force $job -ErrorAction SilentlyContinue }
    }
}
#endregion

#region Command Implementations
function Reset-Project {
    <#
    .SYNOPSIS
    Reset the project to a clean state
    #>
    Write-Log "Starting project reset" 'INFO' -Command 'reset'

    # Step 1: Clean build artifacts
    $cleanSuccess = Show-Spinner -Message "Cleaning build artifacts" -ScriptBlock {
        $BuildArtifacts | ForEach-Object {
            if (Test-Path $_) {
                Remove-Item $_ -Recurse -Force -ErrorAction Stop
            }
        }
        $true
    }

    if (-not $cleanSuccess) {
        Write-Log "Failed to clean build artifacts" 'ERROR' -Command 'reset'
        return $false
    }

    # Step 2: Clear npm cache
    $cacheSuccess = Show-Spinner -Message "Clearing npm cache" -ScriptBlock {
        npm cache clean --force
        $LASTEXITCODE -eq 0
    }

    if (-not $cacheSuccess) {
        Write-Log "Failed to clear npm cache" 'WARN' -Command 'reset'
    }

    # Step 3: Reinstall dependencies
    $installSuccess = Show-Spinner -Message "Reinstalling dependencies" -ScriptBlock {
        npm install
        $LASTEXITCODE -eq 0
    }

    if (-not $installSuccess) {
        Write-Log "Failed to reinstall dependencies" 'ERROR' -Command 'reset'
        return $false
    }

    Write-Log "Project reset completed successfully" 'SUCCESS' -Command 'reset'
    return $true
}

function Update-Dependencies {
    <#
    .SYNOPSIS
    Update project dependencies with comprehensive checks
    #>
    Write-Log "Starting dependency update" 'INFO' -Command 'update'

    try {
        # Check for outdated packages
        $outdated = Invoke-SafeCommand -Command {
            npm outdated --json | ConvertFrom-Json
        } -SuccessMessage "Checked for outdated packages" -ErrorMessage "Failed to check outdated packages"

        if (-not $outdated) {
            Write-Log "All dependencies are up to date" 'INFO' -Command 'update'
            return $true
        }

        # Perform the update
        $updateResult = Invoke-SafeCommand -Command {
            npm update
        } -SuccessMessage "Updated dependencies" -ErrorMessage "Failed to update dependencies"

        if (-not $updateResult) {
            return $false
        }

        # Check for deprecated packages
        $deprecated = Invoke-SafeCommand -Command {
            npm ls --json | ConvertFrom-Json |
            Select-Object -ExpandProperty dependencies |
            Where-Object { $_.deprecated } |
            Select-Object -ExpandProperty name
        } -SuccessMessage "Checked for deprecated packages" -ErrorMessage "Failed to check deprecated packages"

        if ($deprecated) {
            Write-Log "Found deprecated packages: $($deprecated -join ', ')" 'WARN' -Command 'update'
        }

        return $true
    } catch {
        Write-Log "Dependency update failed: $_" 'ERROR' -Command 'update'
        return $false
    }
}

function Show-ProjectInfo {
    <#
    .SYNOPSIS
    Display comprehensive project information
    #>
    Write-Log "Displaying project information" 'INFO' -Command 'info'

    try {
        $packageJson = Get-Content -Path "package.json" -ErrorAction Stop | ConvertFrom-Json

        Write-Host ""
        Write-Host "$($ANSI.Cyan)=== Project Information ===$($ANSI.Reset)"
        Write-Host "Name:    $($packageJson.name)"
        Write-Host "Version: $($packageJson.version)"
        Write-Host "Node:    $RequiredNodeVersion (required)"
        Write-Host "npm:     $RequiredNpmVersion (required)"

        Write-Host ""
        Write-Host "$($ANSI.Cyan)=== Available Commands ===$($ANSI.Reset)"
        $Commands.GetEnumerator() | Sort-Object Key | ForEach-Object {
            Write-Host "$($ANSI.Yellow)$($_.Key.PadRight(12))$($ANSI.Reset) $($_.Value)"
        }

        Write-Host ""
        Write-Host "$($ANSI.Cyan)=== Project Scripts ===$($ANSI.Reset)"
        $packageJson.scripts.PSObject.Properties | Sort-Object Name | ForEach-Object {
            Write-Host "$($ANSI.Yellow)$($_.Name.PadRight(20))$($ANSI.Reset) $($_.Value)"
        }

        return $true
    } catch {
        Write-Log "Failed to display project information: $_" 'ERROR' -Command 'info'
        return $false
    }
}

# Additional command implementations would follow the same pattern...
#endregion

#region User Interface
function Show-InteractiveMenu {
    <#
    .SYNOPSIS
    Display an interactive menu for command selection
    #>
    do {
        Clear-Host
        Write-Host ""
        Write-Host "$($ANSI.Cyan)=== Project Management CLI ===$($ANSI.Reset)"
        Write-Host "$($ANSI.Yellow)Select an option:$($ANSI.Reset)"
        Write-Host ""

        # Display commands grouped by category
        $i = 1
        $menuOptions = @()
        $Commands.GetEnumerator() | Sort-Object Key | ForEach-Object {
            Write-Host "  $i. $($ANSI.Yellow)$($_.Key.PadRight(12))$($ANSI.Reset) $($_.Value)"
            $menuOptions += $_.Key
            $i++
        }

        Write-Host ""
        Write-Host "  M. Return to Menu"
        Write-Host "  H. Help"
        Write-Host "  Q. Quit"
        Write-Host ""

        $selection = Read-Host "Enter your choice"

        switch -Regex ($selection.ToLower()) {
            '^q$' { return 'exit' }
            '^m$' { return 'menu' }
            '^h$' { return 'help' }
            '^\d+$' {
                $index = [int]$selection - 1
                if ($index -ge 0 -and $index -lt $menuOptions.Count) {
                    return $menuOptions[$index]
                }
            }
            default {
                if ($Commands.ContainsKey($selection)) {
                    return $selection
                }
            }
        }

        Write-Host "Invalid selection. Please try again." -ForegroundColor Red
        Start-Sleep -Seconds 1
    } while ($true)
}

function Show-CommandHelp {
    <#
    .SYNOPSIS
    Display detailed help for a specific command
    #>
    param(
        [string]$Command
    )

    Clear-Host
    Write-Host ""
    Write-Host "$($ANSI.Cyan)=== Help for command: $Command ===$($ANSI.Reset)"
    Write-Host ""

    switch ($Command) {
        'reset' {
            Write-Host "This command will:"
            Write-Host "- Remove all build artifacts ($($BuildArtifacts -join ', '))"
            Write-Host "- Clear npm cache"
            Write-Host "- Reinstall all dependencies"
            Write-Host ""
            Write-Host "$($ANSI.Yellow)Warning:$($ANSI.Reset) This will delete files and folders!"
        }
        # Add help for other commands...
        default {
            Write-Host $Commands[$Command]
        }
    }

    Write-Host ""
    Read-Host "Press Enter to continue..."
}
#endregion

#region Main Execution
try {
    # Initialize logging system
    Initialize-Logging
    Write-Log "CLI started" 'INFO'

    # Check environment before proceeding
    if (-not (Test-Environment)) {
        Write-Log "Environment validation failed. Some commands may not work properly." 'WARN'
        $choice = Read-Host "Continue anyway? (y/n)"
        if ($choice -ne 'y') {
            exit 1
        }
    }

    $running = $true
    while ($running) {
        try {
            $command = Show-InteractiveMenu

            switch ($command) {
                'reset'       { $success = Reset-Project }
                'update'      { $success = Update-Dependencies }
                'info'        { $success = Show-ProjectInfo }
                'help'        { Show-CommandHelp; $success = $true }
                'exit'        { $running = $false; $success = $true }
                default       { Write-Log "Command not yet implemented: $command" 'WARN'; $success = $false }
            }

            if (-not $success) {
                Write-Log "Command '$command' failed" 'ERROR'
            } else {
                Write-Log "Command '$command' completed" 'INFO'
            }

            if ($running) {
                Write-Host ""
                $choice = Read-Host "Press Enter to continue or Q to quit"
                if ($choice -eq 'q') {
                    $running = $false
                }
            }
        } catch {
            Write-Log "Error processing command: $_" 'ERROR'
            Write-Log "Stack trace: $($_.ScriptStackTrace)" 'DEBUG'
        }
    }

    Write-Log "CLI session ended" 'INFO'
    exit 0
} catch {
    Write-Log "Fatal error: $_" 'CRITICAL'
    Write-Log "Stack trace: $($_.ScriptStackTrace)" 'DEBUG'
    exit 1
}
#endregion
