@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"

echo ========================================================
echo   Annapurna Astra - Starting All Dev Services
echo ========================================================

start "Backend API :5000" /D "%~dp0backend" cmd /k "npm run dev"
start "Landing Page :5173" /D "%~dp0landing-page" cmd /k "npm run dev -- --port 5173"
start "Hotel Admin Panel :5174" /D "%~dp0hotel_admin-panel" cmd /k "npm run dev -- --port 5174"
start "Staff Panel :5175" /D "%~dp0staff-panel" cmd /k "npm run dev -- --port 5175"
start "Super Admin Panel :5176" /D "%~dp0admin-panel" cmd /k "npm run dev -- --port 5176"

echo.
echo All dev servers have been launched in separate terminals!
echo - Backend:      http://localhost:5000
echo - Landing Page: http://localhost:5173
echo - Hotel Admin:  http://localhost:5174
echo - Staff Panel:  http://localhost:5175
echo - Super Admin:  http://localhost:5176
echo ========================================================
pause
pause

