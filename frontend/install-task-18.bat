@echo off
echo Installing Task 18 dependencies...
cd /d "%~dp0"

REM Install dependencies
call npm install

REM Run tests
echo.
echo Running EventMap tests...
call npm test -- EventMap.test.tsx

echo.
echo Task 18 installation complete!
echo The Event Map visualization is now ready to use.
pause
