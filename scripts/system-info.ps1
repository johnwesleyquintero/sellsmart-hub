# System Information and Environment Management Script

$ErrorActionPreference = 'Stop'

function Get-SystemInfo {
    try {
        # Get OS Information
        $osInfo = Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object Caption, Version, OSArchitecture

        # Get Processor Information
        $processorInfo = Get-CimInstance -ClassName Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors

        # Get Memory Information
        $memoryInfo = Get-CimInstance -ClassName Win32_ComputerSystem | Select-Object TotalPhysicalMemory
        $memoryGB = [math]::Round($memoryInfo.TotalPhysicalMemory / 1GB, 2)

        # Output System Information
        Write-Host "=== System Information ==="
        Write-Host "OS: $($osInfo.Caption)"
        Write-Host "Version: $($osInfo.Version)"
        Write-Host "Architecture: $($osInfo.OSArchitecture)"
        Write-Host "Processor: $($processorInfo.Name)"
        Write-Host "Cores: $($processorInfo.NumberOfCores)"
        Write-Host "Logical Processors: $($processorInfo.NumberOfLogicalProcessors)"
        Write-Host "Memory: ${memoryGB}GB"

    } catch {
        Write-Error "Error gathering system information: $_"
        exit 1
    }
}

function Update-EnvironmentVariables {
    try {
        Write-Host "Refreshing environment variables..."

        # Update Process Environment
        $Env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                    [System.Environment]::GetEnvironmentVariable("Path", "User")

        # Verify Critical Environment Variables
        $requiredVars = @('NEXT_PUBLIC_API_URL', 'NODE_ENV')
        foreach ($var in $requiredVars) {
            if (-not [System.Environment]::GetEnvironmentVariable($var)) {
                Write-Warning "Warning: $var is not set"
            }
        }

        Write-Host "Environment variables refreshed successfully"

    } catch {
        Write-Error "Error updating environment variables: $_"
        exit 1
    }
}

# Execute Functions
Get-SystemInfo
Update-EnvironmentVariables