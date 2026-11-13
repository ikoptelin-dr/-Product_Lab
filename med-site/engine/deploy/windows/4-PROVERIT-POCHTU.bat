@echo off
rem Proba Lab: send a test e-mail using the settings in nastrojki.txt
chcp 65001 >nul
cd /d "%~dp0"
set "NODE=node"
if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
for /d %%d in ("%~dp0node-*") do if exist "%%~fd\node.exe" set "NODE=%%~fd\node.exe"
if exist "%~dp0node.exe" set "NODE=%~dp0node.exe"
"%NODE%" "%~dp0server.mjs" --test-mail
pause
