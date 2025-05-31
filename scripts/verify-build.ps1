#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Verifies that all projects build correctly
.DESCRIPTION
    This script builds and tests all Rust and C# projects to ensure
    everything works correctly after version updates.
.EXAMPLE
    .\scripts\verify-build.ps1
#>

Write-Host "🔧 Verifying build for Rust EtherNet/IP library..." -ForegroundColor Green

$ErrorActionPreference = "Stop"
$success = $true

function Test-Command {
    param($Command, $Description)
    
    Write-Host "📋 $Description..." -ForegroundColor Yellow
    try {
        Invoke-Expression $Command
        Write-Host "✅ $Description - SUCCESS" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ $Description - FAILED" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Check current version consistency
Write-Host "`n🔍 Checking version consistency..." -ForegroundColor Cyan

$cargoVersion = (Get-Content "Cargo.toml" | Select-String 'version = "(.+)"').Matches[0].Groups[1].Value
$versionFile = Get-Content "VERSION" -Raw | ForEach-Object { $_.Trim() }

Write-Host "Cargo.toml version: $cargoVersion" -ForegroundColor White
Write-Host "VERSION file: $versionFile" -ForegroundColor White

if ($cargoVersion -ne $versionFile) {
    Write-Host "❌ Version mismatch between Cargo.toml and VERSION file!" -ForegroundColor Red
    $success = $false
} else {
    Write-Host "✅ Version consistency check passed" -ForegroundColor Green
}

# Clean previous builds
Write-Host "`n🧹 Cleaning previous builds..." -ForegroundColor Cyan
if (Test-Path "target") {
    Remove-Item "target" -Recurse -Force -ErrorAction SilentlyContinue
}

# Build Rust library
Write-Host "`n🦀 Building Rust library..." -ForegroundColor Cyan
$success = $success -and (Test-Command "cargo check" "Rust syntax check")
$success = $success -and (Test-Command "cargo build" "Rust debug build")
$success = $success -and (Test-Command "cargo build --release" "Rust release build")

# Run Rust tests
Write-Host "`n🧪 Running Rust tests..." -ForegroundColor Cyan
$success = $success -and (Test-Command "cargo test --lib" "Rust unit tests")

# Build C# projects
Write-Host "`n🔷 Building C# projects..." -ForegroundColor Cyan

$csharpProjects = @(
    @{ Path = "csharp/RustEtherNetIp/RustEtherNetIp.csproj"; Name = "Main C# library" },
    @{ Path = "examples/WpfExample/WpfExample.csproj"; Name = "WPF example" },
    @{ Path = "examples/WinFormsExample/WinFormsExample.csproj"; Name = "WinForms example" },
    @{ Path = "examples/AspNetExample/AspNetExample.csproj"; Name = "ASP.NET example" }
)

foreach ($project in $csharpProjects) {
    if (Test-Path $project.Path) {
        $success = $success -and (Test-Command "dotnet build `"$($project.Path)`" --configuration Release" $project.Name)
    } else {
        Write-Host "⚠️  Project not found: $($project.Path)" -ForegroundColor Yellow
    }
}

# Check for common issues
Write-Host "`n🔍 Checking for common issues..." -ForegroundColor Cyan

# Check if native library exists
$nativeLib = "target/release/rust_ethernet_ip.dll"
if (Test-Path $nativeLib) {
    Write-Host "✅ Native library found: $nativeLib" -ForegroundColor Green
} else {
    Write-Host "❌ Native library not found: $nativeLib" -ForegroundColor Red
    $success = $false
}

# Check version in built assembly (if available)
$csharpDll = "csharp/RustEtherNetIp/bin/Release/net9.0/RustEtherNetIp.dll"
if (Test-Path $csharpDll) {
    try {
        $assembly = [System.Reflection.Assembly]::LoadFrom((Resolve-Path $csharpDll))
        $version = $assembly.GetName().Version
        Write-Host "✅ C# assembly version: $version" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Could not read C# assembly version" -ForegroundColor Yellow
    }
}

# Summary
Write-Host "`n📊 Build Verification Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

if ($success) {
    Write-Host "🎉 ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "The project is ready for release." -ForegroundColor Green
    exit 0
} else {
    Write-Host "💥 SOME CHECKS FAILED!" -ForegroundColor Red
    Write-Host "Please fix the issues above before proceeding." -ForegroundColor Red
    exit 1
} 