#!/bin/bash

echo ""
echo " ╔══════════════════════════════════════╗"
echo " ║       AgentHub v5 - Quick Start      ║"
echo " ║   AI Agent Orchestration Platform    ║"
echo " ╚══════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo " [ERROR] Node.js is not installed!"
    echo ""
    echo " Please install Node.js first:"
    echo "   macOS:  brew install node"
    echo "   Linux:  sudo apt install nodejs npm"
    echo "   Or:     https://nodejs.org/"
    echo ""
    exit 1
fi

NODE_VER=$(node -v)
echo " [OK] Node.js $NODE_VER detected"

# Start server
echo ""
echo " Starting AgentHub server on http://localhost:3000 ..."
echo " Press Ctrl+C to stop."
echo ""

npx serve . -l 3000
