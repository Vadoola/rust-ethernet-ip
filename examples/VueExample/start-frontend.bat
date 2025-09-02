@echo off
echo Starting Rust EtherNet/IP Vue.js Frontend...
echo =============================================

echo.
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies!
    echo Please ensure Node.js is installed and available in PATH
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully!
echo.
echo Starting development server at http://localhost:3000
echo.
echo Frontend Features:
echo - Modern Vue.js 3 + TypeScript + Tailwind CSS
echo - Real-time PLC connection monitoring
echo - Tag read/write operations
echo - Batch operations support
echo - Performance monitoring
echo - Responsive design
echo.
echo Make sure the ASP.NET Core backend is running on localhost:5000
echo.
echo Press Ctrl+C to stop the development server
echo.

call npm run dev
