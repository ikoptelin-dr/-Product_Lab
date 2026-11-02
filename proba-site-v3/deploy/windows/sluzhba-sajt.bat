@echo off
rem Proba Lab service loop: site + forms (node server.mjs). Started by Task Scheduler task "Proba - sajt". Do not run by hand.
cd /d "%~dp0"
if not exist "%~dp0logs" mkdir "%~dp0logs"
set "NODE=node"
if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
:loop
echo [%date% %time%] start >> "%~dp0logs\sajt.log"
"%NODE%" "%~dp0server.mjs" >> "%~dp0logs\sajt.log" 2>&1
ping -n 6 127.0.0.1 >nul
goto loop
