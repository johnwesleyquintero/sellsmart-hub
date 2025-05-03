#!/usr/bin/env bash

# --- Script Configuration ---
OS="$(uname -s)"
VERSION="1.2.0"
LOG_FILE="project-cli.log"
ERROR_LOG_FILE="project-cli.error.log"
REQUIRED_NODE_VERSION="16.0.0"
REQUIRED_NPM_VERSION="9.0.0"
BUILD_ARTIFACTS=(".next" ".vercel" "node_modules" "package-lock.json" "coverage" ".nyc_output" "storybook-static" "dist" "out")
LOG_PATTERNS=("*.log" "*.tmp" "*.temp" "*.bak" "*.cache")
REQUIRED_PROJECT_FILES=("package.json" "tsconfig.json" "next.config.js")
CONFIG_FILE=""

# --- ANSI Colors ---
ANSI_Reset='\e[0m'
ANSI_Bold='\e[1m'
ANSI_Red='\e[31m'
ANSI_Green='\e[32m'
ANSI_Yellow='\e[33m'
ANSI_Blue='\e[34m'
ANSI_Magenta='\e[35m'
ANSI_Cyan='\e[36m'

# --- Spinner Utilities ---
spinner_chars=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
spinner_pid=""

cleanup() {
    stop_spinner
    echo -e "\n${ANSI_Yellow}[INFO]${ANSI_Reset} Cleaning up and exiting..."
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

start_spinner() {
    local message="$1"
    echo -ne "${ANSI_Cyan}${message}${ANSI_Reset} "

    # Hide cursor
    echo -ne "\e[?25l"

    # Start spinner in background
    while :; do
        for char in "${spinner_chars[@]}"; do
            echo -ne "\b${char}"
            sleep 0.1
        done
    done &

    spinner_pid=$!
    disown
}

stop_spinner() {
    if [ -n "$spinner_pid" ]; then
        kill $spinner_pid >/dev/null 2>&1
        wait $spinner_pid 2>/dev/null
        spinner_pid=""
    fi

    # Clear spinner and show cursor
    echo -ne "\b \b\e[?25h"
}

# --- Core Functions ---
# Maximum log file size in bytes (5MB)
MAX_LOG_SIZE=5242880

rotate_log() {
    local log_file=$1
    if [[ -f "$log_file" ]] && [[ $(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null) -gt $MAX_LOG_SIZE ]]; then
        local timestamp=$(date +"%Y%m%d_%H%M%S")
        mv "$log_file" "${log_file}.${timestamp}.bak"
        log_info "Rotated log file: ${log_file} -> ${log_file}.${timestamp}.bak"
    fi
}

log() {
    local level=$1
    local message=$2
    local timestamp=$(date +'%Y-%m-%d %T')

    # Rotate logs if needed
    rotate_log "$LOG_FILE"

    # Ensure log directory exists
    local log_dir=$(dirname "$LOG_FILE")
    [[ ! -d "$log_dir" ]] && mkdir -p "$log_dir"

    echo -e "${timestamp} [${level}] ${message}" >> "$LOG_FILE"
}

log_info() {
    echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} $1"
    log "INFO" "$1"
}

log_warn() {
    echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} $1"
    log "WARN" "$1"
}

log_error() {
    echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} $1"
    log "ERROR" "$1"

    # Rotate error log if needed
    rotate_log "$ERROR_LOG_FILE"

    local timestamp=$(date +'%Y-%m-%d %T')
    echo -e "${timestamp} [ERROR] $1" >> "$ERROR_LOG_FILE"

    # Don't exit by default, let the caller decide
    return 1
}

# Default command timeout in seconds
COMMAND_TIMEOUT=300

run_with_timeout() {
    local cmd="$1"
    local timeout=${2:-$COMMAND_TIMEOUT}
    local description="$3"

    # Start the command in background
    eval "$cmd" & local cmd_pid=$!

    # Wait for command to finish or timeout
    local count=0
    while kill -0 $cmd_pid 2>/dev/null; do
        if [ $count -ge $timeout ]; then
            kill -9 $cmd_pid 2>/dev/null
            log_error "${description:-Command} timed out after ${timeout} seconds"
            return 1
        fi
        sleep 1
        ((count++))
    done

    wait $cmd_pid
    return $?
}

validate_environment() {
    local check_cmd

    # Check Node.js installation
    if [[ "$OS" == "MINGW"* || "$OS" == "CYGWIN"* || "$OS" == "MSYS"* ]]; then
        check_cmd="where node 2>/dev/null"
    else
        check_cmd="command -v node 2>/dev/null"
    fi
    eval $check_cmd || log_error "Node.js not installed"

    # Check npm installation
    if [[ "$OS" == "MINGW"* || "$OS" == "CYGWIN"* || "$OS" == "MSYS"* ]]; then
        check_cmd="where npm 2>/dev/null"
    else
        check_cmd="command -v npm 2>/dev/null"
    fi
    eval $check_cmd || log_error "npm not installed"

    # Get versions with timeout protection
    local node_version
    if ! node_version=$(run_with_timeout "node -v | cut -d'v' -f2" 10 "Node.js version check"); then
        log_error "Failed to get Node.js version"
    fi

    local npm_version
    if ! npm_version=$(run_with_timeout "npm -v" 10 "npm version check"); then
        log_error "Failed to get npm version"
    fi

    # Compare versions using semver rules
    if ! printf '%s\n%s' "$REQUIRED_NODE_VERSION" "$node_version" | sort -V -C; then
        log_error "Node.js version $node_version < required $REQUIRED_NODE_VERSION"
    fi

    if ! printf '%s\n%s' "$REQUIRED_NPM_VERSION" "$npm_version" | sort -V -C; then
        log_error "npm version $npm_version < required $REQUIRED_NPM_VERSION"
    fi

    log_info "Environment validation passed"
}

clean_artifacts() {
    log_info "Cleaning build artifacts"
    for artifact in "${BUILD_ARTIFACTS[@]}"; do
        if [[ -e "$artifact" ]]; then
            rm -rf "$artifact"
        fi
    done
}

# --- Interactive Menu ---
show_menu() {
    clear
    # Header
    echo -e "${ANSI_Bold}${ANSI_Cyan}╔════════════════════════════════════════════╗${ANSI_Reset}"
    echo -e "${ANSI_Bold}${ANSI_Cyan}║         ${ANSI_Yellow}Wescore Project Cli ${VERSION}${ANSI_Cyan}          ║${ANSI_Reset}"
    echo -e "${ANSI_Bold}${ANSI_Cyan}╠════════════════════════════════════════════╣${ANSI_Reset}"

    # Development Section
    echo -e "\n${ANSI_Bold}${ANSI_Blue}Development${ANSI_Reset}"
    echo -e "${ANSI_Bold}${ANSI_Green} 1) ${ANSI_Reset}Install Dependencies     ${ANSI_Yellow}[i]${ANSI_Reset} - Setup project packages"
    echo -e "${ANSI_Bold}${ANSI_Green} 6) ${ANSI_Reset}Start Dev Server        ${ANSI_Yellow}[d]${ANSI_Reset} - Run development environment"

    # Testing & Quality Section
    echo -e "\n${ANSI_Bold}${ANSI_Blue}Testing & Quality${ANSI_Reset}"
    echo -e "${ANSI_Bold}${ANSI_Green} 2) ${ANSI_Reset}Run Tests              ${ANSI_Yellow}[t]${ANSI_Reset} - Execute test suite"
    echo -e "${ANSI_Bold}${ANSI_Green} 7) ${ANSI_Reset}Run Code Checks        ${ANSI_Yellow}[c]${ANSI_Reset} - Lint and analyze code"
    echo -e "${ANSI_Bold}${ANSI_Green} 8) ${ANSI_Reset}Security Audit         ${ANSI_Yellow}[a]${ANSI_Reset} - Check dependencies"

    # Build & Maintenance Section
    echo -e "\n${ANSI_Bold}${ANSI_Blue}Build & Maintenance${ANSI_Reset}"
    echo -e "${ANSI_Bold}${ANSI_Green} 3) ${ANSI_Reset}Build Project          ${ANSI_Yellow}[b]${ANSI_Reset} - Create production build"
    echo -e "${ANSI_Bold}${ANSI_Green} 4) ${ANSI_Reset}Clean Artifacts        ${ANSI_Yellow}[x]${ANSI_Reset} - Remove build files"

    # Monitoring Section
    echo -e "\n${ANSI_Bold}${ANSI_Blue}Monitoring${ANSI_Reset}"
    echo -e "${ANSI_Bold}${ANSI_Green} 5) ${ANSI_Reset}Project Status         ${ANSI_Yellow}[s]${ANSI_Reset} - View dependencies"
    echo -e "${ANSI_Bold}${ANSI_Green}11) ${ANSI_Reset}Update Tracker         ${ANSI_Yellow}[u]${ANSI_Reset} - Update project tracker"
    echo -e "${ANSI_Bold}${ANSI_Green} 9) ${ANSI_Reset}View Logs              ${ANSI_Yellow}[l]${ANSI_Reset} - Check system logs"

    # Exit Option
    echo -e "\n${ANSI_Bold}${ANSI_Red}10) ${ANSI_Reset}Exit                   ${ANSI_Yellow}[q]${ANSI_Reset} - Quit application"

    echo -e "\n${ANSI_Bold}${ANSI_Cyan}╚════════════════════════════════════════════╝${ANSI_Reset}"
    echo -e "${ANSI_Yellow}Use number or shortcut key in [brackets]${ANSI_Reset}"
}

# --- Main Execution ---
main() {
    validate_environment

    # Cross-platform execution
    if [[ "$OS" == "Linux" || "$OS" == "Darwin" ]]; then
        chmod +x "$0"
        ./"$0"
    elif [[ "$OS" == "MINGW"* || "$OS" == "CYGWIN"* || "$OS" == "MSYS"* ]]; then
        # On Windows, ensure we're using bash explicitly
        if ! command -v bash >/dev/null 2>&1; then
            log_error "bash not found. Please install Git Bash or WSL to run this script on Windows."
        fi
        # Execute PowerShell portion if this is a Windows bash call
        if [[ "$1" == "--powershell" ]]; then
            exec pwsh -Command "& { . \"$0\"; }"
        else
            bash "$0" "--powershell"
        fi
    else
        log_error "Unsupported operating system: $OS"
    fi

    while true; do
        show_menu
        echo -e "${ANSI_Bold}${ANSI_Yellow}› ${ANSI_Reset}\c"
        read -r choice
        choice=$(echo "$choice" | tr '[:upper:]' '[:lower:]')

        case $choice in
            1|"i") {
                log_info "Starting dependency installation..."
                echo -e "${ANSI_Yellow}[STATUS]${ANSI_Reset} Installing dependencies (this may take a while)..."

                # Show progress spinner during installation
                start_spinner "Installing dependencies..."
                if npm install --legacy-peer-deps --progress=true > .npm-install.log 2>&1; then
                    stop_spinner
                    log_info "Dependencies installed successfully"
                    echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Dependencies installed successfully"

                    # Verify installation with progress
                    if [ -d "node_modules" ]; then
                        start_spinner "Verifying packages..."
                        if npm ls --depth=0 > .npm-verify.log 2>&1; then
                            stop_spinner
                            echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Package verification completed"
                            log_info "Package verification successful"
                        else
                            stop_spinner
                            log_error "Dependency verification failed"
                            echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Package verification failed - check .npm-verify.log for details"
                        fi
                    else
                        stop_spinner
                        log_error "node_modules directory not found after installation"
                        echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Installation failed - node_modules not found"
                        exit 1
                    fi
                else
                    stop_spinner
                    log_error "Dependency installation failed"
                    echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Installation failed - check .npm-install.log for details"
                    exit 1
                fi
                # Cleanup temporary logs
                rm -f .npm-install.log .npm-verify.log
            } ;;
            2|"t") {
                log_info "Running tests..."
                > "$ERROR_LOG_FILE"  # Truncate file before writing
                npm test 2>&1 | grep -i "error\|fail" > "$ERROR_LOG_FILE"
                log_info "Tests completed. Errors logged to $ERROR_LOG_FILE"
            } ;;
            3|"b") npm run build ;;
            4|"x") clean_artifacts ;;
            5|"s") npm list ;;
            6|"d") npm run dev ;;
            7|"c") {
                log_info "Running code checks..."
                > "$ERROR_LOG_FILE"  # Truncate file before writing
                npm run check 2>&1 | grep -i "error" > "$ERROR_LOG_FILE"
                log_info "Code checks completed. Errors logged to $ERROR_LOG_FILE"
            } ;;
            8|"a") npm audit ;;
            9|"l") cat "$LOG_FILE" ;;
            10|"q") exit 0 ;;
            11|"u") {
                log_info "Updating project tracker..."
                node ./.wescore/scripts/update-tracker.mjs 2>&1 | tee -a "$LOG_FILE"
                log_info "Project tracker update completed"
            } ;;
            *) log_error "Invalid selection" ;;
        esac

        read -p "Press Enter to continue..."
    done
}

# Properly separate Bash and PowerShell sections
if [[ "$0" == "${BASH_SOURCE[0]}" ]]; then
    main "$@"
    exit 0
fi

# --- PowerShell Section ---
# --- Global Variables ---
$script:CurrentNodeVersion = $null
$script:CurrentNpmVersion = $null

# --- PowerShell Functions ---

function Write-Log {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        [ValidateNotNullOrEmpty()]
        [string]$Message,

        [Parameter(Mandatory = $false, Position = 1)]
        [ValidateSet("INFO", "ERROR", "WARN", "SUCCESS", "DEBUG")]
        [string]$Level = "INFO",

        [Parameter(Mandatory = $false)]
        [string]$LogPath = $script:LOG_FILE # Use script-scoped variable
    )

    process {
        try {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            $logMessage = "$timestamp - [$Level] $Message"

            # Ensure log directory exists
            $logDir = Split-Path -Parent -Path $LogPath -Resolve
            if ($logDir -and (-not (Test-Path -Path $logDir -PathType Container))) {
                New-Item -ItemType Directory -Path $logDir -Force | Out-Null
                Write-Host "Created log directory: $logDir" -ForegroundColor Gray
            }

            # Write to log file
            Add-Content -Path $LogPath -Value $logMessage

            # Console output with color
            switch ($Level) {
                "ERROR"   { Write-Host "$($script:ANSI.Red)$Message$($script:ANSI.Reset)" }
                "WARN"    { Write-Host "$($script:ANSI.Yellow)$Message$($script:ANSI.Reset)" }
                "SUCCESS" { Write-Host "$($script:ANSI.Green)$Message$($script:ANSI.Reset)" }
                "DEBUG"   { Write-Host "$($script:ANSI.Gray)$Message$($script:ANSI.Reset)" } # Make DEBUG visible but gray
                default   { Write-Host $Message }
            }
        }
        catch {
            # Avoid recursive logging if Write-Log itself fails
            $errorMessage = "FATAL: Failed to write log to '$LogPath'. Error: $($_.Exception.Message)"
            Write-Error $errorMessage
            Write-Host $errorMessage -ForegroundColor Red
            # Consider exiting or alternative logging here if file logging is critical
        }
    }
}

function Get-Configuration {
    param (
        [string]$ConfigFile
    )

    if ($ConfigFile -and (Test-Path $ConfigFile -PathType Leaf)) {
        try {
            Write-Log "Loading configuration from $ConfigFile" "INFO"
            $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json -ErrorAction Stop

            # Update script parameters if present in the config file
            if ($config.PSObject.Properties.Name -contains 'LOG_FILE') { $script:LOG_FILE = $config.LOG_FILE }
            if ($config.PSObject.Properties.Name -contains 'REQUIRED_NODE_VERSION') { $script:REQUIRED_NODE_VERSION = $config.REQUIRED_NODE_VERSION }
            if ($config.PSObject.Properties.Name -contains 'REQUIRED_NPM_VERSION') { $script:REQUIRED_NPM_VERSION = $config.REQUIRED_NPM_VERSION }
            if ($config.PSObject.Properties.Name -contains 'BUILD_ARTIFACTS') { $script:BUILD_ARTIFACTS = $config.BUILD_ARTIFACTS }
            if ($config.PSObject.Properties.Name -contains 'LOG_PATTERNS') { $script:LOG_PATTERNS = $config.LOG_PATTERNS }
            if ($config.PSObject.Properties.Name -contains 'REQUIRED_PROJECT_FILES') { $script:REQUIRED_PROJECT_FILES = $config.REQUIRED_PROJECT_FILES }

            Write-Log "Configuration loaded successfully from $ConfigFile" "SUCCESS"
        }
        catch {
            Write-Log "Failed to load or parse configuration from '$($ConfigFile)': $($_.Exception.Message)" "ERROR"
            # Decide if this should be a fatal error
            # exit 1
        }
    }
    else {
        Write-Log "No valid configuration file specified or found. Using default parameters." "DEBUG"
    }
}

function Test-NodeVersion {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$RequiredVersion
    )

    try {
        Write-Log "Checking Node.js version..." "DEBUG"
        $nodeOutput = node --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to execute 'node --version'. Is Node.js installed and in PATH? Error: $nodeOutput"
        }

        $script:CurrentNodeVersion = $nodeOutput.TrimStart('v').Trim()

        if (-not ($script:CurrentNodeVersion -match '^\d+\.\d+\.\d+')) {
            throw "Could not parse Node.js version format: $($script:CurrentNodeVersion)"
        }

        if ([version]$script:CurrentNodeVersion -lt [version]$RequiredVersion) {
            Write-Log "Node.js version $RequiredVersion or higher is required. Current version: $($script:CurrentNodeVersion)" "ERROR"
            return $false
        }

        Write-Log "Node.js version check passed: $($script:CurrentNodeVersion) (Required: >= $RequiredVersion)" "DEBUG"
        return $true
    }
    catch {
        Write-Log "Failed to check Node.js version: $($_.Exception.Message)" "ERROR"
        $script:CurrentNodeVersion = "Error"
        return $false
    }
}

function Test-NpmVersion {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$RequiredVersion
    )

    try {
        Write-Log "Checking npm version..." "DEBUG"
        $npmOutput = npm --version 2>&1
         if ($LASTEXITCODE -ne 0) {
            throw "Failed to execute 'npm --version'. Is npm installed and in PATH? Error: $npmOutput"
        }

        $script:CurrentNpmVersion = $npmOutput.Trim()

        if (-not ($script:CurrentNpmVersion -match '^\d+\.\d+\.\d+')) {
            throw "Could not parse npm version format: $($script:CurrentNpmVersion)"
        }

        if ([version]$script:CurrentNpmVersion -lt [version]$RequiredVersion) {
            Write-Log "npm version $RequiredVersion or higher is required. Current version: $($script:CurrentNpmVersion)" "ERROR"
            return $false
        }

        Write-Log "npm version check passed: $($script:CurrentNpmVersion) (Required: >= $RequiredVersion)" "DEBUG"
        return $true
    }
    catch {
        Write-Log "Failed to check npm version: $($_.Exception.Message)" "ERROR"
        $script:CurrentNpmVersion = "Error"
        return $false
    }
}

function Test-ProjectStructure {
    [CmdletBinding()]
    param(
        # Use the script-scoped variable as the default
        [Parameter(Mandatory = $false)]
        [string[]]$RequiredFiles = $script:REQUIRED_PROJECT_FILES
    )

    try {
        Write-Log "Validating project structure..." "INFO"
        $missingFiles = @()
        $projectRoot = $PSScriptRoot # Assume script is in project root or adjust as needed

        foreach ($file in $RequiredFiles) {
            if ([string]::IsNullOrWhiteSpace($file)) {
                Write-Log "Skipping invalid (empty) required file entry." "WARN"
                continue
            }

            $filePath = Join-Path -Path $projectRoot -ChildPath $file
            if (-not (Test-Path $filePath -PathType Leaf)) {
                $missingFiles += $file
            } else {
                 Write-Log "Found required file: $file" "DEBUG"
            }
        }

        if ($missingFiles.Count -gt 0) {
            Write-Log "Missing required project files: $($missingFiles -join ', ')" "ERROR"
            return $false
        }

        Write-Log "Project structure validation passed" "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Project structure validation failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-Environment {
    # Uses script-scoped variables $REQUIRED_NODE_VERSION and $REQUIRED_NPM_VERSION
    Write-Log "Testing development environment..." "INFO"
    $allTestsPassed = $true

    if (-not (Test-NodeVersion -RequiredVersion $script:REQUIRED_NODE_VERSION)) {
        $allTestsPassed = $false
    }

    if (-not (Test-NpmVersion -RequiredVersion $script:REQUIRED_NPM_VERSION)) {
        $allTestsPassed = $false
    }

    if (-not (Test-ProjectStructure)) { # Uses default $script:REQUIRED_PROJECT_FILES
        $allTestsPassed = $false
    }

    if ($allTestsPassed) {
        Write-Log "Development environment tests passed" "SUCCESS"
    } else {
        Write-Log "One or more development environment tests failed." "ERROR"
    }

    return $allTestsPassed
}

function Get-ProjectInfo {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $false)]
        [string]$PackageJsonPath = "package.json",

        [Parameter(Mandatory = $false)]
        [string[]]$EnvFiles = @(".env", ".env.local", ".env.development", ".env.production")
    )

    try {
        Write-Log "Gathering project information..." "INFO"

        $packageJsonFullPath = Join-Path -Path $PSScriptRoot -ChildPath $PackageJsonPath
        if (-not (Test-Path $packageJsonFullPath -PathType Leaf)) {
            throw "Package.json not found at path: $packageJsonFullPath"
        }

        $pkg = Get-Content $packageJsonFullPath -Raw | ConvertFrom-Json
        if (-not $pkg) {
            throw "Failed to parse $PackageJsonPath"
        }

        # Check Git status safely
        $gitBranch = "N/A"
        $gitStatus = "N/A"
        $gitExists = (Get-Command git -ErrorAction SilentlyContinue)
        if ($gitExists) {
             # Check if inside a git repo work tree
            git rev-parse --is-inside-work-tree 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                $gitBranch = (git rev-parse --abbrev-ref HEAD 2>$null).Trim()
                if ($LASTEXITCODE -ne 0) { $gitBranch = "Error getting branch" }

                $gitStatusOutput = (git status --porcelain 2>$null)
                if ($LASTEXITCODE -ne 0) {
                    $gitStatus = "Error getting status"
                } elseif ($gitStatusOutput) {
                    $gitStatus = "Has uncommitted changes"
                } else {
                    $gitStatus = "Clean"
                }
            } else {
                 $gitBranch = "Not a git repository"
                 $gitStatus = "Not a git repository"
            }
        } else {
            $gitBranch = "Git not found"
            $gitStatus = "Git not found"
        }


        $presentEnvFiles = $EnvFiles | ForEach-Object { Join-Path -Path $PSScriptRoot -ChildPath $_ } | Where-Object { Test-Path $_ -PathType Leaf } | ForEach-Object { Split-Path $_ -Leaf }

        $projectInfo = [PSCustomObject]@{
            Name          = $pkg.name | Get-OrElse "N/A"
            Version       = $pkg.version | Get-OrElse "N/A"
            NodeRequired  = $pkg.engines.node | Get-OrElse "Not specified"
            NodeCurrent   = $script:CurrentNodeVersion | Get-OrElse "N/A"
            NpmCurrent    = $script:CurrentNpmVersion | Get-OrElse "N/A"
            GitBranch     = $gitBranch
            GitStatus     = $gitStatus
            EnvFiles      = if ($presentEnvFiles) { $presentEnvFiles -join ', ' } else { 'None found' }
            DepsProd      = ($pkg.dependencies.PSObject.Properties).Count
            DepsDev       = ($pkg.devDependencies.PSObject.Properties).Count
        }

        Write-Host ""
        Write-Host "$($script:ANSI.BoldCyan)=== Project Information ===$($script:ANSI.Reset)"
        Write-Host "Name:              $($script:ANSI.Green)$($projectInfo.Name)$($script:ANSI.Reset)"
        Write-Host "Version:           $($script:ANSI.Green)$($projectInfo.Version)$($script:ANSI.Reset)"
        Write-Host "Node Required:     $($script:ANSI.Green)$($projectInfo.NodeRequired)$($script:ANSI.Reset)"
        Write-Host "Node Current:      $($script:ANSI.Green)$($projectInfo.NodeCurrent)$($script:ANSI.Reset)"
        Write-Host "Npm Current:       $($script:ANSI.Green)$($projectInfo.NpmCurrent)$($script:ANSI.Reset)"
        Write-Host "Git Branch:        $($script:ANSI.Green)$($projectInfo.GitBranch)$($script:ANSI.Reset)"
        Write-Host "Git Status:        $($script:ANSI.Green)$($projectInfo.GitStatus)$($script:ANSI.Reset)"
        Write-Host "Environment Files: $($script:ANSI.Green)$($projectInfo.EnvFiles)$($script:ANSI.Reset)"
        Write-Host "Dependencies:"
        Write-Host "$($script:ANSI.Yellow)  Production: $($script:ANSI.Reset)$($projectInfo.DepsProd)"
        Write-Host "$($script:ANSI.Yellow)  Development:$($script:ANSI.Reset) $($projectInfo.DepsDev)"
        Write-Host "$($script:ANSI.BoldCyan)===========================$($script:ANSI.Reset)"
        Write-Host ""

        Write-Log "Project information displayed successfully." "SUCCESS"
        return $projectInfo # Return the object for potential programmatic use
    }
    catch {
        Write-Log "Failed to gather project information: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Helper function to provide a default value if the input is null or empty
function Get-OrElse($InputObject, $DefaultValue) {
    if ($null -eq $InputObject -or ([string]::IsNullOrWhiteSpace($InputObject))) {
        return $DefaultValue
    }
    return $InputObject
}

function Confirm-Action {
    param(
        [string]$Message = "Are you sure you want to proceed?"
    )
    $confirm = Read-Host "$($script:ANSI.Yellow)$Message (y/N)$($script:ANSI.Reset)"
    return ($confirm -eq 'y')
}

function Invoke-NpmCommand {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Command,
        [string]$SuccessMessage = "npm command '$Command' completed successfully.",
        [string]$FailureMessage = "npm command '$Command' failed."
    )
    Write-Log "Executing: npm $Command ..." "INFO"
    npm $Command
    if ($LASTEXITCODE -eq 0) {
        Write-Log $SuccessMessage "SUCCESS"
        return $true
    } else {
        Write-Log "$FailureMessage (Exit Code: $LASTEXITCODE)" "ERROR"
        return $false
    }
}

function Start-ProjectDev {
    try {
        Write-Log "Attempting to start development server (npm run dev)..." "INFO"

        # Simple check for port 3000 (can be improved for reliability)
        $portCheck = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
        if ($portCheck) {
            Write-Log "Port 3000 appears to be in use. Please check and free up the port if necessary." "WARN"
            # Optionally ask user if they want to continue anyway
        }

        $envPath = Join-Path -Path $PSScriptRoot -ChildPath ".env"
        if (-not (Test-Path $envPath -PathType Leaf)) {
            Write-Log "Optional: No .env file found at project root. Server might rely on default or system environment variables." "WARN"
        }

        # Execute npm run dev
        Execute-NpmCommand -Command "run dev" `
                           -SuccessMessage "Development server started (or command initiated)." `
                           -FailureMessage "Failed to start development server."

        # Note: npm run dev often runs indefinitely. Success here means the command launched.
        # Further monitoring might be needed if you want to know when the server is *ready*.
        return $true # Assume launch success if Execute-NpmCommand didn't throw/return false
    }
    catch {
        Write-Log "Failed to start development server: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Reset-Project {
    try {
        if (-not (Confirm-Action "WARNING: This will delete build artifacts ($($script:BUILD_ARTIFACTS -join ', ')) and reinstall dependencies. Continue?")) {
            Write-Log "Project reset cancelled by user." "INFO"
            return $false
        }

        Write-Log "Resetting project..." "INFO"

        # Clear build artifacts first
        if (-not (Clear-BuildArtifacts -SkipConfirmation)) {
             Write-Log "Failed to clear build artifacts during reset. Aborting further steps." "ERROR"
             return $false
        }

        # Reinstall dependencies
        if (Execute-NpmCommand -Command "install" -SuccessMessage "Dependencies reinstalled successfully." -FailureMessage "Failed to reinstall dependencies.") {
             Write-Log "Project reset completed successfully." "SUCCESS"
             return $true
        } else {
             Write-Log "Project reset completed, but dependency installation failed." "ERROR"
             return $false
        }
    }
    catch {
        Write-Log "Project reset failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Clear-BuildArtifacts {
     param (
        [switch]$SkipConfirmation
    )
    try {
        if (-not $SkipConfirmation.IsPresent) {
             if (-not (Confirm-Action "This will delete the following build artifacts: $($script:BUILD_ARTIFACTS -join ', '). Continue?")) {
                Write-Log "Clear build artifacts cancelled by user." "INFO"
                return $false
            }
        }

        Write-Log "Clearing build artifacts..." "INFO"
        $projectRoot = $PSScriptRoot
        $itemsRemoved = $false

        foreach ($item in $script:BUILD_ARTIFACTS) {
            $itemPath = Join-Path -Path $projectRoot -ChildPath $item
            if (Test-Path $itemPath) {
                Write-Log "Removing '$item'..." "DEBUG"
                Remove-Item -Recurse -Force -Path $itemPath -ErrorAction Stop
                Write-Log "Removed '$item'" "SUCCESS"
                $itemsRemoved = $true
            } else {
                 Write-Log "Item '$item' not found, skipping." "DEBUG"
            }
        }

        if ($itemsRemoved) {
             Write-Log "Build artifacts cleared successfully." "SUCCESS"
        } else {
             Write-Log "No build artifacts found to clear." "INFO"
        }
        return $true
    }
    catch {
        Write-Log "Failed to clear build artifacts: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Clear-Logs {
    try {
         if (-not (Confirm-Action "This will delete files matching patterns: $($script:LOG_PATTERNS -join ', ') recursively from the current directory. Continue?")) {
            Write-Log "Clear logs cancelled by user." "INFO"
            return $false
        }

        Write-Log "Clearing logs and temporary files..." "INFO"
        $itemsRemoved = $false
        $projectRoot = $PSScriptRoot

        foreach ($pattern in $script:LOG_PATTERNS) {
            Write-Log "Searching for files matching '$pattern'..." "DEBUG"
            $filesToRemove = Get-ChildItem -Path $projectRoot -Include $pattern -Recurse -Force -File -ErrorAction SilentlyContinue
            if ($filesToRemove) {
                $filesToRemove | Remove-Item -Force -ErrorAction Continue # Continue even if one file fails
                Write-Log "Removed files matching pattern '$pattern'" "SUCCESS"
                $itemsRemoved = $true
            } else {
                 Write-Log "No files found matching pattern '$pattern'." "DEBUG"
            }
        }

        if ($itemsRemoved) {
            Write-Log "Logs and temporary files cleared successfully." "SUCCESS"
        } else {
            Write-Log "No logs or temporary files found to clear." "INFO"
        }
        return $true
    }
    catch {
        # Catch potential errors from Get-ChildItem or Remove-Item if -ErrorAction Stop was used
        Write-Log "Failed to clear logs and temporary files: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Show-Help {
    Write-Host ""
    Write-Host "$($script:ANSI.BoldCyan)=== Help ===$($script:ANSI.Reset)"
    Write-Host "$($script:ANSI.Yellow)Navigation:$($script:ANSI.Reset)"
    Write-Host "  ↑ / ↓   - Move through menu items"
    Write-Host "  Enter   - Select menu item"
    Write-Host "  H       - Show this help screen"
    Write-Host "  Q       - Quit the application"
    Write-Host ""
    Write-Host "$($script:ANSI.Yellow)Available Commands (via menu):$($script:ANSI.Reset)"
    Write-Host "  info        - Display project information (name, version, dependencies)"
    Write-Host "  test-env    - Check Node/npm versions and required project files"
    Write-Host "  install     - Install project dependencies (npm install)"
    Write-Host "  update      - Update project dependencies (npm update)"
    Write-Host "  reset       - Remove build artifacts, node_modules, and reinstall deps"
    Write-Host "  build       - Build the project for production (npm run build)"
    Write-Host "  dev         - Start the development server (npm run dev)"
    Write-Host "  invoke-test - Run project tests (npm test)"
    Write-Host "  invoke-check- Run code quality checks (npm run check) - (Requires 'check' script in package.json)"
    Write-Host "  invoke-audit- Run security audit (npm audit)"
    Write-Host "  clear-build - Remove build artifacts (dist, .next, node_modules)"
    Write-Host "  clear-logs  - Remove log and temporary files"
    # Write-Host "  new-docs    - Generate documentation (npm run docs) - (Requires 'docs' script)" # Example if added
    # Write-Host "  stats       - Show project statistics (Not Implemented)"
    # Write-Host "  new-backup  - Create project backup (Not Implemented)"
    Write-Host "$($script:ANSI.BoldCyan)============$($script:ANSI.Reset)"
    Write-Host ""
    Read-Host "Press Enter to return to the menu..." | Out-Null
}

function Invoke-Command {
    param(
        [string]$Command
    )
    $continueRunning = $true

    Write-Host "" # Add space before command output
    Write-Log "Invoking command: $Command" "DEBUG"

    switch ($Command) {
        'info'        { Get-ProjectInfo }
        'test-env'    { Test-Environment } # Re-test environment
        'install'     { Execute-NpmCommand -Command "install" }
        'update'      { Execute-NpmCommand -Command "update" }
        'reset'       { Reset-Project }
        'build'       { Execute-NpmCommand -Command "run build" }
        'dev'         { Start-ProjectDev }
        'invoke-test' { Execute-NpmCommand -Command "test" }
        'invoke-check'{ Execute-NpmCommand -Command "run check" -FailureMessage "Command 'npm run check' failed. Ensure 'check' script exists in package.json." }
        'invoke-audit'{ Execute-NpmCommand -Command "audit" }
        'clear-build' { Clear-BuildArtifacts }
        'clear-logs'  { Clear-Logs }
        # --- Add future commands here ---
        # 'new-docs'    { Execute-NpmCommand -Command "run docs" }
        # 'stats'       { Get-ProjectStats } # Not implemented
        # 'new-backup'  { New-ProjectBackup } # Not implemented
        'help'        { Show-Help }
        'exit'        { $continueRunning = $false }
        default       { Write-Log "Unknown command: $Command" "ERROR" }
    }

    if ($Command -ne 'help' -and $Command -ne 'exit') {
        Read-Host "Command '$Command' finished. Press Enter to continue..." | Out-Null
    }

    return $continueRunning
}

function Show-InteractiveMenu {
    $menuItems = @(
        @{ Command = 'info';        Description = 'Show Project Information' }
        @{ Command = 'test-env';    Description = 'Test Development Environment' }
        @{ Command = 'install';     Description = 'Install Dependencies (npm install)' }
        @{ Command = 'update';      Description = 'Update Dependencies (npm update)' }
        @{ Command = 'reset';       Description = 'Reset Project (Clean & Reinstall)' }
        @{ Command = 'build';       Description = 'Build Project (npm run build)' }
        @{ Command = 'dev';         Description = 'Start Development Server (npm run dev)' }
        @{ Command = 'invoke-test'; Description = 'Run Tests (npm test)' }
        @{ Command = 'invoke-check';Description = 'Run Code Checks (npm run check)' }
        @{ Command = 'invoke-audit';Description = 'Run Security Audit (npm audit)' }
        @{ Command = 'clear-build'; Description = 'Clear Build Artifacts' }
        @{ Command = 'clear-logs';  Description = 'Clear Logs and Temp Files' }
        # Add placeholders for future commands if desired
        # @{ Command = 'new-docs';    Description = 'Generate Documentation (npm run docs)' }
        # @{ Command = 'stats';       Description = 'Show Project Statistics (NI)' }
        # @{ Command = 'new-backup';  Description = 'Create Project Backup (NI)' }
        @{ Command = 'help';        Description = 'Show Help' }
        @{ Command = 'exit';        Description = 'Exit CLI' }
    )

    $selectedIndex = 0
    $continueRunning = $true

    while ($continueRunning) {
        Clear-Host
        $headerLine = "$($script:ANSI.Gray)" + ("-" * 80) + "$($script:ANSI.Reset)"
        $statusLine = "$($script:ANSI.BoldCyan)Project CLI v$($script:VERSION)$($script:ANSI.Reset) | Node: $($script:CurrentNodeVersion) | npm: $($script:CurrentNpmVersion) | Time: $(Get-Date -Format 'HH:mm:ss')$($script:ANSI.Reset)"

        Write-Host $headerLine
        Write-Host $statusLine
        Write-Host $headerLine
        Write-Host ""
        Write-Host "$($script:ANSI.Yellow)Use ↑/↓ arrows, Enter to select, H for Help, Q to Quit$($script:ANSI.Reset)"
        Write-Host ""

        # Display Menu Items
        for ($i = 0; $i -lt $menuItems.Count; $i++) {
            $menuItem = $menuItems[$i]
            $prefix = if ($i -eq $selectedIndex) { "$($script:ANSI.BoldCyan)> " } else { "  " }
            Write-Host "$prefix$($menuItem.Description)$($script:ANSI.Reset)"
        }
        Write-Host $headerLine


        # Get User Input (Handles Arrow Keys, Enter, H, Q)
        $keyInfo = $Host.UI.RawUI.ReadKey("IncludeKeyDown,NoEcho")

        switch ($keyInfo.VirtualKeyCode) {
            # Navigation
            ([System.ConsoleKey]::UpArrow) {
                $selectedIndex = ($selectedIndex - 1 + $menuItems.Count) % $menuItems.Count
            }
            ([System.ConsoleKey]::DownArrow) {
                $selectedIndex = ($selectedIndex + 1) % $menuItems.Count
            }
            # Actions
            ([System.ConsoleKey]::Enter) {
                $selectedCommand = $menuItems[$selectedIndex].Command
                $continueRunning = Invoke-Command $selectedCommand
            }
            ([System.ConsoleKey]::H) {
                Show-Help
            }
            ([System.ConsoleKey]::Q) {
                $continueRunning = $false
                Write-Log "Exiting Project CLI." "INFO"
            }
            default {
                # Optional: Handle other key presses or ignore
                # Write-Log "Invalid key pressed: $($keyInfo.Character)" "DEBUG"
            }
        }
    } # End While Loop
}

# --- Main Script Execution ---

# 1. Load Configuration (if specified)
Get-Configuration -ConfigFile $CONFIG_FILE

# 2. Initial Environment Check
Write-Log "Starting Project CLI v$($script:VERSION)..." "INFO"
if (Test-Environment) {
    # 3. Show Initial Project Info (Optional, but helpful)
    Get-ProjectInfo | Out-Null # Display info but don't wait for Enter key

    # 4. Start Interactive Menu
    Show-InteractiveMenu
} else {
    Write-Log "Initial environment checks failed. Please review the errors above and check your setup." "ERROR"
    Write-Log "Required Node >= $($script:REQUIRED_NODE_VERSION), Required npm >= $($script:REQUIRED_NPM_VERSION)" "ERROR"
    Write-Log "Required files: $($script:REQUIRED_PROJECT_FILES -join ', ')" "ERROR"
    # Optionally exit here or provide guidance
    Read-Host "Press Enter to exit..." | Out-Null
    exit 1
}

Write-Log "Project CLI finished." "INFO"
