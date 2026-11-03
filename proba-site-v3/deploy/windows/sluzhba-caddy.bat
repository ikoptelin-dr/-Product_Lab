@echo off
rem Proba Lab service loop: Caddy (HTTPS for proba-lab.ru). Started by Task Scheduler task "Proba - caddy". Do not run by hand.
cd /d "%~dp0"
if not exist "%~dp0logs" mkdir "%~dp0logs"
rem Certificates are kept here, in the "dannye" folder
set "XDG_DATA_HOME=%~dp0dannye"
set "XDG_CONFIG_HOME=%~dp0dannye"
:loop
set "CADDY="
for %%f in ("%~dp0caddy*.exe") do set "CADDY=%%~ff"
if not defined CADDY echo [%date% %time%] caddy.exe not found >> "%~dp0logs\caddy.log"
if defined CADDY echo [%date% %time%] start >> "%~dp0logs\caddy.log"
if defined CADDY "%CADDY%" run --config "%~dp0Caddyfile" --adapter caddyfile >> "%~dp0logs\caddy.log" 2>&1
ping -n 31 127.0.0.1 >nul
goto loop
