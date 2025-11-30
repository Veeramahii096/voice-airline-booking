@echo off
echo ================================================
echo Voice Airline Booking - Docker Deployment
echo ================================================
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker is not installed or not running!
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo Docker version:
docker --version
docker-compose --version
echo.

echo ================================================
echo Building and Starting Services...
echo ================================================
echo.
echo This may take a few minutes on first run...
echo.

REM Build and start containers
docker-compose up --build -d

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to start containers!
    echo Check the error messages above.
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================
echo Services Started Successfully!
echo ================================================
echo.
echo Frontend:  http://localhost
echo Backend:   http://localhost:4000
echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ================================================
echo Checking Service Health...
echo ================================================
echo.

REM Check backend health
curl -s http://localhost:4000/api/health >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Backend:  HEALTHY
) else (
    echo Backend:  Starting... (may take a moment)
)

REM Check frontend health
curl -s http://localhost/health >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Frontend: HEALTHY
) else (
    echo Frontend: Starting... (may take a moment)
)

echo.
echo ================================================
echo View Logs:
echo ================================================
echo docker-compose logs -f
echo.
echo Stop Services:
echo docker-compose down
echo.
echo Opening browser...
start http://localhost

echo.
echo Press any key to view logs (Ctrl+C to exit logs)...
pause >nul

docker-compose logs -f
