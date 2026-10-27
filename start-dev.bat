@echo off
echo ========================================================
echo   Annapurna Astra - Starting All Dev Services
echo ========================================================

start "Backend API :5000" cmd /k "cd backend && npm run dev"
start "Landing Page :5173" cmd /k "cd landing-page && npm run dev -- --port 5173"
start "Hotel Admin Panel :5174" cmd /k "cd hotel_admin-panel && npm run dev -- --port 5174"
start "Staff Panel :5175" cmd /k "cd staff-panel && npm run dev -- --port 5175"
start "Super Admin Panel :5176" cmd /k "cd admin-panel && npm run dev -- --port 5176"

echo.
echo All dev servers have been launched in separate terminals!
echo - Backend:      http://localhost:5000
echo - Landing Page: http://localhost:5173
echo - Hotel Admin:  http://localhost:5174
echo - Staff Panel:  http://localhost:5175
echo - Super Admin:  http://localhost:5176
echo ========================================================
pause
