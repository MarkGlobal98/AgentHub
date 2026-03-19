@echo off
chcp 65001 >nul 2>&1
title AgentHub - Starting...

echo.
echo  ╔══════════════════════════════════════╗
echo  ║       AgentHub v5 - Quick Start      ║
echo  ║   AI Agent Orchestration Platform    ║
echo  ╚══════════════════════════════════════╝
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed!
    echo.
    echo  Please install Node.js first:
    echo  https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo  [OK] Node.js %NODE_VER% detected

:: Start server
echo.
echo  Starting AgentHub server on http://localhost:3000 ...
echo  Press Ctrl+C to stop.
echo.

npx serve . -l 3000
