@echo off
rem Proba Lab: tell Yandex and Bing about all site pages (IndexNow). Run after every site update.
chcp 65001 >nul
cd /d "%~dp0"
set "NODE=node"
if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
for /d %%d in ("%~dp0node-*") do if exist "%%~fd\node.exe" set "NODE=%%~fd\node.exe"
if exist "%~dp0node.exe" set "NODE=%~dp0node.exe"
"%NODE%" "%~dp0server.mjs" --indexnow
pause
