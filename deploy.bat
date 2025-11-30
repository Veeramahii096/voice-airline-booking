@echo off
REM Voice Airline Booking - Windows Deployment Script
REM Usage: deploy.bat SERVER_IP SSH_USER

echo ================================================
echo Voice Airline Booking - Production Deployment
echo ================================================
echo.

if "%1"=="" (
    echo Error: Server IP required
    echo Usage: deploy.bat SERVER_IP SSH_USER
    echo Example: deploy.bat 192.168.1.100 root
    exit /b 1
)

set SERVER_IP=%1
set SSH_USER=%2
if "%SSH_USER%"=="" set SSH_USER=root
set REMOTE_DIR=/root/voice-airline-booking

echo Step 1: Creating deployment package...
tar -czf voice-airline-deploy.tar.gz ^
    --exclude=node_modules ^
    --exclude=.git ^
    --exclude=*.log ^
    --exclude=dist ^
    --exclude=build ^
    backend frontend nlp-service ^
    docker-compose.prod.yml ^
    *.md

echo.
echo Step 2: Uploading to server...
scp voice-airline-deploy.tar.gz %SSH_USER%@%SERVER_IP%:/tmp/

echo.
echo Step 3: Installing on server...
ssh %SSH_USER%@%SERVER_IP% "mkdir -p %REMOTE_DIR% && cd %REMOTE_DIR% && tar -xzf /tmp/voice-airline-deploy.tar.gz && rm /tmp/voice-airline-deploy.tar.gz && docker-compose -f docker-compose.prod.yml down 2>nul || echo 'No containers running' && docker-compose -f docker-compose.prod.yml up -d --build && docker-compose -f docker-compose.prod.yml ps"

del voice-airline-deploy.tar.gz

echo.
echo ================================================
echo Deployment Complete!
echo ================================================
echo Application URL: http://%SERVER_IP%
echo.
echo Check status: ssh %SSH_USER%@%SERVER_IP% "docker-compose -f %REMOTE_DIR%/docker-compose.prod.yml ps"
echo View logs: ssh %SSH_USER%@%SERVER_IP% "docker-compose -f %REMOTE_DIR%/docker-compose.prod.yml logs -f"
echo.
echo Your voice booking system is now live!
