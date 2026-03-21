@echo off
echo Running Task 24 Tests: AI Decision Display
echo ===========================================

cd /d "%~dp0"

REM Run the specific test file
call npx vitest run src/tests/AIDecisionDisplay.test.tsx

echo.
echo Test execution complete!
pause
