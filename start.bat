@echo off
echo ================================================
echo Voice Airline Booking System - Quick Start
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if backend dependencies are installed
if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo.
)

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo.
)

echo ================================================
echo Starting Backend Server...
echo ================================================
start "Backend Server" cmd /k "cd backend && npm start"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo ================================================
echo Starting Frontend Development Server...
echo ================================================
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ================================================
echo Application is starting!
echo ================================================
echo.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5173
echo.
echo Browser should open automatically.
echo If not, manually open: http://localhost:5173
echo.
echo Press any key to exit this window...
pause >nul
