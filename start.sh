#!/usr/bin/env bash
# Hermes Claude — Startup Script
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
UI_DIR="$SCRIPT_DIR/ui"
SERVER_DIR="$UI_DIR/server"

echo "◆ Hermes Claude — Starting..."
echo ""

# Check Hermes Dashboard
if ! curl -sf http://127.0.0.1:9119/api/status > /dev/null 2>&1; then
  echo "⚠ Hermes Dashboard not running at http://127.0.0.1:9119"
  echo "  Start it: hermes dashboard --no-open"
  echo ""
fi

# Clean up old processes
pkill -f "node $SERVER_DIR/index.js" 2>/dev/null || true
pkill -f "vite.*hermes-claude.*5174" 2>/dev/null || true
sleep 1

# Start backend proxy
echo "● Starting backend proxy (port 3001)..."
cd "$SERVER_DIR"
node index.js &
SERVER_PID=$!
sleep 2

# Start Vite dev server
echo "● Starting frontend (port 5174)..."
cd "$UI_DIR"
npx vite --port 5174 --host &
VITE_PID=$!

echo ""
echo "═══════════════════════════════════════════════"
echo "  ◆ Hermes Claude is ready!"
echo ""
echo "  Frontend:  http://localhost:5174"
echo "  API Proxy: http://localhost:3001"
echo "  Hermes:    http://127.0.0.1:9119"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "═══════════════════════════════════════════════"

cleanup() {
  echo ""; echo "● Shutting down..."
  kill $SERVER_PID 2>/dev/null || true
  kill $VITE_PID 2>/dev/null || true
  wait 2>/dev/null || true
  echo "  ✓ Stopped"
}
trap cleanup EXIT INT TERM
wait
