@echo off
echo 🎉 Building Complete Rust EtherNet/IP Solution v0.5.2
echo ====================================================
echo.
echo ✨ This build includes the latest fixes:
echo   • 🔧 Fixed hanging issues in send_cip_request
echo   • 🔧 Fixed string read parsing with proper CIP extraction
echo   • 🔧 Added proper timeouts and error handling
echo   • 🔧 Complete Allen-Bradley STRING support
echo   • 🔧 Real-time subscription support
echo.

echo [1/9] 🦀 Building Rust library (release)...
echo ============================================
cargo build --release --lib
if %errorlevel% neq 0 (
    echo ❌ Rust build failed!
    exit /b %errorlevel%
)
echo ✅ Rust library built successfully

echo.
echo [2/9] 📦 Copying DLL to projects...
echo =================================
copy target\release\rust_ethernet_ip.dll csharp\RustEtherNetIp\ >nul
copy target\release\rust_ethernet_ip.dll examples\ >nul
if %errorlevel% neq 0 (
    echo ❌ Failed to copy DLL!
    exit /b %errorlevel%
)
echo ✅ DLL copied to all projects

echo.
echo [3/9] 🔷 Building C# wrapper...
echo ==============================
cd csharp\RustEtherNetIp
dotnet build --configuration Release --verbosity minimal
if %errorlevel% neq 0 (
    echo ❌ C# build failed!
    exit /b %errorlevel%
)
echo ✅ C# wrapper built successfully
cd ..\..

echo.
echo [4/9] 🧪 Running C# tests...
echo ==========================
cd csharp\RustEtherNetIp.Tests
dotnet test --configuration Release --verbosity minimal
if %errorlevel% neq 0 (
    echo ❌ Tests failed!
    exit /b %errorlevel%
)
echo ✅ All C# tests passed
cd ..\..

echo.
echo [5/9] 🔍 Building C# FFI Connection Test...
echo =========================================
cd examples\CSharpFFITest
dotnet build --configuration Release --verbosity minimal
if %errorlevel% neq 0 (
    echo ❌ C# FFI Connection Test build failed!
    exit /b %errorlevel%
)
echo ✅ C# FFI Connection Test built successfully
cd ..\..

echo.
echo [6/9] 🖥️ Building WPF Example...
echo ===============================
cd examples\WpfExample
dotnet build --configuration Release --verbosity minimal
if %errorlevel% neq 0 (
    echo ❌ WPF build failed!
    exit /b %errorlevel%
)
echo ✅ WPF example built successfully
cd ..\..

echo.
echo [7/9] 📋 Building WinForms Example...
echo ===================================
cd examples\WinFormsExample
dotnet build --configuration Release --verbosity minimal
if %errorlevel% neq 0 (
    echo ❌ WinForms build failed!
    exit /b %errorlevel%
)
echo ✅ WinForms example built successfully
cd ..\..

echo.
echo [8/9] 🌐 Building ASP.NET Example...
echo =================================
cd examples\AspNetExample
dotnet build --configuration Release --verbosity minimal
if %errorlevel% neq 0 (
    echo ❌ ASP.NET build failed!
    exit /b %errorlevel%
)
echo ✅ ASP.NET example built successfully
cd ..\..

echo.
echo [9/11] 🐹 Building Go wrapper...
echo ==============================
cd gowrapper
go mod tidy
go test
if %errorlevel% neq 0 (
    echo ❌ Go wrapper build/test failed!
    exit /b %errorlevel%
)
echo ✅ Go wrapper built and tested successfully
cd ..

echo.
echo [10/11] 🌐 Building Go + React Example Backend...
echo ===============================================
cd examples\GoReactExample\backend
go mod tidy
go build -o server.exe main.go
if %errorlevel% neq 0 (
    echo ❌ Go backend build failed!
    exit /b %errorlevel%
)
echo ✅ Go backend built successfully
cd ..\..\..

echo.
echo [11/11] ⚛️ Building React Frontends...
echo ====================================
echo Building TypeScript Example...
cd examples\TypeScriptExample\frontend
call npm install --silent
call npm run build --silent
if %errorlevel% neq 0 (
    echo ❌ TypeScript React build failed!
    exit /b %errorlevel%
)
echo ✅ TypeScript React frontend built successfully
cd ..\..\..

echo Building Go + React Example...
cd examples\GoReactExample\frontend
call npm install --silent
call npm run build --silent
if %errorlevel% neq 0 (
    echo ❌ Go + React frontend build failed!
    exit /b %errorlevel%
)
echo ✅ Go + React frontend built successfully
cd ..\..\..

echo.
echo 🎉 COMPLETE BUILD SUCCESS!
echo =========================
echo.
echo 📦 Built Components:
echo   ✅ Rust Library (v0.5.2) - with real-time subscriptions & batch operations
echo   ✅ C# Wrapper - tested and verified  
echo   ✅ Go Wrapper - CGO bindings with comprehensive API
echo   ✅ C# FFI Connection Test - diagnostic tool
echo   ✅ WPF Example - production ready
echo   ✅ WinForms Example - production ready
echo   ✅ ASP.NET Example - web API ready
echo   ✅ TypeScript React Frontend - modern UI ready
echo   ✅ Go + React Example - full-stack solution
echo.
echo 🚀 Ready for deployment!
echo.
echo 📋 Key Outputs:
echo   Rust DLL:     target\release\rust_ethernet_ip.dll
echo   C# Wrapper:   csharp\RustEtherNetIp\bin\Release\net9.0\RustEtherNetIp.dll
echo   Go Wrapper:   gowrapper\ (Go module)
echo   WPF App:      examples\WpfExample\bin\Release\net9.0-windows\WpfExample.exe
echo   WinForms App: examples\WinFormsExample\bin\Release\net9.0-windows\WinFormsExample.exe
echo   ASP.NET Web:  examples\AspNetExample\bin\Release\net9.0\AspNetExample.dll
echo   TypeScript:   examples\TypeScriptExample\frontend\dist\
echo   Go Backend:   examples\GoReactExample\backend\server.exe
echo   React Web:    examples\GoReactExample\frontend\build\
echo.
echo 💡 Next Steps:
echo   1. Test C# FFI connection: dotnet run --project examples\CSharpFFITest
echo   2. Test Rust connectivity: cargo run --example connection_test
echo   3. Test string operations: cargo run --example test_string_direct
echo   4. Test Go wrapper: cd gowrapper && go test
echo   5. Run WPF example: examples\WpfExample\bin\Release\net9.0-windows\WpfExample.exe
echo   6. Run ASP.NET: dotnet run --project examples\AspNetExample
echo   7. Run Go + React: cd examples\GoReactExample\backend && .\server.exe
echo. 