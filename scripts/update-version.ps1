# PowerShell script to update version across all files
param(
    [Parameter(Mandatory=$true)]
    [string]$NewVersion
)

Write-Host "🔄 Updating version to $NewVersion across all files..." -ForegroundColor Green

# Update Cargo.toml
Write-Host "📦 Updating Cargo.toml..." -ForegroundColor Yellow
$cargoContent = Get-Content "Cargo.toml" -Raw
$cargoContent = $cargoContent -replace 'version = "[^"]*"', "version = `"$NewVersion`""
Set-Content "Cargo.toml" -Value $cargoContent

# Update README.md
Write-Host "📖 Updating README.md..." -ForegroundColor Yellow
$readmeContent = Get-Content "README.md" -Raw
$readmeContent = $readmeContent -replace 'version-0\.\d+\.\d+', "version-$NewVersion"
$readmeContent = $readmeContent -replace 'rust-ethernet-ip = "0\.\d+\.\d+"', "rust-ethernet-ip = `"$NewVersion`""
$readmeContent = $readmeContent -replace '<PackageReference Include="RustEtherNetIp" Version="0\.\d+\.\d+" />', "<PackageReference Include=`"RustEtherNetIp`" Version=`"$NewVersion`" />"
$readmeContent = $readmeContent -replace 'v0\.\d+\.\d+', "v$NewVersion"
Set-Content "README.md" -Value $readmeContent

# Update Go backend
Write-Host "🐹 Updating Go backend..." -ForegroundColor Yellow
$goContent = Get-Content "examples/gonextjs/backend/main.go" -Raw
$goContent = $goContent -replace '"version":\s*"0\.\d+\.\d+"', "`"version`": `"$NewVersion`""
Set-Content "examples/gonextjs/backend/main.go" -Value $goContent

# Update version.rs
Write-Host "🦀 Updating version.rs..." -ForegroundColor Yellow
$versionParts = $NewVersion.Split('.')
$majorVersion = $versionParts[0]
$minorVersion = $versionParts[1]
$patchVersion = $versionParts[2]

$versionContent = Get-Content "src/version.rs" -Raw
$versionContent = $versionContent -replace 'pub const MAJOR_VERSION: u32 = \d+;', "pub const MAJOR_VERSION: u32 = $majorVersion;"
$versionContent = $versionContent -replace 'pub const MINOR_VERSION: u32 = \d+;', "pub const MINOR_VERSION: u32 = $minorVersion;"
$versionContent = $versionContent -replace 'pub const PATCH_VERSION: u32 = \d+;', "pub const PATCH_VERSION: u32 = $patchVersion;"
Set-Content "src/version.rs" -Value $versionContent

# Update C# project files
Write-Host "🖥️ Updating C# project files..." -ForegroundColor Yellow
Get-ChildItem -Path "csharp" -Filter "*.csproj" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace '<Version>0\.\d+\.\d+</Version>', "<Version>$NewVersion</Version>"
    Set-Content $_.FullName -Value $content
}

# Update Python wrapper
Write-Host "🐍 Updating Python wrapper..." -ForegroundColor Yellow
$pyContent = Get-Content "pywrapper/pyproject.toml" -Raw
$pyContent = $pyContent -replace 'version = "[^"]*"', "version = `"$NewVersion`""
Set-Content "pywrapper/pyproject.toml" -Value $pyContent

Write-Host "✅ Version update completed successfully!" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Review the changes with: git diff" -ForegroundColor White
Write-Host "   2. Test the build: cargo build --release" -ForegroundColor White
Write-Host "   3. Update CHANGELOG.md with new version entry" -ForegroundColor White
Write-Host "   4. Create release notes: RELEASE_NOTES_v$NewVersion.md" -ForegroundColor White
Write-Host "   5. Commit and tag: git commit -am 'Release v$NewVersion' && git tag v$NewVersion" -ForegroundColor White