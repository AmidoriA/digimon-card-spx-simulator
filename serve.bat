@echo off
rem Serve the game from the web folder and open it in the browser. Ctrl+C stops the server.
cd /d "%~dp0"
start "" http://localhost:8765/
python -m http.server 8765 --bind 127.0.0.1 --directory web
pause
