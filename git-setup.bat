@echo off
echo ====================================
echo Voice Airline Booking - Git Setup
echo ====================================
echo.

REM Remove local files that shouldn't be in git
echo Cleaning up local files...
if exist nlp-service\user_profiles.json del nlp-service\user_profiles.json
if exist .env del .env
if exist backend\.env del backend\.env
if exist frontend\.env del frontend\.env
if exist nlp-service\.env del nlp-service\.env

echo.
echo Initializing Git repository...
git init

echo.
echo Adding files to git...
git add .

echo.
echo Creating initial commit...
git commit -m "Voice airline booking system - production ready with real APIs"

echo.
echo ====================================
echo Git repository initialized!
echo ====================================
echo.
echo Next steps:
echo 1. Create repository on GitHub: https://github.com/new
echo 2. Run these commands:
echo.
echo    git remote add origin https://github.com/YOUR_USERNAME/voice-airline-booking.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. Deploy to Render/Railway/Vercel (see PRODUCTION-DEPLOYMENT-GUIDE.md)
echo.
pause
