# Build script for Go wrapper

# Set environment variables
$env:CGO_ENABLED = 1
$env:GOOS = "windows"
$env:GOARCH = "amd64"

# Build the test program
Write-Host "Building test program..."
go build -o test_connection.exe ./cmd/test_connection

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!"
    Write-Host "You can now run the test program with: .\test_connection.exe"
} else {
    Write-Host "Build failed!"
    exit 1
} 