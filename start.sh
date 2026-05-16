#!/bin/bash
# Hermes Claude — Start script
# This will start the backend and frontend

echo "╭─ Hermes Claude ─────────────────────────────╮"
echo "│  Starting Hermes Claude Backend...           │"
echo "╰──────────────────────────────────────────────╯"

# Kill any existing processes on our ports
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null
sleep 1

# Get the directory where this script lives
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start backend
cd "$DIR/ui" && node server/index.js &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

sleep 2

# Start frontend (Vite dev mode)
cd "$DIR/ui" && npx vite --port 5174 --host &
VITE_PID=$!
echo "  Frontend PID: $VITE_PID"

echo ""
echo "╭──────────────────────────────────────────────╮"
echo "│  🚀  Frontend: http://localhost:5174          │"
echo "│  🔧  Backend:  http://localhost:3001          │"
echo "╰──────────────────────────────────────────────╯"

# Wait
wait
