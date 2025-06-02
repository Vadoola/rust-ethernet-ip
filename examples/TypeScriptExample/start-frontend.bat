@echo off
echo Starting React + TypeScript Frontend...
echo ========================================

cd frontend
echo Installing dependencies...
call npm install
echo.
echo Starting development server at http://localhost:5173
call npm run dev 