@echo off
setlocal
set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE_EXE%" (
  echo Node.js not found: %NODE_EXE%
  exit /b 1
)
cd /d "%~dp0"
"%NODE_EXE%" "%~dp0server.js"
exit /b %errorlevel%
