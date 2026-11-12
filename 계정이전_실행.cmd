@echo off
setlocal
set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=C:\Program Files\OneAI Desktop\resources\bin\node.exe"
"%NODE_EXE%" "%~dp0tools\transfer-members.js"
pause
