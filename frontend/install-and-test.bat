@echo off
echo Installing frontend dependencies...
call npm install

echo Running tests...
call npm test

echo Done!
pause
