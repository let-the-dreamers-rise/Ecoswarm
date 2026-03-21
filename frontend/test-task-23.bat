@echo off
echo Running Task 23 State Persistence Tests...
echo ==========================================

cd /d "%~dp0"

REM Run the state persistence tests
call npm test -- StatePersistence.test.tsx

echo.
echo Test execution complete!
pause
