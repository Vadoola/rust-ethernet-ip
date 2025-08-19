@echo off
echo Starting Rust EtherNet/IP React Demo Frontend...
echo ===============================================

cd frontend
echo Installing dependencies...
call npm install
echo.
echo Starting development server at http://localhost:5173
echo.
echo Frontend Layout:
echo - Connection section with PLC address input
echo - Performance metrics showing read/write rates  
echo - Tag Monitoring panel with discovery and table
echo - Activity Log panel with real-time updates
echo.
echo Make sure the ASP.NET Core backend is running on localhost:5000
echo.
call npm run dev -- --host 0.0.0.0