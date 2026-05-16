#!/bin/bash
# Hermes Claude — Start script

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TERMUL_DIR="$HOME/termul"

echo "╭─ Hermes Claude ─────────────────────────────╮"
echo "│  Starting services...                        │"
echo "╰──────────────────────────────────────────────╯"

# Kill existing on our ports
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null
lsof -ti:8080 | xargs kill -9 2>/dev/null
sleep 1

# 1. Start Hermes Dashboard (needed for data proxy)
hermes dashboard --no-open 2>/dev/null &
echo "  ⏳ Dashboard..."

# 2. Start Termul frontend
cd "$TERMUL_DIR" && npx vite --port 8080 --host 2>/dev/null &
TERMUL_PID=$!
echo "  🖥  Termul PID: $TERMUL_PID"

sleep 2

# 3. Start Backend
cd "$DIR/ui" && node server/index.js &
echo "  🔧 Backend PID: $!"

sleep 2

# 4. Start Frontend
cd "$DIR/ui" && npx vite --port 5174 --host 2>/dev/null &
echo "  🚀 Frontend PID: $!"

echo ""
echo "╭──────────────────────────────────────────────╮"
echo "│  🚀  Frontend: http://localhost:5174          │"
echo "│  🔧  Backend:  http://localhost:3001          │"
echo "│  🖥  Termul:   http://localhost:8080           │"
echo "╰──────────────────────────────────────────────╯"

wait
