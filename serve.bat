@echo off
rem Serve the game from the web folder and open it in the browser. Ctrl+C stops the server.
rem Starts at port 8765 and moves up to the first one that is free.
setlocal
cd /d "%~dp0"
set PORT=8765

:probe
python -c "import socket,sys; socket.socket().bind(('127.0.0.1', int(sys.argv[1])))" %PORT% 2>nul
if errorlevel 1 (
  echo Port %PORT% is in use, trying the next one.
  set /a PORT+=1
  if %PORT% geq 8865 goto none
  goto probe
)

echo Serving on http://localhost:%PORT%/
start "" http://localhost:%PORT%/
python -m http.server %PORT% --bind 127.0.0.1 --directory web
pause
exit /b

:none
echo No free port between 8765 and 8865, or Python is not on the PATH.
pause
