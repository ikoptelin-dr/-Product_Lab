@echo off
rem Proba Lab: start the site in this window to look at it on this PC (http://localhost:8080). Close the window to stop.
chcp 65001 >nul
cd /d "%~dp0"
set "NODE=node"
if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
for /d %%d in ("%~dp0node-*") do if exist "%%~fd\node.exe" set "NODE=%%~fd\node.exe"
if exist "%~dp0node.exe" set "NODE=%~dp0node.exe"
start "" cmd /c "ping -n 3 127.0.0.1 >nul & start http://localhost:8080"
"%NODE%" "%~dp0server.mjs"
pause
