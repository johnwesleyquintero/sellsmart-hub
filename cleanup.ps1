$ErrorActionPreference='SilentlyContinue'
try {
    if (Test-Path '.next') { Remove-Item -Path '.next' -Recurse -Force }
    if (Test-Path '.vercel') { Remove-Item -Path '.vercel' -Recurse -Force }
    if (Test-Path 'node_modules') { Remove-Item -Path 'node_modules' -Recurse -Force }
    Write-Host 'Cleanup completed successfully'
} catch {
    Write-Host 'WARNING: Some cleanup operations failed but proceeding anyway'
    if (Test-Path '.next') { Write-Host 'Could not remove .next directory' }
    if (Test-Path '.vercel') { Write-Host 'Could not remove .vercel directory' }
    if (Test-Path 'node_modules') { Write-Host 'Could not remove node_modules directory' }
}