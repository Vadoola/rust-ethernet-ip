#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Updates version across all project files
.DESCRIPTION
    This script updates the version number in Cargo.toml, C# project files, 
    VERSION file, and other relevant files throughout the project.
.PARAMETER Version
    The new version number (e.g., "0.3.0")
.PARAMETER UpdateChangelog
    Whether to update the CHANGELOG.md with a new version entry
.EXAMPLE
    .\scripts\update-version.ps1 -Version "0.3.0" -UpdateChangelog
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Version,
    
    [Parameter(Mandatory = $false)]
    [switch]$UpdateChangelog
)

# Validate version format
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Error "Version must be in format X.Y.Z (e.g., 0.3.0)"
    exit 1
}

$parts = $Version.Split('.')
$major = $parts[0]
$minor = $parts[1]
$patch = $parts[2]

Write-Host "Updating version to $Version..." -ForegroundColor Green

# Update Cargo.toml
Write-Host "Updating Cargo.toml..." -ForegroundColor Yellow
$cargoContent = Get-Content "Cargo.toml" -Raw
$cargoContent = $cargoContent -replace 'version = "\d+\.\d+\.\d+"', "version = `"$Version`""
Set-Content "Cargo.toml" $cargoContent

# Update src/version.rs
Write-Host "Updating src/version.rs..." -ForegroundColor Yellow
$versionContent = Get-Content "src/version.rs" -Raw
$versionContent = $versionContent -replace 'pub const MAJOR_VERSION: u32 = \d+;', "pub const MAJOR_VERSION: u32 = $major;"
$versionContent = $versionContent -replace 'pub const MINOR_VERSION: u32 = \d+;', "pub const MINOR_VERSION: u32 = $minor;"
$versionContent = $versionContent -replace 'pub const PATCH_VERSION: u32 = \d+;', "pub const PATCH_VERSION: u32 = $patch;"
Set-Content "src/version.rs" $versionContent

# Update VERSION file
Write-Host "Updating VERSION file..." -ForegroundColor Yellow
Set-Content "VERSION" $Version

# Update C# project files
$csprojFiles = @(
    "csharp/RustEtherNetIp/RustEtherNetIp.csproj",
    "examples/WpfExample/WpfExample.csproj",
    "examples/WinFormsExample/WinFormsExample.csproj",
    "examples/AspNetExample/AspNetExample.csproj"
)

foreach ($file in $csprojFiles) {
    if (Test-Path $file) {
        Write-Host "Updating $file..." -ForegroundColor Yellow
        $content = Get-Content $file -Raw
        $content = $content -replace '<Version>\d+\.\d+\.\d+</Version>', "<Version>$Version</Version>"
        $content = $content -replace '<AssemblyVersion>\d+\.\d+\.\d+\.\d+</AssemblyVersion>', "<AssemblyVersion>$Version.0</AssemblyVersion>"
        $content = $content -replace '<FileVersion>\d+\.\d+\.\d+\.\d+</FileVersion>', "<FileVersion>$Version.0</FileVersion>"
        Set-Content $file $content
    }
}

# Update CHANGELOG.md if requested
if ($UpdateChangelog) {
    Write-Host "Updating CHANGELOG.md..." -ForegroundColor Yellow
    $changelogContent = Get-Content "CHANGELOG.md" -Raw
    $date = Get-Date -Format "yyyy-MM-dd"
    $newEntry = @"
## [$Version] - $date

### Added
- 

### Changed
- 

### Fixed
- 

### Removed
- 

"@
    
    $changelogContent = $changelogContent -replace '## \[Unreleased\]', "## [Unreleased]`n`n$newEntry"
    Set-Content "CHANGELOG.md" $changelogContent
}

Write-Host "Version update complete!" -ForegroundColor Green
Write-Host "Updated files:" -ForegroundColor Cyan
Write-Host "  - Cargo.toml" -ForegroundColor White
Write-Host "  - src/version.rs" -ForegroundColor White
Write-Host "  - VERSION" -ForegroundColor White
foreach ($file in $csprojFiles) {
    if (Test-Path $file) {
        Write-Host "  - $file" -ForegroundColor White
    }
}
if ($UpdateChangelog) {
    Write-Host "  - CHANGELOG.md" -ForegroundColor White
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Review and update CHANGELOG.md with actual changes" -ForegroundColor White
Write-Host "2. Commit the version changes" -ForegroundColor White
Write-Host "3. Create a git tag: git tag v$Version" -ForegroundColor White
Write-Host "4. Build and test the new version" -ForegroundColor White 